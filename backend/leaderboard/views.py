from rest_framework import generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import GameScore, BestScore, GameResult
from games.models import Game
from .serializers import GameScoreSerializer, BestScoreSerializer
from users.models import CustomUser
from django.db.models import Sum, Max, Avg, Count, Q
from django.db.models.functions import TruncDate
from .helpers import get_user_leaderboard_info
from datetime import datetime, timedelta

# GLOBAL leaderboard: sum all best scores for each user across all games/categories
class GlobalLeaderboardView(APIView):
    def get(self, request):
        scores = (
            BestScore.objects.values('user')
            .annotate(
                score=Sum('score'),
                level=Sum('level_reached')
            )
            .order_by('-score')
        )
        
        # Enhance with complete user info
        enhanced_scores = []
        for score_entry in scores:
            user_info = get_user_leaderboard_info(score_entry['user'], request)
            enhanced_scores.append({
                **user_info,
                'score': score_entry['score'],
                'level': score_entry['level']
            })
            
        return Response(enhanced_scores)

# CATEGORY leaderboard: sum all best scores for each user in a category
class CategoryLeaderboardView(APIView):
    def get(self, request, category_name):
        scores = (
            BestScore.objects.filter(game__category=category_name)
            .values('user')
            .annotate(
                score=Sum('score'),
                level=Sum('level_reached')
            )
            .order_by('-score')
        )
        
        # Enhance with complete user info
        enhanced_scores = []
        for score_entry in scores:
            user_info = get_user_leaderboard_info(score_entry['user'], request)
            enhanced_scores.append({
                **user_info,
                'score': score_entry['score'],
                'level': score_entry['level']
            })
            
        return Response(enhanced_scores)

# GAME leaderboard: best score for each user in a specific game
class GameLeaderboardView(APIView):
    def get(self, request, game_name):
        scores = (
            BestScore.objects.filter(game__name=game_name)
            .values('user', 'score', 'level_reached', 'best_streak', 'fewest_mistakes')
            .order_by('-score')
        )
        
        # Enhance with complete user info
        enhanced_scores = []
        for score_entry in scores:
            user_info = get_user_leaderboard_info(score_entry['user'], request)
            enhanced_scores.append({
                **user_info,
                'score': score_entry['score'],
                'level': score_entry['level_reached'],
                'best_streak': score_entry['best_streak'],
                'fewest_mistakes': score_entry['fewest_mistakes']
            })
            
        return Response(enhanced_scores)

# List all scores (not leaderboard, just raw list)
class GameScoreListView(generics.ListAPIView):
    queryset = GameScore.objects.all().order_by('-score')
    serializer_class = GameScoreSerializer

# List all scores for a specific game (raw list)
class GameScoreByGameView(generics.ListAPIView):
    serializer_class = GameScoreSerializer

    def get_queryset(self):
        game_id = self.kwargs['game_id']
        return GameScore.objects.filter(game_id=game_id).order_by('-score')

# User's progress in a specific game
class UserGameProgressView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        game_name = request.query_params.get("game")
        print(f"=== UserGameProgressView: Looking for game: '{game_name}'")
        
        if not game_name:
            print("=== UserGameProgressView: No game name provided")
            return Response({"error": "Game name required."}, status=400)
        
        # Debug: List all games in database
        all_games = Game.objects.all()
        print(f"=== UserGameProgressView: All games in DB: {[g.name for g in all_games]}")
        
        try:
            game = Game.objects.get(name=game_name)
            print(f"=== UserGameProgressView: Found game: {game.name}")
        except Game.DoesNotExist:
            print(f"=== UserGameProgressView: Game '{game_name}' not found in database")
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
        ).order_by('-played_at')[:5]
        
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
    
    def get(self, request, category_name):
        user = request.user
        
        # Get all games in this category
        games = Game.objects.filter(category=category_name)
        
        result = {
            'category': category_name,
            'games': []
        }
        
        for game in games:
            # Get the best score from BestScore model
            try:
                best_score_obj = BestScore.objects.get(user=user, game=game)
                best_score = best_score_obj.score
                best_level = best_score_obj.level_reached
                best_streak = best_score_obj.best_streak
                fewest_mistakes = best_score_obj.fewest_mistakes
                most_correct = best_score_obj.most_correct
            except BestScore.DoesNotExist:
                best_score = 0
                best_level = 1
                best_streak = 0
                fewest_mistakes = 0
                most_correct = 0
            
            # Get ALL scores for this user and game from GameResult for history
            scores = GameResult.objects.filter(
                user=user,
                game=game
            ).order_by('-played_at')
            
            game_history = []
            
            for score in scores:
                # Add streaks and mistakes to the game history
                game_history.append({
                    'score': score.score,
                    'level': score.level_reached,
                    'date': score.played_at,
                    'streaks': score.streaks,
                    'mistakes': score.mistakes,
                    'correct_answers': getattr(score, 'correct_answers', 0)
                })
            
            # Use name as key since slug doesn't exist
            game_key = game.name.lower().replace(' ', '-')
            
            result['games'].append({
                'key': game_key,
                'name': game.name,
                'best_score': best_score,
                'best_level': best_level,
                'best_streak': best_streak,
                'fewest_mistakes': fewest_mistakes if fewest_mistakes < 999 else 0,
                'most_correct': most_correct,
                'history': game_history,  # This will contain ALL game plays, not just the best
                'total_plays': len(game_history)  # Add total plays count
            })
        
        return Response(result)

# New User Stats View for Dashboard
class UserStatsView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        
        # Get all game results for the user (using current GameResult model)
        all_scores = GameResult.objects.filter(user=user)
        best_scores = BestScore.objects.filter(user=user)
        
        # Calculate total games played
        total_games = all_scores.count()
        
        # Calculate average score
        avg_score = all_scores.aggregate(avg=Avg('score'))['avg'] or 0
        
        # Find best category by average score
        category_scores = {}
        for score in best_scores:
            category = score.game.category
            if category not in category_scores:
                category_scores[category] = []
            category_scores[category].append(score.score)
        
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
        play_dates = set(score.played_at.date() for score in all_scores if score.played_at)
        
        print(f"=== Streak Debug for user {user.username}: today={today}, play_dates={sorted(play_dates)}")
        
        current_streak = 0
        longest_streak = 0
        temp_streak = 0
        
        # Check current streak (including today)
        check_date = today
        while check_date in play_dates:
            current_streak += 1
            print(f"=== Streak: Found game on {check_date}, current_streak={current_streak}")
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
        
        # Calculate categories played
        categories_played = best_scores.values_list('game__category', flat=True).distinct().count()
        
        return Response({
            'total_games': total_games,
            'average_score': round(avg_score, 1),
            'best_category': best_category or 'N/A',
            'improvement_trend': round(improvement_trend, 1),
            'currentStreak': current_streak,
            'longestStreak': longest_streak,
            'playedDates': played_dates,
            'total_levels': sum(score.level_reached for score in best_scores) or user.total_xp // 100,  # Estimate levels from XP
            'categories_played': categories_played
        })

# Recent Games View
class RecentGamesView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        
        # Get last 10 games played using GameResult model
        recent_results = GameResult.objects.filter(user=user).order_by('-played_at')[:10]
        
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
            
            # Count users below this level
            users_below_level = CustomUser.objects.filter(level__lt=level).count()
            
            # Calculate percentage
            if total_users > 0:
                percentage_below = (users_below_level / total_users) * 100
            else:
                percentage_below = 0
                
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