from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from users.models import CustomUser
from django.db.models import Q
from django.utils import timezone
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from .models import Friendship, UserStatus, ChatMessage, Notification
from .serializers import (
    FriendshipSerializer, UserStatusSerializer, ChatMessageSerializer,
    NotificationSerializer, SendFriendRequestSerializer, SendMessageSerializer,
    UserSerializer, SearchUserSerializer
)

class SocialViewSet(viewsets.ViewSet):
    """ViewSet for social features"""
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def friends(self, request):
        """Get user's friends list"""
        user = request.user
        
        # Get accepted friendships where user is either requester or receiver
        friendships = Friendship.objects.filter(
            (Q(requester=user) | Q(receiver=user)) & Q(status='accepted')
        ).select_related('requester', 'receiver')
        
        friends = []
        for friendship in friendships:
            friend = friendship.receiver if friendship.requester == user else friendship.requester
            friends.append(friend)
        
        serializer = UserSerializer(friends, many=True, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def friend_requests(self, request):
        """Get pending friend requests"""
        user = request.user
        
        # Get received friend requests
        received_requests = Friendship.objects.filter(
            receiver=user, status='pending'
        ).select_related('requester', 'receiver')
        
        # Get sent friend requests
        sent_requests = Friendship.objects.filter(
            requester=user, status='pending'
        ).select_related('requester', 'receiver')
        
        return Response({
            'received': FriendshipSerializer(received_requests, many=True).data,
            'sent': FriendshipSerializer(sent_requests, many=True).data
        })
    
    @action(detail=False, methods=['post'])
    def send_friend_request(self, request):
        """Send a friend request"""
        serializer = SendFriendRequestSerializer(data=request.data)
        if serializer.is_valid():
            username = serializer.validated_data['username']
            
            # Use the serializer's method to find the user
            receiver = serializer.get_user_by_username(username)
            
            if not receiver:
                return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
            
            if receiver == request.user:
                return Response({'error': 'Cannot send friend request to yourself'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Check if users are already friends or have pending request
            existing = Friendship.objects.filter(
                (Q(requester=request.user, receiver=receiver) | 
                 Q(requester=receiver, receiver=request.user))
            ).first()
            
            if existing:
                if existing.status == 'accepted':
                    return Response({'error': 'Already friends'}, status=status.HTTP_400_BAD_REQUEST)
                else:
                    return Response({'error': 'Friend request already exists'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Create friend request
            friendship = Friendship.objects.create(
                requester=request.user,
                receiver=receiver,
                status='pending'
            )
            
            # Get sender display name
            sender_name = request.user.username
            
            # Create notification
            notification = Notification.objects.create(
                user=receiver,
                notification_type='friend_request',
                title='New Friend Request',
                message=f'{sender_name} sent you a friend request',
                data={'sender_id': request.user.id}
            )
            
            # Send WebSocket notification to receiver
            channel_layer = get_channel_layer()
            if channel_layer:
                friendship_data = FriendshipSerializer(friendship).data
                async_to_sync(channel_layer.group_send)(
                    f"user_{receiver.id}",
                    {
                        'type': 'friend_request',
                        'data': friendship_data
                    }
                )
            
            return Response({
                'message': f'Friend request sent to {receiver.username}',
                'receiver': UserSerializer(receiver, context={'request': request}).data
            }, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'])
    def cancel_friend_request(self, request):
        """Cancel a sent friend request"""
        friendship_id = request.data.get('friendship_id')
        
        if not friendship_id:
            return Response({'error': 'friendship_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            friendship = Friendship.objects.get(
                id=friendship_id,
                requester=request.user,
                status='pending'
            )
            
            friendship.delete()
            
            return Response({'message': 'Friend request cancelled'})
            
        except Friendship.DoesNotExist:
            return Response({'error': 'Friend request not found'}, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=False, methods=['post'])
    def respond_friend_request(self, request):
        """Accept or reject a friend request"""
        friendship_id = request.data.get('friendship_id')
        action_type = request.data.get('action')  # 'accept' or 'reject'
        
        if not friendship_id or action_type not in ['accept', 'reject']:
            return Response({'error': 'Invalid data'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            friendship = Friendship.objects.get(
                id=friendship_id,
                receiver=request.user,
                status='pending'
            )
            
            friendship.status = 'accepted' if action_type == 'accept' else 'rejected'
            friendship.save()
            
            if action_type == 'accept':
                # Get receiver display name
                receiver_name = getattr(request.user, 'username', request.user.email)
                
                # Create notification for requester
                Notification.objects.create(
                    user=friendship.requester,
                    notification_type='friend_accepted',
                    title='Friend Request Accepted',
                    message=f'{receiver_name} accepted your friend request',
                    data={'friend_id': request.user.id}
                )
            
            return Response({'message': f'Friend request {action_type}ed'})
            
        except Friendship.DoesNotExist:
            return Response({'error': 'Friend request not found'}, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=False, methods=['post'])
    def remove_friend(self, request):
        """Remove a friend from friends list"""
        username = request.data.get('username')
        
        if not username:
            return Response({'error': 'username is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Find the user to remove
            friend_user = CustomUser.objects.get(username=username)
            
            # Find the friendship (could be either direction)
            friendship = Friendship.objects.filter(
                (Q(requester=request.user, receiver=friend_user) |
                 Q(requester=friend_user, receiver=request.user)) &
                Q(status='accepted')
            ).first()
            
            if not friendship:
                return Response({'error': 'Friendship not found'}, status=status.HTTP_404_NOT_FOUND)
            
            # Delete the friendship
            friendship.delete()
            
            # Create notification for the removed friend
            user_name = getattr(request.user, 'username', request.user.email)
            Notification.objects.create(
                user=friend_user,
                notification_type='friend_removed',
                title='Friend Removed',
                message=f'{user_name} removed you from their friends list',
                data={'user_id': request.user.id}
            )
            
            # Broadcast friend removal via WebSocket
            channel_layer = get_channel_layer()
            if channel_layer:
                # Notify the removed friend
                async_to_sync(channel_layer.group_send)(
                    f"user_{friend_user.id}",
                    {
                        'type': 'friend_removed',
                        'data': {
                            'user_id': request.user.id,
                            'username': request.user.username
                        }
                    }
                )
            
            return Response({
                'message': f'Successfully removed {username} from friends',
                'removed_user': username
            })
            
        except CustomUser.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['get'])
    def search_users(self, request):
        """Search for users to add as friends"""
        query = request.query_params.get('q', '')

        if len(query) < 1:
            return Response({'error': 'Query must be at least 1 character'}, status=status.HTTP_400_BAD_REQUEST)

        # Split query into words for full name search
        query_words = query.strip().split()

        # Search for username match (case-insensitive)
        users = CustomUser.objects.filter(
            username__icontains=query
        ).exclude(id=request.user.id)[:10]

        if users.exists():
                serializer = SearchUserSerializer(users, many=True, context={'request': request})
                return Response(serializer.data)

        # Search by individual fields
        search_fields = (
            Q(username__contains=query) |
            Q(email__icontains=query)
        )

        users = CustomUser.objects.filter(search_fields).exclude(id=request.user.id)[:10]

        serializer = SearchUserSerializer(users, many=True, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def update_status(self, request):
        """Update user's status"""
        status_value = request.data.get('status', 'online')
        
        if status_value not in ['online', 'away', 'offline']:
            return Response(
                {'error': 'Invalid status. Must be one of: online, away, offline'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            user_status, created = UserStatus.objects.get_or_create(
                user=request.user,
                defaults={'status': status_value}
            )
            user_status.status = status_value
            user_status.save()
            
            # Broadcast status update to friends
            channel_layer = get_channel_layer()
            if channel_layer:
                # Get user's friends
                friendships = Friendship.objects.filter(
                    (Q(requester=request.user) | Q(receiver=request.user)) & Q(status='accepted')
                ).select_related('requester', 'receiver')
                
                friends = []
                for friendship in friendships:
                    friend = friendship.receiver if friendship.requester == request.user else friendship.requester
                    friends.append(friend.id)
                
                # Broadcast to each friend
                for friend_id in friends:
                    async_to_sync(channel_layer.group_send)(
                        f"user_{friend_id}",
                        {
                            'type': 'status_update',
                            'data': {
                                'user_id': request.user.id,
                                'username': request.user.username,
                                'status': status_value
                            }
                        }
                    )
            
            return Response({
                'success': True,
                'status': status_value,
                'message': f'Status updated to {status_value}'
            })
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def messages(self, request):
        """Get chat messages"""
        message_type = request.query_params.get('type', 'global')
        receiver_id = request.query_params.get('receiver_id')
        
        if message_type == 'private':
            if not receiver_id:
                return Response({'error': 'receiver_id required for private messages'}, status=status.HTTP_400_BAD_REQUEST)
            
            messages = ChatMessage.objects.filter(
                Q(sender=request.user, receiver_id=receiver_id) |
                Q(sender_id=receiver_id, receiver=request.user)
            ).order_by('timestamp')[:50]  # Last 50 messages
        else:
            messages = ChatMessage.objects.filter(
                message_type='global'
            ).order_by('timestamp')[:50]  # Last 50 messages
        
        serializer = ChatMessageSerializer(messages, many=True, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def send_message(self, request):
        """Send a chat message"""
        serializer = SendMessageSerializer(data=request.data)
        if serializer.is_valid():
            data = serializer.validated_data
            
            receiver = None
            if data['message_type'] == 'private':
                try:
                    receiver = CustomUser.objects.get(id=data['receiver_id'])
                except CustomUser.DoesNotExist:
                    return Response({'error': 'Receiver not found'}, status=status.HTTP_404_NOT_FOUND)
            
            message = ChatMessage.objects.create(
                sender=request.user,
                receiver=receiver,
                message_type=data['message_type'],
                content=data['content']
            )
            
            # Create notification for private messages
            if receiver:
                sender_name = getattr(request.user, 'username', request.user.email)
                Notification.objects.create(
                    user=receiver,
                    notification_type='new_message',
                    title='New Message',
                    message=f'{sender_name} sent you a message',
                    data={'sender_id': request.user.id, 'message_id': message.id}
                )
            
            serializer = ChatMessageSerializer(message, context={'request': request})
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def notifications(self, request):
        """Get user notifications"""
        notifications = Notification.objects.filter(user=request.user).order_by('-created_at')[:20]
        serializer = NotificationSerializer(notifications, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def mark_notifications_read(self, request):
        """Mark notifications as read"""
        notification_ids = request.data.get('notification_ids', [])
        
        if notification_ids:
            Notification.objects.filter(
                id__in=notification_ids,
                user=request.user
            ).update(is_read=True)
        else:
            Notification.objects.filter(
                user=request.user,
                is_read=False
            ).update(is_read=True)
        
        return Response({'message': 'Notifications marked as read'})
    
    @action(detail=False, methods=['get'])
    def global_messages(self, request):
        """Get recent global messages"""
        try:
            messages = ChatMessage.objects.filter(
                message_type='global'
            ).order_by('-timestamp')[:50]
            
            serializer = ChatMessageSerializer(messages, many=True, context={'request': request})
            return Response(serializer.data[::-1])  # Reverse to get chronological order
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['get'])
    def chat_messages(self, request, pk=None):
        """Get chat messages between current user and specified user"""
        try:
            other_user_id = int(pk)
            messages = ChatMessage.objects.filter(
                message_type='private',
                sender__in=[request.user.id, other_user_id],
                receiver__in=[request.user.id, other_user_id]
            ).order_by('-timestamp')[:50]
            
            serializer = ChatMessageSerializer(messages, many=True, context={'request': request})
            return Response(serializer.data[::-1])  # Reverse to get chronological order
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )