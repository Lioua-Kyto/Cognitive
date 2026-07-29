from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from django.utils import timezone
from .serializers import *
from leaderboard.models import GameResult  # Use GameResult instead of GameScore
from games.models import Game, MultiplayerMatch, MultiplayerScore
from users.models import CustomUser
from users.utils import check_and_award_achievements

def create_game_response(result_data, correct=None):
    """
    Helper function to create standardized game response format
    """
    game_result = result_data.get('game_result')
    
    # Get best score record for this user and game to include best stats
    from leaderboard.models import BestScore
    try:
        best_score = BestScore.objects.get(user=game_result.user, game=game_result.game)
        best_streak = best_score.best_streak
        best_score_value = best_score.score
        best_level = best_score.level_reached
    except BestScore.DoesNotExist:
        best_streak = game_result.streaks
        best_score_value = game_result.score
        best_level = game_result.level_reached
    
    response_data = {
        'correct': correct if correct is not None else True,
        'score': game_result.score,
        'level_reached': game_result.level_reached,
        'streaks': game_result.streaks,
        'best_score': best_score_value,
        'best_level': best_level,
        'best_streak': best_streak,
        'xp_earned': result_data['xp_earned'],
        'level_up': result_data['level_up'],
        'old_level': result_data['old_level'],
        'new_level': result_data['new_level'],
        'total_xp': result_data['total_xp'],
        'newly_earned_achievements': [
            {
                'id': a.id,
                'name': a.name,
                'description': a.description,
                'icon': a.icon,
                'points': a.points
            } for a in result_data['newly_earned']['achievements']
        ],
        'newly_earned_badges': [
            {
                'id': b.id,
                'name': b.name,
                'description': b.description,
                'icon': b.icon,
                'badge_type': b.badge_type
            } for b in result_data['newly_earned']['badges']
        ]
    }
    return response_data

