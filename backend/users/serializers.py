from django.contrib.auth import authenticate
from django_countries.serializers import CountryFieldMixin
from rest_framework import serializers

from .models import CustomUser, UserAchievement, UserBadge


class UserRegistrationSerializer(CountryFieldMixin, serializers.ModelSerializer):
    password1 = serializers.CharField(write_only=True, min_length=8)
    password2 = serializers.CharField(write_only=True, min_length=8)
    country = serializers.CharField(required=True)
    profile_picture = serializers.ImageField(required=True)

    class Meta:
        model = CustomUser
        fields = ['email', 'username', 'profile_picture', 'password1', 'password2', 'country']

    def validate(self, data):
        if data['password1'] != data['password2']:
            raise serializers.ValidationError("Passwords do not match.")
        return data
    
    def validate_email(self, value):
        if CustomUser.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def create(self, validated_data):
        password = validated_data.pop('password1')
        validated_data.pop('password2')
        user = CustomUser.objects.create_user(password=password, **validated_data)
        return user

class UserLoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        email = data.get('email')
        password = data.get('password')
        user = authenticate(request=self.context.get('request'), email=email, password=password)
        if not user:
            raise serializers.ValidationError("Invalid credentials.")
        if not user.is_active:
            raise serializers.ValidationError("User is inactive.")
        data['user'] = user
        return data

class UserDetailSerializer(CountryFieldMixin, serializers.ModelSerializer):
    country_name = serializers.SerializerMethodField()
    country_flag = serializers.SerializerMethodField()
    profile_picture = serializers.SerializerMethodField()
    bio = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    xp_for_next_level = serializers.SerializerMethodField()
    xp_progress_in_current_level = serializers.SerializerMethodField()
    current_level_xp = serializers.SerializerMethodField()
    xp_for_current_level_base = serializers.SerializerMethodField()

    class Meta:
        model = CustomUser
        fields = [
            'id', 'email', 'username', 'profile_picture', 
            'date_joined', 'level', 'experience', 
            'xp_for_next_level', 'xp_progress_in_current_level', 'current_level_xp', 'xp_for_current_level_base',
            'country', 'country_name', 'country_flag', 'bio'
        ]
        read_only_fields = ['id', 'date_joined', 'level', 'experience']

    def get_xp_for_next_level(self, obj):
        return obj.xp_for_next_level
        
    def get_xp_progress_in_current_level(self, obj):
        return obj.xp_progress_in_current_level
        
    def get_current_level_xp(self, obj):
        """Get actual XP progress within current level"""
        xp_base_for_current_level = obj.xp_for_current_level_base
        current_level_progress = obj.experience - xp_base_for_current_level
        return max(0, current_level_progress)

    def get_xp_for_current_level_base(self, obj):
        """Get total XP required to reach current level"""
        return obj.xp_for_current_level_base


    def get_country_name(self, obj):
        return obj.country.name if obj.country else None

    def get_country_flag(self, obj):
        if obj.country:
            # Use the country code to get flag from backend static files
            code = obj.country.code.lower()
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(f'/static/flags/{code}.svg')
            return f'http://127.0.0.1:8000/static/flags/{code}.svg'
        return None

    def get_profile_picture(self, obj):
        if obj.profile_picture:
            request = self.context.get('request')
            url = obj.profile_picture.url
            if request is not None:
                return request.build_absolute_uri(url)
            return url
        return None

class UserProfileSerializer(CountryFieldMixin, serializers.ModelSerializer):
    """Complete user profile with stats, achievements, and badges"""
    country_name = serializers.SerializerMethodField()
    country_flag = serializers.SerializerMethodField()
    profile_picture = serializers.SerializerMethodField()
    username = serializers.SerializerMethodField()
    global_rank = serializers.SerializerMethodField()
    total_games_played = serializers.SerializerMethodField()
    achievements_count = serializers.SerializerMethodField()
    badges_count = serializers.SerializerMethodField()
    xp_for_next_level = serializers.SerializerMethodField()
    xp_progress_in_current_level = serializers.SerializerMethodField()
    current_level_xp = serializers.SerializerMethodField()
    xp_for_current_level_base = serializers.SerializerMethodField()

    class Meta:
        model = CustomUser
        fields = [
            'id', 'email', 'username',
            'profile_picture', 'date_joined', 'level', 'experience', 
            'xp_for_next_level', 'xp_progress_in_current_level', 'current_level_xp', 'xp_for_current_level_base',
            'country', 'country_name', 'country_flag', 'bio',
            'global_rank', 'total_games_played', 'achievements_count', 'badges_count'
        ]
        read_only_fields = ['id', 'date_joined']

    def get_username(self, obj):
        return obj.username
        
    def get_xp_for_next_level(self, obj):
        return obj.xp_for_next_level
        
    def get_xp_progress_in_current_level(self, obj):
        return obj.xp_progress_in_current_level
        
    def get_current_level_xp(self, obj):
        """Get actual XP progress within current level"""
        xp_base_for_current_level = obj.xp_for_current_level_base
        current_level_progress = obj.experience - xp_base_for_current_level
        return max(0, current_level_progress)

    def get_xp_for_current_level_base(self, obj):
        """Get total XP required to reach current level"""
        return obj.xp_for_current_level_base

    def get_country_name(self, obj):
        return obj.country.name if obj.country else None

    def get_country_flag(self, obj):
        if obj.country:
            code = obj.country.code.lower()
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(f'/static/flags/{code}.svg')
            return f'http://127.0.0.1:8000/static/flags/{code}.svg'
        return None

    def get_profile_picture(self, obj):
        if obj.profile_picture:
            request = self.context.get('request')
            url = obj.profile_picture.url
            if request is not None:
                return request.build_absolute_uri(url)
            return url
        return None

    def get_global_rank(self, obj):
        return obj.global_rank

    def get_total_games_played(self, obj):
        return obj.total_games_played

    def get_achievements_count(self, obj):
        return UserAchievement.objects.filter(user=obj).count()

    def get_badges_count(self, obj):
        return UserBadge.objects.filter(user=obj).count()

class UserUpdateSerializer(serializers.ModelSerializer):
    bio = serializers.CharField(required=False, allow_blank=True, allow_null=True, max_length=150)
    
    class Meta:
        model = CustomUser
        fields = ['username', 'email', 'country', 'bio', 'profile_picture']