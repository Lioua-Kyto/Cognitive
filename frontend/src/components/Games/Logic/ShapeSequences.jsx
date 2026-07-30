import { useState, useEffect, useRef } from "react";
import GameWindow from "../GameWindow.jsx";
import GameLayout from "../Layout/GameLayout.jsx";
import { submitShapeSequences } from "../../../api/games.jsx";
import { fetchUserGameProgress } from "../../../api/score.jsx";

function generateSequence(level) {
  const shapes = [
    "circle",
    "square",
    "triangle",
    "diamond",
    "pentagon",
    "hexagon",
  ];
  const colors = ["red", "blue", "green", "yellow", "purple", "orange"];
  const sizes = ["small", "medium", "large"];

  const sequenceLength = Math.min(4 + level, 8); // 5-8 items in sequence
  const patternTypes = ["shape", "color", "size", "alternating", "arithmetic"];
  const patternType =
    patternTypes[
      Math.floor(Math.random() * Math.min(patternTypes.length, 2 + level))
    ];

  let sequence = [];
  let nextItem = null;

  switch (patternType) {
    case "shape":
      // Shape rotation pattern
      const shapeSet = shapes.slice(0, Math.min(3 + Math.floor(level / 2), 6));
      for (let i = 0; i < sequenceLength; i++) {
        sequence.push({
          shape: shapeSet[i % shapeSet.length],
          color: colors[0],
          size: sizes[1],
        });
      }
      nextItem = {
        shape: shapeSet[sequenceLength % shapeSet.length],
        color: colors[0],
        size: sizes[1],
      };
      break;

    case "color":
      // Color rotation pattern
      const colorSet = colors.slice(0, Math.min(3 + Math.floor(level / 2), 6));
      for (let i = 0; i < sequenceLength; i++) {
        sequence.push({
          shape: shapes[0],
          color: colorSet[i % colorSet.length],
          size: sizes[1],
        });
      }
      nextItem = {
        shape: shapes[0],
        color: colorSet[sequenceLength % colorSet.length],
        size: sizes[1],
      };
      break;

    case "size":
      // Size pattern
      for (let i = 0; i < sequenceLength; i++) {
        sequence.push({
          shape: shapes[0],
          color: colors[0],
          size: sizes[i % sizes.length],
        });
      }
      nextItem = {
        shape: shapes[0],
        color: colors[0],
        size: sizes[sequenceLength % sizes.length],
      };
      break;

    case "alternating":
      // Alternating between two patterns
      const pattern1 = { shape: shapes[0], color: colors[0], size: sizes[0] };
      const pattern2 = { shape: shapes[1], color: colors[1], size: sizes[1] };
      for (let i = 0; i < sequenceLength; i++) {
        sequence.push(i % 2 === 0 ? pattern1 : pattern2);
      }
      nextItem = sequenceLength % 2 === 0 ? pattern1 : pattern2;
      break;

    case "arithmetic":
      // Size progression (small -> medium -> large -> small...)
      for (let i = 0; i < sequenceLength; i++) {
        const colorIndex = Math.floor(i / 3) % colors.length;
        sequence.push({
          shape: shapes[0],
          color: colors[colorIndex],
          size: sizes[i % 3],
        });
      }
      const nextColorIndex = Math.floor(sequenceLength / 3) % colors.length;
      nextItem = {
        shape: shapes[0],
        color: colors[nextColorIndex],
        size: sizes[sequenceLength % 3],
      };
      break;
  }

  // Generate multiple choice options
  const options = [nextItem];

  // Add 3 incorrect options
  while (options.length < 4) {
    const wrongOption = {
      shape: shapes[Math.floor(Math.random() * shapes.length)],
      color: colors[Math.floor(Math.random() * colors.length)],
      size: sizes[Math.floor(Math.random() * sizes.length)],
    };

    // Make sure it's different from the correct answer
    if (
      !options.some(
        (opt) =>
          opt.shape === wrongOption.shape &&
          opt.color === wrongOption.color &&
          opt.size === wrongOption.size
      )
    ) {
      options.push(wrongOption);
    }
  }

  // Shuffle options
  const shuffledOptions = options.sort(() => Math.random() - 0.5);

  return {
    sequence: sequence,
    correctAnswer: nextItem,
    options: shuffledOptions,
    pattern: patternType,
  };
}