# Helper for updating GameResult and BestScore with level, score, xp logic
def update_score(user, game_name, score, level, frontend_xp, streaks=0, mistakes=0, correct_answers=0):
    from leaderboard.models import BestScore  # Import here to avoid circular imports
    
    print(f"=== update_score: Called with user={user}, game_name='{game_name}', score={score}, level={level}, frontend_xp={frontend_xp}")
    
    try:
        game = Game.objects.get(name=game_name)
        print(f"=== update_score: Found game: {game.name} (id: {game.id})")
    except Game.DoesNotExist:
        print(f"=== update_score: Game '{game_name}' not found, creating it...")
        # If game doesn't exist, create it with default values
        game = Game.objects.create(
            name=game_name,
            description=f"Auto-created game: {game_name}",
            category="memory",  # Default category
            base_xp_reward=10
        )
        print(f"=== update_score: Created new game: {game.name} (id: {game.id})")
    
    # Calculate game XP based on performance - IGNORE frontend XP
    base_xp = game.base_xp_reward
    performance_xp = 0
    
    # Award XP based on level reached (5 XP per level)
    level_xp = level * 5
    
    # Award XP based on score (1 XP per 100 points, max 20 bonus XP)
    score_xp = min(score // 100, 20)
    
    # Award XP based on streaks (2 XP per streak, max 10 bonus XP)
    streak_xp = min(streaks * 2, 10)
    
    # Penalty for mistakes (lose 1 XP per mistake, min 0)
    mistake_penalty = min(mistakes, base_xp // 2)  # Max penalty is half the base XP
    
    # Calculate total game XP
    total_game_xp = max(base_xp + level_xp + score_xp + streak_xp - mistake_penalty, 5)  # Minimum 5 XP
    
    print(f"=== update_score: XP calculation - Base: {base_xp}, Level: {level_xp}, Score: {score_xp}, Streak: {streak_xp}, Penalty: {mistake_penalty}, Total: {total_game_xp}")
    print(f"=== update_score: Frontend sent XP: {frontend_xp}, Backend calculated: {total_game_xp} - Using backend calculation")
    
    # Award XP to user
    old_level = user.level
    user.add_experience(total_game_xp)
    new_level = user.level
    level_up = new_level > old_level
    
    if level_up:
        print(f"🎉 {user} leveled up from {old_level} to {new_level}!")
    
    # Always create a new GameResult entry for each play
    print(f"=== update_score: Creating GameResult...")
    game_result = GameResult.objects.create(
        user=user,
        game=game,
        score=score,
        level_reached=level,  # Use game level reached, not user's account level
        xp_earned=total_game_xp,  # Use calculated XP instead of passed XP
        streaks=streaks,
        mistakes=mistakes,
        correct_answers=correct_answers
    )
    print(f"=== update_score: Created GameResult with id: {game_result.id}")
    
    # Get or create the BestScore record for this user and game
    print(f"=== update_score: Getting or creating BestScore...")
    bestscore, created = BestScore.objects.get_or_create(
        user=user, game=game,
        defaults={
            'score': score,
            'level_reached': level,  # Use game level reached, not user's account level
            'xp_earned': total_game_xp,  # Use calculated XP
            'best_streak': streaks,
            'fewest_mistakes': mistakes if mistakes > 0 else 999,  # Use 999 as default if no mistakes
            'most_correct': correct_answers,
            'times_played': 1
        }
    )
    
    if created:
        print(f"=== update_score: Created new BestScore with id: {bestscore.id}")
    else:
        print(f"=== update_score: Found existing BestScore with id: {bestscore.id}")
    
    # Update BestScore if any metrics have improved
    if not created:
        updated = False
        
        # Update if score is higher
        if score > bestscore.score:
            bestscore.score = score
            updated = True
        
        # Update if level is higher
        if level > bestscore.level_reached:
            bestscore.level_reached = level
            updated = True
        
        # Update if XP is higher
        if total_game_xp > bestscore.xp_earned:
            bestscore.xp_earned = total_game_xp
            updated = True
        
        # Update if streak is higher
        if streaks > bestscore.best_streak:
            bestscore.best_streak = streaks
            updated = True
        
        # Update if mistakes is fewer (and not zero, which might mean mistakes weren't tracked)
        if mistakes > 0 and mistakes < bestscore.fewest_mistakes:
            bestscore.fewest_mistakes = mistakes
            updated = True
            
        # Update if correct answers is higher
        if correct_answers > bestscore.most_correct:
            bestscore.most_correct = correct_answers
            updated = True
        
        # Save if anything was updated
        if updated:
            bestscore.save()
        else:
            # Still increment times_played even if no records were broken
            bestscore.times_played += 1
            bestscore.save()
    
    # **NEW: Check and award achievements after every game**
    print(f"=== update_score: Checking achievements for user {user}")
    newly_earned = check_and_award_achievements(user)
    if newly_earned['achievements'] or newly_earned['badges']:
        print(f"=== update_score: User earned {len(newly_earned['achievements'])} achievements and {len(newly_earned['badges'])} badges")
    
    # Return game result with XP and level info
    game_data = {
        'game_result': game_result,
        'newly_earned': newly_earned,
        'xp_earned': total_game_xp,
        'level_up': level_up,
        'old_level': old_level,
        'new_level': new_level,
        'total_xp': user.experience
    }
    
    return game_data


class CategoriesView(APIView):
    def get(self, request):
        # Get unique categories with their display names
        categories = []
        for key, label in Game.CATEGORY_CHOICES:
            # Get count of games in this category
            game_count = Game.objects.filter(category=key).count()
            
            # Create a structure similar to your frontend constants
            categories.append({
                'key': key,
                'label': label,
                'game_count': game_count,
                # You could add default icons/colors here or handle in frontend
            })
        
        return Response(categories)


# MEMORY GAMES

class NumberRecallView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        # Add GET method for testing
        return Response({"message": "NumberRecall endpoint is working", "user": str(request.user)})
    
    def post(self, request):
        print(f"=== NumberRecallView: Received data: {request.data}")
        print(f"=== NumberRecallView: User: {request.user}")
        print(f"=== NumberRecallView: Headers: {dict(request.headers)}")
        
        serializer = NumberRecallSerializer(data=request.data)
        if not serializer.is_valid():
            print(f"=== NumberRecallView: Serializer errors: {serializer.errors}")
            return Response({"errors": serializer.errors, "received_data": request.data}, status=400)
            
        data = serializer.validated_data
        print(f"=== NumberRecallView: Validated data: {data}")
        
        correct = data['sequence'] == data['user_response']  # <-- Remove mode logic
        score = data.get('score', 0)
        level = data.get('level_reached', 1)
        xp = data.get('xp', score)
        streaks = data.get('streaks', 0)
        mistakes = data.get('mistakes', 0)
        correct_answers = data.get('correct_answers', score // 100)  # Estimate correct answers from score if not provided
        
        print(f"=== NumberRecallView: Calling update_score with: user={request.user}, game='Number Recall', score={score}, level={level}, xp={xp}, streaks={streaks}, mistakes={mistakes}, correct_answers={correct_answers}")
        
        try:
            result = update_score(request.user, "Number Recall", score, level, xp, streaks, mistakes, correct_answers)
            print(f"=== NumberRecallView: Successfully created GameResult: {result.get('game_result').id}")
            
            response_data = create_game_response(result, correct)
            return Response(response_data)
        except Exception as e:
            print(f"=== NumberRecallView: Error in update_score: {e}")
            import traceback
            traceback.print_exc()
            return Response({'error': str(e)}, status=500)

class WordGridView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        serializer = WordGridSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        correct_words = set(data['grid']) & set(data['user_words'])
        score = data.get('score', len(correct_words))
        level = data.get('level_reached', 1)
        xp = data.get('xp', score)
        streaks = data.get('streaks', 0)
        mistakes = data.get('mistakes', 0)
        result = update_score(request.user, "Word Grid", score, level, xp, streaks, mistakes)
        
        response_data = create_game_response(result)
        response_data['correct_words'] = list(correct_words)  # Add game-specific data
        return Response(response_data)

class PatternPlaybackView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        serializer = PatternPlaybackSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        correct = data['pattern'] == data['user_response']
        score = data.get('score', len(data['pattern']) if correct else 0)
        level = data.get('level_reached', 1)
        xp = data.get('xp', score)
        streaks = data.get('streaks', 0)
        mistakes = data.get('mistakes', 0)
        update_score(request.user, "Pattern Playback", score, level, xp, streaks, mistakes)
        return Response({'correct': correct, 'score': score})

class FaceNameMatchView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        serializer = FaceNameMatchSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        correct = sum(1 for a, b in zip(data['names'], data['user_matches']) if a == b)
        score = data.get('score', correct)
        level = data.get('level_reached', 1)
        xp = data.get('xp', score)
        streaks = data.get('streaks', 0)
        mistakes = data.get('mistakes', 0)
        update_score(request.user, "Face-Name Match", score, level, xp, streaks, mistakes)
        return Response({'correct': correct, 'score': score})

class CardFlipMemoryView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        serializer = CardFlipMemorySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        score = data.get('score', 0)
        level = data.get('level_reached', 1)
        xp = data.get('xp', score)
        streaks = data.get('streaks', 0)
        mistakes = data.get('mistakes', 0)
        update_score(request.user, "Card Flip Memory", score, level, xp, streaks, mistakes)
        return Response({'score': score})
    
# Attention GAMES

class OddOneOutView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        serializer = OddOneOutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        score = data.get('score', 0)
        level = data.get('level_reached', 1)
        xp = data.get('xp', score)
        streaks = data.get('streaks', 0)
        mistakes = data.get('mistakes', 0)
        update_score(request.user, "Odd One Out", score, level, xp, streaks, mistakes)
        return Response({'score': score})

class FocusShiftView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        serializer = FocusShiftSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        score = data.get('score', 0)
        level = data.get('level_reached', 1)
        xp = data.get('xp', score)
        streaks = data.get('streaks', 0)
        mistakes = data.get('mistakes', 0)
        update_score(request.user, "Focus Shift", score, level, xp, streaks, mistakes)
        return Response({'score': score})

class DistractionDodgerView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        serializer = DistractionDodgerSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        score = data.get('score', 0)
        level = data.get('level_reached', 1)
        xp = data.get('xp', score)
        streaks = data.get('streaks', 0)
        mistakes = data.get('mistakes', 0)
        update_score(request.user, "Distraction Dodger", score, level, xp, streaks, mistakes)
        return Response({'score': score})

class SpotTheChangeView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        serializer = SpotTheChangeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        score = data.get('score', 0)
        level = data.get('level_reached', 1)
        xp = data.get('xp', score)
        streaks = data.get('streaks', 0)
        mistakes = data.get('mistakes', 0)
        update_score(request.user, "Spot the Change", score, level, xp, streaks, mistakes)
        return Response({'score': score})

class MovingTargetView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        serializer = MovingTargetSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        score = data.get('score', 0)
        level = data.get('level_reached', 1)
        xp = data.get('xp', score)
        streaks = data.get('streaks', 0)
        mistakes = data.get('mistakes', 0)
        update_score(request.user, "Moving Target", score, level, xp, streaks, mistakes)
        return Response({'score': score})
    
# SPEED GAMES

class QuickMatchView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        serializer = QuickMatchSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        score = data.get('score', 0)
        level = data.get('level_reached', 1)
        xp = data.get('xp', score)
        streaks = data.get('streaks', 0)
        mistakes = data.get('mistakes', 0)
        update_score(request.user, "Quick Match", score, level, xp, streaks, mistakes)
        return Response({'score': score})

class MathBlitzView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        serializer = MathBlitzSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        score = data.get('score', 0)
        level = data.get('level_reached', 1)
        xp = data.get('xp', score)
        streaks = data.get('streaks', 0)
        mistakes = data.get('mistakes', 0)
        update_score(request.user, "Math Blitz", score, level, xp, streaks, mistakes)
        return Response({'score': score})

class SpeedSortView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        serializer = SpeedSortSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        score = data.get('score', 0)
        level = data.get('level_reached', 1)
        xp = data.get('xp', score)
        streaks = data.get('streaks', 0)
        mistakes = data.get('mistakes', 0)
        update_score(request.user, "Speed Sort", score, level, xp, streaks, mistakes)
        return Response({'score': score})

class ReactionTimeTapView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        serializer = ReactionTimeTapSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        score = data.get('score', 0)
        level = data.get('level_reached', 1)
        xp = data.get('xp', score)
        streaks = data.get('streaks', 0)
        mistakes = data.get('mistakes', 0)
        update_score(request.user, "Reaction Time Tap", score, level, xp, streaks, mistakes)
        return Response({'score': score})

class CategoryStormView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        serializer = CategoryStormSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        score = data.get('score', 0)
        level = data.get('level_reached', 1)
        xp = data.get('xp', score)
        streaks = data.get('streaks', 0)
        mistakes = data.get('mistakes', 0)
        update_score(request.user, "Category Storm", score, level, xp, streaks, mistakes)
        return Response({'score': score})

# LOGIC GAMES

class ShapeSequencesView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        serializer = ShapeSequencesSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        score = data.get('score', 0)
        level = data.get('level_reached', 1)
        xp = data.get('xp', score)
        streaks = data.get('streaks', 0)
        mistakes = data.get('mistakes', 0)
        update_score(request.user, "Shape Sequences", score, level, xp, streaks, mistakes)
        return Response({'score': score})

class MathLogicView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        serializer = MathLogicSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        score = data.get('score', 0)
        level = data.get('level_reached', 1)
        xp = data.get('xp', score)
        streaks = data.get('streaks', 0)
        mistakes = data.get('mistakes', 0)
        update_score(request.user, "Math Logic", score, level, xp, streaks, mistakes)
        return Response({'score': score})

class TilePuzzleView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        serializer = TilePuzzleSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        score = data.get('score', 0)
        level = data.get('level_reached', 1)
        xp = data.get('xp', score)
        streaks = data.get('streaks', 0)
        mistakes = data.get('mistakes', 0)
        update_score(request.user, "Tile Puzzle", score, level, xp, streaks, mistakes)
        return Response({'score': score})

class SymbolEquationView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        serializer = SymbolEquationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        score = data.get('score', 0)
        level = data.get('level_reached', 1)
        xp = data.get('xp', score)
        streaks = data.get('streaks', 0)
        mistakes = data.get('mistakes', 0)
        update_score(request.user, "Symbol Equation", score, level, xp, streaks, mistakes)
        return Response({'score': score})

class PathBuilderView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        serializer = PathBuilderSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        score = data.get('score', 0)
        level = data.get('level_reached', 1)
        xp = data.get('xp', score)
        streaks = data.get('streaks', 0)
        mistakes = data.get('mistakes', 0)
        update_score(request.user, "Path Builder", score, level, xp, streaks, mistakes)
        return Response({'score': score})
    
# LANGUAGE GAMES

class WordLadderView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        serializer = WordLadderSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        score = data.get('score', 0)
        level = data.get('level_reached', 1)
        xp = data.get('xp', score)
        streaks = data.get('streaks', 0)
        mistakes = data.get('mistakes', 0)
        update_score(request.user, "Word Ladder", score, level, xp, streaks, mistakes)
        return Response({'score': score})

class AnagramRushView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        serializer = AnagramRushSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        score = data.get('score', 0)
        level = data.get('level_reached', 1)
        xp = data.get('xp', score)
        streaks = data.get('streaks', 0)
        mistakes = data.get('mistakes', 0)
        update_score(request.user, "Anagram Rush", score, level, xp, streaks, mistakes)
        return Response({'score': score})

class SynonymMatchView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        serializer = SynonymMatchSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        score = data.get('score', 0)
        level = data.get('level_reached', 1)
        xp = data.get('xp', score)
        streaks = data.get('streaks', 0)
        mistakes = data.get('mistakes', 0)
        update_score(request.user, "Synonym Match", score, level, xp, streaks, mistakes)
        return Response({'score': score})

class MissingLetterView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        serializer = MissingLetterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        score = data.get('score', 0)
        level = data.get('level_reached', 1)
        xp = data.get('xp', score)
        streaks = data.get('streaks', 0)
        mistakes = data.get('mistakes', 0)
        update_score(request.user, "Missing Letter", score, level, xp, streaks, mistakes)
        return Response({'score': score})

class GrammarFixView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        serializer = GrammarFixSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        score = data.get('score', 0)
        level = data.get('level_reached', 1)
        xp = data.get('xp', score)
        streaks = data.get('streaks', 0)
        mistakes = data.get('mistakes', 0)
        update_score(request.user, "Grammar Fix", score, level, xp, streaks, mistakes)
        return Response({'score': score})

# MULTI-DOMAIN GAMES

class DualTaskingView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        serializer = DualTaskingSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        score = data.get('score', 0)
        level = data.get('level_reached', 1)
        xp = data.get('xp', score)
        streaks = data.get('streaks', 0)
        mistakes = data.get('mistakes', 0)
        update_score(request.user, "Dual Tasking", score, level, xp, streaks, mistakes)
        return Response({'score': score})

class NavigationChallengeView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        serializer = NavigationChallengeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        score = data.get('score', 0)
        level = data.get('level_reached', 1)
        xp = data.get('xp', score)
        streaks = data.get('streaks', 0)
        mistakes = data.get('mistakes', 0)
        update_score(request.user, "Navigation Challenge", score, level, xp, streaks, mistakes)
        return Response({'score': score})

class ResourceManagementView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        serializer = ResourceManagementSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        score = data.get('score', 0)
        level = data.get('level_reached', 1)
        xp = data.get('xp', score)
        streaks = data.get('streaks', 0)
        mistakes = data.get('mistakes', 0)
        update_score(request.user, "Resource Management", score, level, xp, streaks, mistakes)
        return Response({'score': score})

class ColorWordSwitchView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        serializer = ColorWordSwitchSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        score = data.get('score', 0)
        level = data.get('level_reached', 1)
        xp = data.get('xp', score)
        streaks = data.get('streaks', 0)
        mistakes = data.get('mistakes', 0)
        update_score(request.user, "Color-Word Switch (Stroop Test)", score, level, xp, streaks, mistakes)
        return Response({'score': score})

class RapidDecisionView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        serializer = RapidDecisionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        score = data.get('score', 0)
        level = data.get('level_reached', 1)
        xp = data.get('xp', score)
        streaks = data.get('streaks', 0)
        mistakes = data.get('mistakes', 0)
        update_score(request.user, "Rapid Decision", score, level, xp, streaks, mistakes)
        return Response({'score': score})

# COMPETITIVE GAMES

class BrainBattleView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        serializer = BrainBattleSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        score = data.get('score', 0)
        level = data.get('level_reached', 1)
        xp = data.get('xp', score)
        streaks = data.get('streaks', 0)
        mistakes = data.get('mistakes', 0)
        update_score(request.user, "Brain Battle (Multiplayer)", score, level, xp, streaks, mistakes)
        return Response({'score': score})

class MemoryMazeView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        serializer = MemoryMazeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        score = data.get('score', 0)
        level = data.get('level_reached', 1)
        xp = data.get('xp', score)
        streaks = data.get('streaks', 0)
        mistakes = data.get('mistakes', 0)
        update_score(request.user, "Memory Maze", score, level, xp, streaks, mistakes)
        return Response({'score': score})

class SpeedDuelView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        serializer = SpeedDuelSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        score = data.get('score', 0)
        level = data.get('level_reached', 1)
        xp = data.get('xp', score)
        streaks = data.get('streaks', 0)
        mistakes = data.get('mistakes', 0)
        update_score(request.user, "Speed Duel", score, level, xp, streaks, mistakes)
        return Response({'score': score})

class CognitiveComboView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        serializer = CognitiveComboSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        score = data.get('score', 0)
        level = data.get('level_reached', 1)
        xp = data.get('xp', score)
        streaks = data.get('streaks', 0)
        mistakes = data.get('mistakes', 0)
        update_score(request.user, "Cognitive Combo", score, level, xp, streaks, mistakes)
        return Response({'score': score})

class IQArenaView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        serializer = IQArenaSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        score = data.get('score', 0)
        level = data.get('level_reached', 1)
        xp = data.get('xp', score)
        streaks = data.get('streaks', 0)
        mistakes = data.get('mistakes', 0)
        update_score(request.user, "IQ Arena", score, level, xp, streaks, mistakes)
        return Response({'score': score})


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
        
        # First, try to join an existing waiting match
        waiting_match = MultiplayerMatch.objects.filter(
            game=game,
            status='waiting',
            player2__isnull=True
        ).exclude(player1=request.user).first()
        
        if waiting_match:
            # Join existing match
            waiting_match.player2 = request.user
            waiting_match.status = 'active'
            waiting_match.started_at = timezone.now()
            waiting_match.save()
            
            return Response({
                'match_id': waiting_match.id,
                'status': 'matched',
                'opponent': waiting_match.player1.username,
                'game': game.name
            })
        else:
            # Create new match
            new_match = MultiplayerMatch.objects.create(
                game=game,
                player1=request.user,
                status='waiting'
            )
            
            return Response({
                'match_id': new_match.id,
                'status': 'waiting',
                'game': game.name
            })


class MultiplayerMatchStatusView(APIView):
    """Get current status of a multiplayer match"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, match_id):
        try:
            match = MultiplayerMatch.objects.get(
                id=match_id
            )
            # Check if user is part of this match
            if match.player1 != request.user and match.player2 != request.user:
                return Response({'error': 'Match not found'}, status=404)
        except MultiplayerMatch.DoesNotExist:
            return Response({'error': 'Match not found'}, status=404)
        
        opponent = match.get_opponent(request.user)
        scores = MultiplayerScore.objects.filter(match=match)
        
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
                    'completed_at': score.completed_at
                }
                for score in scores
            ]
        }
        
        if match.status == 'completed' and match.winner:
            response_data['winner'] = match.winner.username
        
        return Response(response_data)


class MultiplayerScoreSubmissionView(APIView):
    """Submit score for a multiplayer match"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request, match_id):
        try:
            match = MultiplayerMatch.objects.get(
                id=match_id,
                status='active'
            )
            # Check if user is part of this match
            if match.player1 != request.user and match.player2 != request.user:
                return Response({'error': 'Active match not found'}, status=404)
        except MultiplayerMatch.DoesNotExist:
            return Response({'error': 'Active match not found'}, status=404)
        
        # Check if user already submitted score
        existing_score = MultiplayerScore.objects.filter(
            match=match,
            player=request.user
        ).first()
        
        if existing_score:
            return Response({'error': 'Score already submitted'}, status=400)
        
        # Create new score
        score_data = request.data
        MultiplayerScore.objects.create(
            match=match,
            player=request.user,
            score=score_data.get('score', 0),
            level_reached=score_data.get('level_reached', 1),
            performance_data=score_data.get('performance_data', {})
        )
        
        # Check if both players have submitted scores
        scores_count = MultiplayerScore.objects.filter(match=match).count()
        if scores_count == 2:
            # Both players finished, determine winner
            scores = MultiplayerScore.objects.filter(match=match).order_by('-score')
            top_score = scores.first()
            
            match.winner = top_score.player
            match.status = 'completed'
            match.completed_at = timezone.now()
            match.save()
            
            # Award XP to both players (winner gets bonus)
            for score in scores:
                base_xp = match.game.calculate_xp_reward(score.score)
                if score.player == match.winner:
                    # Winner gets 50% bonus XP
                    final_xp = int(base_xp * 1.5)
                else:
                    final_xp = base_xp
                
                # Update player's overall score/XP
                update_score(
                    score.player,
                    match.game.name,
                    score.score,
                    score.level_reached,
                    final_xp,
                    score.performance_data.get('streaks', 0),
                    score.performance_data.get('mistakes', 0)
                )
        
        return Response({'success': True})


class MultiplayerLeaderboardView(APIView):
    """Get leaderboard for competitive multiplayer games"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        # Get overall multiplayer stats
        players_stats = []
        
        # Get all users who have played competitive games
        competitive_players = CustomUser.objects.filter(
            won_matches__isnull=False
        ).distinct() | CustomUser.objects.filter(
            matches_as_player1__status='completed'
        ).distinct() | CustomUser.objects.filter(
            matches_as_player2__status='completed'
        ).distinct()
        
        for player in competitive_players:
            wins = MultiplayerMatch.objects.filter(winner=player).count()
            total_matches = MultiplayerMatch.objects.filter(
                Q(player1=player) | Q(player2=player),
                status='completed'
            ).count()
            
            win_rate = (wins / total_matches * 100) if total_matches > 0 else 0
            
            players_stats.append({
                'username': player.username,
                'wins': wins,
                'total_matches': total_matches,
                'win_rate': round(win_rate, 1)
            })
        
        # Sort by wins, then by win rate
        players_stats.sort(key=lambda x: (x['wins'], x['win_rate']), reverse=True)
        
        return Response({
            'leaderboard': players_stats[:50]  # Top 50 players
        })

# Available Games API
class AvailableGamesView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get all available games"""
        try:
            games = Game.objects.all().values('id', 'name', 'category', 'description')
            games_list = list(games)
            
            return Response(games_list)
        except Exception as e:
            print(f"Error fetching available games: {e}")
            return Response({'error': 'Failed to fetch games'}, status=500)