from datetime import timedelta

from django.db.models import Avg, Count, Sum
from django.db.models.functions import TruncDate
from rest_framework import generics
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from games.models import Game
from users.models import CustomUser

from .helpers import get_users_leaderboard_info, leaderboard_limit
from .models import BestScore, GameResult, GameScore
from .serializers import GameScoreSerializer


def _with_user_info(rows, request):
    """Attach display info to aggregate rows keyed by 'user' in one extra query."""
    rows = list(rows)
    users = get_users_leaderboard_info([row['user'] for row in rows], request)
    return [
        {**users[row['user']], **{k: v for k, v in row.items() if k != 'user'}}
        for row in rows
    ]


# GLOBAL leaderboard: sum all best scores for each user across all games/categories
class GlobalLeaderboardView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        scores = (
            BestScore.objects.values('user')
            .annotate(score=Sum('score'), level=Sum('level_reached'))
            .order_by('-score')[:leaderboard_limit(request)]
        )
        return Response(_with_user_info(scores, request))

# CATEGORY leaderboard: sum all best scores for each user in a category
class CategoryLeaderboardView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, category_name):
        scores = (
            BestScore.objects.filter(game__category=category_name)
            .values('user')
            .annotate(score=Sum('score'), level=Sum('level_reached'))
            .order_by('-score')[:leaderboard_limit(request)]
        )
        return Response(_with_user_info(scores, request))

# GAME leaderboard: best score for each user in a specific game
class GameLeaderboardView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, game_name):
        # BestScore is unique per (user, game), so one row per user already.
        scores = (
            BestScore.objects.filter(game__name=game_name)
            .values('user', 'score', 'level_reached', 'best_streak', 'fewest_mistakes')
            .order_by('-score')[:leaderboard_limit(request)]
        )
        rows = [{**row, 'level': row.pop('level_reached')} for row in scores]
        return Response(_with_user_info(rows, request))

# List all scores (not leaderboard, just raw list)
class GameScoreListView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = GameScoreSerializer

    def get_queryset(self):
        return GameScore.objects.all().order_by('-score')[:leaderboard_limit(self.request)]

# List all scores for a specific game (raw list)
class GameScoreByGameView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = GameScoreSerializer

    def get_queryset(self):
        return GameScore.objects.filter(
            game_id=self.kwargs['game_id']
        ).order_by('-score')[:leaderboard_limit(self.request)]

# User's progress in a specific game
class UserGameProgressView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        game_name = request.query_params.get("game")
        
        if not game_name:
            return Response({"error": "Game name required."}, status=400)
        
        
        try:
            game = Game.objects.get(name=game_name)
        except Game.DoesNotExist:
            return Response({"error": f"Game '{game_name}' not found."}, status=404)
        
        # Get the best score from BestScore model
        best_score = BestScore.objects.filter(
            user=request.user,
            game=game
        ).first()
        
        if best_score:
            return Response({
                "score": best_score.score,
                "level_reached": best_score.level_reached,
                "xp": best_score.xp_earned,
                "best_streak": best_score.best_streak,
                "fewest_mistakes": best_score.fewest_mistakes,
                "most_correct": best_score.most_correct
            })
        else:
            # Return default progress if not played yet
            return Response({
                "score": 0, 
                "level_reached": 1, 
                "xp": 0,
                "best_streak": 0,
                "fewest_mistakes": 0,
                "most_correct": 0
            })
    
class UserRankGlobalView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        # Get all users with summed best scores
        user_scores = BestScore.objects.values('user').annotate(
            total_score=Sum('score')
        ).order_by('-total_score')
        
        # Get current user's position among players
        user_id = request.user.id
        rank = None
        total_players_with_scores = user_scores.count()
        
        for i, score in enumerate(user_scores):
            if score['user'] == user_id:
                rank = i + 1
                break
        
        # Get total number of all users (including those who haven't played)
        from users.models import CustomUser
        total_users = CustomUser.objects.count()
        
        # If user hasn't played any games, their rank is after all players
        if rank is None:
            rank = total_players_with_scores + 1
        
        return Response({
            'rank': rank,
            'total_players': total_users  # Use total users, not just players
        })

