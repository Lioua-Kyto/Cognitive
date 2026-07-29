import { useState, useEffect, useRef } from "react";
import GameWindow from "../GameWindow.jsx";
import GameLayout from "../Layout/GameLayout.jsx";
import { submitOddOneOut } from "../../../api/games.jsx";
import { fetchUserGameProgress } from "../../../api/score.jsx";
import "../Styles/games.css";

// Shape types and colors
const SHAPES = [
  "circle",
  "square",
  "triangle",
  "diamond",
  "pentagon",
  "hexagon",
];
const COLORS = [
  "#FF6B6B",
  "#4ECDC4",
  "#45B7D1",
  "#96CEB4",
  "#FFEAA7",
  "#DDA0DD",
  "#F0A500",
  "#FF8C94",
];

function generateRound(level) {
  const itemCount = Math.min(4 + level, 9); // 5-9 items based on level
  const items = [];

  // Choose random base properties
  const baseShape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
  const baseColor = COLORS[Math.floor(Math.random() * COLORS.length)];
  const baseSize = "medium";

  // Create majority items (all the same)
  for (let i = 0; i < itemCount - 1; i++) {
    items.push({
      id: i,
      shape: baseShape,
      color: baseColor,
      size: baseSize,
      isOdd: false,
    });
  }

  // Create the odd one out
  const oddItem = {
    id: itemCount - 1,
    shape: baseShape,
    color: baseColor,
    size: baseSize,
    isOdd: true,
  };

  // Make it different in one aspect
  const differenceType = Math.floor(Math.random() * 3);
  if (differenceType === 0) {
    // Different shape
    let newShape;
    do {
      newShape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
    } while (newShape === baseShape);
    oddItem.shape = newShape;
  } else if (differenceType === 1) {
    // Different color
    let newColor;
    do {
      newColor = COLORS[Math.floor(Math.random() * COLORS.length)];
    } while (newColor === baseColor);
    oddItem.color = newColor;
  } else {
    // Different size
    oddItem.size = oddItem.size === "medium" ? "large" : "small";
  }

  items.push(oddItem);

  // Shuffle items
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }

  return items;
}

const introSlides = [
  {
    title: "Why Odd One Out?",
    desc: "This game enhances your visual perception and pattern recognition skills. It trains your brain to quickly identify differences and anomalies.",
    img: "/images/brain-idea.svg",
  },
  {
    title: "Benefits",
    desc: "• Improves visual discrimination\n• Enhances pattern recognition\n• Develops attention to detail\n• Strengthens analytical thinking",
    img: "/images/brain-benefit.svg",
  },
  {
    title: "How to Play",
    desc: "Look at all the shapes and find the one that's different from the others. It might differ in shape, color, or size. Click on the odd one out!",
    img: "/images/brain-tutorial.svg",
  },
];

