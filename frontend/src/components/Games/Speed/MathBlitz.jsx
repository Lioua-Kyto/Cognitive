import { useState, useEffect, useRef } from "react";
import GameWindow from "../GameWindow.jsx";
import GameLayout from "../Layout/GameLayout.jsx";
import { submitMathBlitz } from "../../../api/games.jsx";
import { fetchUserGameProgress } from "../../../api/score.jsx";
import "../Styles/games.css";

function generateEquation(level) {
  const operations = ["+", "-", "*", "/"];
  const maxNumber = Math.min(10 + level * 5, 50); // 15-50 based on level

  let num1, num2, operation, answer;

  // For division, ensure clean results
  if (level > 2 && Math.random() < 0.3) {
    operation = "/";
    // Generate result first, then create equation
    answer = Math.floor(Math.random() * 20) + 1;
    num2 = Math.floor(Math.random() * 9) + 2; // 2-10
    num1 = answer * num2;
  } else {
    operation = operations[Math.floor(Math.random() * (level > 1 ? 4 : 2))]; // Start with +,- only
    num1 = Math.floor(Math.random() * maxNumber) + 1;
    num2 = Math.floor(Math.random() * maxNumber) + 1;

    // Ensure subtraction doesn't go negative
    if (operation === "-" && num2 > num1) {
      [num1, num2] = [num2, num1];
    }

    switch (operation) {
      case "+":
        answer = num1 + num2;
        break;
      case "-":
        answer = num1 - num2;
        break;
      case "*":
        answer = num1 * num2;
        break;
      default:
        answer = num1;
    }
  }

  return {
    equation: `${num1} ${operation} ${num2}`,
    answer: answer,
    display: `${num1} ${operation} ${num2} = ?`,
  };
}

const introSlides = [
  {
    title: "Why Math Blitz?",
    desc: "This game sharpens your mental arithmetic speed and numerical processing. It builds confidence with numbers and improves calculation fluency.",
    img: "/images/brain-idea.svg",
  },
  {
    title: "Benefits",
    desc: "• Improves mental arithmetic speed\n• Enhances numerical processing\n• Builds calculation confidence\n• Develops number sense",
    img: "/images/brain-benefit.svg",
  },
  {
    title: "How to Play",
    desc: "Solve math equations as quickly as possible! Type your answer and press Enter. Speed and accuracy both matter - wrong answers cost time.",
    img: "/images/brain-tutorial.svg",
  },
];

