"""Achievement and badge award rules.

Every achievement type reduces to the same shape: a measured value and a target.
`measure_achievement` returns that pair once, and both the award check and the
progress bar are derived from it — previously the same query tree was written
twice, once returning a bool and once a percentage, and the two drifted.
"""

import logging

from django.db.models import Max, Sum

from games.models import Game
from leaderboard.models import BestScore, GameResult

from ..models import Achievement, Badge, CustomUser, UserAchievement, UserBadge

logger = logging.getLogger(__name__)

ALL_CATEGORIES = [key for key, _ in Game.CATEGORY_CHOICES]

PLATINUM_XP = 2500
DIAMOND_XP = 5000
STREAK_CHAMPION = 100
DAILY_PLAYER_GAMES = 30


def _best_scores(user, category=None):
    qs = BestScore.objects.filter(user=user)
    return qs.filter(game__category=category) if category else qs


def _game_results(user, category=None):
    qs = GameResult.objects.filter(user=user)
    return qs.filter(game__category=category) if category else qs


def _aggregate(qs, **kwargs):
    key, = kwargs
    return qs.aggregate(**kwargs)[key] or 0


def measure_achievement(user, achievement):
    """Return (current, target) for an achievement. target of 0 means unmeasurable."""
    kind = achievement.achievement_type
    category = achievement.category
    target = achievement.requirement_value

    if kind == 'level':
        if category:
            current = _aggregate(_best_scores(user, category), v=Max('level_reached'))
        else:
            current = user.level

    elif kind == 'games':
        current = _game_results(user, category).count()

    elif kind == 'score':
        if category:
            current = _aggregate(_best_scores(user, category), v=Max('score'))
        else:
            current = _aggregate(_best_scores(user), v=Sum('score'))

    elif kind == 'streak':
        current = _aggregate(_best_scores(user, category), v=Max('best_streak'))

    elif kind == 'category':
        if not category:
            return 0, 0
        in_category = Game.objects.filter(category=category).count()
        current = _game_results(user, category).values('game').distinct().count()
        target = min(target, in_category)

    elif kind == 'special':
        return measure_special_achievement(user, achievement)

    else:
        return 0, 0

    return current, target


def measure_special_achievement(user, achievement):
    name = achievement.name
    target = achievement.requirement_value

    if name == 'Perfect Memory':
        return _game_results(user, 'memory').filter(mistakes=0).count(), target

    if name == 'Perfectionist':
        return _game_results(user).filter(mistakes=0).count(), target

    if name == 'Jack of All Trades':
        played = set(
            _game_results(user).values_list('game__category', flat=True).distinct()
        )
        return len(played & set(ALL_CATEGORIES)), len(ALL_CATEGORIES)

    # Competitor / Champion / Legendary Fighter depend on multiplayer results,
    # which no game currently produces. Unmeasurable rather than never-awarded.
    return 0, 0


def should_award_achievement(user, achievement):
    current, target = measure_achievement(user, achievement)
    return target > 0 and current >= target


def get_achievement_progress(user, achievement):
    current, target = measure_achievement(user, achievement)
    if target <= 0:
        return 0
    return min(100, (current / target) * 100)


def should_award_badge(user, badge, global_rank=None):
    name = badge.name

    if name == 'Early Adopter':
        return CustomUser.objects.filter(date_joined__lte=user.date_joined).count() <= 100

    if name == 'Beta Tester':
        return CustomUser.objects.filter(date_joined__lte=user.date_joined).count() <= 10

    # Bronze/Silver/Gold are rank tiers with no defined thresholds yet.
    if 'Bronze' in name or 'Silver' in name or 'Gold' in name:
        return False

    if 'Platinum' in name:
        return user.experience >= PLATINUM_XP

    if 'Diamond' in name:
        return user.experience >= DIAMOND_XP

    if name == 'Top 10 Player':
        return (global_rank if global_rank is not None else user.global_rank) <= 10

    if name == 'Top 100 Player':
        return (global_rank if global_rank is not None else user.global_rank) <= 100

    if name == 'Streak Champion':
        return _aggregate(_best_scores(user), v=Max('best_streak')) >= STREAK_CHAMPION

    if name == 'Daily Player':
        return _game_results(user).count() >= DAILY_PLAYER_GAMES

    return False


def check_and_award_achievements(user):
    """Award any newly earned achievements and badges. Runs on every submission."""
    newly_earned = {'achievements': [], 'badges': []}

    owned = set(UserAchievement.objects.filter(user=user).values_list('achievement_id', flat=True))
    pending_xp = 0

    for achievement in Achievement.objects.exclude(id__in=owned):
        if should_award_achievement(user, achievement):
            UserAchievement.objects.create(user=user, achievement=achievement)
            newly_earned['achievements'].append(achievement)
            pending_xp += achievement.points

    # One save instead of one per achievement, and it happens before the badge
    # pass so XP-threshold badges see the new total.
    if pending_xp:
        user.add_experience(pending_xp)

    owned_badges = set(UserBadge.objects.filter(user=user).values_list('badge_id', flat=True))
    global_rank = user.global_rank  # one COUNT, not one per rank badge

    for badge in Badge.objects.exclude(id__in=owned_badges):
        if should_award_badge(user, badge, global_rank=global_rank):
            UserBadge.objects.create(user=user, badge=badge)
            newly_earned['badges'].append(badge)

    if newly_earned['achievements'] or newly_earned['badges']:
        logger.info(
            'Awarded %s: %d achievements (+%d XP), %d badges',
            user, len(newly_earned['achievements']), pending_xp, len(newly_earned['badges']),
        )

    return newly_earned
