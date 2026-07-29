"""Shared fixtures. Database and cache backends are configured in
backend/settings_test.py so the suite needs no local Postgres or Redis."""

import pytest


@pytest.fixture
def user(db):
    from users.models import CustomUser

    return CustomUser.objects.create_user(
        email='player@example.com', password='pw', username='player'
    )


@pytest.fixture
def game(db):
    from games.models import Game

    return Game.objects.create(
        name='Number Recall',
        description='Recall a sequence of digits',
        category='memory',
        base_xp_reward=10,
    )
