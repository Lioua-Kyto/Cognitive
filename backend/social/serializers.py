from rest_framework import serializers
from users.models import CustomUser
from .models import Friendship, UserStatus, ChatMessage, Notification

class SearchUserSerializer(serializers.ModelSerializer):
    """Simplified serializer for user search results with more complete data"""
    profile_pic_url = serializers.SerializerMethodField()
    country_name = serializers.SerializerMethodField()
    country_flag = serializers.SerializerMethodField()
    
    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'email', 'profile_pic_url', 'country_name', 
                 'country_flag', 'level', 'experience', 'bio', 'date_joined']

    
    def get_profile_pic_url(self, obj):
        if obj.profile_picture:
            request = self.context.get('request')
            if request is not None:
                return request.build_absolute_uri(obj.profile_picture.url)
            return obj.profile_picture.url
        return None
    
    def get_country_name(self, obj):
        return obj.country.name if obj.country else None

    def get_country_flag(self, obj):
        if obj.country:
            code = obj.country.code.lower()
            return f"https://flagcdn.com/24x18/{code}.png"
        return None

class UserSerializer(serializers.ModelSerializer):
    """Serializer for User model with social features"""
    username = serializers.SerializerMethodField()
    country_name = serializers.SerializerMethodField()
    profile_picture = serializers.SerializerMethodField()
    status = serializers.SerializerMethodField()
    
    class Meta:
        model = CustomUser
        fields = ['id', 'username',  'email', 'profile_picture', 
                 'level', 'experience', 'country_name', 'bio', 'status']
    
    def get_username(self, obj):
        # Return the username property from CustomUser
        return obj.username
    

    
    def get_country_name(self, obj):
        try:
            return obj.country.name if obj.country else None
        except AttributeError:
            return None
    
    def get_profile_picture(self, obj):
        if obj.profile_picture:
            request = self.context.get('request')
            if request is not None:
                return request.build_absolute_uri(obj.profile_picture.url)
            return obj.profile_picture.url
        return None
    
    def get_status(self, obj):
        """Get user's current status"""
        try:
            from .models import UserStatus
            user_status = UserStatus.objects.get(user=obj)
            return user_status.status
        except UserStatus.DoesNotExist:
            return 'offline'

class FriendshipSerializer(serializers.ModelSerializer):
    """Serializer for Friendship model"""
    requester = UserSerializer(read_only=True)
    receiver = UserSerializer(read_only=True)
    
    class Meta:
        model = Friendship
        fields = ['id', 'requester', 'receiver', 'status', 'created_at']


class UserStatusSerializer(serializers.ModelSerializer):
    """Serializer for UserStatus model"""
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = UserStatus
        fields = ['user', 'status', 'last_activity']


class ChatMessageSerializer(serializers.ModelSerializer):
    """Serializer for ChatMessage model"""
    sender = UserSerializer(read_only=True)
    receiver = UserSerializer(read_only=True)
    
    class Meta:
        model = ChatMessage
        fields = ['id', 'sender', 'receiver', 'message_type', 'content', 'timestamp', 'is_read']


class NotificationSerializer(serializers.ModelSerializer):
    """Serializer for Notification model"""
    class Meta:
        model = Notification
        fields = ['id', 'notification_type', 'title', 'message', 'data', 'is_read', 'created_at']


class SendFriendRequestSerializer(serializers.Serializer):
    """Serializer for sending friend requests"""
    username = serializers.CharField()
    
    def validate_username(self, value):
        # Try to find user by username (case-insensitive)
        user = CustomUser.objects.filter(username__iexact=value).first()
        if user:
            return value
        
        # Try to find by email (case-insensitive)
        user = CustomUser.objects.filter(email__iexact=value).first()
        if user:
            return value
        
        raise serializers.ValidationError("User not found")
    
    def get_user_by_username(self, username):
        """Get user by username or email - try case sensitive first, then case insensitive"""
        # Try username case-sensitive first
        user = CustomUser.objects.filter(username=username).first()
        if user:
            return user
        
        # Try username case-insensitive
        user = CustomUser.objects.filter(username__iexact=username).first()
        if user:
            return user
        
        # Try email case-insensitive
        user = CustomUser.objects.filter(email__iexact=username).first()
        if user:
            return user
            
        return None


class SendMessageSerializer(serializers.Serializer):
    """Serializer for sending messages"""
    receiver_id = serializers.IntegerField(required=False)
    message_type = serializers.CharField(max_length=10)
    content = serializers.CharField(max_length=2000)