function MathBlitzGame({
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
  const [equations, setEquations] = useState([]);
  const [currentEquationIndex, setCurrentEquationIndex] = useState(0);
  const [currentEquation, setCurrentEquation] = useState(null);
  const [userAnswer, setUserAnswer] = useState("");
  const [userAnswers, setUserAnswers] = useState([]);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackType, setFeedbackType] = useState("");
  const inputRef = useRef();
  const gameStartedRef = useRef(false);
  const totalEquations = Math.min(10 + level * 2, 25); // 12-25 equations

  // Initialize new game when level changes
  useEffect(() => {
    const newEquations = [];
    for (let i = 0; i < totalEquations; i++) {
      newEquations.push(generateEquation(level));
    }
    setEquations(newEquations);
    setCurrentEquationIndex(0);
    setCurrentEquation(newEquations[0]);
    setUserAnswer("");
    setUserAnswers([]);
    setCorrectAnswers(0);
    setGameStarted(false);
    setShowFeedback(false);
    gameStartedRef.current = false;
  }, [level, totalEquations]);

  // Start game and focus input
  useEffect(() => {
    if (equations.length > 0 && !gameStarted) {
      const startTimer = setTimeout(() => {
        setGameStarted(true);
        gameStartedRef.current = true;
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 1000);

      return () => clearTimeout(startTimer);
    }
  }, [equations, gameStarted]);

  const handleAnswerSubmit = (e) => {
    e.preventDefault();
    if (!gameStarted || result || !userAnswer.trim()) return;

    const userNum = parseFloat(userAnswer.trim());
    const isCorrect = Math.abs(userNum - currentEquation.answer) < 0.001; // Handle floating point

    setUserAnswers((prev) => [...prev, userAnswer.trim()]);

    if (isCorrect) {
      if (playCorrect) playCorrect();
      setCorrectAnswers((prev) => prev + 1);
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
    setUserAnswer("");

    // Show feedback briefly, then move to next equation
    setTimeout(() => {
      setShowFeedback(false);

      if (currentEquationIndex + 1 >= totalEquations) {
        // Game complete
        const accuracy =
          ((correctAnswers + (isCorrect ? 1 : 0)) / totalEquations) * 100;

        if (accuracy >= 70) {
          if (handleGameComplete) {
            handleGameComplete({
              equations: equations.map((eq) => eq.equation),
              user_answers: [...userAnswers, userAnswer.trim()],
              message: "Math master!",
            });
          }
        } else {
          handleGameOver({
            equations: equations.map((eq) => eq.equation),
            user_answers: [...userAnswers, userAnswer.trim()],
            message: "Need better accuracy!",
          });
        }
      } else {
        // Next equation
        const nextIndex = currentEquationIndex + 1;
        setCurrentEquationIndex(nextIndex);
        setCurrentEquation(equations[nextIndex]);
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }
    }, 800);
  };

  // Handle game over when timer runs out
  useEffect(() => {
    if (timer === 0 && !result && gameStartedRef.current) {
      handleGameOver({
        equations: equations.map((eq) => eq.equation),
        user_answers: userAnswers,
        message: "Time's up!",
      });
    }
  }, [timer, result, handleGameOver, equations, userAnswers]);

  const accuracy =
    totalEquations > 0
      ? Math.round((correctAnswers / Math.max(currentEquationIndex, 1)) * 100)
      : 0;

  return (
    <div className="math-blitz-container">
      {!result && (
        <div className="flex-grow-1 w-100 d-flex flex-column align-items-center justify-content-center">
          {/* Game Stats */}
          <div className="game-stats text-white mb-3 text-center">
            <div className="mb-2">
              Level: {level} | Equation: {currentEquationIndex + 1}/
              {totalEquations} | Correct: {correctAnswers}
            </div>
            <div className="mb-2">
              XP: {xp} / {xpToNextLevel} | Accuracy: {accuracy}%
            </div>
          </div>

          {/* Equation Display */}
          <div
            className="equation-display"
            style={{
              backgroundColor: "#2a2a2a",
              border: "3px solid #4a4a4a",
              borderRadius: "15px",
              padding: "2rem",
              marginBottom: "2rem",
              minWidth: "400px",
              textAlign: "center",
            }}
          >
            {currentEquation && !showFeedback && (
              <div
                style={{
                  fontSize: "3rem",
                  fontWeight: "bold",
                  color: "#fff",
                  marginBottom: "1rem",
                }}
              >
                {currentEquation.display}
              </div>
            )}

            {showFeedback && (
              <div
                style={{
                  fontSize: "2.5rem",
                  fontWeight: "bold",
                  color: feedbackType === "correct" ? "#4ECDC4" : "#FF6B6B",
                  marginBottom: "1rem",
                }}
              >
                {feedbackType === "correct"
                  ? "✓ Correct!"
                  : `✗ Wrong! Answer: ${currentEquation.answer}`}
              </div>
            )}

            {!showFeedback && gameStarted && (
              <form onSubmit={handleAnswerSubmit}>
                <input
                  ref={inputRef}
                  type="number"
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  placeholder="Your answer..."
                  style={{
                    fontSize: "2rem",
                    padding: "0.5rem",
                    border: "2px solid #666",
                    borderRadius: "8px",
                    backgroundColor: "#1a1a1a",
                    color: "#fff",
                    textAlign: "center",
                    width: "200px",
                  }}
                  autoComplete="off"
                />
              </form>
            )}

            {!gameStarted && (
              <div
                style={{
                  fontSize: "1.5rem",
                  color: "#666",
                  fontWeight: "bold",
                }}
              >
                Get ready to calculate!
              </div>
            )}
          </div>

          {/* In-game instruction text removed; instructions live in intro panel */}
        </div>
      )}
    </div>
  );
}

export default function MathBlitz({ token }) {
  return (
    <GameWindow>
      <GameLayout
        introSlides={introSlides}
        helpText="Solve math equations as quickly and accurately as possible! Type your answer and press Enter to submit. Speed and accuracy both contribute to your score."
        gameName="Math Blitz"
        fetchUserGameProgress={fetchUserGameProgress}
        submitGameScore={submitMathBlitz}
        initialLevel={1}
        maxLevel={10}
        onGameStart={(level, { resetProgress }) => resetProgress(level)}
        onGameRestart={() => window.location.reload()}
        onGameQuit={() => window.location.assign("/games/speed")}
        token={token}
      >
        {(game) => (
          <MathBlitzGame
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
