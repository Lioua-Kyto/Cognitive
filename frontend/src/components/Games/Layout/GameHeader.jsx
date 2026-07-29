import React, { useEffect, useRef, useState } from "react";

import "./Styles/GameHeader.css";

export default function GameHeader({
  level,
  levelProgress = 0,
  getLevelBarColor = () => "#6366f1",
  timer,
  timerBoxClass = "gameheader-timer-box",
  showMinusFive = false,
  score,
  bestScore,
  streak = 0,
  streakBroken = false,
  lastStreak = 0,
  fullscreen = false,
  onFullscreen = () => {},
  onHelp = () => {},
  onPause = () => {},
  onResume = () => {},
  paused = false,
  timerShake = false, // <-- pass this prop from GameLayout
}) {
  const [showBreak, setShowBreak] = useState(false);
  const streakRef = useRef();

  useEffect(() => {
    if (streakBroken) {
      setShowBreak(true);
      const t = setTimeout(() => setShowBreak(false), 700);
      return () => clearTimeout(t);
    }
  }, [streakBroken]);

  // For fullscreen, add a class to the header
  const headerClass =
    "gameheader d-flex align-items-center justify-content-between mb-3" +
    (fullscreen ? " fullscreen" : "");

  // Fix streak width to match timer box
  const timerBoxWidth = 110; // px, adjust to match your timer box min-width

  return (
    <div className={headerClass}>
      {/* Left: Help & Pause */}
      <div className="d-flex align-items-center gap-2">
        <button className="btn btn-outline-silver" onClick={onHelp}>
          <span role="img" aria-label="help">
            ❓
          </span>
        </button>
        {paused ? (
          <button className="btn btn-outline-silver" onClick={onResume}>
            <span role="img" aria-label="resume">
              ▶️
            </span>
          </button>
        ) : (
          <button className="btn btn-outline-silver" onClick={onPause}>
            <span role="img" aria-label="pause">
              ⏸️
            </span>
          </button>
        )}
      </div>
      {/* Center: Level, Timer, Score, Best */}
  <div className="d-flex align-items-center justify-content-center gap-4 flex-grow-1 gameheader-center">
        <div className="d-flex align-items-center gap-2">
          <span className="gameheader-level-icon">🧩</span>
          <span className="gameheader-level-number">{level}</span>
          <div className="level-bar-bg ms-2">
            <div
              className="level-bar-fill"
              style={{
                width: `${levelProgress * 100}%`,
                background: getLevelBarColor(level),
              }}
            />
          </div>
        </div>
        <div
          className="timer-streak-container"
          style={{ position: "relative", minWidth: timerBoxWidth }}
        >
          <div
            className={timerBoxClass + (timerShake ? " timer-shake" : "")}
            style={{
              position: "relative",
              zIndex: 2,
              minWidth: timerBoxWidth,
              transition: "box-shadow 0.2s",
            }}
          >
            <span className="gameheader-timer-label">Time</span>
            <span className="gameheader-timer-value">
              {Math.floor(timer / 60)}:{String(timer % 60).padStart(2, "0")}
            </span>
            <span
              className={`minus-five-indicator${showMinusFive ? " show" : ""}`}
            >
              -5
            </span>
          </div>
          {/* --- Streak Indicator Under Timer --- */}
          {(streak >= 3 || streakBroken) && (
            <div
              className={`streak-under-timer${
                showBreak ? " streak-break" : ""
              }${streakBroken ? " streak-broken-bg" : ""}`}
              key={streakBroken ? lastStreak : streak}
              style={{
                width: timerBoxWidth,
                minWidth: timerBoxWidth,
                maxWidth: timerBoxWidth,
              }}
              ref={streakRef}
            >
              <span className="streak-u-bg" />
              <span className="streak-u-text">
                🔥 x{streakBroken ? lastStreak : streak}!
              </span>
            </div>
          )}
        </div>
        <div className="d-flex align-items-center gap-1 gameheader-score-wrap">
          <span className="gameheader-score-icon">⭐</span>
          <span className="gameheader-score-number">{score}</span>
        </div>
        <div className="d-flex align-items-center gap-1">
          <span className="gameheader-best-icon">🏆</span>
          <span className="gameheader-best-number">{bestScore}</span>
        </div>
      </div>
      {/* Right: Fullscreen */}
      <div>
        <button
          className="btn btn-outline-silver"
          onClick={() => {
            const el = document.querySelector(".game-container");
            if (el) {
              if (document.fullscreenElement) {
                document.exitFullscreen();
              } else {
                el.requestFullscreen();
              }
            }
            onFullscreen();
          }}
        >
          <span role="img" aria-label="fullscreen" style={{ color: "#bfc8d8" }}>
            ⛶
          </span>
        </button>
      </div>
    </div>
  );
}
