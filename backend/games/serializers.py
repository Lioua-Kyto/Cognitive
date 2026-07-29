from rest_framework import serializers

from .models import MultiplayerMatch, MultiplayerScore


class GameSubmissionSerializer(serializers.Serializer):
    """Result of one single-player game session.

    Replaces the 35 near-identical per-game serializers. Each of those also
    declared game-specific "proof" fields (sequence, grid, maze, ...) that were
    required but never checked against the submitted score, so they validated
    nothing. Extra keys in the payload are ignored rather than rejected; real
    server-side verification is planned with the new game engine.
    """

    score = serializers.IntegerField(required=False, default=0, min_value=0)
    level_reached = serializers.IntegerField(required=False, default=1, min_value=1)
    streaks = serializers.IntegerField(required=False, default=0, min_value=0)
    mistakes = serializers.IntegerField(required=False, default=0, min_value=0)
    correct_answers = serializers.IntegerField(required=False, default=0, min_value=0)


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
