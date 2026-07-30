import { useState, useEffect, useRef } from "react";
import GameWindow from "../GameWindow.jsx";
import GameLayout from "../Layout/GameLayout.jsx";
import { submitSpeedSort } from "../../../api/games.jsx";
import { fetchUserGameProgress } from "../../../api/score.jsx";

function generateSortingTask(level) {
  const taskTypes = ["numbers", "words", "colors", "sizes"];
  const taskType = taskTypes[Math.floor(Math.random() * taskTypes.length)];

  const itemCount = Math.min(4 + level, 12); // 5-12 items based on level
  let items = [];
  let sortCriteria = "";
  let correctOrder = [];

  switch (taskType) {
    case "numbers":
      // Generate random numbers
      for (let i = 0; i < itemCount; i++) {
        items.push(Math.floor(Math.random() * 100) + 1);
      }
      sortCriteria = Math.random() < 0.5 ? "ascending" : "descending";
      correctOrder = [...items].sort((a, b) =>
        sortCriteria === "ascending" ? a - b : b - a
      );
      items = shuffleArray([...items]);
      break;

    case "words":
      const wordSets = [
        [
          "apple",
          "banana",
          "cherry",
          "date",
          "elderberry",
          "fig",
          "grape",
          "kiwi",
          "lemon",
          "mango",
          "orange",
          "peach",
        ],
        [
          "dog",
          "cat",
          "bird",
          "fish",
          "horse",
          "lion",
          "tiger",
          "bear",
          "wolf",
          "fox",
          "deer",
          "rabbit",
        ],
        [
          "red",
          "blue",
          "green",
          "yellow",
          "purple",
          "orange",
          "pink",
          "brown",
          "black",
          "white",
          "gray",
          "violet",
        ],
      ];
      const selectedSet = wordSets[Math.floor(Math.random() * wordSets.length)];
      items = selectedSet.slice(0, itemCount);
      sortCriteria =
        Math.random() < 0.5 ? "alphabetical" : "reverse alphabetical";
      correctOrder = [...items].sort((a, b) =>
        sortCriteria === "alphabetical"
          ? a.localeCompare(b)
          : b.localeCompare(a)
      );
      items = shuffleArray([...items]);
      break;

    case "colors":
      const colorIntensity = ["light", "medium", "dark"];
      const baseColors = ["red", "blue", "green", "yellow", "purple", "orange"];
      items = [];
      for (let i = 0; i < itemCount; i++) {
        const intensity = colorIntensity[i % 3];
        const color = baseColors[Math.floor(i / 3) % baseColors.length];
        items.push({
          name: `${intensity} ${color}`,
          intensity: colorIntensity.indexOf(intensity),
        });
      }
      sortCriteria = Math.random() < 0.5 ? "light to dark" : "dark to light";
      correctOrder = [...items].sort((a, b) =>
        sortCriteria === "light to dark"
          ? a.intensity - b.intensity
          : b.intensity - a.intensity
      );
      items = shuffleArray([...items]);
      break;

    case "sizes":
      const sizeNames = ["tiny", "small", "medium", "large", "huge"];
      const objects = ["circle", "square", "triangle", "star"];
      items = [];
      for (let i = 0; i < itemCount; i++) {
        const size = sizeNames[i % sizeNames.length];
        const object =
          objects[Math.floor(i / sizeNames.length) % objects.length];
        items.push({
          name: `${size} ${object}`,
          size: sizeNames.indexOf(size),
        });
      }
      sortCriteria =
        Math.random() < 0.5 ? "smallest to largest" : "largest to smallest";
      correctOrder = [...items].sort((a, b) =>
        sortCriteria === "smallest to largest"
          ? a.size - b.size
          : b.size - a.size
      );
      items = shuffleArray([...items]);
      break;
  }

  return {
    type: taskType,
    items: items,
    sortCriteria: sortCriteria,
    correctOrder: correctOrder,
  };
}

function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

