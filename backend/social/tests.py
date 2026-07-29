from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status
from .models import Friendship, UserStatus, ChatMessage, Notification


class SocialFeatureTestCase(TestCase):
    """Test cases for social features"""
    
    def setUp(self):
        """Set up test data"""
        self.client = APIClient()
        
        # Create test users
        self.user1 = User.objects.create_user(
            username='User One',
            email='user1@example.com',
            password='testpass123'
        )
        
        self.user2 = User.objects.create_user(
            username='User Two',
            email='user2@example.com',
            password='testpass123'
        )
        
        # Create user status
        UserStatus.objects.create(user=self.user1, status='online')
        UserStatus.objects.create(user=self.user2, status='online')
    
    def test_send_friend_request(self):
        """Test sending a friend request"""
        self.client.force_authenticate(user=self.user1)
        
        response = self.client.post('/api/social/send_friend_request/', {
            'username': 'user2'
        })
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Friendship.objects.filter(
            requester=self.user1,
            receiver=self.user2,
            status='pending'
        ).exists())
    
    def test_respond_to_friend_request(self):
        """Test responding to a friend request"""
        # Create a friend request
        friendship = Friendship.objects.create(
            requester=self.user1,
            receiver=self.user2,
            status='pending'
        )
        
        self.client.force_authenticate(user=self.user2)
        
        response = self.client.post('/api/social/respond_friend_request/', {
            'friendship_id': friendship.id,
            'action': 'accept'
        })
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        friendship.refresh_from_db()
        self.assertEqual(friendship.status, 'accepted')
    
    def test_get_friends_list(self):
        """Test getting friends list"""
        # Create accepted friendship
        Friendship.objects.create(
            requester=self.user1,
            receiver=self.user2,
            status='accepted'
        )
        
        self.client.force_authenticate(user=self.user1)
        
        response = self.client.get('/api/social/friends/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['username'], 'user2')
    
    def test_send_message(self):
        """Test sending a message"""
        self.client.force_authenticate(user=self.user1)
        
        response = self.client.post('/api/social/send_message/', {
            'receiver_id': self.user2.id,
            'message_type': 'private',
            'content': 'Hello there!'
        })
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(ChatMessage.objects.filter(
            sender=self.user1,
            receiver=self.user2,
            content='Hello there!'
        ).exists())
    
    def test_search_users(self):
        """Test searching for users"""
        self.client.force_authenticate(user=self.user1)
        
        response = self.client.get('/api/social/search_users/?q=user2')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['username'], 'user2')
    
    def test_get_notifications(self):
        """Test getting notifications"""
        # Create a notification
        Notification.objects.create(
            user=self.user1,
            notification_type='friend_request',
            title='New Friend Request',
            message='Test message'
        )
        
        self.client.force_authenticate(user=self.user1)
        
        response = self.client.get('/api/social/notifications/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['title'], 'New Friend Request')
