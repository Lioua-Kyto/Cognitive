import { useState, useEffect } from "react";
import "./Styles/GameResultPopup.css";

function Confetti({ show, duration = 1800 }) {
  const [visible, setVisible] = useState(show);

  useEffect(() => {
    if (show) {
      setVisible(true);
      const timeout = setTimeout(() => setVisible(false), duration);
      return () => clearTimeout(timeout);
    } else {
      setVisible(false);
    }
  }, [show, duration]);

  if (!visible) return null;

  const pieces = Array.from({ length: 28 }).map((_, i) => {
    const left = Math.random() * 90 + 5;
    const delay = Math.random() * 0.7;
    const rotate = Math.random() * 360;
    const scale = Math.random() * 0.7 + 0.7;
    const colors = [
      "#fde047",
      "#facc15",
      "#fbbf24",
      "#fef08a",
      "#fcd34d",
      "#fef9c3",
    ];
    const color = colors[Math.floor(Math.random() * colors.length)];
    return (
      <div
        key={i}
        className="confetti-piece"
        style={{
          left: `${left}%`,
          animationDelay: `${delay}s`,
          background: color,
          transform: `rotate(${rotate}deg) scale(${scale})`,
          animationDuration: `${duration / 1000}s`,
        }}
      />
    );
  });

  return <div className="confetti-container">{pieces}</div>;
}

export default function GameResultPopup({
  result,
  showConfetti = false,
  onRestart = () => {},
  fullscreen = false,
}) {
  if (!result) return null;

  const isVictory = result.isVictory;
  const isNewBest = result.newBest;

  return (
    <div
      className={`game-result-popup ${isVictory ? "victory-popup" : ""} ${
        isNewBest ? "new-best-popup" : ""
      }`}
    >
      {/* Confetti for new best */}
      {isNewBest && showConfetti && <Confetti show={true} duration={2000} />}

      {/* Result Icon */}
      <div className="result-icon-container">
        {isNewBest ? (
          <div className="trophy-icon">
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 2L15.09 8.26L22 9L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9L8.91 8.26L12 2Z"
                fill="currentColor"
              />
            </svg>
          </div>
        ) : isVictory ? (
          <div className="success-icon">
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM10 17l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
                fill="currentColor"
              />
            </svg>
          </div>
        ) : (
          <div className="timeout-icon">
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.31-8.86c-.1-.42-.4-.78-.78-1.05-.44-.31-.95-.49-1.53-.49-.58 0-1.09.18-1.53.49-.38.27-.68.63-.78 1.05-.1.42-.1.84 0 1.26.1.42.4.78.78 1.05.44.31.95.49 1.53.49.58 0 1.09-.18 1.53-.49.38-.27.68-.63.78-1.05.1-.42.1-.84 0-1.26z"
                fill="currentColor"
              />
            </svg>
          </div>
        )}
      </div>

      {/* Main Message */}
      <div className={`result-title ${isNewBest ? "new-best-title" : ""}`}>
        {isNewBest ? (
          <>
            <span className="crown">👑</span>
            New Best Score!
            <span className="crown">👑</span>
          </>
        ) : (
          result.message
        )}
      </div>

      {/* Stats Section */}
      <div className="stats-container">
        {/* Primary Stats Row */}
        <div className="primary-stats-row">
          {/* Score Comparison */}
          <div className="stat-card score-card">
            <div className="stat-icon">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 2L15.09 8.26L22 9L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9L8.91 8.26L12 2Z"
                  fill="currentColor"
                />
              </svg>
            </div>
            <div className="stat-content">
              <div className="stat-label">SCORE</div>
              <div className="stat-comparison">
                <div className="current-value">{result.score}</div>
                <div className="best-value">Best: {result.best}</div>
              </div>
            </div>
          </div>

          {/* Level Comparison */}
          <div className="stat-card level-card">
            <div className="stat-icon">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M7 14L12 9L17 14H7Z" fill="currentColor" />
              </svg>
            </div>
            <div className="stat-content">
              <div className="stat-label">LEVEL</div>
              <div className="stat-comparison">
                <div className="current-value">
                  {result.level_reached || result.level || 1}
                </div>
                <div className="best-value">
                  Best: {result.bestLevel || result.best_level || 1}
                </div>
              </div>
            </div>
          </div>

          {/* Streak Comparison */}
          <div className="stat-card streak-card">
            <div className="stat-icon">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M13.5 9.5C13.5 8.12 12.38 7 11 7S8.5 8.12 8.5 9.5 9.62 12 11 12 13.5 10.88 13.5 9.5ZM20 10V8L18.5 7.5C18.33 6.97 18.08 6.47 17.77 6.02L18.5 4.5L17 3L15.48 3.73C15.03 3.42 14.53 3.17 14 3V1H12V3C11.47 3.17 10.97 3.42 10.52 3.73L9 3L7.5 4.5L8.23 6.02C7.92 6.47 7.67 6.97 7.5 7.5L6 8V10L7.5 10.5C7.67 11.03 7.92 11.53 8.23 11.98L7.5 13.5L9 15L10.52 14.27C10.97 14.58 11.47 14.83 12 15V17H14V15C14.53 14.83 15.03 14.58 15.48 14.27L17 15L18.5 13.5L17.77 11.98C18.08 11.53 18.33 11.03 18.5 10.5L20 10Z"
                  fill="currentColor"
                />
              </svg>
            </div>
            <div className="stat-content">
              <div className="stat-label">STREAK</div>
              <div className="stat-comparison">
                <div className="current-value">
                  {result.streaks || result.streak || 0}
                </div>
                <div className="best-value">
                  Best: {result.bestStreak || result.best_streak || 0}
                </div>
              </div>
            </div>
          </div>

          {/* XP Earned Stat */}
          <div className="stat-card xp-card">
            <div className="stat-icon">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 7.5L13.5 6.5C13.1 6.1 12.6 6 12 6S10.9 6.1 10.5 6.5L9 7.5L3 7V9L9 8.5V19H11V13H13V19H15V8.5L21 9Z"
                  fill="currentColor"
                />
              </svg>
            </div>
            <div className="stat-content">
              <div className="stat-label">XP EARNED</div>
              <div className="stat-comparison">
                <div className="current-value">+{result.xp_earned || 0}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Button */}
      <div className="result-actions">
        <button className="btn-play-again" onClick={onRestart}>
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M8 5V19L19 12L8 5Z" fill="currentColor" />
          </svg>
          <span>Play Again</span>
        </button>
      </div>
    </div>
  );
}
