from rest_framework import serializers
from .models import MultiplayerMatch, MultiplayerScore

# MEMORY GAMES

class NumberRecallSerializer(serializers.Serializer):
    # Required fields
    sequence = serializers.CharField()
    user_response = serializers.CharField(allow_blank=True)
    
    # Optional fields that might be sent
    score = serializers.IntegerField(required=False, default=0)
    level_reached = serializers.IntegerField(required=False, default=1)
    xp = serializers.IntegerField(required=False, default=0)
    streaks = serializers.IntegerField(required=False, default=0)
    mistakes = serializers.IntegerField(required=False, default=0)
    correct_answers = serializers.IntegerField(required=False, default=0)
    
    # Extra fields that might be sent from frontend
    message = serializers.CharField(required=False, allow_blank=True)
    
    def to_internal_value(self, data):
        print(f"=== NumberRecallSerializer: Received raw data: {data}")
        print(f"=== NumberRecallSerializer: Data keys: {list(data.keys()) if hasattr(data, 'keys') else 'Not a dict'}")
        
        # Call parent validation
        try:
            validated_data = super().to_internal_value(data)
            print(f"=== NumberRecallSerializer: Validated data: {validated_data}")
            return validated_data
        except Exception as e:
            print(f"=== NumberRecallSerializer: Validation error: {e}")
            raise

class WordGridSerializer(serializers.Serializer):
    grid = serializers.ListField(child=serializers.CharField())
    user_words = serializers.ListField(child=serializers.CharField())
    score = serializers.IntegerField(required=False, default=0)
    level_reached = serializers.IntegerField(required=False, default=1)
    xp = serializers.IntegerField(required=False, default=0)
    streaks = serializers.IntegerField(required=False, default=0)
    mistakes = serializers.IntegerField(required=False, default=0)

class PatternPlaybackSerializer(serializers.Serializer):
    pattern = serializers.ListField(child=serializers.CharField())
    user_response = serializers.ListField(child=serializers.CharField())
    score = serializers.IntegerField(required=False, default=0)
    level_reached = serializers.IntegerField(required=False, default=1)
    xp = serializers.IntegerField(required=False, default=0)
    streaks = serializers.IntegerField(required=False, default=0)
    mistakes = serializers.IntegerField(required=False, default=0)

class FaceNameMatchSerializer(serializers.Serializer):
    faces = serializers.ListField(child=serializers.CharField())
    names = serializers.ListField(child=serializers.CharField())
    user_matches = serializers.ListField(child=serializers.CharField())
    score = serializers.IntegerField(required=False, default=0)
    level_reached = serializers.IntegerField(required=False, default=1)
    xp = serializers.IntegerField(required=False, default=0)
    streaks = serializers.IntegerField(required=False, default=0)
    mistakes = serializers.IntegerField(required=False, default=0)

class CardFlipMemorySerializer(serializers.Serializer):
    moves = serializers.ListField(child=serializers.CharField())
    score = serializers.IntegerField(required=False, default=0)
    level_reached = serializers.IntegerField(required=False, default=1)
    xp = serializers.IntegerField(required=False, default=0)
    streaks = serializers.IntegerField(required=False, default=0)
    mistakes = serializers.IntegerField(required=False, default=0)

# ATTENTION GAMES

class OddOneOutSerializer(serializers.Serializer):
    rounds = serializers.ListField(child=serializers.DictField())
    user_choices = serializers.ListField(child=serializers.IntegerField())
    score = serializers.IntegerField(required=False, default=0)
    level_reached = serializers.IntegerField(required=False, default=1)
    xp = serializers.IntegerField(required=False, default=0)
    streaks = serializers.IntegerField(required=False, default=0)
    mistakes = serializers.IntegerField(required=False, default=0)

class FocusShiftSerializer(serializers.Serializer):
    tasks = serializers.ListField(child=serializers.CharField())
    user_responses = serializers.ListField(child=serializers.CharField())
    score = serializers.IntegerField(required=False, default=0)
    level_reached = serializers.IntegerField(required=False, default=1)
    xp = serializers.IntegerField(required=False, default=0)
    streaks = serializers.IntegerField(required=False, default=0)
    mistakes = serializers.IntegerField(required=False, default=0)

class DistractionDodgerSerializer(serializers.Serializer):
    events = serializers.ListField(child=serializers.CharField())
    user_taps = serializers.ListField(child=serializers.CharField())
    score = serializers.IntegerField(required=False, default=0)
    level_reached = serializers.IntegerField(required=False, default=1)
    xp = serializers.IntegerField(required=False, default=0)
    streaks = serializers.IntegerField(required=False, default=0)
    mistakes = serializers.IntegerField(required=False, default=0)

