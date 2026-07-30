from django.contrib import admin

from .models import ChatMessage, Friendship, Notification, UserStatus


@admin.register(Friendship)
class FriendshipAdmin(admin.ModelAdmin):
    list_display = ['get_requester_name', 'get_receiver_name', 'status', 'created_at']
    list_filter = ['status', 'created_at']
    search_fields = ['requester__username', 'requester__email', 
                     'receiver__username', 'receiver__email']
    
    def get_requester_name(self, obj):
        # Use the username property from CustomUser
        return obj.requester.username
    get_requester_name.short_description = 'Requester'
    
    def get_receiver_name(self, obj):
        # Use the username property from CustomUser
        return obj.receiver.username
    get_receiver_name.short_description = 'Receiver'


@admin.register(UserStatus)
class UserStatusAdmin(admin.ModelAdmin):
    list_display = ['get_user_name', 'status', 'last_activity']
    list_filter = ['status', 'last_activity']
    search_fields = ['user__username', 'user__email']
    
    def get_user_name(self, obj):
        # Use the username property from CustomUser
        return obj.user.username
    get_user_name.short_description = 'User'


@admin.register(ChatMessage)
class ChatMessageAdmin(admin.ModelAdmin):
    list_display = ['get_sender_name', 'get_receiver_name', 'message_type', 'content_preview', 'timestamp']
    list_filter = ['message_type', 'timestamp']
    search_fields = ['sender__username', 'sender__email',
                     'receiver__username', 'receiver__email', 'content']
    
    def get_sender_name(self, obj):
        return obj.sender.username
    get_sender_name.short_description = 'Sender'
    
    def get_receiver_name(self, obj):
        if obj.receiver:
            return obj.receiver.username
        return 'Global'
    get_receiver_name.short_description = 'Receiver'
    
    def content_preview(self, obj):
        return obj.content[:50] + '...' if len(obj.content) > 50 else obj.content
    content_preview.short_description = 'Content'


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ['get_user_name', 'notification_type', 'title', 'is_read', 'created_at']
    list_filter = ['notification_type', 'is_read', 'created_at']
    search_fields = ['user__username', 'user__email', 'title', 'message']
    
    def get_user_name(self, obj):
        return obj.user.username
    get_user_name.short_description = 'User'