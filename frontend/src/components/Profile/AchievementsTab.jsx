import AchievementTooltip from "../AchievementTooltip.jsx";
import AwardGrid from "./AwardGrid.jsx";
import StatTile from "../../ui/StatTile.jsx";

function LockedList({ items, kind }) {
  if (items.length === 0) return null;

  return (
    <ul className="mt-4 grid gap-px overflow-hidden rounded-room bg-rule sm:grid-cols-2">
      {items.map((item) => (
        <li key={item.id} className="bg-surface">
          <AchievementTooltip
            isVisible
            {...(kind === "achievement"
              ? { achievement: item }
              : { badge: item })}
          >
            {/* Focusable so the stats tooltip is reachable without a pointer —
                it opens on focus as well as hover. */}
            <div
              tabIndex={0}
              className="flex w-full gap-3 p-4 focus:outline-none focus-visible:outline-2 focus-visible:outline-beam"
            >
              <span aria-hidden="true" className="text-heading-s opacity-40">
                {item.icon}
              </span>
              <span className="min-w-0 flex-1 text-left">
                <span className="block text-body-s text-ink-muted">
                  {item.name}
                </span>
                <span className="mt-1 block text-body-s text-ink-faint">
                  {item.description}
                </span>
              </span>
            </div>
          </AchievementTooltip>
        </li>
      ))}
    </ul>
  );
}

export default function AchievementsTab({ achievements, badges, loading }) {
  if (loading) {
    return <p className="text-body-s text-ink-muted">Loading…</p>;
  }

  const earnedAchievements = achievements.filter((a) => a.is_earned);
  const lockedAchievements = achievements.filter((a) => !a.is_earned);
  const earnedBadges = badges.filter((b) => b.is_earned);
  const lockedBadges = badges.filter((b) => !b.is_earned);

  const points = earnedAchievements.reduce(
    (total, a) => total + (a.points ?? 0),
    0
  );

  return (
    <div className="flex flex-col gap-storey-half">
      <div className="grid grid-cols-3 gap-px overflow-hidden rounded-room bg-rule">
        <StatTile
          label="Achievements"
          value={`${earnedAchievements.length}/${achievements.length}`}
        />
        <StatTile
          label="Badges"
          value={`${earnedBadges.length}/${badges.length}`}
        />
        <StatTile label="Award XP" value={points} />
      </div>

      <section aria-labelledby="earned-achievements">
        <h2
          id="earned-achievements"
          className="font-label text-label text-ink-faint"
        >
          Achievements earned
        </h2>
        <AwardGrid
          items={earnedAchievements}
          empty="None yet."
          kind="achievement"
        />
      </section>

      {lockedAchievements.length > 0 && (
        <section aria-labelledby="locked-achievements">
          <h2
            id="locked-achievements"
            className="font-label text-label text-ink-faint"
          >
            Still to earn
          </h2>
          <LockedList items={lockedAchievements} kind="achievement" />
        </section>
      )}

      <section aria-labelledby="earned-badges">
        <h2 id="earned-badges" className="font-label text-label text-ink-faint">
          Badges earned
        </h2>
        <AwardGrid items={earnedBadges} empty="None yet." kind="badge" />
      </section>

      {lockedBadges.length > 0 && (
        <section aria-labelledby="locked-badges">
          <h2
            id="locked-badges"
            className="font-label text-label text-ink-faint"
          >
            Still to earn
          </h2>
          <LockedList items={lockedBadges} kind="badge" />
        </section>
      )}
    </div>
  );
}
