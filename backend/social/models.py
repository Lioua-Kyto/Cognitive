from django.db import models
from users.models import CustomUser
from django.utils import timezone
from django.conf import settings

class Friendship(models.Model):
    """Model to represent friendships between users"""
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
    ]
    
    requester = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='sent_requests')
    receiver = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='received_requests')
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending', db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ('requester', 'receiver')
        
    def __str__(self):
        return f"{self.requester.username} -> {self.receiver.username} ({self.status})"


class UserStatus(models.Model):
    """Model to track user online status"""
    STATUS_CHOICES = [
        ('online', 'Online'),
        ('away', 'Away'),
        ('offline', 'Offline'),
    ]
    
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='offline')
    last_activity = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.user.username} - {self.status}"


class ChatMessage(models.Model):
    """Model to store chat messages"""
    MESSAGE_TYPES = [
        ('private', 'Private'),
        ('global', 'Global'),
    ]
    
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='sent_messages')
    receiver = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='received_messages', null=True, blank=True)
    message_type = models.CharField(max_length=10, choices=MESSAGE_TYPES, db_index=True)
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)
    is_read = models.BooleanField(default=False, db_index=True)
    
    class Meta:
        ordering = ['-timestamp']
        
    def __str__(self):
        if self.message_type == 'private':
            return f"{self.sender.username} -> {self.receiver.username}: {self.content[:50]}"
        return f"{self.sender.username} (Global): {self.content[:50]}"


class Notification(models.Model):
    """Model to store user notifications"""
    NOTIFICATION_TYPES = [
        ('friend_request', 'Friend Request'),
        ('friend_accepted', 'Friend Accepted'),
        ('new_message', 'New Message'),
        ('achievement', 'Achievement'),
        ('game_invite', 'Game Invite'),
    ]
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications')
    notification_type = models.CharField(max_length=20, choices=NOTIFICATION_TYPES)
    title = models.CharField(max_length=200)
    message = models.TextField()
    data = models.JSONField(default=dict, blank=True)  # Additional data for the notification
    is_read = models.BooleanField(default=False, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
        
    def __str__(self):
        return f"{self.user.username} - {self.title}"