import { useState, useEffect, useRef } from "react";
import GameWindow from "../GameWindow.jsx";
import GameLayout from "../Layout/GameLayout.jsx";
import { submitMathLogic } from "../../../api/games.jsx";
import { fetchUserGameProgress } from "../../../api/score.jsx";

function generateMathPuzzle(level) {
  const puzzleTypes = [
    "missing_number",
    "equation_balance",
    "number_sequence",
    "algebraic",
  ];
  const puzzleType =
    puzzleTypes[
      Math.floor(
        Math.random() * Math.min(puzzleTypes.length, 2 + Math.floor(level / 2))
      )
    ];

  let puzzle = "";
  let solution = "";
  let options = [];

  switch (puzzleType) {
    case "missing_number":
      // Pattern: a + b = c, find missing number
      const a = Math.floor(Math.random() * (10 + level * 5)) + 1;
      const b = Math.floor(Math.random() * (10 + level * 5)) + 1;
      const c = a + b;

      const missingPos = Math.floor(Math.random() * 3);
      if (missingPos === 0) {
        puzzle = `? + ${b} = ${c}`;
        solution = a.toString();
      } else if (missingPos === 1) {
        puzzle = `${a} + ? = ${c}`;
        solution = b.toString();
      } else {
        puzzle = `${a} + ${b} = ?`;
        solution = c.toString();
      }

      // Generate wrong options
      options = [solution];
      while (options.length < 4) {
        const wrong = (
          parseInt(solution) +
          Math.floor(Math.random() * 10) -
          5
        ).toString();
        if (
          wrong !== solution &&
          parseInt(wrong) > 0 &&
          !options.includes(wrong)
        ) {
          options.push(wrong);
        }
      }
      break;

    case "equation_balance":
      // Balance equations like: 2 × 3 = 3 + ?
      const x = Math.floor(Math.random() * 8) + 2;
      const y = Math.floor(Math.random() * 8) + 2;
      const product = x * y;
      const z = Math.floor(Math.random() * product) + 1;

      puzzle = `${x} × ${y} = ${z} + ?`;
      solution = (product - z).toString();

      options = [solution];
      while (options.length < 4) {
        const wrong = (
          parseInt(solution) +
          Math.floor(Math.random() * 8) -
          4
        ).toString();
        if (
          wrong !== solution &&
          parseInt(wrong) >= 0 &&
          !options.includes(wrong)
        ) {
          options.push(wrong);
        }
      }
      break;

    case "number_sequence":
      // Arithmetic sequences
      const start = Math.floor(Math.random() * 20) + 1;
      const diff = Math.floor(Math.random() * 5) + 1;
      const length = 4 + Math.floor(level / 2);

      const sequence = [];
      for (let i = 0; i < length; i++) {
        sequence.push(start + i * diff);
      }

      // Remove one number randomly (not first or last)
      const missingIndex = Math.floor(Math.random() * (length - 2)) + 1;
      const missing = sequence[missingIndex];
      sequence[missingIndex] = "?";

      puzzle = sequence.join(", ");
      solution = missing.toString();

      options = [solution];
      while (options.length < 4) {
        const wrong = (missing + Math.floor(Math.random() * 10) - 5).toString();
        if (
          wrong !== solution &&
          parseInt(wrong) > 0 &&
          !options.includes(wrong)
        ) {
          options.push(wrong);
        }
      }
      break;

    case "algebraic":
      // Simple algebra: 2x + 3 = 11, find x
      const coefficient = Math.floor(Math.random() * 5) + 2;
      const constant = Math.floor(Math.random() * 10) + 1;
      const xValue = Math.floor(Math.random() * 8) + 1;
      const result = coefficient * xValue + constant;

      puzzle = `${coefficient}x + ${constant} = ${result}`;
      solution = xValue.toString();

      options = [solution];
      while (options.length < 4) {
        const wrong = (xValue + Math.floor(Math.random() * 6) - 3).toString();
        if (
          wrong !== solution &&
          parseInt(wrong) > 0 &&
          !options.includes(wrong)
        ) {
          options.push(wrong);
        }
      }
      break;
  }

  // Shuffle options
  options = options.sort(() => Math.random() - 0.5);

  return {
    puzzle: puzzle,
    solution: solution,
    options: options,
    type: puzzleType,
  };
}

const introSlides = [
  {
    title: "Why Math Logic?",
    desc: "This game enhances your mathematical reasoning, problem-solving skills, and logical thinking. It combines math skills with pattern recognition and deductive reasoning.",
    img: "/images/brain-idea.svg",
  },
  {
    title: "Benefits",
    desc: "• Improves mathematical reasoning\n• Enhances problem-solving skills\n• Develops logical thinking\n• Builds numerical fluency",
    img: "/images/brain-benefit.svg",
  },
  {
    title: "How to Play",
    desc: "Solve mathematical puzzles and logic problems! Find missing numbers, balance equations, complete sequences, and solve algebraic problems.",
    img: "/images/brain-tutorial.svg",
  },
];