class SpotTheChangeSerializer(serializers.Serializer):
    images = serializers.ListField(child=serializers.CharField())
    user_changes = serializers.ListField(child=serializers.CharField())
    score = serializers.IntegerField(required=False, default=0)
    level_reached = serializers.IntegerField(required=False, default=1)
    xp = serializers.IntegerField(required=False, default=0)
    streaks = serializers.IntegerField(required=False, default=0)
    mistakes = serializers.IntegerField(required=False, default=0)

class MovingTargetSerializer(serializers.Serializer):
    targets = serializers.ListField(child=serializers.CharField())
    user_selection = serializers.ListField(child=serializers.CharField())
    score = serializers.IntegerField(required=False, default=0)
    level_reached = serializers.IntegerField(required=False, default=1)
    xp = serializers.IntegerField(required=False, default=0)
    streaks = serializers.IntegerField(required=False, default=0)
    mistakes = serializers.IntegerField(required=False, default=0)

# SPEED GAMES

class QuickMatchSerializer(serializers.Serializer):
    rounds = serializers.ListField(child=serializers.DictField())
    user_matches = serializers.ListField(child=serializers.CharField())
    score = serializers.IntegerField(required=False, default=0)
    level_reached = serializers.IntegerField(required=False, default=1)
    xp = serializers.IntegerField(required=False, default=0)
    streaks = serializers.IntegerField(required=False, default=0)
    mistakes = serializers.IntegerField(required=False, default=0)

class MathBlitzSerializer(serializers.Serializer):
    equations = serializers.ListField(child=serializers.CharField())
    user_answers = serializers.ListField(child=serializers.CharField())
    score = serializers.IntegerField(required=False, default=0)
    level_reached = serializers.IntegerField(required=False, default=1)
    xp = serializers.IntegerField(required=False, default=0)
    streaks = serializers.IntegerField(required=False, default=0)
    mistakes = serializers.IntegerField(required=False, default=0)

class SpeedSortSerializer(serializers.Serializer):
    items = serializers.ListField(child=serializers.CharField())
    user_sort = serializers.ListField(child=serializers.CharField())
    score = serializers.IntegerField(required=False, default=0)
    level_reached = serializers.IntegerField(required=False, default=1)
    xp = serializers.IntegerField(required=False, default=0)
    streaks = serializers.IntegerField(required=False, default=0)
    mistakes = serializers.IntegerField(required=False, default=0)

class ReactionTimeTapSerializer(serializers.Serializer):
    reaction_times = serializers.ListField(child=serializers.FloatField())
    score = serializers.IntegerField(required=False, default=0)
    level_reached = serializers.IntegerField(required=False, default=1)
    xp = serializers.IntegerField(required=False, default=0)
    streaks = serializers.IntegerField(required=False, default=0)
    mistakes = serializers.IntegerField(required=False, default=0)

class CategoryStormSerializer(serializers.Serializer):
    categories = serializers.ListField(child=serializers.CharField())
    user_items = serializers.ListField(child=serializers.CharField())
    score = serializers.IntegerField(required=False, default=0)
    level_reached = serializers.IntegerField(required=False, default=1)
    xp = serializers.IntegerField(required=False, default=0)
    streaks = serializers.IntegerField(required=False, default=0)
    mistakes = serializers.IntegerField(required=False, default=0)

# LOGIC GAMES

class ShapeSequencesSerializer(serializers.Serializer):
    sequence = serializers.ListField(child=serializers.CharField())
    user_guess = serializers.CharField()
    score = serializers.IntegerField(required=False, default=0)
    level_reached = serializers.IntegerField(required=False, default=1)
    xp = serializers.IntegerField(required=False, default=0)
    streaks = serializers.IntegerField(required=False, default=0)
    mistakes = serializers.IntegerField(required=False, default=0)

class MathLogicSerializer(serializers.Serializer):
    puzzle = serializers.CharField()
    user_solution = serializers.CharField()
    score = serializers.IntegerField(required=False, default=0)
    level_reached = serializers.IntegerField(required=False, default=1)
    xp = serializers.IntegerField(required=False, default=0)
    streaks = serializers.IntegerField(required=False, default=0)
    mistakes = serializers.IntegerField(required=False, default=0)

class TilePuzzleSerializer(serializers.Serializer):
    initial_state = serializers.ListField(child=serializers.CharField())
    moves = serializers.ListField(child=serializers.CharField())
    score = serializers.IntegerField(required=False, default=0)
    level_reached = serializers.IntegerField(required=False, default=1)
    xp = serializers.IntegerField(required=False, default=0)
    streaks = serializers.IntegerField(required=False, default=0)
    mistakes = serializers.IntegerField(required=False, default=0)

