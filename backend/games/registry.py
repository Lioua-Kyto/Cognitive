"""URL slug to Game.name mapping.

Names must match backend/games/management/commands/populate_games.py exactly:
Game.name is unique and is the only key the submission path has to find a game
by, so a typo here silently routes scores at the wrong game.
"""

GAME_SLUGS = {
    # Memory
    'number-recall': 'Number Recall',
    'word-grid': 'Word Grid',
    'pattern-playback': 'Pattern Playback',
    'face-name-match': 'Face-Name Match',
    'card-flip-memory': 'Card Flip Memory',
    # Attention
    'odd-one-out': 'Odd One Out',
    'focus-shift': 'Focus Shift',
    'distraction-dodger': 'Distraction Dodger',
    'spot-the-change': 'Spot the Change',
    'moving-target': 'Moving Target',
    # Speed
    'quick-match': 'Quick Match',
    'math-blitz': 'Math Blitz',
    'speed-sort': 'Speed Sort',
    'reaction-time-tap': 'Reaction Time Tap',
    'category-storm': 'Category Storm',
    # Logic
    'shape-sequences': 'Shape Sequences',
    'math-logic': 'Math Logic',
    'tile-puzzle': 'Tile Puzzle',
    'symbol-equation': 'Symbol Equation',
    'path-builder': 'Path Builder',
    # Language
    'word-ladder': 'Word Ladder',
    'anagram-rush': 'Anagram Rush',
    'synonym-match': 'Synonym Match',
    'missing-letter': 'Missing Letter',
    'grammar-fix': 'Grammar Fix',
    # Multi-domain
    'dual-tasking': 'Dual Tasking',
    'navigation-challenge': 'Navigation Challenge',
    'resource-management': 'Resource Management',
    'color-word-switch': 'Color-Word Switch',
    'rapid-decision': 'Rapid Decision',
    # Competitive
    'brain-battle': 'Brain Battle',
    'memory-maze': 'Memory Maze',
    'speed-duel': 'Speed Duel',
    'cognitive-combo': 'Cognitive Combo',
    'iq-arena': 'IQ Arena',
}
