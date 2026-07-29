import { useState, useEffect, useRef } from "react";
import GameWindow from "../GameWindow.jsx";
import GameLayout from "../Layout/GameLayout.jsx";
import { submitPatternPlayback } from "../../../api/games.jsx";
import { fetchUserGameProgress } from "../../../api/score.jsx";
import "../Styles/games.css";

// Color patterns for the game
const colors = [
  { name: "Red", hex: "#ef4444", light: "#fecaca" },
  { name: "Blue", hex: "#3b82f6", light: "#bfdbfe" },
  { name: "Green", hex: "#10b981", light: "#a7f3d0" },
  { name: "Yellow", hex: "#f59e0b", light: "#fde68a" },
  { name: "Purple", hex: "#8b5cf6", light: "#c4b5fd" },
  { name: "Orange", hex: "#f97316", light: "#fed7aa" },
  { name: "Pink", hex: "#ec4899", light: "#fbcfe8" },
  { name: "Cyan", hex: "#06b6d4", light: "#a5f3fc" },
];

// Generate a random pattern based on level
const generatePattern = (level) => {
  const length = Math.min(3 + level, 12); // 4-12 steps
  const availableColors = colors.slice(0, Math.min(4 + Math.floor(level / 2), 8));
  const pattern = [];

  for (let i = 0; i < length; i++) {
    const randomColor = availableColors[Math.floor(Math.random() * availableColors.length)];
    pattern.push(randomColor);
  }

  return pattern;
};

// Game intro slides
const introSlides = [
  {
    title: "Pattern Playback",
    desc: "Watch carefully as a sequence of colors is shown, then recreate the exact pattern by clicking the colors in the correct order.",
    img: null,
  },
  {
    title: "How to Play",
    desc: "1. Watch the pattern demonstration\n2. Wait for the input phase\n3. Click colors in the exact same order\n4. Complete the pattern to advance!",
    img: null,
  },
  {
    title: "Get Ready!",
    desc: "The patterns get longer and more complex as you progress. Stay focused and trust your memory!",
    img: null,
  },
];