function MathLogicGame({
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
  const [allUserSolutions, setAllUserSolutions] = useState([]);
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
      newPuzzles.push(generateMathPuzzle(level));
    }
    setPuzzles(newPuzzles);
    setCurrentPuzzleIndex(0);
    setCurrentPuzzle(newPuzzles[0]);
    setSelectedOption(null);
    setAllUserSolutions([]);
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

  const handleSubmitSolution = () => {
    if (!gameStarted || result || showFeedback || !selectedOption) return;

    const isCorrect = selectedOption === currentPuzzle.solution;
    setAllUserSolutions((prev) => [...prev, selectedOption]);

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
              puzzle: puzzles.map((puzzle) => puzzle.puzzle),
              user_solution: [...allUserSolutions, selectedOption],
              message: "Math genius!",
            });
          }
        } else {
          handleGameOver({
            puzzle: puzzles.map((puzzle) => puzzle.puzzle),
            user_solution: [...allUserSolutions, selectedOption],
            message: "Need better math skills!",
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
        puzzle: puzzles.map((puzzle) => puzzle.puzzle),
        user_solution: allUserSolutions,
        message: "Time's up!",
      });
    }
  }, [timer, result, handleGameOver, puzzles, allUserSolutions]);

  const getPuzzleTypeDescription = (type) => {
    switch (type) {
      case "missing_number":
        return "Find the missing number";
      case "equation_balance":
        return "Balance the equation";
      case "number_sequence":
        return "Complete the sequence";
      case "algebraic":
        return "Solve for x";
      default:
        return "Solve the puzzle";
    }
  };

  const accuracy =
    totalPuzzles > 0
      ? Math.round((correctPuzzles / Math.max(currentPuzzleIndex, 1)) * 100)
      : 0;

  return (
    <div className="math-logic-container">
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
                minWidth: "600px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: "1.3rem",
                  fontWeight: "bold",
                  color: "#4ECDC4",
                  marginBottom: "1rem",
                }}
              >
                {getPuzzleTypeDescription(currentPuzzle.type)}
              </div>

              {/* Puzzle Display */}
              <div
                className="puzzle-content"
                style={{
                  backgroundColor: "#1a1a1a",
                  border: "2px solid #666",
                  borderRadius: "10px",
                  padding: "2rem",
                  marginBottom: "2rem",
                  fontSize: "2.5rem",
                  fontWeight: "bold",
                  color: "#fff",
                  fontFamily: "monospace",
                  minHeight: "80px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {currentPuzzle.puzzle}
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
                    ? "✓ Correct Solution!"
                    : `✗ Wrong! Answer: ${currentPuzzle.solution}`}
                </div>
              )}

              {!showFeedback && gameStarted && (
                <div className="options-area">
                  <div
                    className="options-grid"
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(2, 1fr)",
                      gap: "15px",
                      marginBottom: "2rem",
                      maxWidth: "400px",
                      margin: "0 auto 2rem auto",
                    }}
                  >
                    {currentPuzzle.options.map((option, index) => (
                      <button
                        key={index}
                        onClick={() => handleOptionSelect(option)}
                        style={{
                          backgroundColor:
                            selectedOption === option ? "#4ECDC4" : "#333",
                          color: selectedOption === option ? "#000" : "#fff",
                          border: `3px solid ${
                            selectedOption === option ? "#4ECDC4" : "#666"
                          }`,
                          borderRadius: "10px",
                          padding: "15px 20px",
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                          fontSize: "1.5rem",
                          fontWeight: "bold",
                          minHeight: "60px",
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
                        {option}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={handleSubmitSolution}
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
                    Submit Solution
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
                  Get ready to solve math puzzles!
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
              Solve mathematical logic puzzles!
            </div>
            <div style={{ fontSize: "0.9rem", opacity: 0.8 }}>
              Find missing numbers • Balance equations • Complete sequences •
              Solve for variables • Need 70% accuracy
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MathLogic({ token }) {
  return (
    <GameWindow>
      <GameLayout
        introSlides={introSlides}
        helpText="Solve various mathematical logic puzzles! Use your reasoning skills to find missing numbers, balance equations, complete sequences, and solve algebraic problems."
        gameName="Math Logic"
        fetchUserGameProgress={fetchUserGameProgress}
        submitGameScore={submitMathLogic}
        initialLevel={1}
        maxLevel={10}
        onGameStart={(level, { resetProgress }) => resetProgress(level)}
        onGameRestart={() => window.location.reload()}
        onGameQuit={() => window.location.assign("/games/logic")}
        token={token}
      >
        {(game) => (
          <MathLogicGame
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
