"""Populate a dev database with enough data to actually look at the app.

The frontend has several surfaces that render nothing without relational data —
Social needs friendships, requests and a chat history; Profile and Dashboard need
months of results across all seven domains; PlayStreak needs those results to
land on specific dates. Until now the only way to see any of them was to play
through the app by hand, which is why the social surfaces went through a redesign
without once being looked at in a browser.

Everything created here is tagged by the DEMO_DOMAIN email suffix, so --reset can
remove exactly what this command made and nothing a human typed in.
"""

import random
from datetime import timedelta

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils import timezone
from rest_framework_simplejwt.tokens import RefreshToken

from games.models import Game
from leaderboard.models import BestScore, GameResult
from social.models import ChatMessage, Friendship, UserStatus
from users.models import Achievement, Badge, CustomUser, UserAchievement, UserBadge

DEMO_DOMAIN = "demo.cognitive.local"
DEMO_PASSWORD = "demo-only-not-a-secret"

# The account you sign in as. The rest exist to give it a social graph.
PROTAGONIST = {
    "username": "ada",
    "country": "GB",
    "bio": "Working through the logic domain, slowly.",
    "experience": 4200,
}

CAST = [
    {"username": "hedy", "country": "AT", "bio": "Attention and speed, mostly.", "experience": 6100},
    {"username": "katherine", "country": "US", "bio": "Numbers person.", "experience": 5300},
    {"username": "grace", "country": "US", "bio": "Debugging my own memory.", "experience": 9800},
    {"username": "alan", "country": "GB", "bio": "", "experience": 2400},
    {"username": "shakuntala", "country": "IN", "bio": "Speed drills before coffee.", "experience": 7700},
    {"username": "mileva", "country": "RS", "bio": "Here for the logic rooms.", "experience": 1500},
    {"username": "chien", "country": "CN", "bio": "Language domain regular.", "experience": 3100},
    {"username": "emmy", "country": "DE", "bio": "Multi-domain, no favourites.", "experience": 8400},
]

GLOBAL_CHAT = [
    ("hedy", "Anyone else find the language rooms harder in the evening?"),
    ("grace", "Evening is when I do worst at everything, so probably not just you."),
    ("ada", "Same. My attention scores fall off a cliff after about 21:00."),
    ("shakuntala", "Morning speed runs are the only reason my numbers look good."),
    ("emmy", "I've stopped chasing the leaderboard and just do two domains a day."),
    ("katherine", "That's the right call. Chasing it made me worse."),
    ("ada", "Two a day is roughly where I've landed too."),
    ("grace", "Anyone tried the multi-domain set? Curious whether it's worth the time."),
]

PRIVATE_CHAT = {
    "hedy": [
        ("hedy", "How did you get on with the logic set?"),
        ("ada", "Badly, but less badly than last week."),
        ("hedy", "That's the whole game really."),
        ("hedy", "I'm doing a run tomorrow morning if you want to compare after."),
    ],
    "grace": [
        ("ada", "Did the pattern one break for you too, or is it me?"),
        ("grace", "Worked fine here. What were you seeing?"),
        ("ada", "Sequence kept resetting at round nine. Probably me."),
    ],
    "emmy": [
        ("emmy", "Your memory scores have moved a lot this month."),
        ("emmy", "Whatever you changed, keep doing it."),
    ],
}

# Which of the cast are friends, who has asked, and who has been asked.
FRIENDS = ["hedy", "grace", "emmy", "shakuntala"]
INCOMING_REQUESTS = ["alan", "mileva"]
OUTGOING_REQUESTS = ["katherine"]
ONLINE = ["hedy", "emmy", "alan"]

# Unread private messages, so the badges on the chat list have something to show.
UNREAD_FROM = {"hedy": 2, "emmy": 1}


