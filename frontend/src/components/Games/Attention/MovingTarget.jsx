import { useState, useEffect, useRef } from "react";
import GameWindow from "../GameWindow.jsx";
import GameLayout from "../Layout/GameLayout.jsx";
import { submitMovingTarget } from "../../../api/games.jsx";
import { fetchUserGameProgress } from "../../../api/score.jsx";
import "../Styles/games.css";

// Target types
const TARGET_TYPES = {
  CIRCLE: { symbol: "🔵", color: "#4ECDC4", size: 40 },
  SQUARE: { symbol: "🟦", color: "#45B7D1", size: 40 },
  TRIANGLE: { symbol: "🔺", color: "#FF6B6B", size: 40 },
  STAR: { symbol: "⭐", color: "#FFEAA7", size: 40 },
  DIAMOND: { symbol: "💎", color: "#96CEB4", size: 40 },
  HEART: { symbol: "❤️", color: "#FF8C94", size: 40 },
};

function generateTargets(level) {
  const targetCount = Math.min(3 + level, 8); // 4-8 targets
  const targets = [];
  const types = Object.keys(TARGET_TYPES);

  for (let i = 0; i < targetCount; i++) {
    const type = types[Math.floor(Math.random() * types.length)];
    const speed = Math.min(1 + level * 0.2, 3); // Speed increases with level

    targets.push({
      id: i,
      type,
      x: Math.random() * 400 + 100, // Random starting position
      y: Math.random() * 300 + 100,
      vx: (Math.random() - 0.5) * speed * 2, // Random velocity
      vy: (Math.random() - 0.5) * speed * 2,
      isClicked: false,
      clickTime: null,
    });
  }

  return targets;
}

const introSlides = [
  {
    title: "Why Moving Target?",
    desc: "This game improves your dynamic visual tracking and hand-eye coordination. It trains your ability to follow and interact with moving objects.",
    img: "/images/brain-idea.svg",
  },
  {
    title: "Benefits",
    desc: "• Enhances visual tracking\n• Improves hand-eye coordination\n• Develops dynamic attention\n• Strengthens reaction time",
    img: "/images/brain-benefit.svg",
  },
  {
    title: "How to Play",
    desc: "Click on all the moving targets before time runs out! Targets bounce around the screen, so you need to track them carefully and click quickly.",
    img: "/images/brain-tutorial.svg",
  },
];

