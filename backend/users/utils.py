from django.db.models import Count, Max, Sum, Q
from .models import Achievement, UserAchievement, Badge, UserBadge, CustomUser
from leaderboard.models import GameResult, BestScore
from games.models import Game


def check_and_award_achievements(user):
    """
    Check all achievements for a user and award any that are newly earned.
    Returns a list of newly earned achievements and badges.
    """
    from games.models import Game
    
    print(f"*** ACHIEVEMENT DEBUG: check_and_award_achievements called for user: {user.username} (ID: {user.id}) ***")
    
    # Debug: Check games and their categories
    games = Game.objects.all()
    print(f"*** ACHIEVEMENT DEBUG: Available games: {[(g.name, g.category) for g in games]} ***")
    
    # Debug: Check user's game results
    game_results = GameResult.objects.filter(user=user)
    print(f"*** ACHIEVEMENT DEBUG: User's game results: {[(gr.game.name, gr.game.category, gr.score) for gr in game_results]} ***")
    
    # Debug: Check user's best scores
    best_scores = BestScore.objects.filter(user=user)
    print(f"*** ACHIEVEMENT DEBUG: User's best scores: {[(bs.game.name, bs.game.category, bs.score, bs.level_reached) for bs in best_scores]} ***")
    
    newly_earned = {'achievements': [], 'badges': []}
    
    # Get all achievements and current user achievements
    all_achievements = Achievement.objects.all()
    current_user_achievements = set(
        UserAchievement.objects.filter(user=user).values_list('achievement_id', flat=True)
    )
    
    # Check each achievement
    for achievement in all_achievements:
        if achievement.id in current_user_achievements:
            continue  # User already has this achievement
            
        if should_award_achievement(user, achievement):
            user_achievement = UserAchievement.objects.create(
                user=user,
                achievement=achievement
            )
            newly_earned['achievements'].append(achievement)
            
            # Award XP for the achievement
            old_level = user.level
            user.add_experience(achievement.points)
            new_level = user.level
            
            print(f"✅ Awarded achievement: {achievement.name} to {user} (+{achievement.points} XP)")
            if new_level > old_level:
                print(f"🎉 {user} leveled up from {old_level} to {new_level}!")
    
    # Get all badges and current user badges
    all_badges = Badge.objects.all()
    current_user_badges = set(
        UserBadge.objects.filter(user=user).values_list('badge_id', flat=True)
    )
    
    # Check each badge
    for badge in all_badges:
        if badge.id in current_user_badges:
            continue  # User already has this badge
            
        if should_award_badge(user, badge):
            user_badge = UserBadge.objects.create(
                user=user,
                badge=badge
            )
            newly_earned['badges'].append(badge)
            print(f"🎖️ Awarded badge: {badge.name} to {user}")
    
    print(f"=== Summary: Awarded {len(newly_earned['achievements'])} achievements and {len(newly_earned['badges'])} badges ===\n")
    
    return newly_earned