// Main game component
function PatternPlaybackGame({
  level,
  onResult,
  handleSuccess,
  handleGameOver,
  handleGameComplete,
  handleWrong,
  playWrong,
  playCorrect,
  triggerMinusFive,
  mistakes,
  setMistakes,
}) {
  const [pattern, setPattern] = useState([]);
  const [userPattern, setUserPattern] = useState([]);
  const [gamePhase, setGamePhase] = useState("showing"); // "showing", "input", "complete"
  const [currentStep, setCurrentStep] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [result, setResult] = useState(null);
  const [timer, setTimer] = useState(30);

  const stepTimer = useRef(null);
  const gameTimer = useRef(null);

  // Initialize game
  useEffect(() => {
    const newPattern = generatePattern(level);
    setPattern(newPattern);
    setUserPattern([]);
    setGamePhase("showing");
    setCurrentStep(0);
    setShowSuccess(false);
    setShowError(false);
    setResult(null);
    setTimer(30);

    // Start showing pattern
    showPatternSequence(newPattern);
  }, [level]);

  // Game timer
  useEffect(() => {
    if (gamePhase === "input" && timer > 0) {
      gameTimer.current = setTimeout(() => {
        setTimer(t => t - 1);
      }, 1000);
    } else if (timer === 0 && gamePhase === "input") {
      handleTimeUp();
    }

    return () => {
      if (gameTimer.current) clearTimeout(gameTimer.current);
    };
  }, [timer, gamePhase]);

  const showPatternSequence = (pattern) => {
    let step = 0;
    const showStep = () => {
      if (step < pattern.length) {
        setCurrentStep(step);
        step++;
        stepTimer.current = setTimeout(showStep, 800);
      } else {
        // Pattern showing complete, switch to input phase
        setTimeout(() => {
          setGamePhase("input");
          setCurrentStep(-1);
        }, 500);
      }
    };
    showStep();
  };

  const handleColorClick = (color) => {
    if (gamePhase !== "input") return;

    const newUserPattern = [...userPattern, color];
    setUserPattern(newUserPattern);

    // Check if this step is correct
    const currentIndex = newUserPattern.length - 1;
    if (pattern[currentIndex]?.name !== color.name) {
      // Wrong color
      setShowError(true);
      setTimeout(() => setShowError(false), 1000);
      playWrong();
      
      const newMistakes = mistakes + 1;
      setMistakes(newMistakes);
      
      if (newMistakes >= 3) {
        handleGameOver();
      } else {
        triggerMinusFive();
        setTimer(Math.max(0, timer - 5));
      }
      return;
    }

    // Correct color
    playCorrect();

    // Check if pattern is complete
    if (newUserPattern.length === pattern.length) {
      // Pattern completed successfully
      setShowSuccess(true);
      setGamePhase("complete");
      
      const finalResult = {
        score: Math.max(0, timer + 10),
        time: 30 - timer,
        accuracy: 100,
        mistakes: mistakes,
      };
      
      setTimeout(() => {
        setResult(finalResult);
        handleSuccess();
        onResult(finalResult);
      }, 1500);
    }
  };

  const handleTimeUp = () => {
    handleGameOver();
  };

  // Cleanup timers
  useEffect(() => {
    return () => {
      if (stepTimer.current) clearTimeout(stepTimer.current);
      if (gameTimer.current) clearTimeout(gameTimer.current);
    };
  }, []);

  return (
    <div
      className="pattern-playback-container"
      style={{ display: "flex", flexDirection: "column", height: "100%" }}
    >
      {!result && (
        <>
          {/* Game Stats */}
          <div
            className="game-stats text-dark mb-4 text-center"
            style={{ flexShrink: 0 }}
          >
            <div className="mb-2">
              Pattern Length: {pattern.length} | Step:{" "}
              <span key={userPattern.length}>
                {Math.min(userPattern.length + 1, pattern.length)}
              </span>
              /{pattern.length}
            </div>
          </div>

          {/* Game Phase Indicator */}
          <div
            className="phase-indicator text-dark text-center mb-4"
            style={{ flexShrink: 0 }}
          >
            {gamePhase === "showing" && (
              <div key="showing">
                <h4>🎯 Watch the Pattern</h4>
                <div style={{ fontSize: "0.9rem", opacity: 0.8 }}>
                  Memorize the sequence of colors
                </div>
              </div>
            )}
            {gamePhase === "input" && (
              <div key="input">
                <h4>🎮 Recreate the Pattern</h4>
                <div style={{ fontSize: "0.9rem", opacity: 0.8 }}>
                  Click the colors in the correct order
                </div>
              </div>
            )}
          </div>

          {/* Main game content */}
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {/* Success/Error Overlay */}
            {showSuccess && (
              <div
                className="success-overlay"
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  zIndex: 1000,
                  background: "linear-gradient(135deg, #10b981, #059669)",
                  color: "white",
                  padding: "1rem 2rem",
                  borderRadius: "1rem",
                  boxShadow: "0 10px 30px rgba(16, 185, 129, 0.3)",
                  fontWeight: "bold",
                  fontSize: "1.2rem",
                  textAlign: "center",
                }}
              >
                <div>✅ Perfect!</div>
              </div>
            )}
            {showError && (
              <div
                className="error-overlay"
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  zIndex: 1000,
                  background: "linear-gradient(135deg, #ef4444, #dc2626)",
                  color: "white",
                  padding: "1rem 2rem",
                  borderRadius: "1rem",
                  boxShadow: "0 10px 30px rgba(239, 68, 68, 0.3)",
                  fontWeight: "bold",
                  fontSize: "1.2rem",
                  textAlign: "center",
                }}
              >
                <div>❌ Wrong Color!</div>
              </div>
            )}

            {/* Pattern Display */}
            <div style={{ marginBottom: "2rem" }}>
              <div
                style={{
                  display: "flex",
                  gap: "0.5rem",
                  flexWrap: "wrap",
                  justifyContent: "center",
                  marginBottom: "1rem",
                }}
              >
                {pattern.map((color, index) => (
                  <div
                    key={index}
                    style={{
                      width: "60px",
                      height: "60px",
                      borderRadius: "12px",
                      backgroundColor: 
                        gamePhase === "showing" && index === currentStep
                          ? color.hex
                          : gamePhase === "input" && index < userPattern.length
                          ? color.hex
                          : "#f3f4f6",
                      border: "2px solid #d1d5db",
                      transition: "all 0.2s ease",
                      transform: 
                        gamePhase === "showing" && index === currentStep
                          ? "scale(1.1)"
                          : "scale(1)",
                      boxShadow: 
                        gamePhase === "showing" && index === currentStep
                          ? `0 4px 12px ${color.hex}30`
                          : "none",
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Color Palette */}
            {gamePhase === "input" && (
              <div style={{ textAlign: "center" }}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(4, 1fr)",
                    gap: "1rem",
                    maxWidth: "400px",
                    margin: "0 auto",
                  }}
                >
                  {colors.slice(0, Math.min(4 + Math.floor(level / 2), 8)).map((color) => (
                    <button
                      key={color.name}
                      onClick={() => handleColorClick(color)}
                      style={{
                        width: "80px",
                        height: "80px",
                        borderRadius: "16px",
                        backgroundColor: color.hex,
                        border: "3px solid white",
                        boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "white",
                        fontWeight: "bold",
                        textShadow: "1px 1px 2px rgba(0,0,0,0.5)",
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.transform = "scale(1.05)";
                        e.target.style.boxShadow = `0 6px 16px ${color.hex}40`;
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.transform = "scale(1)";
                        e.target.style.boxShadow = "0 4px 8px rgba(0,0,0,0.1)";
                      }}
                    >
                      {color.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default function PatternPlayback({ token }) {
  return (
    <GameWindow>
      <GameLayout
        introSlides={introSlides}
        helpText="Watch the color pattern, then recreate it by clicking the colors in the exact same order. The patterns get longer as you advance!"
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
            handleGameComplete={game.handleGameComplete}
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
