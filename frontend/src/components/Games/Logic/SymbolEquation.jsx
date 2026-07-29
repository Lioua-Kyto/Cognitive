import { useState, useEffect, useRef } from "react";
import GameWindow from "../GameWindow.jsx";
import GameLayout from "../Layout/GameLayout.jsx";
import { submitSymbolEquation } from "../../../api/games.jsx";
import { fetchUserGameProgress } from "../../../api/score.jsx";
import "../Styles/games.css";

function generateSymbolEquation(level) {
  const symbols = ["★", "♦", "●", "▲", "♠", "♥", "♣", "◆", "■", "▼"];
  const usedSymbols = symbols.slice(0, Math.min(3 + Math.floor(level / 2), 6));

  // Generate values for symbols (1-9)
  const symbolValues = {};
  usedSymbols.forEach((symbol) => {
    symbolValues[symbol] = Math.floor(Math.random() * 9) + 1;
  });

  const equations = [];
  const targetSymbol =
    usedSymbols[Math.floor(Math.random() * usedSymbols.length)];

  // Generate 2-3 equations to establish symbol values
  const numEquations = Math.min(2 + Math.floor(level / 3), 3);

  for (let i = 0; i < numEquations; i++) {
    const equationSymbols = usedSymbols.slice(
      0,
      Math.min(2 + Math.floor(level / 4), 3)
    );
    const operations = ["+", "-", "*"];
    const operation = operations[Math.floor(Math.random() * operations.length)];

    let leftSide, rightSide, result;

    if (equationSymbols.length >= 2) {
      const symbol1 = equationSymbols[0];
      const symbol2 = equationSymbols[1];
      const value1 = symbolValues[symbol1];
      const value2 = symbolValues[symbol2];

      switch (operation) {
        case "+":
          result = value1 + value2;
          break;
        case "-":
          result = Math.abs(value1 - value2);
          break;
        case "*":
          result = value1 * value2;
          break;
      }

      leftSide = `${symbol1} ${operation} ${symbol2}`;
      rightSide = result.toString();
    } else {
      // Simple equation
      const symbol = equationSymbols[0];
      const value = symbolValues[symbol];
      const constant = Math.floor(Math.random() * 5) + 1;

      switch (operation) {
        case "+":
          result = value + constant;
          leftSide = `${symbol} + ${constant}`;
          break;
        case "-":
          result = Math.abs(value - constant);
          leftSide = `${symbol} - ${constant}`;
          break;
        case "*":
          result = value * constant;
          leftSide = `${symbol} × ${constant}`;
          break;
      }

      rightSide = result.toString();
    }

    equations.push({
      left: leftSide,
      right: rightSide,
      result: result,
    });
  }

  // Create the question equation
  const questionOperations = ["+", "-", "*"];
  const questionOp =
    questionOperations[Math.floor(Math.random() * questionOperations.length)];
  const otherSymbol = usedSymbols.find((s) => s !== targetSymbol);

  let questionEquation, correctAnswer;

  if (otherSymbol && Math.random() < 0.7) {
    // Two symbol equation
    const value1 = symbolValues[targetSymbol];
    const value2 = symbolValues[otherSymbol];

    switch (questionOp) {
      case "+":
        correctAnswer = value1 + value2;
        break;
      case "-":
        correctAnswer = Math.abs(value1 - value2);
        break;
      case "*":
        correctAnswer = value1 * value2;
        break;
    }

    questionEquation = `${targetSymbol} ${questionOp} ${otherSymbol} = ?`;
  } else {
    // Single symbol with constant
    const value = symbolValues[targetSymbol];
    const constant = Math.floor(Math.random() * 5) + 1;

    switch (questionOp) {
      case "+":
        correctAnswer = value + constant;
        questionEquation = `${targetSymbol} + ${constant} = ?`;
        break;
      case "-":
        correctAnswer = Math.abs(value - constant);
        questionEquation = `${targetSymbol} - ${constant} = ?`;
        break;
      case "*":
        correctAnswer = value * constant;
        questionEquation = `${targetSymbol} × ${constant} = ?`;
        break;
    }
  }

  // Generate multiple choice options
  const options = [correctAnswer];
  while (options.length < 4) {
    const wrong = correctAnswer + Math.floor(Math.random() * 10) - 5;
    if (wrong > 0 && wrong <= 50 && !options.includes(wrong)) {
      options.push(wrong);
    }
  }

  return {
    equations: equations,
    questionEquation: questionEquation,
    symbolValues: symbolValues,
    correctAnswer: correctAnswer,
    options: options.sort(() => Math.random() - 0.5),
  };
}

const introSlides = [
  {
    title: "Why Symbol Equation?",
    desc: "This game enhances your algebraic thinking, pattern recognition, and logical deduction. It builds the foundation for mathematical reasoning and problem-solving.",
    img: "/images/brain-idea.svg",
  },
  {
    title: "Benefits",
    desc: "• Improves algebraic thinking\n• Enhances pattern recognition\n• Develops logical deduction\n• Builds mathematical reasoning",
    img: "/images/brain-benefit.svg",
  },
  {
    title: "How to Play",
    desc: "Use the given equations to figure out what each symbol represents. Then solve the final equation with the unknown value!",
    img: "/images/brain-tutorial.svg",
  },
];