function MovingTargetGame({
  level,
  xp,
  xpToNextLevel,
  timer,
  setTimer,
  result,
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
  const [targets, setTargets] = useState([]);
  const [userSelections, setUserSelections] = useState([]);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameArea, setGameArea] = useState({ width: 600, height: 400 });
  const animationRef = useRef();
  const gameStartedRef = useRef(false);

  // Initialize new game when level changes
  useEffect(() => {
    const newTargets = generateTargets(level);
    setTargets(newTargets);
    setUserSelections([]);
    setGameStarted(false);
    gameStartedRef.current = false;
  }, [level]);

  // Start game after brief delay
  useEffect(() => {
    if (targets.length > 0 && !gameStarted) {
      const startTimer = setTimeout(() => {
        setGameStarted(true);
        gameStartedRef.current = true;
        startAnimation();
      }, 2000);

      return () => clearTimeout(startTimer);
    }
  }, [targets, gameStarted]);

  const startAnimation = () => {
    const animate = () => {
      setTargets((prevTargets) => {
        return prevTargets.map((target) => {
          if (target.isClicked) return target;

          let newX = target.x + target.vx;
          let newY = target.y + target.vy;
          let newVx = target.vx;
          let newVy = target.vy;

          // Bounce off walls
          if (
            newX <= 0 ||
            newX >= gameArea.width - TARGET_TYPES[target.type].size
          ) {
            newVx = -newVx;
            newX =
              newX <= 0 ? 0 : gameArea.width - TARGET_TYPES[target.type].size;
          }
          if (
            newY <= 0 ||
            newY >= gameArea.height - TARGET_TYPES[target.type].size
          ) {
            newVy = -newVy;
            newY =
              newY <= 0 ? 0 : gameArea.height - TARGET_TYPES[target.type].size;
          }

          return {
            ...target,
            x: newX,
            y: newY,
            vx: newVx,
            vy: newVy,
          };
        });
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
  };

  // Stop animation when game ends
  useEffect(() => {
    if (result) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    }
  }, [result]);

  const handleTargetClick = (targetId) => {
    if (!gameStarted || result) return;

    const target = targets.find((t) => t.id === targetId);
    if (!target || target.isClicked) return;

    if (playCorrect) playCorrect();

    setTargets((prevTargets) =>
      prevTargets.map((t) =>
        t.id === targetId ? { ...t, isClicked: true, clickTime: Date.now() } : t
      )
    );

    setUserSelections((prev) => [...prev, target.type]);

    handleSuccess({
      timeLeft: timer,
      timer: 90,
      isCorrect: true,
    });

    // Check if all targets clicked
    const updatedTargets = targets.map((t) =>
      t.id === targetId ? { ...t, isClicked: true } : t
    );

    if (updatedTargets.every((t) => t.isClicked)) {
      setTimeout(() => {
        if (handleGameComplete) {
          handleGameComplete({
            targets: targets.map((t) => t.type),
            user_selection: userSelections.concat(target.type),
            message: "All targets hit!",
          });
        }
      }, 500);
    }
  };

  const handleMissClick = (event) => {
    // Only count as miss if clicking empty space
    if (event.target.classList.contains("game-area") && gameStarted) {
      if (playWrong) playWrong();
      if (handleWrong) handleWrong();
      if (setMistakes) setMistakes((prev) => prev + 1);

      // Small penalty for missing
      setTimer((prev) => Math.max(0, prev - 1));
    }
  };

  // Handle game over when timer runs out
  useEffect(() => {
    if (timer === 0 && !result && gameStartedRef.current) {
      handleGameOver({
        targets: targets.map((t) => t.type),
        user_selection: userSelections,
        message: "Time's up!",
      });
    }
  }, [timer, result, handleGameOver, targets, userSelections]);

  const clickedCount = targets.filter((t) => t.isClicked).length;
  const accuracy =
    targets.length > 0 ? (clickedCount / targets.length) * 100 : 0;

  return (
    <div className="moving-target-container">
      {!result && (
        <div className="flex-grow-1 w-100 d-flex flex-column align-items-center justify-content-center">
          {/* Game Stats */}
          <div className="game-stats text-white mb-3 text-center">
            <div className="mb-2">
              Level: {level} | Targets Hit: {clickedCount}/{targets.length} |
              Accuracy: {Math.round(accuracy)}%
            </div>
            <div className="mb-2">
              XP: {xp} / {xpToNextLevel} |{" "}
              {gameStarted ? "Game Active" : "Get Ready!"}
            </div>
          </div>

          {/* Game Area */}
          <div
            className="game-area"
            style={{
              width: `${gameArea.width}px`,
              height: `${gameArea.height}px`,
              backgroundColor: "#1a1a1a",
              border: "3px solid #4a4a4a",
              borderRadius: "10px",
              position: "relative",
              overflow: "hidden",
              cursor: "crosshair",
              marginBottom: "2rem",
            }}
            onClick={handleMissClick}
          >
            {targets.map((target) => (
              <div
                key={target.id}
                style={{
                  position: "absolute",
                  left: `${target.x}px`,
                  top: `${target.y}px`,
                  width: `${TARGET_TYPES[target.type].size}px`,
                  height: `${TARGET_TYPES[target.type].size}px`,
                  fontSize: `${TARGET_TYPES[target.type].size}px`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  userSelect: "none",
                  opacity: target.isClicked ? 0.3 : 1,
                  transform: target.isClicked ? "scale(1.2)" : "scale(1)",
                  transition: target.isClicked ? "all 0.3s ease" : "none",
                  pointerEvents: target.isClicked ? "none" : "auto",
                  textShadow: "0 0 10px rgba(255,255,255,0.5)",
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleTargetClick(target.id);
                }}
              >
                {TARGET_TYPES[target.type].symbol}
              </div>
            ))}

            {!gameStarted && (
              <div
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  color: "#fff",
                  fontSize: "2rem",
                  fontWeight: "bold",
                  textAlign: "center",
                  textShadow: "0 0 10px rgba(0,0,0,0.8)",
                }}
              >
                Get Ready!
                <br />
                <span style={{ fontSize: "1rem" }}>
                  Targets will start moving soon...
                </span>
              </div>
            )}
          </div>

          {/* Instructions */}
          <div
            className="text-white text-center"
            style={{ fontSize: "1.1rem", maxWidth: "600px" }}
          >
            <div
              className="mb-2"
              style={{ fontSize: "1.2rem", fontWeight: "bold" }}
            >
              Click on all the moving targets!
            </div>
            <div style={{ fontSize: "0.9rem", opacity: 0.8 }}>
              Targets bounce around the screen • Click quickly before time runs
              out • Missing costs 1 second
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MovingTarget({ token }) {
  return (
    <GameWindow>
      <GameLayout
        introSlides={introSlides}
        helpText="Track the moving targets with your eyes and click on them as quickly as possible. They bounce around the screen, so you need good hand-eye coordination!"
        gameName="Moving Target"
        fetchUserGameProgress={fetchUserGameProgress}
        submitGameScore={submitMovingTarget}
        initialLevel={1}
        maxLevel={10}
        onGameStart={(level, { resetProgress }) => resetProgress(level)}
        onGameRestart={() => window.location.reload()}
        onGameQuit={() => window.location.assign("/games/attention")}
        token={token}
      >
        {(game) => (
          <MovingTargetGame
            level={game.level}
            xp={game.xp}
            xpToNextLevel={game.xpToNextLevel}
            timer={game.timer}
            setTimer={game.setTimer}
            result={game.result}
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
