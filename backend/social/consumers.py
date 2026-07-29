import logging
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from users.models import CustomUser
from .models import ChatMessage, UserStatus, Notification
from .serializers import ChatMessageSerializer, NotificationSerializer

logger = logging.getLogger(__name__)

class SocialConsumer(AsyncWebsocketConsumer):
    """WebSocket consumer for social features"""
    
    async def connect(self):
        self.user = self.scope.get('user')
        
        if self.user.is_anonymous:
            await self.close()
            return
            
        # Join user's personal group
        self.user_group_name = f"user_{self.user.id}"
        await self.channel_layer.group_add(self.user_group_name, self.channel_name)
        
        # Join global chat group
        await self.channel_layer.group_add('global_chat', self.channel_name)
        
        await self.accept()
        
        # Set user status to online
        await self.update_user_status('online')
        
        # Broadcast status update to friends
        await self.broadcast_status_update()
        
        # Send initial data
        await self.send_initial_data()
        
        logger.info('User %s connected', self.user.username)

    async def disconnect(self, close_code):
        # Only proceed if user is authenticated
        if not self.user.is_anonymous:
            # Set user offline
            await self.update_user_status('offline')
            
            # Broadcast status update to friends
            await self.broadcast_status_update()
        
        # Leave groups
        if hasattr(self, 'user_group_name'):
            await self.channel_layer.group_discard(self.user_group_name, self.channel_name)
        
        await self.channel_layer.group_discard('global_chat', self.channel_name)
        
        username = getattr(self.user, 'username', 'Anonymous') if not self.user.is_anonymous else 'Anonymous'
        logger.info('User %s disconnected', username)
    
    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            message_type = data.get('type')
            
            if message_type == 'send_message':
                await self.handle_send_message(data)
            elif message_type == 'update_status':
                await self.handle_status_update(data)
            elif message_type == 'mark_read':
                await self.handle_mark_read(data)
                
        except Exception as e:
            logger.exception("Error in receive")
    
    async def handle_send_message(self, data):
        """Handle sending a message"""
        content = data.get('content', '').strip()
        message_type = data.get('message_type', 'private')
        receiver_id = data.get('receiver_id')

        logger.debug('Chat message type=%s receiver=%s', message_type, receiver_id)

        if not content:
            return

        try:
            # Create message
            message = await self.create_message(content, message_type, receiver_id)

            if message:
                if message_type == 'global':
                    # Send to all connected users
                    await self.channel_layer.group_send(
                        'global_chat',
                        {
                            'type': 'chat_message',
                            'message': message
                        }
                    )
                else:
                    # Send to receiver
                    if receiver_id:
                        await self.channel_layer.group_send(
                            f"user_{receiver_id}",
                            {
                                'type': 'chat_message',
                                'message': message
                            }
                        )

                    # Send to sender (for confirmation)
                    await self.channel_layer.group_send(
                        f"user_{self.user.id}",
                        {
                            'type': 'chat_message',
                            'message': message
                        }
                    )
                
                # Create notification for receiver
                notification = await self.create_message_notification(receiver_id, message)
                if notification:
                    await self.channel_layer.group_send(
                        f"user_{receiver_id}",
                        {
                            'type': 'notification',
                            'data': notification
                        }
                    )

            logger.debug('Chat message delivered')

        except Exception as e:
            logger.exception("Error handling send message")
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Failed to send message'
            }))
                

                    
    
    async def handle_status_update(self, data):
        """Handle status update"""
        status = data.get('status', 'online')
        
        if await self.update_user_status(status):
            await self.broadcast_status_update()
    
    async def handle_mark_read(self, data):
        """Handle marking notifications as read"""
        notification_ids = data.get('notification_ids', [])
        
        if await self.mark_notifications_read(notification_ids):
            await self.send(text_data=json.dumps({
                'type': 'notifications_marked_read',
                'notification_ids': notification_ids
            }))
    
    async def chat_message(self, event):
        """Send chat message to WebSocket"""
        await self.send(text_data=json.dumps({
            'type': 'chat_message',
            'message': event['message']
        }))
    
    async def friend_request(self, event):
        """Send friend request notification"""
        await self.send(text_data=json.dumps({
            'type': 'friend_request',
            'data': event['data']
        }))
    
    async def friend_accepted(self, event):
        """Send friend accepted notification"""
        await self.send(text_data=json.dumps({
            'type': 'friend_accepted',
            'data': event['data']
        }))
    
    async def status_update(self, event):
        """Send status update to WebSocket"""
        await self.send(text_data=json.dumps({
            'type': 'status_update',
            'data': event['data']
        }))
    
    async def notification(self, event):
        """Send notification to WebSocket"""
        await self.send(text_data=json.dumps({
            'type': 'notification',
            'data': event['data']
        }))
    
    @database_sync_to_async
    def create_message(self, content, message_type, receiver_id):
        """Create a message in the database"""
        try:
            receiver = None
            if message_type == 'private' and receiver_id:
                receiver = CustomUser.objects.get(id=receiver_id)
            
            message = ChatMessage.objects.create(
                sender=self.user,
                receiver=receiver,
                message_type=message_type,
                content=content
            )
            
            serializer = ChatMessageSerializer(message)
            return serializer.data
        except Exception as e:
            logger.exception("Error creating message")
            return None
    
    @database_sync_to_async
    def create_message_notification(self, receiver_id, message):
        """Create a notification for a new message"""
        try:
            receiver = CustomUser.objects.get(id=receiver_id)
            # Get display name for sender
            sender_name = getattr(self.user, 'username', self.user.email)
            
            notification = Notification.objects.create(
                user=receiver,
                notification_type='new_message',
                title='New Message',
                message=f'{sender_name} sent you a message',
                data={'sender_id': self.user.id, 'message_id': message['id']}
            )
            
            serializer = NotificationSerializer(notification)
            return serializer.data
        except Exception as e:
            logger.exception("Error creating notification")
            return None
    
    @database_sync_to_async
    def update_user_status(self, status):
        """Update user's status in the database"""
        try:
            # Skip for anonymous users
            if self.user.is_anonymous:
                return False
                
            user_status, created = UserStatus.objects.get_or_create(
                user=self.user,
                defaults={'status': status}
            )
            user_status.status = status
            user_status.save()
            return True
        except Exception as e:
            logger.exception("Error updating status")
            return False
    
    @database_sync_to_async
    def get_friends(self):
        """Get user's friends"""
        try:
            # Return empty list for anonymous users
            if self.user.is_anonymous:
                return []
                
            from .models import Friendship
            from django.db.models import Q
            
            friendships = Friendship.objects.filter(
                (Q(requester=self.user) | Q(receiver=self.user)) & Q(status='accepted')
            ).select_related('requester', 'receiver')
            
            friends = []
            for friendship in friendships:
                friend = friendship.receiver if friendship.requester == self.user else friendship.requester
                friends.append(friend.id)
            
            return friends
        except Exception as e:
            logger.exception("Error getting friends")
            return []
    
    @database_sync_to_async
    def mark_notifications_read(self, notification_ids):
        """Mark notifications as read"""
        try:
            if notification_ids:
                Notification.objects.filter(
                    id__in=notification_ids,
                    user=self.user
                ).update(is_read=True)
            else:
                Notification.objects.filter(
                    user=self.user,
                    is_read=False
                ).update(is_read=True)
            return True
        except Exception as e:
            logger.exception("Error marking notifications read")
            return False
    
    async def broadcast_status_update(self):
        """Broadcast status update to friends"""
        # Skip if user is anonymous
        if self.user.is_anonymous:
            return
            
        friends = await self.get_friends()
        sender_name = getattr(self.user, 'username', 'Unknown')
        
        for friend_id in friends:
            await self.channel_layer.group_send(
                f"user_{friend_id}",
                {
                    'type': 'status_update',
                    'data': {
                        'user_id': self.user.id,
                        'username': sender_name,
                        'status': await self.get_user_status()
                    }
                }
            )
    
    @database_sync_to_async
    def get_user_status(self):
        """Get current user status"""
        try:
            user_status = UserStatus.objects.get(user=self.user)
            return user_status.status
        except UserStatus.DoesNotExist:
            return 'offline'
    
    async def send_initial_data(self):
        """Send initial data to newly connected user"""
        try:
            # Send user's friends list
            friends = await self.get_friends_with_status()
            await self.send(text_data=json.dumps({
                'type': 'initial_data',
                'friends': friends,
                'user_id': self.user.id
            }))
        except Exception as e:
            logger.exception("Error sending initial data")
    
    @database_sync_to_async
    def get_friends_with_status(self):
        """Get friends with their status"""
        try:
            from .models import Friendship
            from django.db.models import Q
            from .serializers import UserSerializer
            
            friendships = Friendship.objects.filter(
                (Q(requester=self.user) | Q(receiver=self.user)) & Q(status='accepted')
            ).select_related('requester', 'receiver')
            
            friends = []
            for friendship in friendships:
                friend = friendship.receiver if friendship.requester == self.user else friendship.requester
                friends.append(friend)
            
            # Use the serializer with context to get full user data including status
            serializer = UserSerializer(friends, many=True, context={'request': None})
            return serializer.data
        except Exception as e:
            logger.exception("Error getting friends with status")
            return []