function SymbolEquationGame({
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
  const totalPuzzles = Math.min(6 + level, 12); // 7-12 puzzles

  // Initialize new game when level changes
  useEffect(() => {
    const newPuzzles = [];
    for (let i = 0; i < totalPuzzles; i++) {
      newPuzzles.push(generateSymbolEquation(level));
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
    if (!gameStarted || result || showFeedback || selectedOption === null)
      return;

    const isCorrect = selectedOption === currentPuzzle.correctAnswer;
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

    // Show feedback briefly, then move to next puzzle or finish
    setTimeout(() => {
      setShowFeedback(false);
      const nextIndex = currentPuzzleIndex + 1;
      const completed = nextIndex >= totalPuzzles;
      const finalCorrect = isCorrect ? correctPuzzles + 1 : correctPuzzles;

      if (completed) {
        const passed = Math.round((finalCorrect / totalPuzzles) * 100) >= 70;
        if (passed) {
          if (handleGameComplete) {
            handleGameComplete({
              equation: puzzles.map((p) => p.questionEquation),
              user_solution: [...allUserSolutions, selectedOption],
              message: "Symbol solver!",
            });
          }
        } else {
          handleGameOver({
            equation: puzzles.map((p) => p.questionEquation),
            user_solution: [...allUserSolutions, selectedOption],
            message: "Need better deduction skills!",
          });
        }
      } else {
        // Next puzzle
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
        equation: puzzles.map((puzzle) => puzzle.questionEquation),
        user_solution: allUserSolutions,
        message: "Time's up!",
      });
    }
  }, [timer, result, handleGameOver, puzzles, allUserSolutions]);

  const accuracy =
    totalPuzzles > 0
      ? Math.round((correctPuzzles / Math.max(currentPuzzleIndex, 1)) * 100)
      : 0;

  return (
    <div className="symbol-equation-container">
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
                minWidth: "700px",
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
                Deduce the symbol values and solve:
              </div>

              {/* Known Equations */}
              <div
                className="known-equations"
                style={{
                  backgroundColor: "#1a1a1a",
                  border: "2px solid #666",
                  borderRadius: "10px",
                  padding: "1.5rem",
                  marginBottom: "2rem",
                }}
              >
                <div
                  style={{
                    fontSize: "1.2rem",
                    color: "#4ECDC4",
                    marginBottom: "1rem",
                    fontWeight: "bold",
                  }}
                >
                  Given:
                </div>
                {currentPuzzle.equations.map((equation, index) => (
                  <div
                    key={index}
                    style={{
                      fontSize: "1.8rem",
                      fontWeight: "bold",
                      color: "#fff",
                      marginBottom: "0.5rem",
                      fontFamily: "monospace",
                    }}
                  >
                    {equation.left} = {equation.right}
                  </div>
                ))}
              </div>

              {/* Question */}
              <div
                className="question-equation"
                style={{
                  backgroundColor: "#333",
                  border: "3px solid #4ECDC4",
                  borderRadius: "10px",
                  padding: "1.5rem",
                  marginBottom: "2rem",
                }}
              >
                <div
                  style={{
                    fontSize: "1.2rem",
                    color: "#4ECDC4",
                    marginBottom: "1rem",
                    fontWeight: "bold",
                  }}
                >
                  Find:
                </div>
                <div
                  style={{
                    fontSize: "2.5rem",
                    fontWeight: "bold",
                    color: "#fff",
                    fontFamily: "monospace",
                  }}
                >
                  {currentPuzzle.questionEquation}
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
                    ? "✓ Correct Solution!"
                    : `✗ Wrong! Answer: ${currentPuzzle.correctAnswer}`}
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
                    disabled={selectedOption === null}
                    style={{
                      backgroundColor:
                        selectedOption !== null ? "#4ECDC4" : "#666",
                      color: selectedOption !== null ? "#000" : "#999",
                      border: "none",
                      borderRadius: "8px",
                      padding: "12px 24px",
                      fontSize: "1.2rem",
                      fontWeight: "bold",
                      cursor:
                        selectedOption !== null ? "pointer" : "not-allowed",
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      if (selectedOption !== null) {
                        e.target.style.backgroundColor = "#45B7B8";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedOption !== null) {
                        e.target.style.backgroundColor = "#4ECDC4";
                      }
                    }}
                  >
                    Submit Solution
                  </button>
                </div>
              )}

        {!gameStarted && <div style={{ height: "24px" }} />}
            </div>
          )}
      {/* In-game instruction text removed; instructions live in intro panel */}
        </div>
      )}
    </div>
  );
}

export default function SymbolEquation({ token }) {
  return (
    <GameWindow>
      <GameLayout
        introSlides={introSlides}
        helpText="Use logical deduction to figure out what each symbol represents from the given equations. Then solve the final equation with the unknown value!"
        gameName="Symbol Equation"
        fetchUserGameProgress={fetchUserGameProgress}
        submitGameScore={submitSymbolEquation}
        initialLevel={1}
        maxLevel={10}
        onGameStart={(level, { resetProgress }) => resetProgress(level)}
        onGameRestart={() => window.location.reload()}
        onGameQuit={() => window.location.assign("/games/logic")}
        token={token}
      >
        {(game) => (
          <SymbolEquationGame
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
