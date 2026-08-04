import { useContext } from "react";
import { Link } from "react-router-dom";
import { useQueries } from "@tanstack/react-query";
import { AuthContext } from "../context/AuthContext";
import {
  fetchProfile,
  fetchGlobalRank,
  fetchGameStats,
  fetchRecentGames,
} from "../api/profile.jsx";
import { AchievementsAPI } from "../api/achievements.jsx";
import { queryKeys } from "../queries/keys.js";
import PlayStreak from "../components/Dashboard/PlayStreak";
import Button from "../ui/Button.jsx";
import StatTile from "../ui/StatTile.jsx";

const mostRecentlyEarned = (items, count) =>
  (items ?? [])
    .filter((item) => item.is_earned && item.earned_date)
    .sort((a, b) => new Date(b.earned_date) - new Date(a.earned_date))
    .slice(0, count);

const shortDate = (value) => new Date(value).toLocaleDateString();

function AwardList({ items, empty }) {
  if (items.length === 0) {
    return <p className="mt-3 text-body-s text-ink-faint">{empty}</p>;
  }

  return (
    <ul className="mt-3 flex flex-col">
      {items.map((item) => (
        <li
          key={item.id}
          className="flex items-center gap-3 border-b border-rule py-2.5 last:border-b-0"
        >
          <span aria-hidden="true" className="text-body">
            {item.icon}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-body-s text-lit">
              {item.name}
            </span>
            <span data-figure className="block text-body-s text-ink-faint">
              {shortDate(item.earned_date)}
            </span>
          </span>
          {item.points != null && (
            <span data-figure className="text-body-s text-beam">
              +{item.points}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}

export default function Dashboard() {
  const { token, user } = useContext(AuthContext);
  const enabled = Boolean(token);

  // Five independent queries rather than one effect that reset every piece of
  // state together and re-ran whenever the token identity changed.
  const [profileQ, rankQ, statsQ, recentQ, awardsQ] = useQueries({
    queries: [
      {
        queryKey: queryKeys.user.profile("me"),
        queryFn: () => fetchProfile(token),
        enabled,
      },
      {
        queryKey: ["user", user?.id, "globalRank"],
        queryFn: () => fetchGlobalRank(token),
        enabled,
      },
      {
        queryKey: queryKeys.user.stats(user?.id),
        queryFn: () => fetchGameStats(token),
        enabled,
      },
      {
        queryKey: queryKeys.user.recentGames(user?.id),
        queryFn: () => fetchRecentGames(token),
        enabled,
      },
      {
        queryKey: queryKeys.user.achievements(user?.id),
        queryFn: () => new AchievementsAPI().fetchAchievementsAndBadges(token),
        enabled,
      },
    ],
  });

  const profile = profileQ.data ?? null;
  const globalRank = rankQ.data ?? null;
  const gameStats = statsQ.data ?? null;
  const recentGames = recentQ.data ?? [];
  const recentAchievements = mostRecentlyEarned(awardsQ.data?.achievements, 3);
  const recentBadges = mostRecentlyEarned(awardsQ.data?.badges, 3);

  // Only the profile is load-bearing; the rest degrade to empty sections.
  if (profileQ.isPending && enabled) {
    return <p className="py-storey-half text-body text-ink-muted">Loading…</p>;
  }

  if (profileQ.error) {
    return (
      <div className="py-storey-half">
        <h2 className="font-display text-heading-m text-lit">
          Could not load your dashboard
        </h2>
        <Button className="mt-4" onClick={() => profileQ.refetch()}>
          Try again
        </Button>
      </div>
    );
  }

  const trend = gameStats?.improvement_trend ?? 0;

  return (
    <div className="flex flex-col gap-storey-half py-storey-half">
      <section aria-labelledby="dashboard-heading">
        <h2
          id="dashboard-heading"
          className="font-display text-heading-l text-lit"
        >
          Welcome back, {profile?.username || "player"}
        </h2>

        <div className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-room bg-rule sm:grid-cols-4">
          <StatTile
            label="Global rank"
            value={globalRank?.rank ? `#${globalRank.rank}` : "—"}
          />
          <StatTile label="Sessions" value={gameStats?.total_games ?? 0} />
          <StatTile
            label="Domains trained"
            value={`${gameStats?.categories_played ?? 0}/7`}
          />
          <StatTile
            label="Average score"
            value={
              gameStats?.average_score != null
                ? Math.round(gameStats.average_score)
                : "—"
            }
          />
        </div>
      </section>

      <PlayStreak userStats={gameStats} />

      <div className="grid gap-storey-half lg:grid-cols-2">
        <section aria-labelledby="recent-heading">
          <h3
            id="recent-heading"
            className="font-label text-label text-ink-faint"
          >
            Recent sessions
          </h3>
          {recentGames.length === 0 ? (
            <div className="mt-3">
              <p className="text-body-s text-ink-faint">
                Nothing here yet. Your sessions will appear as you train.
              </p>
              <Link
                to="/games"
                className="mt-4 inline-flex h-10 items-center rounded-hair bg-beam px-4 text-body font-medium text-poche transition-colors duration-hair hover:bg-beam-deep"
              >
                Pick a domain
              </Link>
            </div>
          ) : (
            <ul className="mt-3 flex flex-col">
              {recentGames.slice(0, 5).map((game, index) => (
                <li
                  key={`${game.game_name}-${game.created_at}-${index}`}
                  className="flex items-baseline gap-3 border-b border-rule py-2.5 last:border-b-0"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-body-s text-lit">
                      {game.game_name}
                    </span>
                    <span className="font-label text-label text-ink-faint">
                      {game.category}
                    </span>
                  </span>
                  <span data-figure className="text-body-s text-ink">
                    {game.score}
                  </span>
                  <span data-figure className="w-16 text-right text-body-s text-beam">
                    +{game.xp_earned} XP
                  </span>
                  <span
                    data-figure
                    className="hidden w-24 text-right text-body-s text-ink-faint sm:block"
                  >
                    {shortDate(game.created_at)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="standing-heading">
          <h3
            id="standing-heading"
            className="font-label text-label text-ink-faint"
          >
            Standing
          </h3>
          <dl className="mt-3 flex flex-col">
            <div className="flex items-baseline justify-between gap-3 border-b border-rule py-2.5">
              <dt className="text-body-s text-ink-muted">Strongest domain</dt>
              <dd className="text-body-s text-lit capitalize">
                {gameStats?.best_category || "—"}
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-3 border-b border-rule py-2.5">
              <dt className="text-body-s text-ink-muted">Levels cleared</dt>
              <dd data-figure className="text-body-s text-lit">
                {gameStats?.total_levels ?? 0}
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-3 py-2.5">
              <dt className="text-body-s text-ink-muted">
                Recent score trend
              </dt>
              <dd
                data-figure
                className={`text-body-s ${
                  trend > 0
                    ? "text-positive"
                    : trend < 0
                      ? "text-negative"
                      : "text-ink-muted"
                }`}
              >
                {trend > 0 ? "+" : ""}
                {trend}%
              </dd>
            </div>
          </dl>
        </section>

        <section aria-labelledby="achievements-heading">
          <h3
            id="achievements-heading"
            className="font-label text-label text-ink-faint"
          >
            Achievements
          </h3>
          <AwardList
            items={recentAchievements}
            empty="None yet. They unlock as you train."
          />
        </section>

        <section aria-labelledby="badges-heading">
          <h3
            id="badges-heading"
            className="font-label text-label text-ink-faint"
          >
            Badges
          </h3>
          <AwardList items={recentBadges} empty="None yet." />
        </section>
      </div>
    </div>
  );
}