const introSlides = [
  {
    title: "Why Shape Sequences?",
    desc: "This game enhances your pattern recognition, logical reasoning, and sequential processing. It trains your brain to identify and predict complex patterns.",
    img: "/images/brain-idea.svg",
  },
  {
    title: "Benefits",
    desc: "• Improves pattern recognition\n• Enhances logical reasoning\n• Develops sequential thinking\n• Builds prediction skills",
    img: "/images/brain-benefit.svg",
  },
  {
    title: "How to Play",
    desc: "Study the sequence of shapes and identify the pattern. Then choose which shape comes next from the multiple choice options!",
    img: "/images/brain-tutorial.svg",
  },
];

function ShapeSequencesGame({
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
  const [puzzles, setPuzzles] = useState([]);
  const [currentPuzzleIndex, setCurrentPuzzleIndex] = useState(0);
  const [currentPuzzle, setCurrentPuzzle] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [allUserGuesses, setAllUserGuesses] = useState([]);
  const [correctPuzzles, setCorrectPuzzles] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackType, setFeedbackType] = useState("");
  const gameStartedRef = useRef(false);
  const totalPuzzles = Math.min(8 + level, 15); // 9-15 puzzles

  // Initialize new game when level changes
  useEffect(() => {
    const newPuzzles = [];
    for (let i = 0; i < totalPuzzles; i++) {
      newPuzzles.push(generateSequence(level));
    }
    setPuzzles(newPuzzles);
    setCurrentPuzzleIndex(0);
    setCurrentPuzzle(newPuzzles[0]);
    setSelectedOption(null);
    setAllUserGuesses([]);
    setCorrectPuzzles(0);
    setGameStarted(false);
    setShowFeedback(false);
    gameStartedRef.current = false;
  }, [level, totalPuzzles]);

  // Start game
  useEffect(() => {
    if (puzzles.length > 0 && !gameStarted) {
      const startTimer = setTimeout(() => {
        setGameStarted(true);
        gameStartedRef.current = true;
      }, 1000);

      return () => clearTimeout(startTimer);
    }
  }, [puzzles, gameStarted]);

  const handleOptionSelect = (option) => {
    if (!gameStarted || result || showFeedback) return;
    setSelectedOption(option);
  };

  const handleSubmitGuess = () => {
    if (!gameStarted || result || showFeedback || !selectedOption) return;

    const isCorrect =
      selectedOption.shape === currentPuzzle.correctAnswer.shape &&
      selectedOption.color === currentPuzzle.correctAnswer.color &&
      selectedOption.size === currentPuzzle.correctAnswer.size;

    setAllUserGuesses((prev) => [...prev, selectedOption]);

    if (isCorrect) {
      if (playCorrect) playCorrect();
      setCorrectPuzzles((prev) => prev + 1);
      setFeedbackType("correct");

      handleSuccess({
        timeLeft: timer,
        timer: 120,
        isCorrect: true,
      });
    } else {
      if (playWrong) playWrong();
      if (handleWrong) handleWrong();
      if (setMistakes) setMistakes((prev) => prev + 1);
      setFeedbackType("incorrect");

      // Penalty: reduce timer
      setTimer((prev) => Math.max(0, prev - 5));
      if (triggerMinusFive) triggerMinusFive();
    }

    setShowFeedback(true);

    // Show feedback briefly, then move to next puzzle
    setTimeout(() => {
      setShowFeedback(false);

      if (currentPuzzleIndex + 1 >= totalPuzzles) {
        // Game complete
        const accuracy =
          ((correctPuzzles + (isCorrect ? 1 : 0)) / totalPuzzles) * 100;

        if (accuracy >= 70) {
          if (handleGameComplete) {
            handleGameComplete({
              sequence: puzzles
                .map((puzzle) => puzzle.sequence.join(","))
                .join(" | "),
              user_guess: [...allUserGuesses, selectedOption].join(" | "),
              message: "Pattern master!",
            });
          }
        } else {
          handleGameOver({
            sequence: puzzles
              .map((puzzle) => puzzle.sequence.join(","))
              .join(" | "),
            user_guess: [...allUserGuesses, selectedOption].join(" | "),
            message: "Need better pattern recognition!",
          });
        }
      } else {
        // Next puzzle
        const nextIndex = currentPuzzleIndex + 1;
        setCurrentPuzzleIndex(nextIndex);
        setCurrentPuzzle(puzzles[nextIndex]);
        setSelectedOption(null);
      }
    }, 1500);
  };

  // Handle game over when timer runs out
  useEffect(() => {
    if (timer === 0 && !result && gameStartedRef.current) {
      handleGameOver({
        sequence: puzzles.map((puzzle) => puzzle.sequence),
        user_guess: allUserGuesses,
        message: "Time's up!",
      });
    }
  }, [timer, result, handleGameOver, puzzles, allUserGuesses]);

  const renderShape = (item, size = "normal") => {
    const baseSize = size === "large" ? 60 : size === "small" ? 30 : 40;
    const actualSize =
      item.size === "large"
        ? baseSize * 1.3
        : item.size === "small"
        ? baseSize * 0.7
        : baseSize;

    const shapeStyle = {
      width: `${actualSize}px`,
      height: `${actualSize}px`,
      backgroundColor: item.color,
      display: "inline-block",
      margin: "5px",
    };

    switch (item.shape) {
      case "circle":
        return <div style={{ ...shapeStyle, borderRadius: "50%" }} />;
      case "square":
        return <div style={shapeStyle} />;
      case "triangle":
        return (
          <div
            style={{
              width: 0,
              height: 0,
              borderLeft: `${actualSize / 2}px solid transparent`,
              borderRight: `${actualSize / 2}px solid transparent`,
              borderBottom: `${actualSize}px solid ${item.color}`,
              margin: "5px",
            }}
          />
        );
      case "diamond":
        return (
          <div
            style={{
              width: `${actualSize}px`,
              height: `${actualSize}px`,
              backgroundColor: item.color,
              transform: "rotate(45deg)",
              margin: "5px",
            }}
          />
        );
      case "pentagon":
        return (
          <div
            style={{
              width: `${actualSize}px`,
              height: `${actualSize}px`,
              backgroundColor: item.color,
              clipPath: "polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)",
              margin: "5px",
            }}
          />
        );
      case "hexagon":
        return (
          <div
            style={{
              width: `${actualSize}px`,
              height: `${actualSize}px`,
              backgroundColor: item.color,
              clipPath:
                "polygon(30% 0%, 70% 0%, 100% 50%, 70% 100%, 30% 100%, 0% 50%)",
              margin: "5px",
            }}
          />
        );
      default:
        return <div style={shapeStyle} />;
    }
  };

  const accuracy =
    totalPuzzles > 0
      ? Math.round((correctPuzzles / Math.max(currentPuzzleIndex, 1)) * 100)
      : 0;

  return (
    <div className="shape-sequences-container">
      {!result && (
        <div className="flex-grow-1 w-100 d-flex flex-column align-items-center justify-content-center">
          {/* Game Stats */}
          <div className="game-stats text-white mb-3 text-center">
            <div className="mb-2">
              Level: {level} | Puzzle: {currentPuzzleIndex + 1}/{totalPuzzles} |
              Correct: {correctPuzzles}
            </div>
            <div className="mb-2">
              XP: {xp} / {xpToNextLevel} | Accuracy: {accuracy}%
            </div>
          </div>

          {/* Puzzle Display */}
          {currentPuzzle && (
            <div
              className="puzzle-display"
              style={{
                backgroundColor: "#2a2a2a",
                border: "3px solid #4a4a4a",
                borderRadius: "15px",
                padding: "2rem",
                marginBottom: "2rem",
                minWidth: "800px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: "1.5rem",
                  fontWeight: "bold",
                  color: "#4ECDC4",
                  marginBottom: "1.5rem",
                }}
              >
                Find the pattern and choose what comes next:
              </div>

              {/* Sequence Display */}
              <div
                className="sequence-display"
                style={{
                  backgroundColor: "#1a1a1a",
                  border: "2px solid #666",
                  borderRadius: "10px",
                  padding: "1.5rem",
                  marginBottom: "2rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexWrap: "wrap",
                  minHeight: "100px",
                }}
              >
                {currentPuzzle.sequence.map((item, index) => (
                  <div key={index} style={{ margin: "10px" }}>
                    {renderShape(item, "large")}
                  </div>
                ))}
                <div
                  style={{
                    fontSize: "3rem",
                    color: "#4ECDC4",
                    margin: "0 20px",
                    fontWeight: "bold",
                  }}
                >
                  ?
                </div>
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
                    ? "✓ Correct Pattern!"
                    : "✗ Wrong! Try again!"}
                </div>
              )}

              {!showFeedback && gameStarted && (
                <div className="options-area">
                  <div
                    className="options-grid"
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(2, 1fr)",
                      gap: "20px",
                      marginBottom: "2rem",
                      maxWidth: "400px",
                      margin: "0 auto 2rem auto",
                    }}
                  >
                    {currentPuzzle.options.map((option, index) => (
                      <div
                        key={index}
                        onClick={() => handleOptionSelect(option)}
                        style={{
                          backgroundColor:
                            selectedOption === option ? "#4ECDC4" : "#333",
                          border: `3px solid ${
                            selectedOption === option ? "#4ECDC4" : "#666"
                          }`,
                          borderRadius: "10px",
                          padding: "20px",
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          minHeight: "80px",
                          transform:
                            selectedOption === option
                              ? "scale(1.05)"
                              : "scale(1)",
                        }}
                        onMouseEnter={(e) => {
                          if (selectedOption !== option) {
                            e.target.style.backgroundColor = "#444";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (selectedOption !== option) {
                            e.target.style.backgroundColor = "#333";
                          }
                        }}
                      >
                        {renderShape(option)}
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={handleSubmitGuess}
                    disabled={!selectedOption}
                    style={{
                      backgroundColor: selectedOption ? "#4ECDC4" : "#666",
                      color: selectedOption ? "#000" : "#999",
                      border: "none",
                      borderRadius: "8px",
                      padding: "12px 24px",
                      fontSize: "1.2rem",
                      fontWeight: "bold",
                      cursor: selectedOption ? "pointer" : "not-allowed",
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      if (selectedOption) {
                        e.target.style.backgroundColor = "#45B7B8";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedOption) {
                        e.target.style.backgroundColor = "#4ECDC4";
                      }
                    }}
                  >
                    Submit Answer
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
                  Get ready to find patterns!
                </div>
              )}
            </div>
          )}

          {/* Instructions */}
          <div
            className="text-white text-center"
            style={{ fontSize: "1.1rem", maxWidth: "600px" }}
          >
            <div
              className="mb-2"
              style={{ fontSize: "1.3rem", fontWeight: "bold" }}
            >
              Identify the pattern and predict what comes next!
            </div>
            <div style={{ fontSize: "0.9rem", opacity: 0.8 }}>
              Study the sequence • Find the pattern • Choose the correct next
              shape • Need 70% accuracy
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ShapeSequences({ token }) {
  return (
    <GameWindow>
      <GameLayout
        introSlides={introSlides}
        helpText="Study the sequence of shapes and identify the pattern. Choose which shape comes next from the multiple choice options. Look for patterns in shape, color, size, or combinations!"
        gameName="Shape Sequences"
        fetchUserGameProgress={fetchUserGameProgress}
        submitGameScore={submitShapeSequences}
        initialLevel={1}
        maxLevel={10}
        onGameStart={(level, { resetProgress }) => resetProgress(level)}
        onGameRestart={() => window.location.reload()}
        onGameQuit={() => window.location.assign("/games/logic")}
        token={token}
      >
        {(game) => (
          <ShapeSequencesGame
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
