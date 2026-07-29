from django.urls import path

from .views import (
    AvailableGamesView,
    CategoriesView,
    GameSubmitView,
    MultiplayerLeaderboardView,
    MultiplayerMatchCreateView,
    MultiplayerMatchStatusView,
    MultiplayerScoreSubmissionView,
)

urlpatterns = [
    path('categories/', CategoriesView.as_view(), name='game-categories'),
    path('available-games/', AvailableGamesView.as_view(), name='available-games'),

    # Multiplayer endpoints
    path('multiplayer/create/', MultiplayerMatchCreateView.as_view(), name='multiplayer-create'),
    path('multiplayer/status/<int:match_id>/', MultiplayerMatchStatusView.as_view(), name='multiplayer-status'),
    path('multiplayer/submit/<int:match_id>/', MultiplayerScoreSubmissionView.as_view(), name='multiplayer-submit'),
    path('multiplayer/leaderboard/', MultiplayerLeaderboardView.as_view(), name='multiplayer-leaderboard'),

    # Catch-all for the 35 per-game submission endpoints; must stay last so it
    # does not shadow the named routes above. Slugs are in games/registry.py.
    path('<slug:game_slug>/', GameSubmitView.as_view(), name='game-submit'),
]