class UserRankCategoryView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, category_name):
        # Get category best scores
        category_scores = BestScore.objects.filter(
            game__category=category_name
        ).values('user').annotate(
            total_score=Sum('score')
        ).order_by('-total_score')
        
        # Get current user's position
        user_id = request.user.id
        rank = None
        total_players_with_scores = category_scores.count()
        
        for i, score in enumerate(category_scores):
            if score['user'] == user_id:
                rank = i + 1
                break
        
        # Get total number of all users
        from users.models import CustomUser
        total_users = CustomUser.objects.count()
        
        # If user hasn't played in this category, rank after all players
        if rank is None:
            rank = total_players_with_scores + 1
            
        return Response({
            'rank': rank, 
            'total_players': total_users  # Use total users, not just category players
        })

class UserGamesByCategory(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, category_name):
        # Get recent games in category for this user using GameResult model
        recent_games = GameResult.objects.filter(
            user=request.user,
            game__category=category_name
        ).select_related('game').order_by('-played_at')[:5]
        
        results = []
        for game_result in recent_games:
            results.append({
                'game_name': game_result.game.name,
                'score': game_result.score,
                'level': game_result.level_reached,
                'date': game_result.played_at
            })
            
        return Response(results)

class UserProgressHistory(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, category_name):
        # Get user's score history for this category, grouped by date using GameResult model
        history = GameResult.objects.filter(
            user=request.user,
            game__category=category_name
        ).annotate(
            date=TruncDate('played_at')
        ).values('date').annotate(
            score=Sum('score')
        ).order_by('date')
        
        return Response(list(history))
    

class UserDetailedGameHistory(APIView):
    permission_classes = [IsAuthenticated]
    
    # Most recent plays returned per game. This used to be every play ever.
    HISTORY_PER_GAME = 50

    def get(self, request, category_name):
        user = request.user
        games = list(Game.objects.filter(category=category_name))

        # Three queries for the whole category instead of two per game.
        bests = {
            best.game_id: best
            for best in BestScore.objects.filter(user=user, game__in=games)
        }

        history_by_game = {}
        results = GameResult.objects.filter(
            user=user, game__in=games
        ).order_by('-played_at').values(
            'game_id', 'score', 'level_reached', 'played_at',
            'streaks', 'mistakes', 'correct_answers',
        )
        play_counts = dict(
            GameResult.objects.filter(user=user, game__in=games)
            .values_list('game_id')
            .annotate(n=Count('id'))
            .values_list('game_id', 'n')
        )
        for row in results:
            bucket = history_by_game.setdefault(row['game_id'], [])
            if len(bucket) < self.HISTORY_PER_GAME:
                bucket.append({
                    'score': row['score'],
                    'level': row['level_reached'],
                    'date': row['played_at'],
                    'streaks': row['streaks'],
                    'mistakes': row['mistakes'],
                    'correct_answers': row['correct_answers'],
                })

        result = {'category': category_name, 'games': []}

        for game in games:
            best = bests.get(game.id)
            fewest_mistakes = best.fewest_mistakes if best else 0

            result['games'].append({
                'key': game.name.lower().replace(' ', '-'),
                'name': game.name,
                'best_score': best.score if best else 0,
                'best_level': best.level_reached if best else 1,
                'best_streak': best.best_streak if best else 0,
                'fewest_mistakes': fewest_mistakes if fewest_mistakes < 999 else 0,
                'most_correct': best.most_correct if best else 0,
                'history': history_by_game.get(game.id, []),
                'total_plays': play_counts.get(game.id, 0),
            })
        
        return Response(result)