def should_award_achievement(user, achievement):
    """
    Check if a user should be awarded a specific achievement.
    """
    print(f"=== Checking achievement: {achievement.name} | Type: {achievement.achievement_type} | Category: {achievement.category} | Requirement: {achievement.requirement_value}")
    
    achievement_type = achievement.achievement_type
    category = achievement.category
    requirement_value = achievement.requirement_value
    
    # Level achievements
    if achievement_type == 'level':
        if category:
            # Category-specific level achievement
            max_level = BestScore.objects.filter(
                user=user,
                game__category=category
            ).aggregate(max_level=Max('level_reached'))['max_level'] or 0
            print(f"=== Level achievement for {category}: max_level={max_level}, requirement={requirement_value}")
            return max_level >= requirement_value
        else:
            # Overall level achievement (user's actual level)
            print(f"=== Overall level achievement: user.level={user.level}, requirement={requirement_value}")
            return user.level >= requirement_value
    
    # Games played achievements
    elif achievement_type == 'games':
        if category:
            # Category-specific games played
            games_played = GameResult.objects.filter(
                user=user,
                game__category=category
            ).count()
            print(f"=== Games achievement for {category}: games_played={games_played}, requirement={requirement_value}")
            return games_played >= requirement_value
        else:
            # Total games played
            total_games = GameResult.objects.filter(user=user).count()
            print(f"=== Overall games achievement: total_games={total_games}, requirement={requirement_value}")
            return total_games >= requirement_value
    
    # Score achievements
    elif achievement_type == 'score':
        if category:
            # Category-specific high score
            max_score = BestScore.objects.filter(
                user=user,
                game__category=category
            ).aggregate(max_score=Max('score'))['max_score'] or 0
            print(f"=== Score achievement for {category}: max_score={max_score}, requirement={requirement_value}")
            return max_score >= requirement_value
        else:
            # Total score across all games
            total_score = BestScore.objects.filter(user=user).aggregate(
                total_score=Sum('score')
            )['total_score'] or 0
            print(f"=== Overall score achievement: total_score={total_score}, requirement={requirement_value}")
            return total_score >= requirement_value
    
    # Streak achievements
    elif achievement_type == 'streak':
        if category:
            # Category-specific streak
            max_streak = BestScore.objects.filter(
                user=user,
                game__category=category
            ).aggregate(max_streak=Max('best_streak'))['max_streak'] or 0
            return max_streak >= requirement_value
        else:
            # Overall best streak
            max_streak = BestScore.objects.filter(user=user).aggregate(
                max_streak=Max('best_streak')
            )['max_streak'] or 0
            return max_streak >= requirement_value
    
    # Category achievements (play all games in category)
    elif achievement_type == 'category':
        if category:
            total_games_in_category = Game.objects.filter(category=category).count()
            unique_games_played = GameResult.objects.filter(
                user=user,
                game__category=category
            ).values('game').distinct().count()
            return unique_games_played >= min(requirement_value, total_games_in_category)
    
    # Special achievements
    elif achievement_type == 'special':
        return check_special_achievement(user, achievement)
    
    return False


def check_special_achievement(user, achievement):
    """
    Handle special achievement logic.
    """
    name = achievement.name
    requirement_value = achievement.requirement_value
    category = achievement.category
    
    # Perfect Memory - Complete a memory game with 0 mistakes
    if name == 'Perfect Memory':
        perfect_games = GameResult.objects.filter(
            user=user,
            game__category='memory',
            mistakes=0
        ).count()
        return perfect_games >= requirement_value
    
    # Perfectionist - Complete 10 games with 0 mistakes
    elif name == 'Perfectionist':
        perfect_games = GameResult.objects.filter(
            user=user,
            mistakes=0
        ).count()
        return perfect_games >= requirement_value
    
    # Jack of All Trades - Play at least one game from each category
    elif name == 'Jack of All Trades':
        categories = ['memory', 'attention', 'speed', 'logic', 'language', 'multi', 'competitive']
        played_categories = set(
            GameResult.objects.filter(user=user).values_list('game__category', flat=True).distinct()
        )
        return len(played_categories.intersection(categories)) >= len(categories)
    
    # Competitor - Win your first multiplayer match
    elif name == 'Competitor':
        # This would need multiplayer logic - placeholder for now
        return False
    
    # Champion - Win 10 multiplayer matches
    elif name == 'Champion':
        # This would need multiplayer logic - placeholder for now
        return False
    
    # Legendary Fighter - Win 50 multiplayer matches
    elif name == 'Legendary Fighter':
        # This would need multiplayer logic - placeholder for now
        return False
    
    return False


