from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import (
    Achievement,
    Badge,
    CustomUser,
    UserAchievement,
    UserBadge,
)


class CustomUserAdmin(UserAdmin):
    model = CustomUser
    list_display = ('email', 'username', 'experience', 'level', 'is_staff', 'is_active')
    list_filter = ('is_staff', 'is_active')
    search_fields = ('email', 'username')
    ordering = ('email',)
    readonly_fields = ('date_joined', 'level', 'xp_for_next_level', 'xp_progress_in_current_level', 'global_rank')
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal Info', {'fields': ('username', 'profile_picture', 'country', 'bio')}),
        ('Experience & Level', {'fields': ('experience', 'level', 'xp_for_next_level', 'xp_progress_in_current_level', 'global_rank')}),
        ('Permissions', {'fields': ('is_staff', 'is_active', 'is_superuser', 'groups', 'user_permissions')}),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'username', 'profile_picture', 'country', 'password1', 'password2', 'is_staff', 'is_active')}
        ),
    )

class AchievementAdmin(admin.ModelAdmin):
    list_display = ('name', 'description', 'icon', 'points')
    search_fields = ('name', 'description', 'icon', 'points')

class UserAchievementAdmin(admin.ModelAdmin):
    list_display = ('user', 'achievement', 'earned_date')
    search_fields = ('user', 'achievement', 'earned_date')

class BadgeAdmin(admin.ModelAdmin):
    list_display = ('name', 'description', 'icon', 'badge_type', 'color', 'requirement', 'is_rare')
    search_fields = ('name', 'badge_type')

class UserBadgeAdmin(admin.ModelAdmin):
    list_display = ('user', 'badge', 'earned_date')
    search_fields = ('user', 'badge', 'earned_date')




admin.site.register(CustomUser, CustomUserAdmin)
admin.site.register(Achievement, AchievementAdmin)
admin.site.register(UserAchievement, UserAchievementAdmin)
admin.site.register(UserBadge, UserBadgeAdmin)
admin.site.register(Badge, BadgeAdmin)