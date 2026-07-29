from django.urls import path
from .views import *

urlpatterns = [
    path('register/', UserRegisterView.as_view(), name='user-register'),
    path('login/', UserLoginView.as_view(), name='user-login'),
    path('profile/', UserDetailView.as_view(), name='user-profile'),
    path('profile/<str:identifier>/', get_user_profile, name='user-profile-detail'),
    path('stats/<int:user_id>/', get_user_stats, name='user-stats'),
    path('achievements/<int:user_id>/', get_user_achievements, name='user-achievements'),
    path('achievements/all/', get_all_achievements, name='all-achievements'),
    path('achievements/<int:achievement_id>/stats/', get_achievement_stats, name='achievement-stats'),
    path('badges/<int:user_id>/', get_user_badges, name='user-badges'),
    path('badges/all/', get_all_badges, name='all-badges'),
    path('badges/<int:badge_id>/stats/', get_badge_stats, name='badge-stats'),
    path('best-scores/<int:user_id>/', get_user_best_scores, name='user-best-scores'),
    path('category-ranks/<int:user_id>/', get_user_category_ranks, name='user-category-ranks'),
    path('update-profile/', UserUpdateProfileView.as_view(), name='user-update-profile'),
    path('countries/', CountryListView.as_view(), name='country-list'),
]