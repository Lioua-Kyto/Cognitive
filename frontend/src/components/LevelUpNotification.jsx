import React, { useEffect } from "react";
import { useLevelUp } from "../context/LevelUpContext";
import "./LevelUpNotification.css";

const LevelUpNotification = () => {
  const { levelUpData, clearLevelUp } = useLevelUp();

  useEffect(() => {
    // Removed auto-dismiss - notification now stays until user clicks continue
  }, [levelUpData, clearLevelUp]);

  if (!levelUpData) return null;

  return (
    <div className="level-up-overlay">
      <div className="level-up-notification">
        {/* Animated background elements */}
        <div className="celebration-particles">
          {Array.from({ length: 40 }).map((_, i) => (
            <div
              key={i}
              className="particle"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${3 + Math.random() * 2}s`,
              }}
            />
          ))}
        </div>

        {/* Main content */}
        <div className="level-up-content">
          <div className="level-up-icon">
            <div className="level-badge">
              <span className="notification-level-number">
                {levelUpData.newLevel}
              </span>
            </div>
            <div className="level-up-glow"></div>
          </div>

          <div className="level-up-text">
            <h1 className="level-up-title">LEVEL UP!</h1>
            <p className="level-up-subtitle">
              Level {levelUpData.oldLevel} → {levelUpData.newLevel}
            </p>

            <div className="level-up-ranking">
              <p className="ranking-text">
                🏆 You're now in the top{" "}
                <strong>
                  {Math.max(
                    1,
                    Math.round(100 - (levelUpData.newLevel || 1) * 8)
                  )}
                  %
                </strong>{" "}
                of all players!
              </p>
            </div>
          </div>

          <button className="level-up-close" onClick={clearLevelUp}>
            Continue
          </button>
        </div>
      </div>
    </div>
  );
};

export default LevelUpNotification;
