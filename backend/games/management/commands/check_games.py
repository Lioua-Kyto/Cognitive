from django.core.management.base import BaseCommand
from games.models import Game


class Command(BaseCommand):
    help = 'Check and create the Number Recall game'

    def handle(self, *args, **options):
        # List all existing games
        all_games = Game.objects.all()
        self.stdout.write(f"Current games in database: {len(all_games)}")
        for game in all_games:
            self.stdout.write(f"  - {game.name} (Category: {game.category})")
        
        # Check if Number Recall exists
        try:
            number_recall = Game.objects.get(name="Number Recall")
            self.stdout.write(self.style.SUCCESS(f"Number Recall game already exists: {number_recall.name}"))
        except Game.DoesNotExist:
            # Create Number Recall game
            number_recall = Game.objects.create(
                name="Number Recall",
                description="Memorize and recall number sequences",
                category="memory",
                base_xp_reward=10,
                difficulty_multiplier=1.0,
            )
            self.stdout.write(self.style.SUCCESS(f"Created Number Recall game: {number_recall.name}"))
        
        # List all games again
        all_games = Game.objects.all()
        self.stdout.write(f"Final games count: {len(all_games)}")
        for game in all_games:
            self.stdout.write(f"  - {game.name} (Category: {game.category})")