function OddOneOutGame({
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
  const [rounds, setRounds] = useState([]);
  const [currentRound, setCurrentRound] = useState(0);
  const [userChoices, setUserChoices] = useState([]);
  const [currentItems, setCurrentItems] = useState([]);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const gameStartedRef = useRef(false);
  const totalRounds = Math.min(3 + level, 8); // 4-8 rounds based on level

  // Initialize new game when level changes
  useEffect(() => {
    const newRounds = [];
    for (let i = 0; i < totalRounds; i++) {
      newRounds.push(generateRound(level));
    }
    setRounds(newRounds);
    setCurrentRound(0);
    setUserChoices([]);
    setCurrentItems(newRounds[0] || []);
    setCorrectAnswers(0);
    gameStartedRef.current = false;
  }, [level]);

  // Update current items when round changes
  useEffect(() => {
    if (rounds.length > 0 && currentRound < rounds.length) {
      setCurrentItems(rounds[currentRound]);
    }
  }, [rounds, currentRound]);

  const handleItemClick = (itemId) => {
    if (!gameStartedRef.current) {
      gameStartedRef.current = true;
    }

    if (result) return;

    const clickedItem = currentItems.find((item) => item.id === itemId);
    const isCorrect = clickedItem?.isOdd || false;

    setUserChoices((prev) => [...prev, itemId]);

    if (isCorrect) {
      if (playCorrect) playCorrect();
      setCorrectAnswers((prev) => prev + 1);

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
      setTimer((prev) => Math.max(0, prev - 3));
      if (triggerMinusFive) triggerMinusFive();
    }

    // Move to next round or complete game
    setTimeout(() => {
      if (currentRound + 1 >= totalRounds) {
        // Game complete
        const accuracy =
          ((correctAnswers + (isCorrect ? 1 : 0)) / totalRounds) * 100;

        if (accuracy >= 70) {
          if (handleGameComplete) {
            handleGameComplete({
              rounds: rounds.map((round) => ({
                items: round.map((item) => ({
                  shape: item.shape,
                  color: item.color,
                  size: item.size,
                  isOdd: item.isOdd,
                })),
              })),
              user_choices: [...userChoices, itemId],
              message: "Great pattern recognition!",
            });
          }
        } else {
          handleGameOver({
            rounds: rounds.map((round) => ({
              items: round.map((item) => ({
                shape: item.shape,
                color: item.color,
                size: item.size,
                isOdd: item.isOdd,
              })),
            })),
            user_choices: [...userChoices, itemId],
            message: "Need better accuracy!",
          });
        }
      } else {
        setCurrentRound((prev) => prev + 1);
      }
    }, 1000);
  };

  // Handle game over when timer runs out
  useEffect(() => {
    if (timer === 0 && !result && gameStartedRef.current) {
      handleGameOver({
        rounds: rounds.map((round) => ({
          items: round.map((item) => ({
            shape: item.shape,
            color: item.color,
            size: item.size,
            isOdd: item.isOdd,
          })),
        })),
        user_choices: userChoices,
        message: "Time's up!",
      });
    }
  }, [timer, result, handleGameOver, rounds, userChoices]);

  const getShapeComponent = (item) => {
    const sizeMap = {
      small: "40px",
      medium: "60px",
      large: "80px",
    };

    const size = sizeMap[item.size] || "60px";
    const style = {
      width: size,
      height: size,
      backgroundColor: item.color,
      cursor: "pointer",
      transition: "all 0.2s ease",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    };

    const hoverStyle = {
      transform: "scale(1.1)",
      boxShadow: "0 4px 8px rgba(0,0,0,0.3)",
    };

    switch (item.shape) {
      case "circle":
        return (
          <div
            style={{
              ...style,
              borderRadius: "50%",
            }}
            onMouseEnter={(e) => Object.assign(e.target.style, hoverStyle)}
            onMouseLeave={(e) => {
              e.target.style.transform = "scale(1)";
              e.target.style.boxShadow = "none";
            }}
          />
        );
      case "square":
        return (
          <div
            style={{
              ...style,
              borderRadius: "8px",
            }}
            onMouseEnter={(e) => Object.assign(e.target.style, hoverStyle)}
            onMouseLeave={(e) => {
              e.target.style.transform = "scale(1)";
              e.target.style.boxShadow = "none";
            }}
          />
        );
      case "triangle":
        return (
          <div
            style={{
              ...style,
              backgroundColor: "transparent",
              width: "0",
              height: "0",
              borderLeft: `${parseInt(size) / 2}px solid transparent`,
              borderRight: `${parseInt(size) / 2}px solid transparent`,
              borderBottom: `${parseInt(size)}px solid ${item.color}`,
            }}
            onMouseEnter={(e) => Object.assign(e.target.style, hoverStyle)}
            onMouseLeave={(e) => {
              e.target.style.transform = "scale(1)";
              e.target.style.boxShadow = "none";
            }}
          />
        );
      case "diamond":
        return (
          <div
            style={{
              ...style,
              transform: "rotate(45deg)",
              borderRadius: "8px",
            }}
            onMouseEnter={(e) => Object.assign(e.target.style, hoverStyle)}
            onMouseLeave={(e) => {
              e.target.style.transform = "rotate(45deg) scale(1)";
              e.target.style.boxShadow = "none";
            }}
          />
        );
      case "pentagon":
        return (
          <div
            style={{
              ...style,
              clipPath: "polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)",
            }}
            onMouseEnter={(e) => Object.assign(e.target.style, hoverStyle)}
            onMouseLeave={(e) => {
              e.target.style.transform = "scale(1)";
              e.target.style.boxShadow = "none";
            }}
          />
        );
      case "hexagon":
        return (
          <div
            style={{
              ...style,
              clipPath:
                "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)",
            }}
            onMouseEnter={(e) => Object.assign(e.target.style, hoverStyle)}
            onMouseLeave={(e) => {
              e.target.style.transform = "scale(1)";
              e.target.style.boxShadow = "none";
            }}
          />
        );
      default:
        return (
          <div
            style={{
              ...style,
              borderRadius: "50%",
            }}
            onMouseEnter={(e) => Object.assign(e.target.style, hoverStyle)}
            onMouseLeave={(e) => {
              e.target.style.transform = "scale(1)";
              e.target.style.boxShadow = "none";
            }}
          />
        );
    }
  };

  return (
    <div className="odd-one-out-container">
      {!result && (
        <div className="flex-grow-1 w-100 d-flex flex-column align-items-center justify-content-center">
          {/* Game Stats */}
          <div className="game-stats text-white mb-3 text-center">
            <div className="mb-2">
              Level: {level} | Round: {currentRound + 1}/{totalRounds} |
              Correct: {correctAnswers}
            </div>
            <div className="mb-2">
              XP: {xp} / {xpToNextLevel} | Accuracy:{" "}
              {totalRounds > 0
                ? Math.round((correctAnswers / Math.max(currentRound, 1)) * 100)
                : 0}
              %
            </div>
          </div>

          {/* Items Grid */}
          <div
            className="items-grid"
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${Math.ceil(
                Math.sqrt(currentItems.length)
              )}, 1fr)`,
              gap: "2rem",
              padding: "2rem",
              backgroundColor: "#2a2a2a",
              borderRadius: "15px",
              border: "2px solid #4a4a4a",
              minHeight: "300px",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {currentItems.map((item) => (
              <div
                key={item.id}
                onClick={() => handleItemClick(item.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "1rem",
                }}
              >
                {getShapeComponent(item)}
              </div>
            ))}
          </div>

          {/* Instructions */}
          <div
            className="text-white text-center mt-3"
            style={{ fontSize: "1.1rem", maxWidth: "600px" }}
          >
            <div
              className="mb-2"
              style={{ fontSize: "1.3rem", fontWeight: "bold" }}
            >
              Find the shape that's different from the others!
            </div>
            <div style={{ fontSize: "0.9rem", opacity: 0.8 }}>
              Look for differences in shape, color, or size • Wrong choices cost
              3 seconds • Need 70% accuracy
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function OddOneOut({ token }) {
  return (
    <GameWindow>
      <GameLayout
        introSlides={introSlides}
        helpText="Study all the shapes carefully and identify the one that's different from the others. It could differ in shape, color, or size. Click on the odd one out!"
        gameName="Odd One Out"
        fetchUserGameProgress={fetchUserGameProgress}
        submitGameScore={submitOddOneOut}
        initialLevel={1}
        maxLevel={10}
        onGameStart={(level, { resetProgress }) => resetProgress(level)}
        onGameRestart={() => window.location.reload()}
        onGameQuit={() => window.location.assign("/games/attention")}
        token={token}
      >
        {(game) => (
          <OddOneOutGame
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
