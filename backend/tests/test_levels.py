"""The level curve and its inverse."""

import pytest

from users.models import CustomUser

pytestmark = pytest.mark.django_db


def test_zero_experience_is_level_one():
    assert CustomUser(experience=0).level == 1


@pytest.mark.parametrize('level', range(1, 40))
def test_experience_for_level_is_an_exact_inverse(level):
    """LevelStatsView filters on experience to stand in for level, so the two
    have to agree at the boundary in both directions."""
    threshold = CustomUser.experience_for_level(level)
    assert CustomUser(experience=threshold).level == level
    if threshold > 0:
        assert CustomUser(experience=threshold - 1).level == level - 1


def test_level_is_capped_at_one_hundred():
    assert CustomUser(experience=10_000_000).level == 100


def test_add_experience_reports_a_level_up(user):
    assert user.level == 1
    assert user.add_experience(CustomUser.experience_for_level(2)) is True
    assert user.level == 2


def test_add_experience_without_crossing_a_boundary_is_not_a_level_up(user):
    user.add_experience(1)
    assert user.level == 1
    assert user.add_experience(1) is False