def should_award_badge(user, badge):
    """
    Check if a user should be awarded a specific badge.
    """
    name = badge.name
    
    # Early Adopter - First 100 users
    if name == 'Early Adopter':
        user_count_when_joined = CustomUser.objects.filter(
            date_joined__lte=user.date_joined
        ).count()
        return user_count_when_joined <= 100
    
    # Beta Tester - First 10 users
    elif name == 'Beta Tester':
        user_count_when_joined = CustomUser.objects.filter(
            date_joined__lte=user.date_joined
        ).count()
        return user_count_when_joined <= 10
    
    # Rank-based badges - Disabled until ranking system is implemented
    elif 'Bronze' in name or 'Silver' in name or 'Gold' in name:
        return False  # Temporarily disable rank badges
    elif 'Platinum' in name:
        return user.experience >= 2500
    elif 'Diamond' in name:
        return user.experience >= 5000
    
    # Top performer badges
    elif name == 'Top 10 Player':
        return user.global_rank <= 10
    elif name == 'Top 100 Player':
        return user.global_rank <= 100
    
    # Streak badges
    elif name == 'Streak Champion':
        max_streak = BestScore.objects.filter(user=user).aggregate(
            max_streak=Max('best_streak')
        )['max_streak'] or 0
        return max_streak >= 100
        
    # Consistency badges
    elif name == 'Daily Player':
        # Check if user has played games on consecutive days (simplified)
        return GameResult.objects.filter(user=user).count() >= 30
    
    return False


def get_achievement_progress(user, achievement):
    """
    Get the current progress towards an achievement (0-100%).
    """
    achievement_type = achievement.achievement_type
    category = achievement.category
    requirement_value = achievement.requirement_value
    
    if achievement_type == 'level':
        if category:
            current_level = BestScore.objects.filter(
                user=user,
                game__category=category
            ).aggregate(max_level=Max('level_reached'))['max_level'] or 0
        else:
            current_level = user.level
        return min(100, (current_level / requirement_value) * 100)
    
    elif achievement_type == 'games':
        if category:
            current_games = GameResult.objects.filter(
                user=user,
                game__category=category
            ).count()
        else:
            current_games = GameResult.objects.filter(user=user).count()
        return min(100, (current_games / requirement_value) * 100)
    
    elif achievement_type == 'score':
        if category:
            current_score = BestScore.objects.filter(
                user=user,
                game__category=category
            ).aggregate(max_score=Max('score'))['max_score'] or 0
        else:
            current_score = BestScore.objects.filter(user=user).aggregate(
                total_score=Sum('score')
            )['total_score'] or 0
        return min(100, (current_score / requirement_value) * 100)
    
    elif achievement_type == 'streak':
        if category:
            current_streak = BestScore.objects.filter(
                user=user,
                game__category=category
            ).aggregate(max_streak=Max('best_streak'))['max_streak'] or 0
        else:
            current_streak = BestScore.objects.filter(user=user).aggregate(
                max_streak=Max('best_streak')
            )['max_streak'] or 0
        return min(100, (current_streak / requirement_value) * 100)
    
    elif achievement_type == 'category':
        if category:
            total_games_in_category = Game.objects.filter(category=category).count()
            unique_games_played = GameResult.objects.filter(
                user=user,
                game__category=category
            ).values('game').distinct().count()
            return min(100, (unique_games_played / min(requirement_value, total_games_in_category)) * 100)
    
    elif achievement_type == 'special':
        return get_special_achievement_progress(user, achievement)
    
    return 0


def get_special_achievement_progress(user, achievement):
    """
    Get progress for special achievements.
    """
    name = achievement.name
    requirement_value = achievement.requirement_value
    
    if name == 'Perfect Memory':
        perfect_games = GameResult.objects.filter(
            user=user,
            game__category='memory',
            mistakes=0
        ).count()
        return min(100, (perfect_games / requirement_value) * 100)
    
    elif name == 'Perfectionist':
        perfect_games = GameResult.objects.filter(
            user=user,
            mistakes=0
        ).count()
        return min(100, (perfect_games / requirement_value) * 100)
    
    elif name == 'Jack of All Trades':
        categories = ['memory', 'attention', 'speed', 'logic', 'language', 'multi', 'competitive']
        played_categories = set(
            GameResult.objects.filter(user=user).values_list('game__category', flat=True).distinct()
        )
        return min(100, (len(played_categories.intersection(categories)) / len(categories)) * 100)
    
    return 0
