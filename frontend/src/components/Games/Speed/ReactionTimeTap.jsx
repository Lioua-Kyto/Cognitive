import { useState, useEffect, useRef } from "react";
import GameWindow from "../GameWindow.jsx";
import GameLayout from "../Layout/GameLayout.jsx";
import { submitReactionTimeTap } from "../../../api/games.jsx";
import { fetchUserGameProgress } from "../../../api/score.jsx";
import "../Styles/games.css";

const introSlides = [
  {
    title: "Why Reaction Time Tap?",
    desc: "This game measures and improves your reaction speed and response time. Quick reactions are essential for many cognitive tasks and real-world situations.",
    img: "/images/brain-idea.svg",
  },
  {
    title: "Benefits",
    desc: "• Improves reaction speed\n• Enhances response time\n• Develops quick decision making\n• Builds alertness and readiness",
    img: "/images/brain-benefit.svg",
  },
  {
    title: "How to Play",
    desc: "Click as soon as you see the green circle appear! Wait for the signal - clicking too early will reset the timer. Be quick but accurate!",
    img: "/images/brain-tutorial.svg",
  },
];

function ReactionTimeTapGame({
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
  const [reactionTimes, setReactionTimes] = useState([]);
  const [currentRound, setCurrentRound] = useState(0);
  const [gameState, setGameState] = useState("waiting"); // 'waiting', 'ready', 'active', 'clicked', 'tooEarly'
  const [showTarget, setShowTarget] = useState(false);
  const [reactionStartTime, setReactionStartTime] = useState(null);
  const [currentReactionTime, setCurrentReactionTime] = useState(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [averageTime, setAverageTime] = useState(0);
  const [bestTime, setBestTime] = useState(null);
  const gameStartedRef = useRef(false);
  const timeoutRef = useRef(null);
  const totalRounds = Math.min(12 + level * 2, 25); // 14-25 rounds

  // Start game
  useEffect(() => {
    if (!gameStarted) {
      const startTimer = setTimeout(() => {
        setGameStarted(true);
        gameStartedRef.current = true;
        startRound();
      }, 1000);

      return () => clearTimeout(startTimer);
    }
  }, [gameStarted]);

  // Start a new reaction round
  const startRound = () => {
    if (currentRound >= totalRounds) return;

    setGameState("waiting");
    setShowTarget(false);
    setCurrentReactionTime(null);

    // Random delay between 1-5 seconds before showing target
    const delay = 1000 + Math.random() * 4000;

    timeoutRef.current = setTimeout(() => {
      setGameState("active");
      setShowTarget(true);
      setReactionStartTime(Date.now());
    }, delay);
  };

  // Handle target click
  const handleTargetClick = () => {
    if (gameState === "waiting" || gameState === "ready") {
      // Clicked too early
      setGameState("tooEarly");
      if (playWrong) playWrong();
      if (handleWrong) handleWrong();
      if (setMistakes) setMistakes((prev) => prev + 1);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Penalty: reduce timer and add poor reaction time
      setTimer((prev) => Math.max(0, prev - 2));
      if (triggerMinusFive) triggerMinusFive();

      const penaltyTime = 1000; // 1 second penalty for early click
      setReactionTimes((prev) => [...prev, penaltyTime]);
      setCurrentReactionTime(penaltyTime);

      setTimeout(() => {
        nextRound();
      }, 1500);
    } else if (gameState === "active") {
      // Valid click
      const reactionTime = Date.now() - reactionStartTime;
      setCurrentReactionTime(reactionTime);
      setGameState("clicked");
      setShowTarget(false);

      if (playCorrect) playCorrect();
      setReactionTimes((prev) => [...prev, reactionTime]);

      // Update best time
      if (!bestTime || reactionTime < bestTime) {
        setBestTime(reactionTime);
      }

      handleSuccess({
        timeLeft: timer,
        timer: 90,
        isCorrect: true,
        reactionTime: reactionTime,
      });

      setTimeout(() => {
        nextRound();
      }, 1000);
    }
  };

  // Move to next round
  const nextRound = () => {
    const nextRoundIndex = currentRound + 1;
    setCurrentRound(nextRoundIndex);

    if (nextRoundIndex >= totalRounds) {
      // Game complete
      const validTimes = reactionTimes.filter((time) => time < 1000); // Exclude penalty times
      const avgTime =
        validTimes.length > 0
          ? validTimes.reduce((a, b) => a + b, 0) / validTimes.length
          : 1000;
      setAverageTime(avgTime);

      // Success if average reaction time is reasonable (under 500ms for high level, 800ms for low level)
      const maxAllowedTime = Math.max(800 - level * 50, 300);

      if (avgTime <= maxAllowedTime && validTimes.length >= totalRounds * 0.7) {
        if (handleGameComplete) {
          handleGameComplete({
            reaction_times: reactionTimes,
            message: `Lightning fast! Average: ${Math.round(avgTime)}ms`,
          });
        }
      } else {
        handleGameOver({
          reaction_times: reactionTimes,
          message: `Need faster reactions! Average: ${Math.round(avgTime)}ms`,
        });
      }
    } else {
      setTimeout(() => {
        startRound();
      }, 500);
    }
  };

  // Handle game over when timer runs out
  useEffect(() => {
    if (timer === 0 && !result && gameStartedRef.current) {
      handleGameOver({
        reaction_times: reactionTimes,
        message: "Time's up!",
      });
    }
  }, [timer, result, handleGameOver, reactionTimes]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Calculate current average
  const currentAverage =
    reactionTimes.length > 0
      ? Math.round(
          reactionTimes
            .filter((time) => time < 1000)
            .reduce((a, b) => a + b, 0) /
            Math.max(reactionTimes.filter((time) => time < 1000).length, 1)
        )
      : 0;

  return (
    <div className="reaction-time-container">
      {!result && (
        <div className="flex-grow-1 w-100 d-flex flex-column align-items-center justify-content-center">
          {/* Game Stats */}
          <div className="game-stats text-white mb-3 text-center">
            <div className="mb-2">
              Level: {level} | Round: {currentRound + 1}/{totalRounds} |
              Average: {currentAverage}ms
            </div>
            <div className="mb-2">
              XP: {xp} / {xpToNextLevel} | Best:{" "}
              {bestTime ? `${bestTime}ms` : "None"}
            </div>
          </div>

          {/* Reaction Area */}
          <div
            className="reaction-area"
            style={{
              backgroundColor: "#2a2a2a",
              border: "3px solid #4a4a4a",
              borderRadius: "15px",
              padding: "3rem",
              marginBottom: "2rem",
              minWidth: "500px",
              minHeight: "400px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              cursor: "pointer",
              userSelect: "none",
            }}
            onClick={handleTargetClick}
          >
            {!gameStarted && (
              <div
                style={{
                  fontSize: "2rem",
                  color: "#666",
                  fontWeight: "bold",
                }}
              >
                Get ready for reaction training!
              </div>
            )}

            {gameStarted && gameState === "waiting" && (
              <div>
                <div
                  style={{
                    fontSize: "2.5rem",
                    color: "#FFD93D",
                    fontWeight: "bold",
                    marginBottom: "1rem",
                  }}
                >
                  Wait for green...
                </div>
                <div
                  style={{
                    width: "150px",
                    height: "150px",
                    borderRadius: "50%",
                    backgroundColor: "#FF6B6B",
                    margin: "0 auto",
                  }}
                />
              </div>
            )}

            {gameStarted && gameState === "active" && showTarget && (
              <div>
                <div
                  style={{
                    fontSize: "2.5rem",
                    color: "#4ECDC4",
                    fontWeight: "bold",
                    marginBottom: "1rem",
                  }}
                >
                  CLICK NOW!
                </div>
                <div
                  style={{
                    width: "150px",
                    height: "150px",
                    borderRadius: "50%",
                    backgroundColor: "#4ECDC4",
                    margin: "0 auto",
                    animation: "pulse 0.5s infinite alternate",
                  }}
                />
              </div>
            )}

            {gameStarted && gameState === "clicked" && currentReactionTime && (
              <div>
                <div
                  style={{
                    fontSize: "2.5rem",
                    color: "#4ECDC4",
                    fontWeight: "bold",
                    marginBottom: "1rem",
                  }}
                >
                  {currentReactionTime}ms!
                </div>
                <div
                  style={{
                    fontSize: "1.5rem",
                    color:
                      currentReactionTime < 300
                        ? "#4ECDC4"
                        : currentReactionTime < 500
                        ? "#FFD93D"
                        : "#FF6B6B",
                  }}
                >
                  {currentReactionTime < 300
                    ? "Lightning fast!"
                    : currentReactionTime < 500
                    ? "Good reaction!"
                    : "Keep practicing!"}
                </div>
              </div>
            )}

            {gameStarted && gameState === "tooEarly" && (
              <div>
                <div
                  style={{
                    fontSize: "2.5rem",
                    color: "#FF6B6B",
                    fontWeight: "bold",
                    marginBottom: "1rem",
                  }}
                >
                  Too Early!
                </div>
                <div
                  style={{
                    fontSize: "1.5rem",
                    color: "#FF6B6B",
                  }}
                >
                  Wait for the green signal
                </div>
              </div>
            )}
          </div>

          {/* In-game instruction text removed; instructions live in intro panel */}
        </div>
      )}

      <style jsx>{`
        @keyframes pulse {
          from {
            transform: scale(1);
          }
          to {
            transform: scale(1.1);
          }
        }
      `}</style>
    </div>
  );
}

export default function ReactionTimeTap({ token }) {
  return (
    <GameWindow>
      <GameLayout
        introSlides={introSlides}
        helpText="Test and improve your reaction speed! Click as soon as you see the green circle appear. Don't click early - wait for the signal!"
        gameName="Reaction Time Tap"
        fetchUserGameProgress={fetchUserGameProgress}
        submitGameScore={submitReactionTimeTap}
        initialLevel={1}
        maxLevel={10}
        onGameStart={(level, { resetProgress }) => resetProgress(level)}
        onGameRestart={() => window.location.reload()}
        onGameQuit={() => window.location.assign("/games/speed")}
        token={token}
      >
        {(game) => (
          <ReactionTimeTapGame
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
