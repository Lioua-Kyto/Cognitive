from django.core.management.base import BaseCommand
from games.models import Game


class Command(BaseCommand):
    help = 'Populate the database with games matching frontend CategoryData.jsx'

    def handle(self, *args, **options):
        games_data = [
            # Memory Games
            {
                'name': 'Number Recall',
                'description': 'Memorize and repeat sequences of numbers.',
                'category': 'memory',
                'base_xp_reward': 10,
                'difficulty_multiplier': 1.0,
            },
            {
                'name': 'Word Grid',
                'description': 'Recall which words were in a grid.',
                'category': 'memory',
                'base_xp_reward': 15,
                'difficulty_multiplier': 1.2,
            },
            {
                'name': 'Pattern Playback',
                'description': 'Repeat color patterns that get longer each round.',
                'category': 'memory',
                'base_xp_reward': 12,
                'difficulty_multiplier': 1.1,
            },
            {
                'name': 'Face-Name Match',
                'description': 'Match faces with names after a preview.',
                'category': 'memory',
                'base_xp_reward': 18,
                'difficulty_multiplier': 1.3,
            },
            {
                'name': 'Card Flip Memory',
                'description': 'Flip cards to find matching pairs.',
                'category': 'memory',
                'base_xp_reward': 14,
                'difficulty_multiplier': 1.1,
            },

            # Attention Games
            {
                'name': 'Odd One Out',
                'description': 'Click the odd shape/color among a group.',
                'category': 'attention',
                'base_xp_reward': 10,
                'difficulty_multiplier': 1.0,
            },
            {
                'name': 'Focus Shift',
                'description': 'Switch tasks quickly (e.g., tap even numbers unless red).',
                'category': 'attention',
                'base_xp_reward': 16,
                'difficulty_multiplier': 1.2,
            },
            {
                'name': 'Distraction Dodger',
                'description': 'Tap targets but avoid distractors.',
                'category': 'attention',
                'base_xp_reward': 14,
                'difficulty_multiplier': 1.1,
            },
            {
                'name': 'Spot the Change',
                'description': 'Find what\'s changed between two images.',
                'category': 'attention',
                'base_xp_reward': 12,
                'difficulty_multiplier': 1.0,
            },
            {
                'name': 'Moving Target',
                'description': 'Track a moving shape and select it after.',
                'category': 'attention',
                'base_xp_reward': 15,
                'difficulty_multiplier': 1.2,
            },

            # Speed Games
            {
                'name': 'Quick Match',
                'description': 'Match symbols or colors as fast as possible.',
                'category': 'speed',
                'base_xp_reward': 8,
                'difficulty_multiplier': 0.8,
            },
            {
                'name': 'Math Blitz',
                'description': 'Solve simple equations quickly.',
                'category': 'speed',
                'base_xp_reward': 10,
                'difficulty_multiplier': 0.8,
            },
            {
                'name': 'Speed Sort',
                'description': 'Sort falling shapes or words by category.',
                'category': 'speed',
                'base_xp_reward': 9,
                'difficulty_multiplier': 0.7,
            },
            {
                'name': 'Reaction Time Tap',
                'description': 'Tap as soon as the screen changes.',
                'category': 'speed',
                'base_xp_reward': 6,
                'difficulty_multiplier': 0.6,
            },
            {
                'name': 'Category Storm',
                'description': 'Name/select items from a category fast.',
                'category': 'speed',
                'base_xp_reward': 12,
                'difficulty_multiplier': 1.0,
            },

            # Logic Games
            {
                'name': 'Shape Sequences',
                'description': 'Guess the next shape in a sequence.',
                'category': 'logic',
                'base_xp_reward': 15,
                'difficulty_multiplier': 1.2,
            },
            {
                'name': 'Math Logic',
                'description': 'Puzzles with missing operators or values.',
                'category': 'logic',
                'base_xp_reward': 18,
                'difficulty_multiplier': 1.4,
            },
            {
                'name': 'Tile Puzzle',
                'description': 'Slide tiles to complete an image or pattern.',
                'category': 'logic',
                'base_xp_reward': 16,
                'difficulty_multiplier': 1.3,
            },
            {
                'name': 'Symbol Equation',
                'description': 'Solve equations with hidden symbol values.',
                'category': 'logic',
                'base_xp_reward': 20,
                'difficulty_multiplier': 1.5,
            },
            {
                'name': 'Path Builder',
                'description': 'Connect points following logic rules.',
                'category': 'logic',
                'base_xp_reward': 17,
                'difficulty_multiplier': 1.3,
            },

            # Language Games
            {
                'name': 'Word Ladder',
                'description': 'Change one letter at a time to reach a new word.',
                'category': 'language',
                'base_xp_reward': 12,
                'difficulty_multiplier': 1.0,
            },
            {
                'name': 'Anagram Rush',
                'description': 'Rearrange letters to make as many words as possible.',
                'category': 'language',
                'base_xp_reward': 14,
                'difficulty_multiplier': 1.1,
            },
            {
                'name': 'Synonym Match',
                'description': 'Match words with similar meanings.',
                'category': 'language',
                'base_xp_reward': 10,
                'difficulty_multiplier': 0.9,
            },
            {
                'name': 'Missing Letter',
                'description': 'Fill in the blank in a word.',
                'category': 'language',
                'base_xp_reward': 8,
                'difficulty_multiplier': 0.8,
            },
            {
                'name': 'Grammar Fix',
                'description': 'Spot the grammatical error in a sentence.',
                'category': 'language',
                'base_xp_reward': 16,
                'difficulty_multiplier': 1.2,
            },

            # Multi-domain Games
            {
                'name': 'Dual Tasking',
                'description': 'Respond to auditory and visual cues at the same time.',
                'category': 'multi',
                'base_xp_reward': 18,
                'difficulty_multiplier': 1.4,
            },
            {
                'name': 'Navigation Challenge',
                'description': 'Remember a map and navigate through it.',
                'category': 'multi',
                'base_xp_reward': 20,
                'difficulty_multiplier': 1.5,
            },
            {
                'name': 'Resource Management',
                'description': 'Track multiple things under pressure.',
                'category': 'multi',
                'base_xp_reward': 22,
                'difficulty_multiplier': 1.6,
            },
            {
                'name': 'Color-Word Switch',
                'description': 'Select the font color, not the word.',
                'category': 'multi',
                'base_xp_reward': 15,
                'difficulty_multiplier': 1.2,
            },
            {
                'name': 'Rapid Decision',
                'description': 'Combine math, logic, and focus for quick decisions.',
                'category': 'multi',
                'base_xp_reward': 25,
                'difficulty_multiplier': 1.8,
            },

            # Competitive Games
            {
                'name': 'Brain Battle',
                'description': 'Compete live in 3 random mini-games.',
                'category': 'competitive',
                'base_xp_reward': 30,
                'difficulty_multiplier': 2.0,
            },
            {
                'name': 'Memory Maze',
                'description': 'Navigate a maze that\'s shown once and disappears.',
                'category': 'competitive',
                'base_xp_reward': 25,
                'difficulty_multiplier': 1.8,
            },
            {
                'name': 'Speed Duel',
                'description': 'Two players race to complete the same task.',
                'category': 'competitive',
                'base_xp_reward': 28,
                'difficulty_multiplier': 1.9,
            },
            {
                'name': 'Cognitive Combo',
                'description': 'A long challenge mixing 4-5 types.',
                'category': 'competitive',
                'base_xp_reward': 35,
                'difficulty_multiplier': 2.2,
            },
            {
                'name': 'IQ Arena',
                'description': 'Weekly rotating puzzle tournaments.',
                'category': 'competitive',
                'base_xp_reward': 40,
                'difficulty_multiplier': 2.5,
            },
        ]

        created_count = 0
        updated_count = 0

        for game_data in games_data:
            game, created = Game.objects.get_or_create(
                name=game_data['name'],
                defaults=game_data
            )
            
            if created:
                created_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f'Created game: {game.name}')
                )
            else:
                # Update existing game with new data
                for key, value in game_data.items():
                    if key != 'name':  # Don't update the name
                        setattr(game, key, value)
                game.save()
                updated_count += 1
                self.stdout.write(
                    self.style.WARNING(f'Updated game: {game.name}')
                )

        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully processed {created_count + updated_count} games '
                f'({created_count} created, {updated_count} updated)'
            )
        )