class SymbolEquationSerializer(serializers.Serializer):
    equation = serializers.CharField()
    user_solution = serializers.CharField()
    score = serializers.IntegerField(required=False, default=0)
    level_reached = serializers.IntegerField(required=False, default=1)
    xp = serializers.IntegerField(required=False, default=0)
    streaks = serializers.IntegerField(required=False, default=0)
    mistakes = serializers.IntegerField(required=False, default=0)

class PathBuilderSerializer(serializers.Serializer):
    path = serializers.ListField(child=serializers.CharField())
    user_path = serializers.ListField(child=serializers.CharField())
    score = serializers.IntegerField(required=False, default=0)
    level_reached = serializers.IntegerField(required=False, default=1)
    xp = serializers.IntegerField(required=False, default=0)
    streaks = serializers.IntegerField(required=False, default=0)
    mistakes = serializers.IntegerField(required=False, default=0)

# LANGUAGE GAMES

class WordLadderSerializer(serializers.Serializer):
    start_word = serializers.CharField()
    end_word = serializers.CharField()
    user_steps = serializers.ListField(child=serializers.CharField())
    score = serializers.IntegerField(required=False, default=0)
    level_reached = serializers.IntegerField(required=False, default=1)
    xp = serializers.IntegerField(required=False, default=0)
    streaks = serializers.IntegerField(required=False, default=0)
    mistakes = serializers.IntegerField(required=False, default=0)

class AnagramRushSerializer(serializers.Serializer):
    letters = serializers.CharField()
    user_words = serializers.ListField(child=serializers.CharField())
    score = serializers.IntegerField(required=False, default=0)
    level_reached = serializers.IntegerField(required=False, default=1)
    xp = serializers.IntegerField(required=False, default=0)
    streaks = serializers.IntegerField(required=False, default=0)
    mistakes = serializers.IntegerField(required=False, default=0)

class SynonymMatchSerializer(serializers.Serializer):
    words = serializers.ListField(child=serializers.CharField())
    user_matches = serializers.ListField(child=serializers.CharField())
    score = serializers.IntegerField(required=False, default=0)
    level_reached = serializers.IntegerField(required=False, default=1)
    xp = serializers.IntegerField(required=False, default=0)
    streaks = serializers.IntegerField(required=False, default=0)
    mistakes = serializers.IntegerField(required=False, default=0)

class MissingLetterSerializer(serializers.Serializer):
    word = serializers.CharField()
    user_letter = serializers.CharField()
    score = serializers.IntegerField(required=False, default=0)
    level_reached = serializers.IntegerField(required=False, default=1)
    xp = serializers.IntegerField(required=False, default=0)
    streaks = serializers.IntegerField(required=False, default=0)
    mistakes = serializers.IntegerField(required=False, default=0)

class GrammarFixSerializer(serializers.Serializer):
    sentence = serializers.CharField()
    user_fix = serializers.CharField()
    score = serializers.IntegerField(required=False, default=0)
    level_reached = serializers.IntegerField(required=False, default=1)
    xp = serializers.IntegerField(required=False, default=0)
    streaks = serializers.IntegerField(required=False, default=0)
    mistakes = serializers.IntegerField(required=False, default=0)

# MULTI-DOMAIN GAMES

class DualTaskingSerializer(serializers.Serializer):
    visual_cues = serializers.ListField(child=serializers.CharField())
    auditory_cues = serializers.ListField(child=serializers.CharField())
    user_responses = serializers.ListField(child=serializers.CharField())
    score = serializers.IntegerField(required=False, default=0)
    level_reached = serializers.IntegerField(required=False, default=1)
    xp = serializers.IntegerField(required=False, default=0)
    streaks = serializers.IntegerField(required=False, default=0)
    mistakes = serializers.IntegerField(required=False, default=0)

class NavigationChallengeSerializer(serializers.Serializer):
    map_data = serializers.CharField()
    user_path = serializers.ListField(child=serializers.CharField())
    score = serializers.IntegerField(required=False, default=0)
    level_reached = serializers.IntegerField(required=False, default=1)
    xp = serializers.IntegerField(required=False, default=0)
    streaks = serializers.IntegerField(required=False, default=0)
    mistakes = serializers.IntegerField(required=False, default=0)

class ResourceManagementSerializer(serializers.Serializer):
    events = serializers.ListField(child=serializers.CharField())
    user_actions = serializers.ListField(child=serializers.CharField())
    score = serializers.IntegerField(required=False, default=0)
    level_reached = serializers.IntegerField(required=False, default=1)
    xp = serializers.IntegerField(required=False, default=0)
    streaks = serializers.IntegerField(required=False, default=0)
    mistakes = serializers.IntegerField(required=False, default=0)

