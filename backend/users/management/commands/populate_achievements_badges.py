from django.core.management.base import BaseCommand

from users.models import Achievement, Badge


class Command(BaseCommand):
    help = 'Populate the database with achievements and badges'

    def handle(self, *args, **options):
        # No delete() pass here: Achievement and Badge cascade to UserAchievement
        # and UserBadge, so re-seeding used to wipe every user's earned awards.

        achievements_data = [
            # Memory Achievements
            {
                'name': 'Memory Beginner',
                'description': 'Complete your first memory game',
                'category': 'memory',
                'icon': '🧠',
                'points': 10,
                'achievement_type': 'games',
                'requirement_value': 1,
            },
            {
                'name': 'Memory Explorer',
                'description': 'Play 5 different memory games',
                'category': 'memory',
                'icon': '🔍',
                'points': 25,
                'achievement_type': 'games',
                'requirement_value': 5,
            },
            {
                'name': 'Memory Master',
                'description': 'Reach level 10 in any memory game',
                'category': 'memory',
                'icon': '🏆',
                'points': 50,
                'achievement_type': 'level',
                'requirement_value': 10,
            },
            {
                'name': 'Perfect Memory',
                'description': 'Complete a memory game with 0 mistakes',
                'category': 'memory',
                'icon': '💎',
                'points': 75,
                'achievement_type': 'special',
                'requirement_value': 1,
            },
            
            # Attention Achievements
            {
                'name': 'Attention Rookie',
                'description': 'Complete your first attention game',
                'category': 'attention',
                'icon': '🎯',
                'points': 10,
                'achievement_type': 'games',
                'requirement_value': 1,
            },
            {
                'name': 'Focus Master',
                'description': 'Achieve a 20+ streak in any attention game',
                'category': 'attention',
                'icon': '🔥',
                'points': 40,
                'achievement_type': 'streak',
                'requirement_value': 20,
            },
            {
                'name': 'Laser Focus',
                'description': 'Complete 100 attention games',
                'category': 'attention',
                'icon': '⚡',
                'points': 100,
                'achievement_type': 'games',
                'requirement_value': 100,
            },
            
            # Speed Achievements
            {
                'name': 'Speed Demon',
                'description': 'Complete your first speed game',
                'category': 'speed',
                'icon': '💨',
                'points': 10,
                'achievement_type': 'games',
                'requirement_value': 1,
            },
            {
                'name': 'Lightning Fast',
                'description': 'Score 1000+ points in a speed game',
                'category': 'speed',
                'icon': '⚡',
                'points': 35,
                'achievement_type': 'score',
                'requirement_value': 1000,
            },
            {
                'name': 'Speed Legend',
                'description': 'Reach level 15 in any speed game',
                'category': 'speed',
                'icon': '🚀',
                'points': 60,
                'achievement_type': 'level',
                'requirement_value': 15,
            },
            
            # Logic Achievements
            {
                'name': 'Logic Learner',
                'description': 'Complete your first logic game',
                'category': 'logic',
                'icon': '🧩',
                'points': 10,
                'achievement_type': 'games',
                'requirement_value': 1,
            },
            {
                'name': 'Problem Solver',
                'description': 'Solve 50 logic puzzles',
                'category': 'logic',
                'icon': '💡',
                'points': 45,
                'achievement_type': 'games',
                'requirement_value': 50,
            },
            {
                'name': 'Logic Genius',
                'description': 'Reach level 20 in any logic game',
                'category': 'logic',
                'icon': '🎓',
                'points': 80,
                'achievement_type': 'level',
                'requirement_value': 20,
            },
            
            # Language Achievements
            {
                'name': 'Word Warrior',
                'description': 'Complete your first language game',
                'category': 'language',
                'icon': '📚',
                'points': 10,
                'achievement_type': 'games',
                'requirement_value': 1,
            },
            {
                'name': 'Vocabulary Master',
                'description': 'Score 2000+ points in a language game',
                'category': 'language',
                'icon': '🔤',
                'points': 50,
                'achievement_type': 'score',
                'requirement_value': 2000,
            },
            {
                'name': 'Linguistic Legend',
                'description': 'Complete all 5 language games',
                'category': 'language',
                'icon': '👑',
                'points': 75,
                'achievement_type': 'category',
                'requirement_value': 5,
            },
            
            # Multi-domain Achievements
            {
                'name': 'Multitasker',
                'description': 'Complete your first multi-domain game',
                'category': 'multi',
                'icon': '🔀',
                'points': 15,
                'achievement_type': 'games',
                'requirement_value': 1,
            },
            {
                'name': 'Cognitive Athlete',
                'description': 'Score 3000+ points in a multi-domain game',
                'category': 'multi',
                'icon': '🏅',
                'points': 65,
                'achievement_type': 'score',
                'requirement_value': 3000,
            },
            {
                'name': 'Jack of All Trades',
                'description': 'Play at least one game from each category',
                'category': 'multi',
                'icon': '🌟',
                'points': 100,
                'achievement_type': 'special',
                'requirement_value': 6,  # All 6 main categories
            },
            
            # Competitive Achievements
            {
                'name': 'Competitor',
                'description': 'Win your first multiplayer match',
                'category': 'competitive',
                'icon': '🏆',
                'points': 25,
                'achievement_type': 'special',
                'requirement_value': 1,
            },
            {
                'name': 'Champion',
                'description': 'Win 10 multiplayer matches',
                'category': 'competitive',
                'icon': '👑',
                'points': 75,
                'achievement_type': 'special',
                'requirement_value': 10,
            },
            {
                'name': 'Legendary Fighter',
                'description': 'Win 50 multiplayer matches',
                'category': 'competitive',
                'icon': '⚔️',
                'points': 150,
                'achievement_type': 'special',
                'requirement_value': 50,
            },
            
            # General Achievements
            {
                'name': 'First Steps',
                'description': 'Play your very first cognitive game',
                'category': None,
                'icon': '👶',
                'points': 5,
                'achievement_type': 'games',
                'requirement_value': 1,
            },
            {
                'name': 'Dedicated Player',
                'description': 'Play 100 total games',
                'category': None,
                'icon': '💪',
                'points': 50,
                'achievement_type': 'games',
                'requirement_value': 100,
            },
            {
                'name': 'Brain Training Master',
                'description': 'Play 500 total games',
                'category': None,
                'icon': '🧠',
                'points': 200,
                'achievement_type': 'games',
                'requirement_value': 500,
            },
            {
                'name': 'Score Hunter',
                'description': 'Reach 50,000 total points across all games',
                'category': None,
                'icon': '🎯',
                'points': 100,
                'achievement_type': 'score',
                'requirement_value': 50000,
            },
            {
                'name': 'Perfectionist',
                'description': 'Complete 10 games with 0 mistakes',
                'category': None,
                'icon': '💎',
                'points': 125,
                'achievement_type': 'special',
                'requirement_value': 10,
            },
            {
                'name': 'Streak Master',
                'description': 'Achieve a 50+ streak in any game',
                'category': None,
                'icon': '🔥',
                'points': 75,
                'achievement_type': 'streak',
                'requirement_value': 50,
            },
        ]
        
        badges_data = [
            {
                'name': 'Bronze Rookie',
                'description': 'Reach Bronze rank',
                'icon': '🥉',
                'badge_type': 'rank',
                'color': '#CD7F32',
                'is_rare': False,
                'requirement': 'Reach Bronze rank (100+ points)'
            },
            {
                'name': 'Silver Challenger',
                'description': 'Reach Silver rank',
                'icon': '🥈',
                'badge_type': 'rank',
                'color': '#C0C0C0',
                'is_rare': False,
                'requirement': 'Reach Silver rank (500+ points)'
            },
            {
                'name': 'Gold Elite',
                'description': 'Reach Gold rank',
                'icon': '🥇',
                'badge_type': 'rank',
                'color': '#FFD700',
                'is_rare': True,
                'requirement': 'Reach Gold rank (1500+ points)'
            },
            {
                'name': 'Platinum Master',
                'description': 'Reach Platinum rank',
                'icon': '💎',
                'badge_type': 'rank',
                'color': '#E5E4E2',
                'is_rare': True,
                'requirement': 'Reach Platinum rank (4000+ points)'
            },
            {
                'name': 'Diamond Legend',
                'description': 'Reach Diamond rank',
                'icon': '💍',
                'badge_type': 'rank',
                'color': '#B9F2FF',
                'is_rare': True,
                'requirement': 'Reach Diamond rank (8000+ points)'
            },
            {
                'name': 'Grandmaster',
                'description': 'Reach the ultimate Grandmaster rank',
                'icon': '👑',
                'badge_type': 'rank',
                'color': '#FF6B35',
                'is_rare': True,
                'requirement': 'Reach Grandmaster rank (15000+ points)'
            },
            {
                'name': 'Early Adopter',
                'description': 'One of the first 100 users to join',
                'icon': '🌟',
                'badge_type': 'special',
                'color': '#FF69B4',
                'is_rare': True,
                'requirement': 'Be among the first 100 registered users'
            },
            {
                'name': 'Daily Warrior',
                'description': 'Play games for 7 consecutive days',
                'icon': '📅',
                'badge_type': 'habit',
                'color': '#32CD32',
                'is_rare': False,
                'requirement': 'Play at least one game daily for 7 consecutive days'
            },
            {
                'name': 'Weekend Warrior',
                'description': 'Play 50+ games on weekends',
                'icon': '🏖️',
                'badge_type': 'time_based',
                'color': '#FF4500',
                'is_rare': False,
                'requirement': 'Play 50+ games on weekends'
            },
            {
                'name': 'Night Owl',
                'description': 'Play 25+ games between 10PM-6AM',
                'icon': '🦉',
                'badge_type': 'time_based',
                'color': '#4B0082',
                'is_rare': False,
                'requirement': 'Play 25+ games between 10PM-6AM'
            },
            {
                'name': 'Speed Runner',
                'description': 'Complete 100 speed games under 30 seconds each',
                'icon': '💨',
                'badge_type': 'performance',
                'color': '#00CED1',
                'is_rare': True,
                'requirement': 'Complete 100 speed games under 30 seconds each'
            },
            {
                'name': 'Social Butterfly',
                'description': 'Play 20+ multiplayer matches',
                'icon': '🦋',
                'badge_type': 'social',
                'color': '#FF1493',
                'is_rare': False,
                'requirement': 'Play 20+ multiplayer matches'
            },
            {
                'name': 'Category Master',
                'description': 'Reach level 10+ in all game categories',
                'icon': '🎨',
                'badge_type': 'category_master',
                'color': '#8A2BE2',
                'is_rare': True,
                'requirement': 'Reach level 10+ in all game categories'
            },
            {
                'name': 'Comeback King',
                'description': 'Win a multiplayer match after being behind by 500+ points',
                'icon': '🔄',
                'badge_type': 'special',
                'color': '#DC143C',
                'is_rare': True,
                'requirement': 'Win a multiplayer match after being behind by 500+ points'
            },
            {
                'name': 'Perfectionist',
                'description': 'Complete 5 games without any mistakes',
                'icon': '💎',
                'badge_type': 'performance',
                'color': '#E91E63',
                'is_rare': True,
                'requirement': 'Complete 5 games with 0 mistakes'
            }
        ]
        
        # Create achievements
        created_achievements = 0
        for achievement_data in achievements_data:
            achievement, created = Achievement.objects.update_or_create(
                name=achievement_data['name'],
                defaults=achievement_data
            )
            if created:
                created_achievements += 1
                self.stdout.write(
                    self.style.SUCCESS(f'Created achievement: {achievement.name}')
                )
        
        # Create badges
        created_badges = 0
        for badge_data in badges_data:
            badge, created = Badge.objects.update_or_create(
                name=badge_data['name'],
                defaults=badge_data
            )
            if created:
                created_badges += 1
                self.stdout.write(
                    self.style.SUCCESS(f'Created badge: {badge.name}')
                )
        
        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully created {created_achievements} achievements and {created_badges} badges'
            )
        )