const introSlides = [
  {
    title: "Why Speed Sort?",
    desc: "This game enhances your processing speed, pattern recognition, and cognitive flexibility. It trains your brain to quickly categorize and organize information.",
    img: "/images/brain-idea.svg",
  },
  {
    title: "Benefits",
    desc: "• Improves processing speed\n• Enhances pattern recognition\n• Develops sorting strategies\n• Builds cognitive flexibility",
    img: "/images/brain-benefit.svg",
  },
  {
    title: "How to Play",
    desc: "Sort items according to the given criteria as quickly as possible! Drag and drop items into the correct order. Speed and accuracy both matter.",
    img: "/images/brain-tutorial.svg",
  },
];

function SpeedSortGame({
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
  const [userSort, setUserSort] = useState([]);
  const [allUserSorts, setAllUserSorts] = useState([]);
  const [correctSorts, setCorrectSorts] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackType, setFeedbackType] = useState("");
  const gameStartedRef = useRef(false);
  const totalTasks = Math.min(8 + level, 15); // 9-15 tasks

  // Initialize new game when level changes
  useEffect(() => {
    const newTasks = [];
    for (let i = 0; i < totalTasks; i++) {
      newTasks.push(generateSortingTask(level));
    }
    setTasks(newTasks);
    setCurrentTaskIndex(0);
    setCurrentTask(newTasks[0]);
    setUserSort(newTasks[0]?.items || []);
    setAllUserSorts([]);
    setCorrectSorts(0);
    setGameStarted(false);
    setShowFeedback(false);
    gameStartedRef.current = false;
  }, [level, totalTasks]);

  // Start game
  useEffect(() => {
    if (tasks.length > 0 && !gameStarted) {
      const startTimer = setTimeout(() => {
        setGameStarted(true);
        gameStartedRef.current = true;
      }, 1000);

      return () => clearTimeout(startTimer);
    }
  }, [tasks, gameStarted]);

  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) return;

    const newSort = [...userSort];
    const draggedItem = newSort[draggedIndex];
    newSort.splice(draggedIndex, 1);
    newSort.splice(dropIndex, 0, draggedItem);

    setUserSort(newSort);
    setDraggedIndex(null);
  };

  const handleSubmitSort = () => {
    if (!gameStarted || result || showFeedback) return;

    const isCorrect = arraysEqual(userSort, currentTask.correctOrder);
    setAllUserSorts((prev) => [...prev, [...userSort]]);

    if (isCorrect) {
      if (playCorrect) playCorrect();
      setCorrectSorts((prev) => prev + 1);
      setFeedbackType("correct");

      handleSuccess({
        timeLeft: timer,
        timer: 90,
        isCorrect: true,
      });
    } else {
      if (playWrong) playWrong();
      if (handleWrong) handleWrong();
      if (setMistakes) setMistakes((prev) => prev + 1);
      setFeedbackType("incorrect");

      // Penalty: reduce timer
      setTimer((prev) => Math.max(0, prev - 3));
      if (triggerMinusFive) triggerMinusFive();
    }

    setShowFeedback(true);

    // Show feedback briefly, then move to next task
    setTimeout(() => {
      setShowFeedback(false);

      if (currentTaskIndex + 1 >= totalTasks) {
        // Game complete
        const accuracy =
          ((correctSorts + (isCorrect ? 1 : 0)) / totalTasks) * 100;

        if (accuracy >= 70) {
          if (handleGameComplete) {
            handleGameComplete({
              items: tasks.map((task) => task.items),
              user_sort: [...allUserSorts, [...userSort]],
              message: "Sorting champion!",
            });
          }
        } else {
          handleGameOver({
            items: tasks.map((task) => task.items),
            user_sort: [...allUserSorts, [...userSort]],
            message: "Need better accuracy!",
          });
        }
      } else {
        // Next task
        const nextIndex = currentTaskIndex + 1;
        setCurrentTaskIndex(nextIndex);
        setCurrentTask(tasks[nextIndex]);
        setUserSort(tasks[nextIndex].items);
      }
    }, 1500);
  };

  // Handle game over when timer runs out
  useEffect(() => {
    if (timer === 0 && !result && gameStartedRef.current) {
      handleGameOver({
        items: tasks.map((task) => task.items),
        user_sort: allUserSorts,
        message: "Time's up!",
      });
    }
  }, [timer, result, handleGameOver, tasks, allUserSorts]);

  function arraysEqual(a, b) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      const aItem = typeof a[i] === "object" ? a[i].name : a[i];
      const bItem = typeof b[i] === "object" ? b[i].name : b[i];
      if (aItem !== bItem) return false;
    }
    return true;
  }

  const accuracy =
    totalTasks > 0
      ? Math.round((correctSorts / Math.max(currentTaskIndex, 1)) * 100)
      : 0;

  return (
    <div className="speed-sort-container">
      {!result && (
        <div className="flex-grow-1 w-100 d-flex flex-column align-items-center justify-content-center">
          {/* Game Stats */}
          <div className="game-stats text-white mb-3 text-center">
            <div className="mb-2">
              Level: {level} | Task: {currentTaskIndex + 1}/{totalTasks} |
              Correct: {correctSorts}
            </div>
            <div className="mb-2">
              XP: {xp} / {xpToNextLevel} | Accuracy: {accuracy}%
            </div>
          </div>

          {/* Task Display */}
          {currentTask && (
            <div
              className="task-display"
              style={{
                backgroundColor: "#2a2a2a",
                border: "3px solid #4a4a4a",
                borderRadius: "15px",
                padding: "2rem",
                marginBottom: "2rem",
                minWidth: "600px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: "1.5rem",
                  fontWeight: "bold",
                  color: "#4ECDC4",
                  marginBottom: "1rem",
                }}
              >
                Sort: {currentTask.sortCriteria}
              </div>

              {showFeedback && (
                <div
                  style={{
                    fontSize: "2rem",
                    fontWeight: "bold",
                    color: feedbackType === "correct" ? "#4ECDC4" : "#FF6B6B",
                    marginBottom: "1rem",
                  }}
                >
                  {feedbackType === "correct"
                    ? "✓ Perfect Sort!"
                    : "✗ Incorrect Order!"}
                </div>
              )}

              {!showFeedback && gameStarted && (
                <div className="sorting-area">
                  <div
                    className="sort-items"
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(120px, 1fr))",
                      gap: "10px",
                      marginBottom: "1.5rem",
                      minHeight: "60px",
                    }}
                  >
                    {userSort.map((item, index) => (
                      <div
                        key={index}
                        draggable
                        onDragStart={(e) => handleDragStart(e, index)}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, index)}
                        style={{
                          backgroundColor:
                            draggedIndex === index ? "#555" : "#1a1a1a",
                          border: "2px solid #666",
                          borderRadius: "8px",
                          padding: "10px",
                          color: "#fff",
                          cursor: "move",
                          textAlign: "center",
                          fontSize: "1rem",
                          fontWeight: "bold",
                          transition: "all 0.2s ease",
                          userSelect: "none",
                        }}
                      >
                        {typeof item === "object" ? item.name : item}
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={handleSubmitSort}
                    style={{
                      backgroundColor: "#4ECDC4",
                      color: "#000",
                      border: "none",
                      borderRadius: "8px",
                      padding: "12px 24px",
                      fontSize: "1.2rem",
                      fontWeight: "bold",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) =>
                      (e.target.style.backgroundColor = "#45B7B8")
                    }
                    onMouseLeave={(e) =>
                      (e.target.style.backgroundColor = "#4ECDC4")
                    }
                  >
                    Submit Sort
                  </button>
                </div>
              )}

              {!gameStarted && (
                <div
                  style={{
                    fontSize: "1.5rem",
                    color: "#666",
                    fontWeight: "bold",
                  }}
                >
                  Get ready to sort!
                </div>
              )}
            </div>
          )}

          {/* In-game instruction text removed; instructions live in intro panel */}
        </div>
      )}
    </div>
  );
}

export default function SpeedSort({ token }) {
  return (
    <GameWindow>
      <GameLayout
        introSlides={introSlides}
        helpText="Sort items according to the given criteria as fast as possible! Drag and drop items to reorder them, then click Submit Sort. Speed and accuracy both matter."
        gameName="Speed Sort"
        fetchUserGameProgress={fetchUserGameProgress}
        submitGameScore={submitSpeedSort}
        initialLevel={1}
        maxLevel={10}
        onGameStart={(level, { resetProgress }) => resetProgress(level)}
        onGameRestart={() => window.location.reload()}
        onGameQuit={() => window.location.assign("/games/speed")}
        token={token}
      >
        {(game) => (
          <SpeedSortGame
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
