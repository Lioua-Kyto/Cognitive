from django.urls import path
from .views import *

urlpatterns = [

    path('categories/', CategoriesView.as_view(), name='game-categories'),

    
    # Memory games...
    path('number-recall/', NumberRecallView.as_view()),
    path('word-grid/', WordGridView.as_view()),
    path('pattern-playback/', PatternPlaybackView.as_view()),
    path('face-name-match/', FaceNameMatchView.as_view()),
    path('card-flip-memory/', CardFlipMemoryView.as_view()),
    # Attention games...
    path('odd-one-out/', OddOneOutView.as_view()),
    path('focus-shift/', FocusShiftView.as_view()),
    path('distraction-dodger/', DistractionDodgerView.as_view()),
    path('spot-the-change/', SpotTheChangeView.as_view()),
    path('moving-target/', MovingTargetView.as_view()),
    # Speed games...
    path('quick-match/', QuickMatchView.as_view()),
    path('math-blitz/', MathBlitzView.as_view()),
    path('speed-sort/', SpeedSortView.as_view()),
    path('reaction-time-tap/', ReactionTimeTapView.as_view()),
    path('category-storm/', CategoryStormView.as_view()),
    # Logic games...
    path('shape-sequences/', ShapeSequencesView.as_view()),
    path('math-logic/', MathLogicView.as_view()),
    path('tile-puzzle/', TilePuzzleView.as_view()),
    path('symbol-equation/', SymbolEquationView.as_view()),
    path('path-builder/', PathBuilderView.as_view()),
    # Language games...
    path('word-ladder/', WordLadderView.as_view()),
    path('anagram-rush/', AnagramRushView.as_view()),
    path('synonym-match/', SynonymMatchView.as_view()),
    path('missing-letter/', MissingLetterView.as_view()),
    path('grammar-fix/', GrammarFixView.as_view()),
    # Multi-domain games...
    path('dual-tasking/', DualTaskingView.as_view()),
    path('navigation-challenge/', NavigationChallengeView.as_view()),
    path('resource-management/', ResourceManagementView.as_view()),
    path('color-word-switch/', ColorWordSwitchView.as_view()),
    path('rapid-decision/', RapidDecisionView.as_view()),
    # Competitive games...
    path('brain-battle/', BrainBattleView.as_view()),
    path('memory-maze/', MemoryMazeView.as_view()),
    path('speed-duel/', SpeedDuelView.as_view()),
    path('cognitive-combo/', CognitiveComboView.as_view()),
    path('iq-arena/', IQArenaView.as_view()),
    
    # Multiplayer endpoints
    path('multiplayer/create/', MultiplayerMatchCreateView.as_view(), name='multiplayer-create'),
    path('multiplayer/status/<int:match_id>/', MultiplayerMatchStatusView.as_view(), name='multiplayer-status'),
    path('multiplayer/submit/<int:match_id>/', MultiplayerScoreSubmissionView.as_view(), name='multiplayer-submit'),
    path('multiplayer/leaderboard/', MultiplayerLeaderboardView.as_view(), name='multiplayer-leaderboard'),
    
    # General endpoints
    path('available-games/', AvailableGamesView.as_view(), name='available-games'),
]