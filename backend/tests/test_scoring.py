"""XP curve, result recording and BestScore reconciliation."""

import pytest

from games.services.scoring import MIN_GAME_XP, calculate_game_xp, record_game_result
from leaderboard.models import BestScore, GameResult

pytestmark = pytest.mark.django_db


def test_xp_is_base_plus_level_score_and_streak_bonuses(game):
    # base 10 + level 3*5 + score 250//100 + streak 2*2 - mistakes 0
    assert calculate_game_xp(game, score=250, level=3, streaks=2, mistakes=0) == 31


def test_score_and_streak_bonuses_are_capped(game):
    huge = calculate_game_xp(game, score=10_000_000, level=1, streaks=1000, mistakes=0)
    # base 10 + level 5 + score cap 20 + streak cap 10
    assert huge == 45


def test_mistake_penalty_is_capped_at_half_the_base_reward(game):
    unpenalised = calculate_game_xp(game, score=0, level=1, streaks=0, mistakes=0)
    heavily = calculate_game_xp(game, score=0, level=1, streaks=0, mistakes=500)
    assert unpenalised - heavily == game.base_xp_reward // 2


@pytest.mark.parametrize('base_xp', [1, 2, 5, 10, 40])
@pytest.mark.parametrize('mistakes', [0, 1, 50, 9999])
def test_xp_never_drops_below_the_floor(game, base_xp, mistakes):
    """The floor is currently unreachable — the level bonus alone is 5 XP at
    level 1 and the mistake penalty is capped at half the base reward — but it
    is the documented guarantee, so it is worth pinning."""
    game.base_xp_reward = base_xp
    assert calculate_game_xp(
        game, score=0, level=1, streaks=0, mistakes=mistakes
    ) >= MIN_GAME_XP


def test_record_game_result_awards_xp_and_creates_a_result(user, game):
    result = record_game_result(user, game.name, score=300, level=2, streaks=1)

    assert GameResult.objects.filter(user=user, game=game).count() == 1
    assert result['xp_earned'] > 0
    user.refresh_from_db()
    assert user.experience >= result['xp_earned']


def test_unknown_game_raises_rather_than_being_auto_created(user):
    from games.models import Game

    with pytest.raises(Game.DoesNotExist):
        record_game_result(user, 'Not A Seeded Game', score=1, level=1)
    assert not Game.objects.filter(name='Not A Seeded Game').exists()


def test_times_played_increments_once_per_play(user, game):
    """Regression: BestScore was written by both the view and the model hook,
    and the hook only saved when a record was broken."""
    for _ in range(3):
        record_game_result(user, game.name, score=100, level=1)

    best = BestScore.objects.get(user=user, game=game)
    assert best.times_played == 3


def test_times_played_increments_even_when_a_record_is_broken(user, game):
    record_game_result(user, game.name, score=100, level=1)
    record_game_result(user, game.name, score=999, level=5)

    best = BestScore.objects.get(user=user, game=game)
    assert best.times_played == 2
    assert best.score == 999


def test_best_score_keeps_the_best_of_each_metric(user, game):
    record_game_result(user, game.name, score=500, level=1, streaks=9, mistakes=4, correct_answers=2)
    record_game_result(user, game.name, score=100, level=7, streaks=1, mistakes=1, correct_answers=8)

    best = BestScore.objects.get(user=user, game=game)
    assert best.score == 500
    assert best.best_streak == 9
    assert best.fewest_mistakes == 1
    assert best.most_correct == 8
