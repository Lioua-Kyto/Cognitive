import { useContext, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQueries } from "@tanstack/react-query";
import { AuthContext } from "../context/AuthContext";
import { useSocial } from "../context/SocialContext";
import { useNotifications } from "../context/NotificationContext";
import { profileAPI } from "../api/profile.jsx";
import { queryKeys } from "../queries/keys.js";
import { FALLBACK_CATEGORIES } from "../queries/useCategories.js";
import AwardGrid from "../components/Profile/AwardGrid.jsx";
import Avatar from "../ui/Avatar.jsx";
import Button from "../ui/Button.jsx";
import Field from "../ui/Field.jsx";
import Select from "../ui/Select.jsx";
import StatTile from "../ui/StatTile.jsx";

export default function ProfileVisit() {
  const { username } = useParams();
  const { user, token } = useContext(AuthContext);
  const { friends, sendFriendRequest, openChat, onlineFriends } = useSocial();
  const { showNotification } = useNotifications();
  const [selectedGame, setSelectedGame] = useState("all");

  const profileQ = useQueries({
    queries: [
      {
        queryKey: queryKeys.user.profile(username),
        queryFn: () => profileAPI.getUserProfile(username, token),
        enabled: Boolean(username && token),
      },
    ],
  })[0];

  const profile = profileQ.data?.success ? profileQ.data.data : null;
  const id = profile?.id;

  /*
   * These three were fetched sequentially inside one effect and then thrown
   * away: the effect tested `response.success` on functions that return the
   * array directly, so the condition was never true and best scores,
   * achievements and badges were permanently empty — a profile with 64 sessions
   * and six achievements rendered "No games played yet".
   */
  const [scoresQ, achievementsQ, badgesQ, statsQ] = useQueries({
    queries: [
      {
        queryKey: ["user", id, "bestScores"],
        queryFn: () => profileAPI.getUserBestScores(id, token),
        enabled: Boolean(id && token),
      },
      {
        queryKey: queryKeys.user.achievements(id),
        queryFn: () => profileAPI.getUserAchievements(id, token),
        enabled: Boolean(id && token),
      },
      {
        queryKey: queryKeys.user.badges(id),
        queryFn: () => profileAPI.getUserBadges(id, token),
        enabled: Boolean(id && token),
      },
      {
        queryKey: queryKeys.user.stats(id),
        queryFn: () => profileAPI.getUserStats(id, token),
        enabled: Boolean(id && token),
      },
    ],
  });

  const bestScores = scoresQ.data ?? [];
  const achievements = achievementsQ.data ?? [];
  const badges = badgesQ.data ?? [];
  const stats = statsQ.data?.success ? statsQ.data.data : null;

  if (profileQ.isPending) {
    return (
      <div className="mx-auto max-w-frame px-4 py-storey-half">
        <p className="text-body text-ink-muted">Loading profile…</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="mx-auto max-w-frame px-4 py-storey-half">
        <h1 className="font-display text-heading-l text-lit">
          Profile not found
        </h1>
        <p className="mt-3 max-w-[48ch] text-body text-ink-muted">
          There is no one here by that name, or their profile is not visible to
          you.
        </p>
        {/* The version this replaces redirected to /social on a two-second
            timer, which moves the page out from under anyone still reading. */}
        <Link
          to="/social"
          className="mt-6 inline-block text-body text-beam underline underline-offset-4"
        >
          Back to social
        </Link>
      </div>
    );
  }

  const name = profile.username || profile.display_name || "Unknown";
  const isCurrentUser = user?.id === profile.id;
  const isFriend = friends.some((f) => f.id === profile.id);
  const isOnline = onlineFriends.some((f) => f.id === profile.id);

  const mostPlayed = bestScores.reduce(
    (top, s) => (top === null || s.times_played > top.times_played ? s : top),
    null
  );
  const bestOverall = bestScores.reduce(
    (max, s) => Math.max(max, s.score),
    0
  );

  const shownScores =
    selectedGame === "all"
      ? bestScores
      : bestScores.filter((s) => String(s.game_id) === selectedGame);

  const handleSendFriendRequest = async () => {
    const result = await sendFriendRequest(name);
    showNotification(
      result.success
        ? {
            type: "success",
            title: "Friend request sent",
            message: `Friend request sent to ${name}`,
          }
        : {
            type: "error",
            title: "Error",
            message: result.error || "Failed to send friend request",
          }
    );
  };

  return (
    <div className="mx-auto flex max-w-frame flex-col gap-storey-half px-4 py-storey-half">
      <div>
        <Link
          to="/social"
          className="text-body-s text-ink-muted transition-colors duration-hair hover:text-beam"
        >
          ← Back to social
        </Link>
      </div>

      <header className="flex flex-wrap items-start gap-6">
        <Avatar
          name={name}
          src={profile.profile_picture}
          size="lg"
          status={isOnline ? "online" : "offline"}
          ringClass="border-ground"
        />

        <div className="min-w-0 flex-1">
          <h1 className="font-display text-display-l text-lit">{name}</h1>

          {profile.country_name && (
            <p className="mt-2 flex items-center gap-2 text-body-s text-ink-muted">
              {profile.country_flag && (
                <img
                  src={profile.country_flag}
                  alt=""
                  className="h-3 w-auto"
                  onError={(e) => {
                    e.target.style.display = "none";
                  }}
                />
              )}
              {profile.country_name}
            </p>
          )}

          {profile.bio && (
            <p className="mt-3 max-w-[56ch] text-body text-ink">
              {profile.bio}
            </p>
          )}

          <p className="mt-3 text-body-s text-ink-faint">
            Member since{" "}
            {new Date(profile.date_joined).toLocaleDateString(undefined, {
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>

        {!isCurrentUser && (
          <div className="flex gap-3">
            {isFriend ? (
              <Button onClick={() => openChat(profile.id)}>Message</Button>
            ) : (
              <Button variant="secondary" onClick={handleSendFriendRequest}>
                Send friend request
              </Button>
            )}
          </div>
        )}
      </header>

      <section aria-labelledby="visit-stats">
        <h2 id="visit-stats" className="font-label text-label text-ink-faint">
          Standing
        </h2>
        <div className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-room bg-rule sm:grid-cols-4">
          <StatTile label="Level" value={profile.level ?? 1} />
          <StatTile label="Sessions" value={profile.total_games_played ?? 0} />
          <StatTile
            label="Global rank"
            value={profile.global_rank ? `#${profile.global_rank}` : "—"}
          />
          <StatTile label="Best score" value={bestOverall.toLocaleString()} />
        </div>
      </section>

      <section aria-labelledby="visit-domains">
        <h2 id="visit-domains" className="font-label text-label text-ink-faint">
          By domain
        </h2>
        <ul className="mt-4 grid gap-px overflow-hidden rounded-room bg-rule sm:grid-cols-2 lg:grid-cols-4">
          {FALLBACK_CATEGORIES.map((category) => {
            const domain = stats?.category_stats?.[category.key];
            return (
              <li
                key={category.key}
                className="flex items-baseline justify-between gap-3 bg-surface p-4"
              >
                <span className="text-body-s text-ink">{category.label}</span>
                {domain?.has_played ? (
                  <span data-figure className="text-body-s text-beam">
                    #{domain.rank}
                  </span>
                ) : (
                  // An untrained domain is not a locked one. No padlock.
                  <span className="text-body-s text-ink-faint">untrained</span>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-labelledby="visit-scores">
        <h2 id="visit-scores" className="font-label text-label text-ink-faint">
          Best scores
        </h2>

        {bestScores.length === 0 ? (
          <p className="mt-4 text-body-s text-ink-faint">
            No sessions recorded yet.
          </p>
        ) : (
          <>
            {mostPlayed && (
              <p className="mt-3 text-body-s text-ink-muted">
                Most played: <span className="text-lit">{mostPlayed.game_name}</span>{" "}
                — <span data-figure>{mostPlayed.times_played}</span> sessions
              </p>
            )}

            <Field label="Filter by game" className="mt-4 max-w-xs">
              {(props) => (
                <Select
                  {...props}
                  value={selectedGame}
                  onChange={(e) => setSelectedGame(e.target.value)}
                >
                  <option value="all">All games</option>
                  {bestScores.map((score) => (
                    <option key={score.game_id} value={score.game_id}>
                      {score.game_name}
                    </option>
                  ))}
                </Select>
              )}
            </Field>

            <ul className="mt-5 flex flex-col">
              {shownScores.map((score) => (
                <li
                  key={score.game_id}
                  className="flex flex-wrap items-baseline gap-x-6 gap-y-1 border-b border-rule py-3 last:border-b-0"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-body-s text-lit">
                      {score.game_name}
                    </span>
                    <span className="font-label text-label text-ink-faint">
                      {score.category}
                    </span>
                  </span>
                  <span data-figure className="text-body-s text-ink">
                    {score.score.toLocaleString()}
                    <span className="ml-1 text-ink-faint">best</span>
                  </span>
                  <span data-figure className="text-body-s text-ink">
                    {score.times_played}
                    <span className="ml-1 text-ink-faint">played</span>
                  </span>
                  <span data-figure className="text-body-s text-ink">
                    {score.best_streak}
                    <span className="ml-1 text-ink-faint">streak</span>
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      <section aria-labelledby="visit-achievements">
        <h2
          id="visit-achievements"
          className="font-label text-label text-ink-faint"
        >
          Achievements
        </h2>
        <AwardGrid
          items={achievements}
          empty="None earned yet."
          kind="achievement"
        />
      </section>

      <section aria-labelledby="visit-badges">
        <h2 id="visit-badges" className="font-label text-label text-ink-faint">
          Badges
        </h2>
        <AwardGrid items={badges} empty="None earned yet." kind="badge" />
      </section>
    </div>
  );
}