class Command(BaseCommand):
    help = "Create a demo account with friends, chat history and months of results."

    def add_arguments(self, parser):
        parser.add_argument(
            "--reset",
            action="store_true",
            help="Delete previously seeded demo users (and their data) first.",
        )
        parser.add_argument(
            "--days",
            type=int,
            default=70,
            help="How far back to spread game results. Default 70.",
        )

    def handle(self, *args, **options):
        # This creates accounts whose password is printed to the terminal. There
        # is no version of that which belongs in a production database.
        if not settings.DEBUG:
            raise CommandError("seed_demo refuses to run with DEBUG=False.")

        if options["reset"]:
            deleted, _ = CustomUser.objects.filter(
                email__endswith=f"@{DEMO_DOMAIN}"
            ).delete()
            self.stdout.write(f"Removed {deleted} demo rows.")

        games = list(Game.objects.all())
        if not games:
            raise CommandError(
                "No games in the database. Run populate_games first (make seed)."
            )

        # Seeded so a second run produces the same history — a screenshot taken
        # today should be comparable to one taken next week.
        rng = random.Random(20260804)

        with transaction.atomic():
            protagonist = self._create_user(PROTAGONIST)
            cast = {spec["username"]: self._create_user(spec) for spec in CAST}

            self._link(protagonist, cast)
            self._chat(protagonist, cast, rng)
            self._history(protagonist, games, options["days"], rng)
            for user in list(cast.values())[:4]:
                self._history(user, games, options["days"], rng, density=0.5)
            self._awards(protagonist)

        self._report(protagonist)

    # -- creation ----------------------------------------------------------

    def _create_user(self, spec):
        email = f"{spec['username']}@{DEMO_DOMAIN}"
        user, created = CustomUser.objects.get_or_create(
            email=email,
            defaults={
                "username": spec["username"],
                "country": spec["country"],
                "bio": spec["bio"],
                "experience": spec["experience"],
            },
        )
        if created:
            user.set_password(DEMO_PASSWORD)
            user.save()
        return user

    def _link(self, protagonist, cast):
        for username in FRIENDS:
            Friendship.objects.get_or_create(
                requester=protagonist,
                receiver=cast[username],
                defaults={"status": "accepted"},
            )
        for username in INCOMING_REQUESTS:
            Friendship.objects.get_or_create(
                requester=cast[username],
                receiver=protagonist,
                defaults={"status": "pending"},
            )
        for username in OUTGOING_REQUESTS:
            Friendship.objects.get_or_create(
                requester=protagonist,
                receiver=cast[username],
                defaults={"status": "pending"},
            )

        for username, user in cast.items():
            UserStatus.objects.update_or_create(
                user=user,
                defaults={"status": "online" if username in ONLINE else "offline"},
            )
        UserStatus.objects.update_or_create(
            user=protagonist, defaults={"status": "online"}
        )

    def _chat(self, protagonist, cast, rng):
        if ChatMessage.objects.filter(sender=protagonist).exists():
            return

        by_name = {**cast, protagonist.username: protagonist}
        now = timezone.now()

        for offset, (author, content) in enumerate(reversed(GLOBAL_CHAT)):
            self._message(
                sender=by_name[author],
                receiver=None,
                message_type="global",
                content=content,
                when=now - timedelta(minutes=7 * offset + rng.randint(0, 4)),
                is_read=True,
            )

        for friend_name, thread in PRIVATE_CHAT.items():
            friend = cast[friend_name]
            unread = UNREAD_FROM.get(friend_name, 0)
            # The last `unread` messages from the friend are the unread ones.
            from_friend = [i for i, (a, _) in enumerate(thread) if a == friend_name]
            unread_indices = set(from_friend[-unread:]) if unread else set()

            for offset, (author, content) in enumerate(reversed(thread)):
                index = len(thread) - 1 - offset
                sender = by_name[author]
                self._message(
                    sender=sender,
                    receiver=protagonist if sender != protagonist else friend,
                    message_type="private",
                    content=content,
                    when=now - timedelta(minutes=11 * offset + rng.randint(0, 5)),
                    is_read=index not in unread_indices,
                )

    def _message(self, *, sender, receiver, message_type, content, when, is_read):
        message = ChatMessage.objects.create(
            sender=sender,
            receiver=receiver,
            message_type=message_type,
            content=content,
            is_read=is_read,
        )
        # timestamp is auto_now_add, so it can only be back-dated after insert.
        ChatMessage.objects.filter(pk=message.pk).update(timestamp=when)

    def _history(self, user, games, days, rng, density=1.0):
        if GameResult.objects.filter(user=user).exists():
            return

        today = timezone.now()
        rows = []
        timestamps = []

        for day_offset in range(days):
            # A real practice history has gaps. Recent days are more likely to be
            # played than old ones, which is what makes a streak look like one.
            recency = 1 - (day_offset / (days * 1.6))
            if rng.random() > recency * 0.75 * density:
                continue

            for _ in range(rng.randint(1, 3)):
                game = rng.choice(games)
                # Scores drift upward as the days approach today.
                improvement = 1 + (days - day_offset) / days * 0.6
                score = int(rng.randint(40, 140) * improvement)
                rows.append(
                    GameResult(
                        user=user,
                        game=game,
                        score=score,
                        level_reached=rng.randint(1, 9),
                        xp_earned=game.calculate_xp_reward(score),
                        duration_seconds=rng.randint(45, 210),
                        streaks=rng.randint(0, 8),
                        mistakes=rng.randint(0, 6),
                        correct_answers=rng.randint(6, 20),
                    )
                )
                timestamps.append(
                    today
                    - timedelta(
                        days=day_offset,
                        hours=rng.randint(0, 14),
                        minutes=rng.randint(0, 59),
                    )
                )

        # bulk_create skips GameResult.save(), which is what we want: its
        # update_best_score() fires a query per row. Best scores are derived in
        # one pass below instead.
        created = GameResult.objects.bulk_create(rows)
        # played_at is auto_now_add, so the history can only be written after the
        # insert — the field ignores anything set on the instance.
        for result, when in zip(created, timestamps, strict=True):
            result.played_at = when
        GameResult.objects.bulk_update(created, ["played_at"])

        self._best_scores(user)

    def _best_scores(self, user):
        by_game = {}
        for result in GameResult.objects.filter(user=user).select_related("game"):
            best = by_game.get(result.game_id)
            if best is None or result.score > best.score:
                by_game[result.game_id] = result

        counts = {}
        for result in GameResult.objects.filter(user=user):
            counts[result.game_id] = counts.get(result.game_id, 0) + 1

        for game_id, result in by_game.items():
            BestScore.objects.update_or_create(
                user=user,
                game_id=game_id,
                defaults={
                    "score": result.score,
                    "level_reached": result.level_reached,
                    "xp_earned": result.xp_earned,
                    "best_streak": result.streaks,
                    "fewest_mistakes": result.mistakes,
                    "most_correct": result.correct_answers,
                    "times_played": counts.get(game_id, 1),
                },
            )

    def _awards(self, user):
        for achievement in Achievement.objects.order_by("id")[:6]:
            UserAchievement.objects.get_or_create(user=user, achievement=achievement)
        for badge in Badge.objects.order_by("id")[:4]:
            UserBadge.objects.get_or_create(user=user, badge=badge)

    # -- output ------------------------------------------------------------

    def _report(self, protagonist):
        refresh = RefreshToken.for_user(protagonist)

        self.stdout.write(self.style.SUCCESS("\nDemo data ready.\n"))
        self.stdout.write(f"  email     {protagonist.email}")
        self.stdout.write(f"  password  {DEMO_PASSWORD}")
        self.stdout.write(f"  friends   {len(FRIENDS)}")
        self.stdout.write(
            f"  requests  {len(INCOMING_REQUESTS)} in, {len(OUTGOING_REQUESTS)} out"
        )
        self.stdout.write(
            f"  results   {GameResult.objects.filter(user=protagonist).count()}"
        )
        self.stdout.write("\n  Sign in through the app, or paste this into the console")
        self.stdout.write("  on the running frontend to skip the form:\n")
        self.stdout.write(
            f"    localStorage.setItem('token', '{refresh.access_token}');\n"
            f"    localStorage.setItem('refreshToken', '{refresh}');\n"
            "    location.reload()\n"
        )
