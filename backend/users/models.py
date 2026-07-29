from django.db import models
from django.db.models import Max
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from django_countries.fields import CountryField
import math

class CustomUserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('The Email field must be set')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email, password, **extra_fields)

class CustomUser(AbstractBaseUser, PermissionsMixin):
    email = models.EmailField(unique=True)
    username = models.CharField(max_length=50, unique=True, blank=True, null=True)
    profile_picture = models.ImageField(upload_to='profile_pics/', blank=True, null=True)
    country = CountryField(blank=True, null=True)
    bio = models.CharField(max_length=150, blank=True, null=True, help_text="A short bio about the user")
    date_joined = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    experience = models.PositiveIntegerField(default=0)

    USERNAME_FIELD = 'email'

    objects = CustomUserManager()

    @property
    def level(self):
        """Calculate level based on experience points with gradual progression"""
        if self.experience <= 0:
            return 1
        # More gradual progression: level = floor(xp / (50 + level * 10))
        # This makes each level require slightly more XP but not exponentially
        level = 1
        total_xp_needed = 0
        current_xp = self.experience
        
        while current_xp >= total_xp_needed:
            xp_for_this_level = 100 + (level - 1) * 25  # Start at 100, increase by 25 each level
            total_xp_needed += xp_for_this_level
            if current_xp >= total_xp_needed:
                level += 1
            if level >= 100:  # Cap at level 100
                return 100
        return level

    @property
    def xp_for_next_level(self):
        """Calculate total XP required to reach the next level (cumulative)"""
        if self.level >= 100:
            return self.experience  # If at max level, return current XP
        
        # Calculate cumulative XP required to reach the next level
        total = 0
        for lvl in range(1, self.level + 1):
            total += 100 + (lvl - 1) * 25
        return total

    @property 
    def xp_for_current_level_base(self):
        """Calculate total XP needed to reach current level (cumulative)"""
        if self.level <= 1:
            return 0
        
        total = 0
        for lvl in range(1, self.level):
            total += 100 + (lvl - 1) * 25
        return total

    @property
    def xp_progress_in_current_level(self):
        """Calculate current progress within this level as percentage"""
        if self.level >= 100:
            return 100.0
            
        # Calculate how much XP we have beyond what was needed for current level
        xp_base_for_current_level = self.xp_for_current_level_base
        current_level_progress = self.experience - xp_base_for_current_level
        
        # Calculate XP required just for current level (not cumulative)
        xp_required_for_current_level = 100 + (self.level - 1) * 25
        
        if xp_required_for_current_level <= 0:
            return 100.0
            
        percentage = (current_level_progress / xp_required_for_current_level) * 100
        return max(0.0, min(100.0, percentage))

    def add_experience(self, xp_amount):
        """Add experience points and return if level increased"""
        old_level = self.level
        self.experience += xp_amount
        self.save()
        new_level = self.level
        return new_level > old_level

    @property
    def total_games_played(self):
        """Get total number of games played across all categories"""
        from leaderboard.models import GameResult
        return GameResult.objects.filter(user=self).count()

    @property
    def global_rank(self):
        """Calculate user's global rank based on experience"""
        users_with_higher_experience = CustomUser.objects.filter(
            experience__gt=self.experience,
            is_active=True
        ).count()
        return users_with_higher_experience + 1

    def get_category_rank(self, category):
        """Get user's rank in a specific category"""
        from leaderboard.models import GameResult
        
        # Get user's best score in this category
        user_best = GameResult.objects.filter(
            user=self,
            game__category=category
        ).aggregate(
            best_score=Max('score')
        )['best_score']
        
        if user_best is None:
            return None  # User hasn't played any games in this category
        
        # Count users with better scores in this category
        better_users = GameResult.objects.filter(
            game__category=category,
            score__gt=user_best
        ).values('user').distinct().count()
        
        return better_users + 1

    def __str__(self):
        if self.username:
            return self.username
        return self.email


class Achievement(models.Model):
    """Achievement model for different types of accomplishments"""
    ACHIEVEMENT_TYPES = [
        ('level', 'Level Achievement'),
        ('games', 'Games Played Achievement'),
        ('score', 'Score Achievement'),
        ('streak', 'Streak Achievement'),
        ('category', 'Category Achievement'),
        ('special', 'Special Achievement'),
    ]
    
    name = models.CharField(max_length=100)
    description = models.TextField()
    icon = models.CharField(max_length=50, default='🏆')  # Emoji or icon class
    achievement_type = models.CharField(max_length=20, choices=ACHIEVEMENT_TYPES)
    requirement_value = models.IntegerField(help_text="Required value to unlock (e.g., level 10, 100 games)")
    category = models.CharField(max_length=50, blank=True, null=True, help_text="For category-specific achievements")
    points = models.IntegerField(default=10, help_text="Points awarded for this achievement")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['name', 'achievement_type', 'category']

    def __str__(self):
        return f"{self.name} ({self.achievement_type})"


class UserAchievement(models.Model):
    """Junction table for user achievements"""
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='achievements')
    achievement = models.ForeignKey(Achievement, on_delete=models.CASCADE)
    earned_date = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['user', 'achievement']
    
    def __str__(self):
        return f"{self.user} - {self.achievement.name}"


class Badge(models.Model):
    """Badge model for special recognition"""
    BADGE_TYPES = [
        ('bronze', 'Bronze Badge'),
        ('silver', 'Silver Badge'),
        ('gold', 'Gold Badge'),
        ('platinum', 'Platinum Badge'),
        ('diamond', 'Diamond Badge'),
        ('special', 'Special Badge'),
    ]
    
    name = models.CharField(max_length=100)
    description = models.TextField()
    icon = models.CharField(max_length=50, default='🎖️')
    badge_type = models.CharField(max_length=20, choices=BADGE_TYPES)
    color = models.CharField(max_length=7, default='#FFD700', help_text="Hex color for badge")
    requirement = models.TextField(help_text="Human readable requirement")
    is_rare = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.badge_type})"


class UserBadge(models.Model):
    """Junction table for user badges"""
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='badges')
    badge = models.ForeignKey(Badge, on_delete=models.CASCADE)
    earned_date = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['user', 'badge']
    
    def __str__(self):
        return f"{self.user} - {self.badge.name}"