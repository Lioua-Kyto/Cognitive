from rest_framework import serializers
from .models import GameScore, BestScore
from users.models import CustomUser

class UserPublicSerializer(serializers.ModelSerializer):
    country_flag = serializers.SerializerMethodField()
    country_name = serializers.SerializerMethodField()
    profile_picture = serializers.SerializerMethodField()

    class Meta:
        model = CustomUser
        fields = [
            "id",
            "username",
            "email",
            "profile_picture",
            "country",
            "country_flag",
            "country_name",
        ]

    def get_country_flag(self, obj):
        if obj.country:
            return obj.country.flag.url if hasattr(obj.country.flag, 'url') else obj.country.flag
        return None

    def get_country_name(self, obj):
        return obj.country.name if obj.country else None

    def get_profile_picture(self, obj):
        request = self.context.get("request")
        if obj.profile_picture:
            url = obj.profile_picture.url
            if request is not None:
                return request.build_absolute_uri(url)
            return url
        return None

class GameScoreSerializer(serializers.ModelSerializer):
    user = UserPublicSerializer(read_only=True)

    class Meta:
        model = GameScore
        fields = [
            "id",
            "user",
            "score",
            "level_reached",
            "xp",
            "last_played",  # Use last_played instead of created_at/updated_at
            "game",
            "streaks",
            "mistakes",
            "correct_answers"
        ]
        read_only_fields = fields

class BestScoreSerializer(serializers.ModelSerializer):
    user = UserPublicSerializer(read_only=True)

    class Meta:
        model = BestScore
        fields = [
            "id",
            "user",
            "score",
            "level_reached",
            "xp",
            "last_updated",
            "game",
            "best_streak",
            "fewest_mistakes",
            "most_correct"
        ]
        read_only_fields = fields