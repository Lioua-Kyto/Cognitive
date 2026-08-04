import { API_BASE } from "../api/config.js";
import { useContext, useId, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AuthContext } from "../context/AuthContext";
import { queryKeys } from "../queries/keys.js";

async function fetchStats(kind, id, token) {
  const res = await fetch(`${API_BASE}/users/${kind}/${id}/stats/`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) throw new Error(`Failed to fetch stats: ${res.status}`);
  return res.json();
}

/**
 * Stats tooltip for an achievement or badge.
 *
 * Open state lives here rather than in a CSS `:hover` rule. It used to be CSS
 * only, while `isVisible` — which every caller passes as a constant `true` —
 * gated the query, so a profile with forty achievements fired forty stats
 * requests on mount for tooltips nobody had pointed at. Now the query is enabled
 * by the pointer, and focus opens it too.
 */
const AchievementTooltip = ({ children, achievement, badge, isVisible }) => {
  const { token } = useContext(AuthContext);
  const [open, setOpen] = useState(false);
  const tooltipId = useId();

  const query = useQuery({
    queryKey: achievement
      ? queryKeys.achievementStats(achievement.id)
      : queryKeys.badgeStats(badge?.id),
    queryFn: () =>
      achievement
        ? fetchStats("achievements", achievement.id, token)
        : fetchStats("badges", badge.id, token),
    enabled: Boolean(open && token && (achievement || badge)),
    staleTime: 5 * 60_000,
  });

  const stats = query.data ?? null;
  const loading = query.isFetching;
  const error = query.error;

  const item = achievement ?? badge;
  const rank = achievement ? achievement.type : badge?.rank;

  const progress = (() => {
    if (!stats) return 0;
    if (!achievement) return stats.user_has_badge ? 100 : 0;
    const current = stats.current_progress || 0;
    const required = achievement.requirement_value || 1;
    return Math.min((current / required) * 100, 100);
  })();

  if (!isVisible) return children;

  return (
    <div
      className="relative inline-block"
      // onFocus/onBlur bubble in React, so this covers the descendant that
      // actually takes focus once the card is a real control.
      onPointerEnter={() => setOpen(true)}
      onPointerLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
      aria-describedby={open ? tooltipId : undefined}
    >
      {children}

      {open && (
        <div
          id={tooltipId}
          role="tooltip"
          className="animate-enter-up absolute top-full left-1/2 mt-2 w-[19rem] max-w-[80vw] -translate-x-1/2 rounded-room border border-rule bg-surface-raised p-4 shadow-2xl"
          style={{ zIndex: "var(--z-overlay)" }}
        >
          {loading && (
            <p className="text-body-s text-ink-muted">Loading stats…</p>
          )}

          {error && (
            <p className="text-body-s text-negative">Failed to load stats</p>
          )}

          {stats && !loading && !error && (
            <>
              <div className="flex items-start justify-between gap-3">
                <h4 className="text-body font-semibold text-lit">
                  {item.name}
                </h4>
                {rank && (
                  // Rank was a five-colour rarity scale of raw hex. Colour is
                  // reserved for the beam, so rank is drawn as an annotation.
                  <span className="font-label shrink-0 rounded-hair border border-rule-strong px-1.5 py-0.5 text-label text-ink-muted">
                    {rank}
                  </span>
                )}
              </div>

              <p className="mt-2 text-body-s text-ink-muted">
                {item.description}
              </p>

              {achievement && (
                <div className="mt-4">
                  <div className="flex items-baseline justify-between gap-3 text-body-s text-ink-faint">
                    <span data-figure>
                      {stats.current_progress || 0} /{" "}
                      {achievement.requirement_value}
                    </span>
                    <span data-figure>{progress.toFixed(0)}%</span>
                  </div>
                  <div
                    className="mt-1.5 h-1 overflow-hidden rounded-hair bg-rule"
                    role="progressbar"
                    aria-valuenow={Math.round(progress)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${item.name} progress`}
                  >
                    <div
                      className="h-full bg-beam transition-[width] duration-warm ease-beam"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  {achievement.points != null && (
                    <p data-figure className="mt-2 text-body-s text-beam">
                      +{achievement.points} XP
                    </p>
                  )}
                </div>
              )}

              <p className="mt-4 border-t border-rule pt-3 text-body-s text-ink-faint">
                <span data-figure>{stats.percentage}%</span> of players unlocked
                this {achievement ? "achievement" : "badge"}
              </p>

              {(stats.user_has_achievement || stats.user_has_badge) && (
                <p className="font-label mt-2 text-label text-beam">Earned</p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default AchievementTooltip;
