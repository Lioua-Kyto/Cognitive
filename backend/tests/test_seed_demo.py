"""The demo seeder — the only way to see Social, Profile or Dashboard with data
in them without playing through the app by hand."""

import pytest
from django.core.management import call_command
from django.core.management.base import CommandError

from games.models import Game
from leaderboard.models import BestScore, GameResult
from social.models import ChatMessage, Friendship, UserStatus
from users.models import CustomUser

pytestmark = pytest.mark.django_db


@pytest.fixture
def debug(settings):
    settings.DEBUG = True
    return settings


@pytest.fixture
def games(db):
    return [
        Game.objects.create(
            name=f'Game {i}',
            description='',
            category=category,
            base_xp_reward=10,
        )
        for i, category in enumerate(
            ['memory', 'attention', 'speed', 'logic', 'language', 'multi', 'competitive']
        )
    ]


def seed(**kwargs):
    call_command('seed_demo', verbosity=0, **kwargs)


def protagonist():
    return CustomUser.objects.get(username='ada')


def test_refuses_to_run_outside_debug(settings, games):
    settings.DEBUG = False

    with pytest.raises(CommandError, match='DEBUG=False'):
        seed()


def test_refuses_to_run_before_the_games_are_seeded(debug):
    with pytest.raises(CommandError, match='populate_games'):
        seed()


def test_builds_the_social_graph_the_page_needs(debug, games):
    seed()
    ada = protagonist()

    accepted = Friendship.objects.filter(requester=ada, status='accepted')
    incoming = Friendship.objects.filter(receiver=ada, status='pending')
    outgoing = Friendship.objects.filter(requester=ada, status='pending')

    assert accepted.count() == 4
    assert incoming.count() == 2
    assert outgoing.count() == 1


def test_leaves_unread_private_messages_so_the_badges_have_something_to_show(
    debug, games
):
    seed()
    ada = protagonist()

    unread = ChatMessage.objects.filter(
        receiver=ada, message_type='private', is_read=False
    )
    assert unread.count() == 3
    # Unread means from someone else; a badge counting your own messages is a bug.
    assert not unread.filter(sender=ada).exists()


def test_global_chat_has_more_than_one_speaker(debug, games):
    seed()

    senders = set(
        ChatMessage.objects.filter(message_type='global').values_list(
            'sender__username', flat=True
        )
    )
    assert len(senders) > 1


def test_some_friends_are_online_and_some_are_not(debug, games):
    seed()

    statuses = set(UserStatus.objects.values_list('status', flat=True))
    assert statuses == {'online', 'offline'}


def test_history_is_spread_over_time_rather_than_stamped_with_now(debug, games):
    seed(days=40)
    ada = protagonist()

    results = GameResult.objects.filter(user=ada)
    assert results.count() > 20

    days = {result.played_at.date() for result in results}
    # auto_now_add would collapse the whole history onto today, and PlayStreak
    # and the Dashboard charts would have nothing to draw.
    assert len(days) > 10


def test_history_covers_every_domain(debug, games):
    seed()
    ada = protagonist()

    categories = set(
        GameResult.objects.filter(user=ada).values_list('game__category', flat=True)
    )
    assert categories == {
        'memory',
        'attention',
        'speed',
        'logic',
        'language',
        'multi',
        'competitive',
    }


def test_best_score_matches_the_best_result_for_each_game(debug, games):
    seed()
    ada = protagonist()

    for best in BestScore.objects.filter(user=ada):
        top = (
            GameResult.objects.filter(user=ada, game=best.game)
            .order_by('-score')
            .first()
        )
        assert best.score == top.score
        assert best.times_played == GameResult.objects.filter(
            user=ada, game=best.game
        ).count()


def test_running_twice_does_not_duplicate_anything(debug, games):
    seed()
    counts = (
        CustomUser.objects.count(),
        Friendship.objects.count(),
        ChatMessage.objects.count(),
        GameResult.objects.count(),
    )

    seed()

    assert counts == (
        CustomUser.objects.count(),
        Friendship.objects.count(),
        ChatMessage.objects.count(),
        GameResult.objects.count(),
    )


def test_reset_removes_only_the_seeded_accounts(debug, games):
    real = CustomUser.objects.create_user(
        email='someone@example.com', password='pw', username='someone'
    )
    seed()

    seed(reset=True)

    assert CustomUser.objects.filter(pk=real.pk).exists()
    assert CustomUser.objects.filter(email__endswith='@demo.cognitive.local').count() == 9
