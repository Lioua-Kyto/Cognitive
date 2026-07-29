"""Scoring, XP award and result recording for single-player game submissions."""

import logging

from django.db import transaction

from games.models import Game
from leaderboard.models import BestScore, GameResult
from users.utils import check_and_award_achievements

logger = logging.getLogger(__name__)

MIN_GAME_XP = 5
MAX_SCORE_BONUS_XP = 20
MAX_STREAK_BONUS_XP = 10


def calculate_game_xp(game, score, level, streaks, mistakes):
    """XP for one play. The client's own XP figure is never trusted."""
    base_xp = game.base_xp_reward
    level_xp = level * 5
    score_xp = min(score // 100, MAX_SCORE_BONUS_XP)
    streak_xp = min(streaks * 2, MAX_STREAK_BONUS_XP)
    mistake_penalty = min(mistakes, base_xp // 2)

    return max(base_xp + level_xp + score_xp + streak_xp - mistake_penalty, MIN_GAME_XP)


@transaction.atomic
def record_game_result(user, game_name, score, level, streaks=0, mistakes=0, correct_answers=0):
    """Record one play: GameResult, XP, and achievement checks.

    BestScore is maintained by GameResult.save() -> update_best_score(); doing it
    here as well is what used to double-count times_played.
    """
    try:
        game = Game.objects.get(name=game_name)
    except Game.DoesNotExist:
        raise Game.DoesNotExist(
            f"No seeded game named {game_name!r}. Run `manage.py populate_games`."
        )

    xp_earned = calculate_game_xp(game, score, level, streaks, mistakes)

    old_level = user.level
    user.add_experience(xp_earned)
    new_level = user.level

    game_result = GameResult.objects.create(
        user=user,
        game=game,
        score=score,
        level_reached=level,
        xp_earned=xp_earned,
        streaks=streaks,
        mistakes=mistakes,
        correct_answers=correct_answers,
    )

    newly_earned = check_and_award_achievements(user)

    logger.info(
        'Recorded %s for %s: score=%s level=%s xp=%s',
        game.name, user, score, level, xp_earned,
    )

    return {
        'game_result': game_result,
        'newly_earned': newly_earned,
        'xp_earned': xp_earned,
        'level_up': new_level > old_level,
        'old_level': old_level,
        'new_level': new_level,
        'total_xp': user.experience,
    }


def build_game_response(result_data, correct=None):
    """Standard submission response: this play, plus the user's bests and awards."""
    game_result = result_data['game_result']

    try:
        best = BestScore.objects.get(user=game_result.user, game=game_result.game)
        best_score, best_level, best_streak = best.score, best.level_reached, best.best_streak
    except BestScore.DoesNotExist:
        best_score = game_result.score
        best_level = game_result.level_reached
        best_streak = game_result.streaks

    return {
        'correct': True if correct is None else correct,
        'score': game_result.score,
        'level_reached': game_result.level_reached,
        'streaks': game_result.streaks,
        'best_score': best_score,
        'best_level': best_level,
        'best_streak': best_streak,
        'xp_earned': result_data['xp_earned'],
        'level_up': result_data['level_up'],
        'old_level': result_data['old_level'],
        'new_level': result_data['new_level'],
        'total_xp': result_data['total_xp'],
        'newly_earned_achievements': [
            {
                'id': a.id,
                'name': a.name,
                'description': a.description,
                'icon': a.icon,
                'points': a.points,
            }
            for a in result_data['newly_earned']['achievements']
        ],
        'newly_earned_badges': [
            {
                'id': b.id,
                'name': b.name,
                'description': b.description,
                'icon': b.icon,
                'badge_type': b.badge_type,
            }
            for b in result_data['newly_earned']['badges']
        ],
    }
