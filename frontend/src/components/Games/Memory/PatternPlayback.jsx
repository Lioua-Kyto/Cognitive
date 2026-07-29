// CLEAN IMPLEMENTATION (no framer-motion, no extra text inside game content)
import { useState, useEffect, useRef } from "react";
import GameWindow from "../GameWindow.jsx";
import GameLayout from "../Layout/GameLayout.jsx";
import { submitPatternPlayback } from "../../../api/games.jsx";
import { fetchUserGameProgress } from "../../../api/score.jsx";
import "../Styles/games.css";

const COLORS = [
  { name: "Red", hex: "#ef4444" },
  { name: "Blue", hex: "#3b82f6" },
  { name: "Green", hex: "#10b981" },
  { name: "Yellow", hex: "#f59e0b" },
  { name: "Purple", hex: "#8b5cf6" },
  { name: "Orange", hex: "#f97316" },
  { name: "Pink", hex: "#ec4899" },
  { name: "Cyan", hex: "#06b6d4" },
];

const introSlides = [
  {
    title: "Pattern Playback",
    desc: "Watch the sequence, then click the colors in the same order.",
    img: null,
  },
  {
    title: "Tips",
    desc: "Sequences get longer as you progress.",
    img: null,
  },
];

const makePattern = (level) => {
  const len = Math.min(3 + level, 12);
  const avail = COLORS.slice(0, Math.min(4 + Math.floor(level / 2), 8));
  return Array.from(
    { length: len },
    () => avail[Math.floor(Math.random() * avail.length)]
  );
};

function PatternPlaybackGame({
  level,
  onResult,
  handleSuccess,
  handleGameOver,
  handleWrong,
  playWrong,
  playCorrect,
  triggerMinusFive,
  mistakes,
  setMistakes,
}) {
  const [pattern, setPattern] = useState([]);
  const [userPattern, setUserPattern] = useState([]);
  const [phase, setPhase] = useState("show");
  const [step, setStep] = useState(-1);
  const [timer, setTimer] = useState(30);
  const [flash, setFlash] = useState({ success: false, error: false });

  const seqTimer = useRef(null);
  const tTimer = useRef(null);

  useEffect(() => {
    const p = makePattern(level);
    setPattern(p);
    setUserPattern([]);
    setPhase("show");
    setStep(-1);
    setTimer(30);
    setFlash({ success: false, error: false });

    let i = 0;
    const tick = () => {
      if (i < p.length) {
        setStep(i);
        i += 1;
        seqTimer.current = setTimeout(tick, 800);
      } else {
        setTimeout(() => {
          setStep(-1);
          setPhase("input");
        }, 400);
      }
    };
    tick();

    return () => seqTimer.current && clearTimeout(seqTimer.current);
  }, [level]);

  useEffect(() => {
    if (phase !== "input") return;
    if (timer <= 0) {
      handleGameOver && handleGameOver();
      return;
    }
    tTimer.current = setTimeout(() => setTimer((t) => t - 1), 1000);
    return () => tTimer.current && clearTimeout(tTimer.current);
  }, [phase, timer]);

  const clickColor = (c) => {
    if (phase !== "input") return;
    const next = [...userPattern, c];
    setUserPattern(next);
    const idx = next.length - 1;
    if (pattern[idx]?.name !== c.name) {
      setFlash({ success: false, error: true });
      playWrong && playWrong();
      const m = mistakes + 1;
      setMistakes(m);
      if (m >= 3) {
        handleGameOver && handleGameOver();
      } else {
        triggerMinusFive && triggerMinusFive();
        setTimer((t) => Math.max(0, t - 5));
      }
      setTimeout(() => setFlash({ success: false, error: false }), 700);
      return;
    }
    playCorrect && playCorrect();
    if (next.length === pattern.length) {
      setPhase("done");
      setFlash({ success: true, error: false });
      const res = {
        score: Math.max(0, timer + 10),
        time: 30 - timer,
        accuracy: 100,
        mistakes,
      };
      setTimeout(() => {
        handleSuccess && handleSuccess();
        onResult && onResult(res);
      }, 900);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div className="text-dark mb-3 text-center" style={{ flexShrink: 0 }}>
        <div>
          {Math.min(userPattern.length + 1, pattern.length)}/{pattern.length}
        </div>
      </div>
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        {flash.success && (
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%,-50%)",
              background: "#10b981",
              color: "#fff",
              padding: "10px 16px",
              borderRadius: 12,
              fontWeight: 700,
            }}
          >
            Perfect
          </div>
        )}
        {flash.error && (
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%,-50%)",
              background: "#ef4444",
              color: "#fff",
              padding: "10px 16px",
              borderRadius: 12,
              fontWeight: 700,
            }}
          >
            Wrong
          </div>
        )}

        <div style={{ marginBottom: 24 }}>
          <div
            style={{
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
              justifyContent: "center",
            }}
          >
            {pattern.map((c, i) => (
              <div
                key={i}
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 12,
                  background:
                    (phase === "show" && i === step) ||
                    (phase === "input" && i < userPattern.length)
                      ? c.hex
                      : "#f3f4f6",
                  border: "2px solid #d1d5db",
                  transition: "all .2s",
                  transform:
                    phase === "show" && i === step ? "scale(1.08)" : "scale(1)",
                  boxShadow:
                    phase === "show" && i === step
                      ? `0 4px 12px ${c.hex}30`
                      : "none",
                }}
              />
            ))}
          </div>
        </div>

        {phase === "input" && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 12,
              maxWidth: 400,
            }}
          >
            {COLORS.slice(0, Math.min(4 + Math.floor(level / 2), 8)).map(
              (c) => (
                <button
                  key={c.name}
                  onClick={() => clickColor(c)}
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: 16,
                    background: c.hex,
                    border: "3px solid #fff",
                    color: "#fff",
                    fontWeight: 700,
                    boxShadow: "0 4px 8px rgba(0,0,0,.1)",
                  }}
                >
                  {c.name}
                </button>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function PatternPlayback({ token }) {
  return (
    <GameWindow>
      <GameLayout
        introSlides={introSlides}
        helpText="Watch the sequence, then click the colors in the same order."
        gameName="Pattern Playback"
        fetchUserGameProgress={fetchUserGameProgress}
        submitGameScore={submitPatternPlayback}
        initialLevel={1}
        maxLevel={10}
        onGameStart={(level, { resetProgress }) => resetProgress(level)}
        onGameRestart={() => window.location.reload()}
        onGameQuit={() => window.location.assign("/games/memory")}
        token={token}
      >
        {(game) => (
          <PatternPlaybackGame
            level={game.level}
            onResult={game.onResult}
            handleSuccess={game.handleSuccess}
            handleGameOver={game.handleGameOver}
            handleWrong={game.handleWrong}
            playWrong={game.playWrong}
            playCorrect={game.playCorrect}
            triggerMinusFive={game.triggerMinusFive}
            mistakes={game.mistakes}
            setMistakes={game.setMistakes}
          />
        )}
      </GameLayout>
    </GameWindow>
  );
}