# New User Stats View for Dashboard
class UserStatsView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        
        # Get all game results for the user (using current GameResult model)
        all_scores = GameResult.objects.filter(user=user)

        # Calculate total games played
        total_games = all_scores.count()

        # Calculate average score
        avg_score = all_scores.aggregate(avg=Avg('score'))['avg'] or 0

        # Find best category by average score. Joined in SQL rather than
        # touching score.game.category once per row.
        category_scores = {}
        for category, score in BestScore.objects.filter(user=user).values_list(
            'game__category', 'score'
        ):
            category_scores.setdefault(category, []).append(score)
        
        best_category = None
        best_category_avg = 0
        
        for category, scores in category_scores.items():
            if scores:
                avg = sum(scores) / len(scores)
                if avg > best_category_avg:
                    best_category_avg = avg
                    best_category = category
        
        # Calculate improvement trend (last 10 games vs previous 10 games)
        recent_scores = all_scores.order_by('-played_at')[:10]
        previous_scores = all_scores.order_by('-played_at')[10:20]
        
        improvement_trend = 0
        if recent_scores and previous_scores:
            recent_avg = sum(score.score for score in recent_scores) / len(recent_scores)
            previous_avg = sum(score.score for score in previous_scores) / len(previous_scores)
            improvement_trend = ((recent_avg - previous_avg) / previous_avg) * 100 if previous_avg > 0 else 0
        
        # Calculate play streak with better debugging
        from django.utils import timezone
        today = timezone.now().date()
        play_dates = {
            played_at.date()
            for played_at in all_scores.values_list('played_at', flat=True)
            if played_at
        }
        
        
        current_streak = 0
        longest_streak = 0
        temp_streak = 0
        
        # Check current streak (including today)
        check_date = today
        while check_date in play_dates:
            current_streak += 1
            check_date -= timedelta(days=1)
        
        # Calculate longest streak
        sorted_dates = sorted(play_dates)
        if sorted_dates:
            temp_streak = 1
            for i in range(1, len(sorted_dates)):
                if (sorted_dates[i] - sorted_dates[i-1]).days == 1:
                    temp_streak += 1
                    longest_streak = max(longest_streak, temp_streak)
                else:
                    temp_streak = 1
            longest_streak = max(longest_streak, temp_streak)
        
        # Get last 7 days for activity
        last_7_days = []
        for i in range(7):
            date = today - timedelta(days=i)
            last_7_days.append(date.isoformat())
        
        played_dates = [date.isoformat() for date in play_dates if date >= (today - timedelta(days=7))]
        
        # category_scores was built above from a single values_list join; the
        # `best_scores` queryset it replaced no longer exists.
        best_totals = BestScore.objects.filter(user=user).aggregate(
            levels=Sum('level_reached')
        )

        return Response({
            'total_games': total_games,
            'average_score': round(avg_score, 1),
            'best_category': best_category or 'N/A',
            'improvement_trend': round(improvement_trend, 1),
            'currentStreak': current_streak,
            'longestStreak': longest_streak,
            'playedDates': played_dates,
            'total_levels': best_totals['levels'] or user.experience // 100,
            'categories_played': len(category_scores),
        })

# Recent Games View
class RecentGamesView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        
        # Get last 10 games played using GameResult model
        recent_results = GameResult.objects.filter(
            user=user
        ).select_related('game').order_by('-played_at')[:10]
        
        games_data = []
        for result in recent_results:
            games_data.append({
                'game_name': result.game.name,
                'category': result.game.category,
                'score': result.score,
                'xp_earned': result.xp_earned,
                'created_at': result.played_at.isoformat(),
                'level_reached': result.level_reached,
                'streaks': result.streaks,
                'mistakes': result.mistakes
            })
        
        return Response(games_data)


# Level Statistics View
class LevelStatsView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, level):
        """Get statistics about users at a specific level"""
        try:
            # Count total users
            total_users = CustomUser.objects.count()
            
            # `level` is a property, not a column: filtering on it raised
            # FieldError and this endpoint always 500'd behind the except below.
            users_below_level = CustomUser.objects.filter(
                experience__lt=CustomUser.experience_for_level(level)
            ).count()
            
            # Calculate percentage
            percentage_below = users_below_level / total_users * 100 if total_users > 0 else 0
                
            return Response({
                'level': level,
                'total_users': total_users,
                'users_below_level': users_below_level,
                'percentage_below': round(percentage_below, 1)
            })
            
        except Exception as e:
            return Response({
                'error': str(e),
                'level': level,
                'percentage_below': 0
            }, status=500)