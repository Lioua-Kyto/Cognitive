import { useState, useEffect, useRef } from "react";
import GameWindow from "../GameWindow.jsx";
import GameLayout from "../Layout/GameLayout.jsx";
import { submitCategoryStorm } from "../../../api/games.jsx";
import { fetchUserGameProgress } from "../../../api/score.jsx";

function generateCategoryTask(level) {
  const categories = [
    {
      name: "Animals",
      items: [
        "dog",
        "cat",
        "elephant",
        "bird",
        "fish",
        "horse",
        "lion",
        "tiger",
        "bear",
        "rabbit",
        "mouse",
        "snake",
      ],
      distractors: [
        "car",
        "book",
        "apple",
        "chair",
        "phone",
        "tree",
        "rock",
        "flower",
      ],
    },
    {
      name: "Colors",
      items: [
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
      distractors: [
        "table",
        "happy",
        "seven",
        "running",
        "quickly",
        "mountain",
        "singing",
        "jumping",
      ],
    },
    {
      name: "Food",
      items: [
        "apple",
        "banana",
        "pizza",
        "bread",
        "cheese",
        "milk",
        "rice",
        "pasta",
        "chicken",
        "beef",
        "fish",
        "cake",
      ],
      distractors: [
        "computer",
        "dancing",
        "beautiful",
        "twelve",
        "slowly",
        "building",
        "writing",
        "thinking",
      ],
    },
    {
      name: "Countries",
      items: [
        "USA",
        "Canada",
        "France",
        "Germany",
        "Japan",
        "China",
        "Brazil",
        "Australia",
        "Italy",
        "Spain",
        "India",
        "Mexico",
      ],
      distractors: [
        "happiness",
        "running",
        "bright",
        "fifteen",
        "carefully",
        "ocean",
        "flying",
        "reading",
      ],
    },
    {
      name: "Sports",
      items: [
        "football",
        "basketball",
        "tennis",
        "soccer",
        "baseball",
        "golf",
        "swimming",
        "running",
        "boxing",
        "hockey",
        "volleyball",
        "skiing",
      ],
      distractors: [
        "pencil",
        "laughing",
        "purple",
        "twenty",
        "gently",
        "forest",
        "studying",
        "cooking",
      ],
    },
    {
      name: "Professions",
      items: [
        "teacher",
        "doctor",
        "engineer",
        "nurse",
        "lawyer",
        "chef",
        "pilot",
        "artist",
        "writer",
        "musician",
        "scientist",
        "farmer",
      ],
      distractors: [
        "window",
        "sleeping",
        "round",
        "hundred",
        "loudly",
        "desert",
        "playing",
        "walking",
      ],
    },
  ];

  const selectedCategory =
    categories[Math.floor(Math.random() * categories.length)];
  const itemCount = Math.min(4 + level, 8); // 5-8 category items
  const distractorCount = Math.min(3 + level, 6); // 4-6 distractors

  // Select random items from category
  const shuffledItems = [...selectedCategory.items].sort(
    () => Math.random() - 0.5
  );
  const categoryItems = shuffledItems.slice(0, itemCount);

  // Select random distractors
  const shuffledDistractors = [...selectedCategory.distractors].sort(
    () => Math.random() - 0.5
  );
  const distractors = shuffledDistractors.slice(0, distractorCount);

  // Combine and shuffle all items
  const allItems = [...categoryItems, ...distractors].sort(
    () => Math.random() - 0.5
  );

  return {
    category: selectedCategory.name,
    allItems: allItems,
    correctItems: categoryItems,
    distractors: distractors,
  };
}

const introSlides = [
  {
    title: "Why Category Storm?",
    desc: "This game enhances your categorization speed, semantic processing, and cognitive flexibility. It trains your brain to quickly identify and group related concepts.",
    img: "/images/brain-idea.svg",
  },
  {
    title: "Benefits",
    desc: "• Improves categorization speed\n• Enhances semantic processing\n• Develops pattern recognition\n• Builds cognitive flexibility",
    img: "/images/brain-benefit.svg",
  },
  {
    title: "How to Play",
    desc: "Quickly identify all items that belong to the given category! Click on items to select them, then submit your choices. Speed and accuracy both matter.",
    img: "/images/brain-tutorial.svg",
  },
];

function CategoryStormGame({
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
  const [selectedItems, setSelectedItems] = useState([]);
  const [allUserSelections, setAllUserSelections] = useState([]);
  const [correctTasks, setCorrectTasks] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackType, setFeedbackType] = useState("");
  const [taskStartTime, setTaskStartTime] = useState(null);
  const gameStartedRef = useRef(false);
  const totalTasks = Math.min(8 + level, 15); // 9-15 tasks

  // Initialize new game when level changes
  useEffect(() => {
    const newTasks = [];
    for (let i = 0; i < totalTasks; i++) {
      newTasks.push(generateCategoryTask(level));
    }
    setTasks(newTasks);
    setCurrentTaskIndex(0);
    setCurrentTask(newTasks[0]);
    setSelectedItems([]);
    setAllUserSelections([]);
    setCorrectTasks(0);
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
        setTaskStartTime(Date.now());
      }, 1000);

      return () => clearTimeout(startTimer);
    }
  }, [tasks, gameStarted]);

  const handleItemClick = (item) => {
    if (!gameStarted || result || showFeedback) return;

    setSelectedItems((prev) => {
      if (prev.includes(item)) {
        return prev.filter((i) => i !== item);
      } else {
        return [...prev, item];
      }
    });
  };

  const handleSubmitSelection = () => {
    if (!gameStarted || result || showFeedback || selectedItems.length === 0)
      return;

    const timeToComplete = Date.now() - taskStartTime;

    // Check if selection is correct (all correct items selected, no incorrect items)
    const correctSet = new Set(currentTask.correctItems);
    const selectedSet = new Set(selectedItems);

    const correctSelections = selectedItems.filter((item) =>
      correctSet.has(item)
    );
    const incorrectSelections = selectedItems.filter(
      (item) => !correctSet.has(item)
    );
    const missedItems = currentTask.correctItems.filter(
      (item) => !selectedSet.has(item)
    );

    const isCorrect =
      correctSelections.length === currentTask.correctItems.length &&
      incorrectSelections.length === 0;

    setAllUserSelections((prev) => [...prev, [...selectedItems]]);

    if (isCorrect) {
      if (playCorrect) playCorrect();
      setCorrectTasks((prev) => prev + 1);
      setFeedbackType("correct");

      // Bonus for speed (under 3 seconds gets bonus)
      const speedBonus = timeToComplete < 3000 ? 1.5 : 1;

      handleSuccess({
        timeLeft: timer,
        timer: 90,
        isCorrect: true,
        speedBonus: speedBonus,
      });
    } else {
      if (playWrong) playWrong();
      if (handleWrong) handleWrong();
      if (setMistakes) setMistakes((prev) => prev + 1);
      setFeedbackType("incorrect");

      // Penalty: reduce timer
      setTimer((prev) => Math.max(0, prev - 2));
      if (triggerMinusFive) triggerMinusFive();
    }

    setShowFeedback(true);

    // Show feedback briefly, then move to next task
    setTimeout(() => {
      setShowFeedback(false);

      if (currentTaskIndex + 1 >= totalTasks) {
        // Game complete
        const accuracy =
          ((correctTasks + (isCorrect ? 1 : 0)) / totalTasks) * 100;

        if (accuracy >= 75) {
          if (handleGameComplete) {
            handleGameComplete({
              categories: tasks.map((task) => task.category),
              user_items: [...allUserSelections, [...selectedItems]],
              message: "Category master!",
            });
          }
        } else {
          handleGameOver({
            categories: tasks.map((task) => task.category),
            user_items: [...allUserSelections, [...selectedItems]],
            message: "Need better accuracy!",
          });
        }
      } else {
        // Next task
        const nextIndex = currentTaskIndex + 1;
        setCurrentTaskIndex(nextIndex);
        setCurrentTask(tasks[nextIndex]);
        setSelectedItems([]);
        setTaskStartTime(Date.now());
      }
    }, 2000);
  };

  // Handle game over when timer runs out
  useEffect(() => {
    if (timer === 0 && !result && gameStartedRef.current) {
      handleGameOver({
        categories: tasks.map((task) => task.category),
        user_items: allUserSelections,
        message: "Time's up!",
      });
    }
  }, [timer, result, handleGameOver, tasks, allUserSelections]);

  const accuracy =
    totalTasks > 0
      ? Math.round((correctTasks / Math.max(currentTaskIndex, 1)) * 100)
      : 0;

  return (
    <div className="category-storm-container">
      {!result && (
        <div className="flex-grow-1 w-100 d-flex flex-column align-items-center justify-content-center">
          {/* Game Stats */}
          <div className="game-stats text-white mb-3 text-center">
            <div className="mb-2">
              Level: {level} | Task: {currentTaskIndex + 1}/{totalTasks} |
              Correct: {correctTasks}
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
                minWidth: "700px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: "2rem",
                  fontWeight: "bold",
                  color: "#4ECDC4",
                  marginBottom: "1.5rem",
                }}
              >
                Find all: {currentTask.category}
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
                    ? "✓ Perfect Selection!"
                    : "✗ Wrong Selection!"}
                  {feedbackType === "incorrect" && (
                    <div
                      style={{
                        fontSize: "1rem",
                        marginTop: "0.5rem",
                        color: "#ccc",
                      }}
                    >
                      Correct: {currentTask.correctItems.join(", ")}
                    </div>
                  )}
                </div>
              )}

              {!showFeedback && gameStarted && (
                <div className="selection-area">
                  <div
                    className="item-grid"
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(140px, 1fr))",
                      gap: "12px",
                      marginBottom: "2rem",
                      minHeight: "120px",
                    }}
                  >
                    {currentTask.allItems.map((item, index) => (
                      <div
                        key={index}
                        onClick={() => handleItemClick(item)}
                        style={{
                          backgroundColor: selectedItems.includes(item)
                            ? "#4ECDC4"
                            : "#1a1a1a",
                          color: selectedItems.includes(item) ? "#000" : "#fff",
                          border: `2px solid ${
                            selectedItems.includes(item) ? "#4ECDC4" : "#666"
                          }`,
                          borderRadius: "8px",
                          padding: "12px",
                          cursor: "pointer",
                          textAlign: "center",
                          fontSize: "1.1rem",
                          fontWeight: "bold",
                          transition: "all 0.2s ease",
                          userSelect: "none",
                          transform: selectedItems.includes(item)
                            ? "scale(1.05)"
                            : "scale(1)",
                        }}
                        onMouseEnter={(e) => {
                          if (!selectedItems.includes(item)) {
                            e.target.style.backgroundColor = "#333";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!selectedItems.includes(item)) {
                            e.target.style.backgroundColor = "#1a1a1a";
                          }
                        }}
                      >
                        {item}
                      </div>
                    ))}
                  </div>

                  <div
                    className="selection-info"
                    style={{ marginBottom: "1rem", color: "#ccc" }}
                  >
                    Selected: {selectedItems.length} items
                  </div>

                  <button
                    onClick={handleSubmitSelection}
                    disabled={selectedItems.length === 0}
                    style={{
                      backgroundColor:
                        selectedItems.length > 0 ? "#4ECDC4" : "#666",
                      color: selectedItems.length > 0 ? "#000" : "#999",
                      border: "none",
                      borderRadius: "8px",
                      padding: "12px 24px",
                      fontSize: "1.2rem",
                      fontWeight: "bold",
                      cursor:
                        selectedItems.length > 0 ? "pointer" : "not-allowed",
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      if (selectedItems.length > 0) {
                        e.target.style.backgroundColor = "#45B7B8";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedItems.length > 0) {
                        e.target.style.backgroundColor = "#4ECDC4";
                      }
                    }}
                  >
                    Submit Selection
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
                  Get ready to categorize!
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

export default function CategoryStorm({ token }) {
  return (
    <GameWindow>
      <GameLayout
        introSlides={introSlides}
        helpText="Quickly identify all items that belong to the given category! Click items to select them, then submit your choices. Speed and accuracy both matter."
        gameName="Category Storm"
        fetchUserGameProgress={fetchUserGameProgress}
        submitGameScore={submitCategoryStorm}
        initialLevel={1}
        maxLevel={10}
        onGameStart={(level, { resetProgress }) => resetProgress(level)}
        onGameRestart={() => window.location.reload()}
        onGameQuit={() => window.location.assign("/games/speed")}
        token={token}
      >
        {(game) => (
          <CategoryStormGame
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
