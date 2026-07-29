"""Award rules: measurement, progress, and the award pass."""

import pytest

from games.services.scoring import record_game_result
from users.models import Achievement, UserAchievement
from users.services.achievements import (
    check_and_award_achievements,
    get_achievement_progress,
    should_award_achievement,
)

pytestmark = pytest.mark.django_db


@pytest.fixture
def games_achievement(db):
    return Achievement.objects.create(
        name='Getting Started',
        description='Play 2 games',
        achievement_type='games',
        requirement_value=2,
        points=10,
        icon='*',
    )


def test_progress_and_award_agree(user, game, games_achievement):
    """The two used to be separate query trees that had already drifted."""
    assert should_award_achievement(user, games_achievement) is False
    assert get_achievement_progress(user, games_achievement) == 0

    record_game_result(user, game.name, score=10, level=1)
    assert should_award_achievement(user, games_achievement) is False
    assert get_achievement_progress(user, games_achievement) == 50

    record_game_result(user, game.name, score=10, level=1)
    assert should_award_achievement(user, games_achievement) is True
    assert get_achievement_progress(user, games_achievement) == 100


def test_progress_is_capped_at_one_hundred(user, game, games_achievement):
    for _ in range(5):
        record_game_result(user, game.name, score=10, level=1)
    assert get_achievement_progress(user, games_achievement) == 100


def test_award_grants_points_once(user, game, games_achievement):
    for _ in range(2):
        record_game_result(user, game.name, score=10, level=1)

    user.refresh_from_db()
    assert UserAchievement.objects.filter(user=user, achievement=games_achievement).count() == 1

    before = user.experience
    again = check_and_award_achievements(user)
    user.refresh_from_db()
    assert again['achievements'] == []
    assert user.experience == before


def test_category_achievement_with_no_seeded_games_is_not_awarded(user):
    """0 >= min(requirement, 0) used to award this for free."""
    achievement = Achievement.objects.create(
        name='Empty Category Master',
        description='Play every game in a category with no games',
        achievement_type='category',
        category='competitive',
        requirement_value=5,
        points=10,
        icon='*',
    )
    assert should_award_achievement(user, achievement) is False
    assert get_achievement_progress(user, achievement) == 0


def test_unmeasurable_special_achievement_is_not_awarded(user):
    achievement = Achievement.objects.create(
        name='Champion',
        description='Win 10 multiplayer matches',
        achievement_type='special',
        requirement_value=10,
        points=50,
        icon='*',
    )
    assert should_award_achievement(user, achievement) is False
