"""The generic submission endpoint that replaced 35 copy-pasted views."""

import pytest
from rest_framework.test import APIClient

from games.models import Game
from games.registry import GAME_SLUGS
from leaderboard.models import GameResult

pytestmark = pytest.mark.django_db


@pytest.fixture
def client(user):
    api = APIClient()
    api.force_authenticate(user=user)
    return api


def test_every_registry_slug_resolves_to_the_generic_view():
    from django.urls import resolve

    for slug in GAME_SLUGS:
        match = resolve(f'/api/games/{slug}/')
        assert match.func.cls.__name__ == 'GameSubmitView'
        assert match.kwargs == {'game_slug': slug}


def test_registry_names_are_unique():
    names = list(GAME_SLUGS.values())
    assert len(names) == len(set(names))


def test_submission_records_a_result_and_returns_the_full_body(client, user, game):
    response = client.post(
        '/api/games/number-recall/',
        {'score': 420, 'level_reached': 3, 'streaks': 2, 'mistakes': 1, 'correct_answers': 7},
        format='json',
    )

    assert response.status_code == 200
    body = response.data
    # The old per-game views returned only {'score': ...}, which left the whole
    # client-side response handler dead for 34 of 35 games.
    for key in ('xp_earned', 'level_up', 'best_score', 'best_level', 'best_streak',
                'total_xp', 'newly_earned_achievements', 'newly_earned_badges'):
        assert key in body

    result = GameResult.objects.get(user=user, game=game)
    assert (result.score, result.level_reached, result.mistakes) == (420, 3, 1)


def test_client_supplied_xp_is_ignored(client, user, game):
    response = client.post(
        '/api/games/number-recall/',
        {'score': 100, 'level_reached': 1, 'xp': 999999},
        format='json',
    )
    assert response.data['xp_earned'] < 1000


def test_unknown_slug_is_a_404(client):
    response = client.post('/api/games/not-a-game/', {'score': 1}, format='json')
    assert response.status_code == 404


def test_slug_for_a_game_that_is_not_seeded_is_a_404(client, game):
    # 'word-grid' is a valid slug but no Game row exists for it here.
    response = client.post('/api/games/word-grid/', {'score': 1}, format='json')
    assert response.status_code == 404
    assert not Game.objects.filter(name='Word Grid').exists()


def test_negative_scores_are_rejected(client, game):
    response = client.post('/api/games/number-recall/', {'score': -5}, format='json')
    assert response.status_code == 400


def test_submission_requires_authentication(game):
    response = APIClient().post('/api/games/number-recall/', {'score': 1}, format='json')
    assert response.status_code in (401, 403)


def test_extra_payload_keys_are_ignored_not_rejected(client, game):
    """Games still send their old proof fields; they must not 400."""
    response = client.post(
        '/api/games/number-recall/',
        {'score': 10, 'sequence': '1234', 'user_response': '1234', 'message': 'hi'},
        format='json',
    )
    assert response.status_code == 200
