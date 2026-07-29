from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.decorators import api_view, permission_classes
from django.conf import settings
from django.shortcuts import get_object_or_404
from django.db.models import Max, Count, Q
from .models import CustomUser, Achievement, UserAchievement, Badge, UserBadge
from leaderboard.models import BestScore, GameResult
from games.models import Game
from .serializers import *
from .services.achievements import get_achievement_progress, check_and_award_achievements
from rest_framework_simplejwt.tokens import RefreshToken
from django_countries import countries

class UserRegisterView(generics.CreateAPIView):
    queryset = CustomUser.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        # Return a simple success response with user data
        response_data = {
            'id': user.id,
            'email': user.email,
            'username': user.username,
            'message': 'User created successfully'
        }
        
        return Response(response_data, status=status.HTTP_201_CREATED)

class UserLoginView(generics.GenericAPIView):
    serializer_class = UserLoginSerializer
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        refresh = RefreshToken.for_user(user)
        return Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }, status=status.HTTP_200_OK)

class UserDetailView(generics.RetrieveAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = UserDetailSerializer

    def get_object(self):
        return self.request.user

class UserUpdateProfileView(generics.UpdateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = UserUpdateSerializer
    parser_classes = [MultiPartParser, FormParser]

    def get_object(self):
        return self.request.user
        
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        # Respond with the full detail shape so the client gets an absolute
        # profile_picture URL back.
        return Response(UserDetailSerializer(instance, context={'request': request}).data)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_user_profile(request, identifier):
    """Get detailed profile data for any user by ID, username, or email"""
    try:
        # Try to find by user ID if identifier is numeric
        if identifier.isdigit():
            user = get_object_or_404(CustomUser, id=int(identifier))
        else:
            # Try to find by username (case-insensitive)
            user = CustomUser.objects.filter(username__iexact=identifier).first()
            if not user:
                # Try by email (case-insensitive)
                user = CustomUser.objects.filter(email__iexact=identifier).first()
            if not user:
                raise CustomUser.DoesNotExist

        serializer = UserProfileSerializer(user, context={'request': request})
        return Response(serializer.data)
    except CustomUser.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_user_stats(request, user_id):
    """Get comprehensive user statistics"""
    user = get_object_or_404(CustomUser, id=user_id)

    # One grouped query for every category instead of one aggregate per category.
    best_by_category = dict(
        BestScore.objects.filter(user=user)
        .values_list('game__category')
        .annotate(best=Max('score'))
        .values_list('game__category', 'best')
    )

    category_stats = {}
    for category, _ in Game.CATEGORY_CHOICES:
        rank = user.get_category_rank(category)
        category_stats[category] = {
            'rank': rank,
            'best_score': best_by_category.get(category, 0),
            'has_played': rank is not None,
        }

    return Response({
        'total_games': GameResult.objects.filter(user=user).count(),
        'total_xp': user.experience,
        'experience': user.experience,
        'level': user.level,
        'global_rank': user.global_rank,
        'category_stats': category_stats,
        'xp_for_next_level': user.xp_for_next_level,
        'xp_progress': user.xp_progress_in_current_level,
    })

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_user_achievements(request, user_id):
    """Get user achievements"""
    try:
        user = get_object_or_404(CustomUser, id=user_id)
        user_achievements = UserAchievement.objects.filter(user=user).select_related('achievement')
        
        achievements_data = [{
            'id': ua.achievement.id,
            'name': ua.achievement.name,
            'description': ua.achievement.description,
            'icon': ua.achievement.icon,
            'type': ua.achievement.achievement_type,
            'points': ua.achievement.points,
            'earned_date': ua.earned_date
        } for ua in user_achievements]
        
        return Response(achievements_data)
    except CustomUser.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_all_achievements(request):
    """Get all achievements with user's progress"""
    user = request.user
    
    # Don't check achievements on page load - only on game completion
    # This prevents unwanted notifications when just viewing the achievements page
    
    # Get fresh achievement status after checking
    user_achievement_ids = set(UserAchievement.objects.filter(user=user).values_list('achievement_id', flat=True))
    all_achievements = Achievement.objects.all().order_by('-achievement_type', 'category', 'requirement_value')
    
    achievements_data = []
    for achievement in all_achievements:
        is_earned = achievement.id in user_achievement_ids
        earned_date = None
        
        if is_earned:
            user_achievement = UserAchievement.objects.get(user=user, achievement=achievement)
            earned_date = user_achievement.earned_date
        
        # Calculate progress percentage using our comprehensive system
        progress_percentage = get_achievement_progress(user, achievement) if not is_earned else 100
        
        
        achievements_data.append({
            'id': achievement.id,
            'name': achievement.name,
            'description': achievement.description,
            'icon': achievement.icon,
            'type': achievement.achievement_type,
            'category': achievement.category,
            'requirement_value': achievement.requirement_value,
            'points': achievement.points,
            'is_earned': is_earned,
            'earned_date': earned_date,
            'progress_percentage': progress_percentage
        })
    
    # Sort so that earned achievements appear first
    achievements_data.sort(key=lambda x: (not x['is_earned'], x['category'] or '', x['name']))
    
    return Response(achievements_data)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_user_badges(request, user_id):
    """Get user badges"""
    try:
        user = get_object_or_404(CustomUser, id=user_id)
        user_badges = UserBadge.objects.filter(user=user).select_related('badge')
        
        badges_data = [{
            'id': ub.badge.id,
            'name': ub.badge.name,
            'description': ub.badge.description,
            'icon': ub.badge.icon,
            'type': ub.badge.badge_type,
            'color': ub.badge.color,
            'is_rare': ub.badge.is_rare,
            'earned_date': ub.earned_date
        } for ub in user_badges]
        
        return Response(badges_data)
    except CustomUser.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_all_badges(request):
    """Get all badges with user's progress"""
    user = request.user
    
    # Don't check achievements on page load - only on game completion
    # This prevents unwanted notifications when just viewing the badges page
    
    # Get fresh badge status after checking
    user_badge_ids = set(UserBadge.objects.filter(user=user).values_list('badge_id', flat=True))
    all_badges = Badge.objects.all()
    
    badges_data = []
    for badge in all_badges:
        is_earned = badge.id in user_badge_ids
        earned_date = None
        
        if is_earned:
            user_badge = UserBadge.objects.get(user=user, badge=badge)
            earned_date = user_badge.earned_date
        
        
        badges_data.append({
            'id': badge.id,
            'name': badge.name,
            'description': badge.description,
            'icon': badge.icon,
            'type': badge.badge_type,
            'color': badge.color,
            'requirement': badge.requirement,
            'is_rare': badge.is_rare,
            'is_earned': is_earned,
            'earned_date': earned_date
        })
    
    return Response(badges_data)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_achievement_stats(request, achievement_id):
    """Get statistics for a specific achievement"""
    try:
        achievement = get_object_or_404(Achievement, id=achievement_id)
        
        # Get total users
        total_users = CustomUser.objects.filter(is_active=True).count()
        
        # Get users who earned this achievement
        users_with_achievement = UserAchievement.objects.filter(achievement=achievement).count()
        
        # Calculate percentage
        percentage = (users_with_achievement / total_users * 100) if total_users > 0 else 0
        
        # Don't check achievements when just viewing stats - only on game completion
        # Re-check if user has this achievement (without triggering new checks)
        user = request.user
        user_has_achievement = UserAchievement.objects.filter(user=user, achievement=achievement).exists()
        
        # Get accurate progress using our comprehensive progress calculation
        progress_percentage = get_achievement_progress(user, achievement) if not user_has_achievement else 100
        
        progress_data = {
            'achievement': {
                'id': achievement.id,
                'name': achievement.name,
                'description': achievement.description,
                'type': achievement.achievement_type,
                'category': achievement.category,
                'requirement_value': achievement.requirement_value,
                'points': achievement.points
            },
            'user_has_achievement': user_has_achievement,
            'users_with_achievement': users_with_achievement,
            'total_users': total_users,
            'percentage': round(percentage, 1),
            'rarity': 'Common' if percentage > 50 else 'Uncommon' if percentage > 20 else 'Rare' if percentage > 5 else 'Epic' if percentage > 1 else 'Legendary',
            'progress_percentage': progress_percentage
        }
        
        # Add current progress using our comprehensive system
        current_progress = progress_percentage * achievement.requirement_value / 100 if progress_percentage < 100 else achievement.requirement_value
        progress_data['current_progress'] = int(current_progress)
        
        return Response(progress_data)
    except Achievement.DoesNotExist:
        return Response({'error': 'Achievement not found'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_badge_stats(request, badge_id):
    """Get statistics for a specific badge"""
    try:
        badge = get_object_or_404(Badge, id=badge_id)
        
        # Get total users
        total_users = CustomUser.objects.filter(is_active=True).count()
        
        # Get users who earned this badge
        users_with_badge = UserBadge.objects.filter(badge=badge).count()
        
        # Calculate percentage
        percentage = (users_with_badge / total_users * 100) if total_users > 0 else 0
        
        # Get current user's progress
        user = request.user
        user_has_badge = UserBadge.objects.filter(user=user, badge=badge).exists()
        
        progress_data = {
            'badge': {
                'id': badge.id,
                'name': badge.name,
                'description': badge.description,
                'type': badge.badge_type,
                'color': badge.color,
                'requirement': badge.requirement,
                'is_rare': badge.is_rare
            },
            'user_has_badge': user_has_badge,
            'users_with_badge': users_with_badge,
            'total_users': total_users,
            'percentage': round(percentage, 1),
            'rarity': 'Common' if percentage > 50 else 'Uncommon' if percentage > 20 else 'Rare' if percentage > 5 else 'Epic' if percentage > 1 else 'Legendary'
        }
        
        return Response(progress_data)
    except Badge.DoesNotExist:
        return Response({'error': 'Badge not found'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_user_best_scores(request, user_id):
    """Get user's best scores by game"""
    try:
        user = get_object_or_404(CustomUser, id=user_id)
        game_id = request.GET.get('game_id')
        
        if game_id:
            best_scores = BestScore.objects.filter(user=user, game_id=game_id).select_related('game')
        else:
            best_scores = BestScore.objects.filter(user=user).select_related('game')
        
        scores_data = [{
            'game_id': bs.game.id,
            'game_name': bs.game.name,
            'category': bs.game.category,
            'score': bs.score,
            'level_reached': bs.level_reached,
            'xp_earned': bs.xp_earned,
            'best_streak': bs.best_streak,
            'fewest_mistakes': bs.fewest_mistakes,
            'most_correct': bs.most_correct,
            'times_played': bs.times_played,
            'last_updated': bs.last_updated
        } for bs in best_scores]
        
        return Response(scores_data)
    except CustomUser.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_user_category_ranks(request, user_id):
    """Get user's ranking in each category"""
    try:
        user = get_object_or_404(CustomUser, id=user_id)
        categories = [key for key, _ in Game.CATEGORY_CHOICES]
        
        category_ranks = {}
        for category in categories:
            rank = user.get_category_rank(category)
            category_ranks[category] = {
                'rank': rank,
                'has_played': rank is not None
            }
        
        return Response(category_ranks)
    except CustomUser.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

class CountryListView(APIView):
    """Returns the list of available countries from django_countries"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        country_list = [{"code": code, "name": name} for code, name in list(countries)]
        return Response(country_list)