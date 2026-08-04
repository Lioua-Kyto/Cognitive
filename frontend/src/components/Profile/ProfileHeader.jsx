import Avatar from "../../ui/Avatar.jsx";
import StatTile from "../../ui/StatTile.jsx";

/**
 * Identity and standing.
 *
 * The rank card used to pick one of five gradient treatments by rank band
 * (rank-1, rank-2, rank-3, rank-10, rank-100), which is five ways of saying a
 * number the tile already shows.
 */
export default function ProfileHeader({ user, globalRank, sessions, bestDomain }) {
  const name = user?.username || user?.email?.split("@")[0] || "You";
  const level = user?.level ?? 1;

  // The API sends the cumulative thresholds; the bar wants the fraction between
  // them. Falling back to the server's own percentage when either is missing.
  const span =
    (user?.xp_for_next_level ?? 0) - (user?.xp_for_current_level_base ?? 0);
  const progress =
    span > 0
      ? Math.min(100, Math.max(0, ((user?.current_level_xp ?? 0) / span) * 100))
      : (user?.xp_progress_in_current_level ?? 0);

  return (
    <header className="flex flex-wrap items-start gap-8">
      <Avatar
        name={name}
        src={user?.profile_picture}
        size="lg"
        ringClass="border-ground"
      />

      <div className="min-w-0 flex-1">
        <h1 className="font-display text-display-l text-lit">{name}</h1>

        {user?.country_name && (
          <p className="mt-2 flex items-center gap-2 text-body-s text-ink-muted">
            {user.country_flag && (
              <img
                src={user.country_flag}
                alt=""
                className="h-3 w-auto"
                onError={(e) => {
                  e.target.style.display = "none";
                }}
              />
            )}
            {user.country_name}
          </p>
        )}

        <p className="mt-3 max-w-[56ch] text-body text-ink">
          {user?.bio || "No bio yet."}
        </p>

        <div className="mt-5 max-w-sm">
          <div className="flex items-baseline justify-between gap-3">
            <span className="font-label text-label text-ink-faint">
              Level <span data-figure className="text-beam">{level}</span>
            </span>
            <span data-figure className="text-body-s text-ink-faint">
              {Math.round(progress)}%
            </span>
          </div>
          <div
            className="mt-1.5 h-1 overflow-hidden rounded-hair bg-rule"
            role="progressbar"
            aria-valuenow={Math.round(progress)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Progress through level ${level}`}
          >
            <div
              className="h-full bg-beam transition-[width] duration-warm ease-beam"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      <div className="grid w-full grid-cols-3 gap-px overflow-hidden rounded-room bg-rule sm:w-auto sm:min-w-[22rem]">
        <StatTile
          label="Global rank"
          value={globalRank ? `#${globalRank}` : "—"}
        />
        <StatTile label="Sessions" value={sessions ?? 0} />
        <StatTile label="Strongest" value={bestDomain ?? "—"} />
      </div>
    </header>
  );
}