class ColorWordSwitchSerializer(serializers.Serializer):
    words = serializers.ListField(child=serializers.CharField())
    user_colors = serializers.ListField(child=serializers.CharField())
    score = serializers.IntegerField(required=False, default=0)
    level_reached = serializers.IntegerField(required=False, default=1)
    xp = serializers.IntegerField(required=False, default=0)
    streaks = serializers.IntegerField(required=False, default=0)
    mistakes = serializers.IntegerField(required=False, default=0)

class RapidDecisionSerializer(serializers.Serializer):
    tasks = serializers.ListField(child=serializers.CharField())
    user_decisions = serializers.ListField(child=serializers.CharField())
    score = serializers.IntegerField(required=False, default=0)
    level_reached = serializers.IntegerField(required=False, default=1)
    xp = serializers.IntegerField(required=False, default=0)
    streaks = serializers.IntegerField(required=False, default=0)
    mistakes = serializers.IntegerField(required=False, default=0)

# COMPETITIVE GAMES

class BrainBattleSerializer(serializers.Serializer):
    rounds = serializers.ListField(child=serializers.DictField())
    user_scores = serializers.ListField(child=serializers.IntegerField())
    score = serializers.IntegerField(required=False, default=0)
    level_reached = serializers.IntegerField(required=False, default=1)
    xp = serializers.IntegerField(required=False, default=0)
    streaks = serializers.IntegerField(required=False, default=0)
    mistakes = serializers.IntegerField(required=False, default=0)

class MemoryMazeSerializer(serializers.Serializer):
    maze = serializers.CharField()
    user_path = serializers.ListField(child=serializers.CharField())
    score = serializers.IntegerField(required=False, default=0)
    level_reached = serializers.IntegerField(required=False, default=1)
    xp = serializers.IntegerField(required=False, default=0)
    streaks = serializers.IntegerField(required=False, default=0)
    mistakes = serializers.IntegerField(required=False, default=0)

class SpeedDuelSerializer(serializers.Serializer):
    duel_data = serializers.CharField()
    user_time = serializers.FloatField()
    score = serializers.IntegerField(required=False, default=0)
    level_reached = serializers.IntegerField(required=False, default=1)
    xp = serializers.IntegerField(required=False, default=0)
    streaks = serializers.IntegerField(required=False, default=0)
    mistakes = serializers.IntegerField(required=False, default=0)

class CognitiveComboSerializer(serializers.Serializer):
    stages = serializers.ListField(child=serializers.CharField())
    user_results = serializers.ListField(child=serializers.CharField())
    score = serializers.IntegerField(required=False, default=0)
    level_reached = serializers.IntegerField(required=False, default=1)
    xp = serializers.IntegerField(required=False, default=0)
    streaks = serializers.IntegerField(required=False, default=0)
    mistakes = serializers.IntegerField(required=False, default=0)

class IQArenaSerializer(serializers.Serializer):
    puzzles = serializers.ListField(child=serializers.CharField())
    user_solutions = serializers.ListField(child=serializers.CharField())
    score = serializers.IntegerField(required=False, default=0)
    level_reached = serializers.IntegerField(required=False, default=1)
    xp = serializers.IntegerField(required=False, default=0)
    streaks = serializers.IntegerField(required=False, default=0)
    mistakes = serializers.IntegerField(required=False, default=0)


# MULTIPLAYER SERIALIZERS

class MultiplayerMatchSerializer(serializers.ModelSerializer):
    """Serializer for multiplayer match data"""
    player1_username = serializers.CharField(source='player1.username', read_only=True)
    player2_username = serializers.CharField(source='player2.username', read_only=True)
    game_name = serializers.CharField(source='game.name', read_only=True)
    winner_username = serializers.CharField(source='winner.username', read_only=True)
    
    class Meta:
        model = MultiplayerMatch
        fields = [
            'id', 'game_name', 'player1_username', 'player2_username', 
            'status', 'winner_username', 'created_at', 'started_at', 
            'completed_at', 'game_data'
        ]


class MultiplayerScoreSerializer(serializers.ModelSerializer):
    """Serializer for multiplayer score data"""
    player_username = serializers.CharField(source='player.username', read_only=True)
    
    class Meta:
        model = MultiplayerScore
        fields = [
            'player_username', 'score', 'level_reached', 
            'completed_at', 'performance_data'
        ]


class MultiplayerCreateSerializer(serializers.Serializer):
    """Serializer for creating multiplayer matches"""
    game_name = serializers.CharField(max_length=100)


class MultiplayerSubmitSerializer(serializers.Serializer):
    """Serializer for submitting multiplayer scores"""
    score = serializers.IntegerField(min_value=0)
    level_reached = serializers.IntegerField(min_value=1, required=False, default=1)
    performance_data = serializers.DictField(required=False, default=dict)