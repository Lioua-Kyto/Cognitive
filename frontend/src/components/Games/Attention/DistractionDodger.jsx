import { useState, useEffect, useRef } from "react";
import GameWindow from "../GameWindow.jsx";
import GameLayout from "../Layout/GameLayout.jsx";
import { submitDistractionDodger } from "../../../api/games.jsx";
import { fetchUserGameProgress } from "../../../api/score.jsx";
import "../Styles/games.css";

// Distraction types
const DISTRACTION_TYPES = {
  STAR: { type: "star", color: "#FFD700", symbol: "⭐" },
  CIRCLE: { type: "circle", color: "#FF6B6B", symbol: "🔴" },
  SQUARE: { type: "square", color: "#4ECDC4", symbol: "🟦" },
  TRIANGLE: { type: "triangle", color: "#45B7D1", symbol: "🔺" },
  DIAMOND: { type: "diamond", color: "#96CEB4", symbol: "💎" },
  HEART: { type: "heart", color: "#FFEAA7", symbol: "❤️" },
};

const TARGET_SYMBOL = "🎯";

function generateEvents(level) {
  const eventCount = Math.min(5 + level * 2, 20); // 7-20 events
  const events = [];
  const targetCount = Math.floor(eventCount * 0.3); // 30% targets

  // Add targets
  for (let i = 0; i < targetCount; i++) {
    events.push("TARGET");
  }

  // Add distractions
  const distractionTypes = Object.keys(DISTRACTION_TYPES);
  for (let i = 0; i < eventCount - targetCount; i++) {
    const randomType =
      distractionTypes[Math.floor(Math.random() * distractionTypes.length)];
    events.push(randomType);
  }

  // Shuffle events
  for (let i = events.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [events[i], events[j]] = [events[j], events[i]];
  }

  return events;
}

const introSlides = [
  {
    title: "Why Distraction Dodger?",
    desc: "This game trains your selective attention and impulse control. It helps you focus on relevant information while ignoring distractions.",
    img: "/images/brain-idea.svg",
  },
  {
    title: "Benefits",
    desc: "• Improves selective attention\n• Strengthens impulse control\n• Enhances focus under pressure\n• Develops sustained concentration",
    img: "/images/brain-benefit.svg",
  },
  {
    title: "How to Play",
    desc: "Tap ONLY when you see the target (🎯). Ignore all other symbols! Be quick but accurate - wrong taps will cost you points.",
    img: "/images/brain-tutorial.svg",
  },
];

