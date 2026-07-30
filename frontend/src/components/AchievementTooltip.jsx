import { API_BASE } from "../api/config.js";
import React, { useContext } from "react";
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

const AchievementTooltip = ({ children, achievement, badge, isVisible }) => {
  const { token } = useContext(AuthContext);

  // Fetches once per achievement and is served from cache on every subsequent
  // hover; the effect version refetched on each one.
  const query = useQuery({
    queryKey: achievement
      ? queryKeys.achievementStats(achievement.id)
      : queryKeys.badgeStats(badge?.id),
    queryFn: () =>
      achievement
        ? fetchStats("achievements", achievement.id, token)
        : fetchStats("badges", badge.id, token),
    enabled: Boolean(isVisible && token && (achievement || badge)),
    staleTime: 5 * 60_000,
  });

  const stats = query.data ?? null;
  const loading = query.isFetching;
  const error = query.error?.message ?? null;

  const getRarityColor = (rarity) => {
    switch (rarity) {
      case "Common":
        return "#6b7280";
      case "Uncommon":
        return "#059669";
      case "Rare":
        return "#2563eb";
      case "Epic":
        return "#7c3aed";
      case "Legendary":
        return "#dc2626";
      default:
        return "#6b7280";
    }
  };

  const getProgressPercentage = () => {
    if (!stats) return 0;

    if (achievement) {
      const current = stats.current_progress || 0;
      const required = achievement.requirement_value || 1;
      return Math.min((current / required) * 100, 100);
    }

    return stats.user_has_badge ? 100 : 0;
  };

  if (!isVisible) return children;

  return (
    <div className="tooltip-container">
      {children}
      <div className="achievement-tooltip">
        {loading && (
          <div className="tooltip-loading">
            <div className="loading-spinner"></div>
            <span>Loading stats...</span>
          </div>
        )}

        {error && (
          <div className="tooltip-error">
            <span>Failed to load stats</span>
          </div>
        )}

        {stats && !loading && !error && (
          <div className="tooltip-content">
            <div className="tooltip-header">
              <h4>{achievement ? achievement.name : badge.name}</h4>
              <span
                className="rarity-badge"
                style={{
                  backgroundColor: getRarityColor(
                    achievement ? achievement.type : badge.rank
                  ),
                }}
              >
                {achievement ? achievement.type : badge.rank}
              </span>
            </div>

            <p className="tooltip-description">
              {achievement ? achievement.description : badge.description}
            </p>

            {achievement && (
              <div className="progress-section">
                <div className="progress-info">
                  <span>
                    Progress: {stats.current_progress || 0} /{" "}
                    {achievement.requirement_value}
                  </span>
                  <span>{getProgressPercentage().toFixed(1)}%</span>
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${getProgressPercentage()}%` }}
                  ></div>
                </div>
                {achievement.points && (
                  <div className="points-info">
                    <span className="points">+{achievement.points} XP</span>
                  </div>
                )}
              </div>
            )}

            <div className="ownership-divider"></div>
            <div className="ownership-text">
              {stats.percentage}% of players unlocked this{" "}
              {achievement ? "achievement" : "badge"}
            </div>

            {(stats.user_has_achievement || stats.user_has_badge) && (
              <div className="earned-status">
                <span className="earned-indicator">✓</span>
                <span>Earned</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AchievementTooltip;
