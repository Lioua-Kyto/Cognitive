import logging

from django.db import transaction
from django.db.models import Count, Q
from django.utils import timezone
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from games.models import Game, MultiplayerMatch, MultiplayerScore
from users.models import CustomUser

from .registry import GAME_SLUGS
from .serializers import GameSubmissionSerializer
from .services.scoring import build_game_response, record_game_result

logger = logging.getLogger(__name__)


class CategoriesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        counts = dict(
            Game.objects.values_list('category').annotate(n=Count('id')).values_list('category', 'n')
        )
        return Response([
            {'key': key, 'label': label, 'game_count': counts.get(key, 0)}
            for key, label in Game.CATEGORY_CHOICES
        ])


class GameSubmitView(APIView):
    """Single endpoint for all 35 single-player games.

    Replaces 35 copy-pasted APIView classes that differed only in which
    serializer they instantiated and which game name string they passed on.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, game_slug):
        game_name = GAME_SLUGS.get(game_slug)
        if game_name is None:
            return Response({'error': f'Unknown game: {game_slug}'}, status=404)

        serializer = GameSubmissionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        try:
            result = record_game_result(
                user=request.user,
                game_name=game_name,
                score=data['score'],
                level=data['level_reached'],
                streaks=data['streaks'],
                mistakes=data['mistakes'],
                correct_answers=data['correct_answers'],
            )
        except Game.DoesNotExist:
            logger.exception('Submission for unseeded game %r', game_name)
            return Response({'error': f'Game not available: {game_name}'}, status=404)

        return Response(build_game_response(result))


class AvailableGamesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(list(Game.objects.values('id', 'name', 'category', 'description')))


# MULTIPLAYER COMPETITIVE GAME VIEWS

class MultiplayerMatchCreateView(APIView):
    """Create a new multiplayer match or join an existing waiting match"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        game_name = request.data.get('game_name')
        if not game_name:
            return Response({'error': 'Game name required'}, status=400)

        try:
            game = Game.objects.get(name=game_name, category='competitive')
        except Game.DoesNotExist:
            return Response({'error': 'Competitive game not found'}, status=404)

        with transaction.atomic():
            # Locked: two players calling this at once would otherwise both read
            # the same waiting match and both claim the player2 slot.
            waiting_match = MultiplayerMatch.objects.select_for_update().filter(
                game=game,
                status='waiting',
                player2__isnull=True,
            ).exclude(player1=request.user).first()

            if waiting_match:
                waiting_match.player2 = request.user
                waiting_match.status = 'active'
                waiting_match.started_at = timezone.now()
                waiting_match.save(update_fields=['player2', 'status', 'started_at'])

                return Response({
                    'match_id': waiting_match.id,
                    'status': 'matched',
                    'opponent': waiting_match.player1.username,
                    'game': game.name,
                })

            new_match = MultiplayerMatch.objects.create(
                game=game,
                player1=request.user,
                status='waiting',
            )

        return Response({
            'match_id': new_match.id,
            'status': 'waiting',
            'game': game.name,
        })


class MultiplayerMatchStatusView(APIView):
    """Get current status of a multiplayer match"""
    permission_classes = [IsAuthenticated]

    def get(self, request, match_id):
        match = MultiplayerMatch.objects.select_related('game', 'winner').filter(
            Q(player1=request.user) | Q(player2=request.user),
            id=match_id,
        ).first()
        if match is None:
            return Response({'error': 'Match not found'}, status=404)

        opponent = match.get_opponent(request.user)
        scores = MultiplayerScore.objects.filter(match=match).select_related('player')

        response_data = {
            'match_id': match.id,
            'game': match.game.name,
            'status': match.status,
            'opponent': opponent.username if opponent else None,
            'started_at': match.started_at,
            'scores': [
                {
                    'player': score.player.username,
                    'score': score.score,
                    'level_reached': score.level_reached,
                    'completed_at': score.completed_at,
                }
                for score in scores
            ],
        }

        if match.status == 'completed' and match.winner:
            response_data['winner'] = match.winner.username

        return Response(response_data)


class MultiplayerScoreSubmissionView(APIView):
    """Submit score for a multiplayer match"""
    permission_classes = [IsAuthenticated]

    def post(self, request, match_id):
        match = MultiplayerMatch.objects.select_related('game').filter(
            Q(player1=request.user) | Q(player2=request.user),
            id=match_id,
            status='active',
        ).first()
        if match is None:
            return Response({'error': 'Active match not found'}, status=404)

        if MultiplayerScore.objects.filter(match=match, player=request.user).exists():
            return Response({'error': 'Score already submitted'}, status=400)

        score_data = request.data
        MultiplayerScore.objects.create(
            match=match,
            player=request.user,
            score=score_data.get('score', 0),
            level_reached=score_data.get('level_reached', 1),
            performance_data=score_data.get('performance_data', {}),
        )

        scores = MultiplayerScore.objects.filter(match=match).select_related('player').order_by('-score')
        if scores.count() == 2:
            match.winner = scores.first().player
            match.status = 'completed'
            match.completed_at = timezone.now()
            match.save(update_fields=['winner', 'status', 'completed_at'])

            for score in scores:
                record_game_result(
                    user=score.player,
                    game_name=match.game.name,
                    score=score.score,
                    level=score.level_reached,
                    streaks=score.performance_data.get('streaks', 0),
                    mistakes=score.performance_data.get('mistakes', 0),
                )

        return Response({'success': True})


class MultiplayerLeaderboardView(APIView):
    """Get leaderboard for competitive multiplayer games"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Two aggregates over the whole board instead of two COUNT queries per player.
        players = CustomUser.objects.annotate(
            wins=Count('won_matches', distinct=True),
            total_matches=Count(
                'matches_as_player1',
                filter=Q(matches_as_player1__status='completed'),
                distinct=True,
            ) + Count(
                'matches_as_player2',
                filter=Q(matches_as_player2__status='completed'),
                distinct=True,
            ),
        ).filter(Q(wins__gt=0) | Q(total_matches__gt=0)).order_by('-wins')[:50]

        return Response({
            'leaderboard': [
                {
                    'username': player.username,
                    'wins': player.wins,
                    'total_matches': player.total_matches,
                    'win_rate': round(player.wins / player.total_matches * 100, 1)
                    if player.total_matches else 0,
                }
                for player in players
            ]
        })