function DistractionDodgerGame({
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
  const [events, setEvents] = useState([]);
  const [currentEventIndex, setCurrentEventIndex] = useState(0);
  const [userTaps, setUserTaps] = useState([]);
  const [showEvent, setShowEvent] = useState(false);
  const [currentEvent, setCurrentEvent] = useState(null);
  const [gamePhase, setGamePhase] = useState("waiting"); // 'waiting', 'showing', 'complete'
  const [targetsHit, setTargetsHit] = useState(0);
  const [totalTargets, setTotalTargets] = useState(0);
  const gameStartedRef = useRef(false);

  // Initialize new game when level changes
  useEffect(() => {
    const newEvents = generateEvents(level);
    setEvents(newEvents);
    setCurrentEventIndex(0);
    setUserTaps([]);
    setShowEvent(false);
    setCurrentEvent(null);
    setGamePhase("waiting");
    setTargetsHit(0);
    setTotalTargets(newEvents.filter((e) => e === "TARGET").length);
    gameStartedRef.current = false;
  }, [level]);

  // Start showing events
  useEffect(() => {
    if (events.length > 0 && gamePhase === "waiting") {
      const startDelay = setTimeout(() => {
        setGamePhase("showing");
        gameStartedRef.current = true;
        showNextEvent();
      }, 1000);

      return () => clearTimeout(startDelay);
    }
  }, [events, gamePhase]);

  const showNextEvent = () => {
    if (currentEventIndex >= events.length) {
      // Game complete
      const accuracy = totalTargets > 0 ? (targetsHit / totalTargets) * 100 : 0;
      if (accuracy >= 80) {
        handleSuccess({
          timeLeft: timer,
          timer: 90,
          isCorrect: true,
        });

        if (handleGameComplete) {
          handleGameComplete({
            events: events,
            user_taps: userTaps,
            message: "Great focus!",
          });
        }
      } else {
        handleGameOver({
          events: events,
          user_taps: userTaps,
          message: "Need better accuracy!",
        });
      }
      return;
    }

    const event = events[currentEventIndex];
    setCurrentEvent(event);
    setShowEvent(true);

    // Hide event after display time
    const displayTime = Math.max(800, 1200 - level * 50); // 1.2s to 0.8s
    setTimeout(() => {
      setShowEvent(false);
      setCurrentEventIndex((prev) => prev + 1);

      // Show next event after brief pause
      setTimeout(() => {
        showNextEvent();
      }, 300);
    }, displayTime);
  };

  const handleTap = () => {
    if (!gameStartedRef.current || !showEvent) return;

    const isTarget = currentEvent === "TARGET";
    const tapResult = isTarget ? "HIT" : "MISS";

    setUserTaps((prev) => [...prev, tapResult]);

    if (isTarget) {
      if (playCorrect) playCorrect();
      setTargetsHit((prev) => prev + 1);

      handleSuccess({
        timeLeft: timer,
        timer: 90,
        isCorrect: true,
      });
    } else {
      if (playWrong) playWrong();
      if (handleWrong) handleWrong();
      if (setMistakes) setMistakes((prev) => prev + 1);

      // Penalty: reduce timer
      setTimer((prev) => Math.max(0, prev - 2));
      if (triggerMinusFive) triggerMinusFive();
    }
  };

  const handleMissedTarget = () => {
    if (currentEvent === "TARGET") {
      setUserTaps((prev) => [...prev, "MISSED"]);
      if (playWrong) playWrong();
      if (handleWrong) handleWrong();
      if (setMistakes) setMistakes((prev) => prev + 1);
    }
  };

  // Handle missed targets
  useEffect(() => {
    if (
      !showEvent &&
      currentEvent === "TARGET" &&
      userTaps.length === currentEventIndex
    ) {
      handleMissedTarget();
    }
  }, [showEvent, currentEvent, userTaps.length, currentEventIndex]);

  // Handle game over when timer runs out
  useEffect(() => {
    if (timer === 0 && !result && gameStartedRef.current) {
      handleGameOver({
        events: events,
        user_taps: userTaps,
        message: "Time's up!",
      });
    }
  }, [timer, result, handleGameOver, events, userTaps]);

  const getEventDisplay = (event) => {
    if (event === "TARGET") {
      return { symbol: TARGET_SYMBOL, color: "#FF4444" };
    }
    return {
      symbol: DISTRACTION_TYPES[event]?.symbol || "❓",
      color: DISTRACTION_TYPES[event]?.color || "#666666",
    };
  };

  return (
    <div className="distraction-dodger-container">
      {!result && (
        <div className="flex-grow-1 w-100 d-flex flex-column align-items-center justify-content-center">
          {/* Game Stats */}
          <div className="game-stats text-white mb-3 text-center">
            <div className="mb-2">
              Level: {level} | Targets Hit: {targetsHit}/{totalTargets} | Event:{" "}
              {currentEventIndex + 1}/{events.length}
            </div>
            <div className="mb-2">
              XP: {xp} / {xpToNextLevel} | Accuracy:{" "}
              {totalTargets > 0
                ? Math.round((targetsHit / totalTargets) * 100)
                : 0}
              %
            </div>
          </div>

          {/* Event Display */}
          <div
            className="event-display"
            style={{
              width: "200px",
              height: "200px",
              backgroundColor: showEvent ? "#2a2a2a" : "#1a1a1a",
              border: "3px solid #4a4a4a",
              borderRadius: "20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "4rem",
              marginBottom: "2rem",
              transition: "all 0.2s ease",
              cursor: "pointer",
              transform: showEvent ? "scale(1.05)" : "scale(1)",
            }}
            onClick={handleTap}
          >
            {showEvent && currentEvent ? (
              <span style={{ color: getEventDisplay(currentEvent).color }}>
                {getEventDisplay(currentEvent).symbol}
              </span>
            ) : (
              <span style={{ color: "#666", fontSize: "2rem" }}>
                {gamePhase === "waiting" ? "Get Ready..." : "Watch!"}
              </span>
            )}
          </div>

          {/* Instructions */}
          <div
            className="text-white text-center"
            style={{ fontSize: "1.1rem", maxWidth: "500px" }}
          >
            <div
              className="mb-2"
              style={{ fontSize: "1.3rem", fontWeight: "bold" }}
            >
              Tap ONLY when you see: {TARGET_SYMBOL}
            </div>
            <div style={{ fontSize: "0.9rem", opacity: 0.8 }}>
              Ignore all other symbols • Wrong taps cost 2 seconds • Need 80%
              accuracy to advance
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DistractionDodger({ token }) {
  return (
    <GameWindow>
      <GameLayout
        introSlides={introSlides}
        helpText="Focus on the target symbol (🎯) and tap only when you see it. Ignore all distractions! Quick reactions and accuracy are key to success."
        gameName="Distraction Dodger"
        fetchUserGameProgress={fetchUserGameProgress}
        submitGameScore={submitDistractionDodger}
        initialLevel={1}
        maxLevel={10}
        onGameStart={(level, { resetProgress }) => resetProgress(level)}
        onGameRestart={() => window.location.reload()}
        onGameQuit={() => window.location.assign("/games/attention")}
        token={token}
      >
        {(game) => (
          <DistractionDodgerGame
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
