from django.urls import path
from .views import *

urlpatterns = [
    path('global/', GlobalLeaderboardView.as_view(), name='global-leaderboard'),
    path('category/<str:category_name>/', CategoryLeaderboardView.as_view(), name='category-leaderboard'),
    path('game/<str:game_name>/', GameLeaderboardView.as_view(), name='game-leaderboard'),
    path('scores/', GameScoreListView.as_view(), name='score-list'),
    path('scores/game/<int:game_name>/', GameScoreByGameView.as_view(), name='score-by-game'),
    path('user-progress/', UserGameProgressView.as_view(), name='user-game-progress'),

    # analytics
    path('user-rank/global/', UserRankGlobalView.as_view(), name='user-rank-global'),
    path('user-rank/category/<str:category_name>/', UserRankCategoryView.as_view(), name='user-rank-category'),
    path('user-games/<str:category_name>/', UserGamesByCategory.as_view(), name='user-games-category'),
    path('user-progress-history/<str:category_name>/', UserProgressHistory.as_view(), name='user-progress-history'),
    path('detailed-history/<str:category_name>/', UserDetailedGameHistory.as_view(), name='user-detailed-history'),
    
    # dashboard
    path('user-stats/', UserStatsView.as_view(), name='user-stats'),
    path('recent-games/', RecentGamesView.as_view(), name='recent-games'),
    path('level-stats/<int:level>/', LevelStatsView.as_view(), name='level-stats'),
]