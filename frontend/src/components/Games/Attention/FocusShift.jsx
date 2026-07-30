import { useState, useEffect, useRef } from "react";
import GameWindow from "../GameWindow.jsx";
import GameLayout from "../Layout/GameLayout.jsx";
import { submitFocusShift } from "../../../api/games.jsx";
import { fetchUserGameProgress } from "../../../api/score.jsx";

// Task types
const TASK_TYPES = {
  COLOR: {
    name: "Color",
    instruction: "Click if the color is",
    options: ["RED", "BLUE", "GREEN", "YELLOW", "PURPLE", "ORANGE"],
  },
  SHAPE: {
    name: "Shape",
    instruction: "Click if the shape is",
    options: ["CIRCLE", "SQUARE", "TRIANGLE", "DIAMOND", "STAR", "HEXAGON"],
  },
  SIZE: {
    name: "Size",
    instruction: "Click if the size is",
    options: ["SMALL", "MEDIUM", "LARGE"],
  },
  POSITION: {
    name: "Position",
    instruction: "Click if the position is",
    options: ["TOP", "BOTTOM", "LEFT", "RIGHT", "CENTER"],
  },
};

const COLORS = {
  RED: "#FF6B6B",
  BLUE: "#4ECDC4",
  GREEN: "#45B7D1",
  YELLOW: "#FFEAA7",
  PURPLE: "#DDA0DD",
  ORANGE: "#F0A500",
};

function generateTasks(level) {
  const taskCount = Math.min(8 + level * 2, 20); // 10-20 tasks
  const tasks = [];
  const taskTypes = Object.keys(TASK_TYPES);

  for (let i = 0; i < taskCount; i++) {
    const taskType = taskTypes[Math.floor(Math.random() * taskTypes.length)];
    const taskData = TASK_TYPES[taskType];
    const target =
      taskData.options[Math.floor(Math.random() * taskData.options.length)];

    tasks.push({
      type: taskType,
      target: target,
      instruction: `${taskData.instruction} ${target}`,
    });
  }

  return tasks;
}

function generateStimulus(level) {
  const colors = Object.keys(COLORS);
  const shapes = Object.keys(TASK_TYPES.SHAPE.options);
  const sizes = ["SMALL", "MEDIUM", "LARGE"];
  const positions = ["TOP", "BOTTOM", "LEFT", "RIGHT", "CENTER"];

  return {
    color: colors[Math.floor(Math.random() * colors.length)],
    shape: shapes[Math.floor(Math.random() * shapes.length)],
    size: sizes[Math.floor(Math.random() * sizes.length)],
    position: positions[Math.floor(Math.random() * positions.length)],
  };
}

const introSlides = [
  {
    title: "Why Focus Shift?",
    desc: "This game trains your cognitive flexibility and task-switching abilities. It helps you adapt quickly to changing rules and maintain focus.",
    img: "/images/brain-idea.svg",
  },
  {
    title: "Benefits",
    desc: "• Improves cognitive flexibility\n• Enhances task-switching speed\n• Develops selective attention\n• Strengthens working memory",
    img: "/images/brain-benefit.svg",
  },
  {
    title: "How to Play",
    desc: "Follow the changing instructions at the top. Click the stimulus only when it matches the current rule. Rules change frequently, so stay focused!",
    img: "/images/brain-tutorial.svg",
  },
];

function FocusShiftGame({
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
  const [tasks, setTasks] = useState([]);
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [currentTask, setCurrentTask] = useState(null);
  const [stimulus, setStimulus] = useState(null);
  const [userResponses, setUserResponses] = useState([]);
  const [showStimulus, setShowStimulus] = useState(false);
  const [correctResponses, setCorrectResponses] = useState(0);
  const [gamePhase, setGamePhase] = useState("waiting"); // 'waiting', 'playing', 'complete'
  const gameStartedRef = useRef(false);

  // Initialize new game when level changes
  useEffect(() => {
    const newTasks = generateTasks(level);
    setTasks(newTasks);
    setCurrentTaskIndex(0);
    setCurrentTask(newTasks[0]);
    setStimulus(null);
    setUserResponses([]);
    setShowStimulus(false);
    setCorrectResponses(0);
    setGamePhase("waiting");
    gameStartedRef.current = false;
  }, [level]);

  // Start the game
  useEffect(() => {
    if (tasks.length > 0 && gamePhase === "waiting") {
      const startDelay = setTimeout(() => {
        setGamePhase("playing");
        gameStartedRef.current = true;
        showNextStimulus();
      }, 2000);

      return () => clearTimeout(startDelay);
    }
  }, [tasks, gamePhase]);

  const showNextStimulus = () => {
    if (currentTaskIndex >= tasks.length) {
      // Game complete
      const accuracy =
        tasks.length > 0 ? (correctResponses / tasks.length) * 100 : 0;

      if (accuracy >= 75) {
        handleSuccess({
          timeLeft: timer,
          timer: 90,
          isCorrect: true,
        });

        if (handleGameComplete) {
          handleGameComplete({
            tasks: tasks.map((t) => t.instruction),
            user_responses: userResponses,
            message: "Great flexibility!",
          });
        }
      } else {
        handleGameOver({
          tasks: tasks.map((t) => t.instruction),
          user_responses: userResponses,
          message: "Need better accuracy!",
        });
      }
      return;
    }

    // Maybe switch task (higher levels switch more often)
    const switchChance = Math.min(0.3 + level * 0.05, 0.7);
    if (Math.random() < switchChance && tasks.length > 1) {
      let newTaskIndex;
      do {
        newTaskIndex = Math.floor(Math.random() * tasks.length);
      } while (newTaskIndex === currentTaskIndex);

      setCurrentTaskIndex(newTaskIndex);
      setCurrentTask(tasks[newTaskIndex]);
    }

    // Generate and show stimulus
    const newStimulus = generateStimulus(level);
    setStimulus(newStimulus);
    setShowStimulus(true);

    // Hide stimulus after display time
    const displayTime = Math.max(1000, 2000 - level * 100); // 2s to 1s
    setTimeout(() => {
      setShowStimulus(false);

      // Auto-advance if no response
      setTimeout(() => {
        if (userResponses.length <= currentTaskIndex) {
          setUserResponses((prev) => [...prev, "NO_RESPONSE"]);
        }
        showNextStimulus();
      }, 500);
    }, displayTime);
  };

  const handleStimulusClick = () => {
    if (
      !gameStartedRef.current ||
      !showStimulus ||
      userResponses.length > currentTaskIndex
    )
      return;

    const shouldClick = checkIfShouldClick(stimulus, currentTask);
    const response = "CLICKED";

    setUserResponses((prev) => [...prev, response]);

    if (shouldClick) {
      if (playCorrect) playCorrect();
      setCorrectResponses((prev) => prev + 1);

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

  const checkIfShouldClick = (stimulus, task) => {
    if (!stimulus || !task) return false;

    switch (task.type) {
      case "COLOR":
        return stimulus.color === task.target;
      case "SHAPE":
        return stimulus.shape === task.target;
      case "SIZE":
        return stimulus.size === task.target;
      case "POSITION":
        return stimulus.position === task.target;
      default:
        return false;
    }
  };

  // Handle game over when timer runs out
  useEffect(() => {
    if (timer === 0 && !result && gameStartedRef.current) {
      handleGameOver({
        tasks: tasks.map((t) => t.instruction),
        user_responses: userResponses,
        message: "Time's up!",
      });
    }
  }, [timer, result, handleGameOver, tasks, userResponses]);

  const getStimulusStyle = () => {
    if (!stimulus) return {};

    const sizeMap = {
      SMALL: "40px",
      MEDIUM: "60px",
      LARGE: "80px",
    };

    const positionMap = {
      TOP: { top: "10%", left: "50%", transform: "translateX(-50%)" },
      BOTTOM: { bottom: "10%", left: "50%", transform: "translateX(-50%)" },
      LEFT: { left: "10%", top: "50%", transform: "translateY(-50%)" },
      RIGHT: { right: "10%", top: "50%", transform: "translateY(-50%)" },
      CENTER: { top: "50%", left: "50%", transform: "translate(-50%, -50%)" },
    };

    return {
      width: sizeMap[stimulus.size] || "60px",
      height: sizeMap[stimulus.size] || "60px",
      backgroundColor: COLORS[stimulus.color] || "#666",
      position: "absolute",
      ...positionMap[stimulus.position],
      borderRadius: stimulus.shape === "CIRCLE" ? "50%" : "8px",
      clipPath:
        stimulus.shape === "TRIANGLE"
          ? "polygon(50% 0%, 0% 100%, 100% 100%)"
          : stimulus.shape === "STAR"
          ? "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)"
          : stimulus.shape === "DIAMOND"
          ? "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)"
          : stimulus.shape === "HEXAGON"
          ? "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)"
          : "none",
      cursor: "pointer",
      transition: "all 0.2s ease",
      border: "2px solid #fff",
      boxShadow: "0 4px 8px rgba(0,0,0,0.3)",
    };
  };

  return (
    <div className="focus-shift-container">
      {!result && (
        <div className="flex-grow-1 w-100 d-flex flex-column align-items-center justify-content-center">
          {/* Game Stats */}
          <div className="game-stats text-white mb-3 text-center">
            <div className="mb-2">
              Level: {level} | Task: {currentTaskIndex + 1}/{tasks.length} |
              Correct: {correctResponses}
            </div>
            <div className="mb-2">
              XP: {xp} / {xpToNextLevel} | Accuracy:{" "}
              {tasks.length > 0
                ? Math.round(
                    (correctResponses / Math.max(userResponses.length, 1)) * 100
                  )
                : 0}
              %
            </div>
          </div>

          {/* Current Task Instruction */}
          <div
            className="task-instruction"
            style={{
              backgroundColor: "#2a2a2a",
              border: "2px solid #4a4a4a",
              borderRadius: "10px",
              padding: "1rem 2rem",
              marginBottom: "2rem",
              fontSize: "1.3rem",
              fontWeight: "bold",
              color: "#fff",
              textAlign: "center",
              minHeight: "60px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {currentTask ? currentTask.instruction : "Get ready..."}
          </div>

          {/* Stimulus Display Area */}
          <div
            className="stimulus-area"
            style={{
              width: "500px",
              height: "400px",
              backgroundColor: "#1a1a1a",
              border: "3px solid #4a4a4a",
              borderRadius: "15px",
              position: "relative",
              marginBottom: "2rem",
              cursor: showStimulus ? "pointer" : "default",
            }}
            onClick={handleStimulusClick}
          >
            {showStimulus && stimulus && <div style={getStimulusStyle()} />}
            {!showStimulus && gamePhase === "playing" && (
              <div
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  color: "#666",
                  fontSize: "1.5rem",
                  fontWeight: "bold",
                }}
              >
                Watch for the next stimulus...
              </div>
            )}
            {gamePhase === "waiting" && (
              <div
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  color: "#666",
                  fontSize: "1.5rem",
                  fontWeight: "bold",
                }}
              >
                Get ready to focus!
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
              Click the stimulus ONLY when it matches the current rule!
            </div>
            <div style={{ fontSize: "0.9rem", opacity: 0.8 }}>
              Rules change frequently • Wrong clicks cost 2 seconds • Need 75%
              accuracy to advance
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function FocusShift({ token }) {
  return (
    <GameWindow>
      <GameLayout
        introSlides={introSlides}
        helpText="Pay attention to the changing rules at the top of the screen. Click the stimulus only when it matches the current requirement. Stay flexible and focused!"
        gameName="Focus Shift"
        fetchUserGameProgress={fetchUserGameProgress}
        submitGameScore={submitFocusShift}
        initialLevel={1}
        maxLevel={10}
        onGameStart={(level, { resetProgress }) => resetProgress(level)}
        onGameRestart={() => window.location.reload()}
        onGameQuit={() => window.location.assign("/games/attention")}
        token={token}
      >
        {(game) => (
          <FocusShiftGame
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
