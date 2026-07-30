import { useState, useEffect, useRef } from "react";
import GameWindow from "../GameWindow.jsx";
import GameLayout from "../Layout/GameLayout.jsx";
import { submitQuickMatch } from "../../../api/games.jsx";
import { fetchUserGameProgress } from "../../../api/score.jsx";

// Shape and color combinations
const SHAPES = ["circle", "square", "triangle", "diamond", "star", "hexagon"];
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
  const gridSize = Math.min(3 + Math.floor(level / 2), 5); // 3x3 to 5x5
  const items = [];

  // Create pairs - some will match, some won't
  const pairCount = Math.floor((gridSize * gridSize) / 2);

  for (let i = 0; i < pairCount; i++) {
    const shape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];

    // Create matching pair
    items.push({ id: i * 2, shape, color, isMatch: true, pairId: i });
    items.push({ id: i * 2 + 1, shape, color, isMatch: true, pairId: i });
  }

  // Fill remaining slots with non-matching items
  while (items.length < gridSize * gridSize) {
    const shape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];

    // Make sure it doesn't accidentally match existing items
    const isUnique = !items.some(
      (item) => item.shape === shape && item.color === color
    );
    if (isUnique) {
      items.push({
        id: items.length,
        shape,
        color,
        isMatch: false,
        pairId: -1,
      });
    }
  }

  // Shuffle items
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }

  return { items, gridSize };
}

const introSlides = [
  {
    title: "Why Quick Match?",
    desc: "This game enhances your pattern recognition speed and visual processing. It trains rapid decision-making and attention to detail.",
    img: "/images/brain-idea.svg",
  },
  {
    title: "Benefits",
    desc: "• Improves pattern recognition speed\n• Enhances visual processing\n• Develops rapid decision making\n• Strengthens attention to detail",
    img: "/images/brain-benefit.svg",
  },
  {
    title: "How to Play",
    desc: "Find matching pairs as quickly as possible! Click on two items with the same shape AND color to make a match. Speed and accuracy are both important.",
    img: "/images/brain-tutorial.svg",
  },
];

function QuickMatchGame({
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
  const [currentItems, setCurrentItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [matchedPairs, setMatchedPairs] = useState([]);
  const [userMatches, setUserMatches] = useState([]);
  const [roundStartTime, setRoundStartTime] = useState(null);
  const [gameStarted, setGameStarted] = useState(false);
  const gameStartedRef = useRef(false);
  const totalRounds = Math.min(3 + level, 8); // 3-8 rounds

  // Initialize new game when level changes
  useEffect(() => {
    const newRounds = [];
    for (let i = 0; i < totalRounds; i++) {
      newRounds.push(generateRound(level));
    }
    setRounds(newRounds);
    setCurrentRound(0);
    setCurrentItems(newRounds[0]?.items || []);
    setSelectedItems([]);
    setMatchedPairs([]);
    setUserMatches([]);
    setRoundStartTime(null);
    setGameStarted(false);
    gameStartedRef.current = false;
  }, [level, totalRounds]);

  // Start game after brief delay
  useEffect(() => {
    if (rounds.length > 0 && !gameStarted) {
      const startTimer = setTimeout(() => {
        setGameStarted(true);
        setRoundStartTime(Date.now());
        gameStartedRef.current = true;
      }, 1000);

      return () => clearTimeout(startTimer);
    }
  }, [rounds, gameStarted]);

  const handleItemClick = (itemId) => {
    if (!gameStarted || result) return;

    const item = currentItems.find((i) => i.id === itemId);
    if (!item || matchedPairs.includes(item.pairId)) return;

    if (selectedItems.length === 0) {
      setSelectedItems([itemId]);
    } else if (selectedItems.length === 1) {
      if (selectedItems[0] === itemId) {
        // Deselect same item
        setSelectedItems([]);
        return;
      }

      const firstItem = currentItems.find((i) => i.id === selectedItems[0]);
      const secondItem = item;

      setSelectedItems([]);

      // Check if they match
      if (
        firstItem.shape === secondItem.shape &&
        firstItem.color === secondItem.color &&
        firstItem.pairId === secondItem.pairId &&
        firstItem.pairId !== -1
      ) {
        // Match found!
        if (playCorrect) playCorrect();

        const matchTime = Date.now() - roundStartTime;
        setMatchedPairs((prev) => [...prev, firstItem.pairId]);
        setUserMatches((prev) => [
          ...prev,
          `${firstItem.shape}-${firstItem.color}`,
        ]);

        handleSuccess({
          timeLeft: timer,
          timer: 90,
          isCorrect: true,
        });

        // Check if round complete
        const totalPairs = currentItems.filter((i) => i.isMatch).length / 2;
        const newMatchedCount = matchedPairs.length + 1;

        if (newMatchedCount >= totalPairs) {
          // Round complete
          setTimeout(() => {
            if (currentRound + 1 >= totalRounds) {
              // Game complete
              if (handleGameComplete) {
                handleGameComplete({
                  rounds: rounds.map((round) => ({
                    items: round.items.map((item) => ({
                      shape: item.shape,
                      color: item.color,
                      isMatch: item.isMatch,
                    })),
                  })),
                  user_matches: [
                    ...userMatches,
                    `${firstItem.shape}-${firstItem.color}`,
                  ],
                  message: "All rounds completed!",
                });
              }
            } else {
              // Next round
              const nextRound = currentRound + 1;
              setCurrentRound(nextRound);
              setCurrentItems(rounds[nextRound].items);
              setSelectedItems([]);
              setMatchedPairs([]);
              setRoundStartTime(Date.now());
            }
          }, 1000);
        }
      } else {
        // No match
        if (playWrong) playWrong();
        if (handleWrong) handleWrong();
        if (setMistakes) setMistakes((prev) => prev + 1);

        // Penalty: reduce timer
        setTimer((prev) => Math.max(0, prev - 2));
        if (triggerMinusFive) triggerMinusFive();
      }
    }
  };

  // Handle game over when timer runs out
  useEffect(() => {
    if (timer === 0 && !result && gameStartedRef.current) {
      handleGameOver({
        rounds: rounds.map((round) => ({
          items: round.items.map((item) => ({
            shape: item.shape,
            color: item.color,
            isMatch: item.isMatch,
          })),
        })),
        user_matches: userMatches,
        message: "Time's up!",
      });
    }
  }, [timer, result, handleGameOver, rounds, userMatches]);

  const renderShape = (item) => {
    const isSelected = selectedItems.includes(item.id);
    const isMatched = matchedPairs.includes(item.pairId);

    const style = {
      width: "60px",
      height: "60px",
      backgroundColor: item.color,
      cursor: isMatched ? "default" : "pointer",
      border: isSelected ? "3px solid #FFD700" : "2px solid #666",
      borderRadius: item.shape === "circle" ? "50%" : "8px",
      clipPath:
        item.shape === "triangle"
          ? "polygon(50% 0%, 0% 100%, 100% 100%)"
          : item.shape === "diamond"
          ? "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)"
          : item.shape === "star"
          ? "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)"
          : item.shape === "hexagon"
          ? "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)"
          : "none",
      opacity: isMatched ? 0.3 : 1,
      transform: isSelected
        ? "scale(1.1)"
        : isMatched
        ? "scale(0.9)"
        : "scale(1)",
      transition: "all 0.2s ease",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      margin: "4px",
    };

    return (
      <div
        key={item.id}
        style={style}
        onClick={() => handleItemClick(item.id)}
        onMouseEnter={(e) => {
          if (!isMatched) {
            e.target.style.transform = isSelected
              ? "scale(1.1)"
              : "scale(1.05)";
          }
        }}
        onMouseLeave={(e) => {
          if (!isMatched) {
            e.target.style.transform = isSelected ? "scale(1.1)" : "scale(1)";
          }
        }}
      />
    );
  };

  const currentRoundData = rounds[currentRound];
  const totalPairs = currentItems.filter((i) => i.isMatch).length / 2;

  return (
    <div className="quick-match-container">
      {!result && (
        <div className="flex-grow-1 w-100 d-flex flex-column align-items-center justify-content-center">
          {/* Game Stats */}
          <div className="game-stats text-white mb-3 text-center">
            <div className="mb-2">
              Level: {level} | Round: {currentRound + 1}/{totalRounds} |
              Matches: {matchedPairs.length}/{totalPairs}
            </div>
            <div className="mb-2">
              XP: {xp} / {xpToNextLevel} | Selected: {selectedItems.length}/2
            </div>
          </div>

          {/* Items Grid */}
          <div
            className="items-grid"
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${
                currentRoundData?.gridSize || 3
              }, 1fr)`,
              gap: "8px",
              padding: "20px",
              backgroundColor: "#2a2a2a",
              borderRadius: "15px",
              border: "2px solid #4a4a4a",
              marginBottom: "2rem",
            }}
          >
            {currentItems.map((item) => renderShape(item))}
          </div>

          {/* In-game instruction text removed; instructions live in intro panel */}
        </div>
      )}
    </div>
  );
}

export default function QuickMatch({ token }) {
  return (
    <GameWindow>
      <GameLayout
        introSlides={introSlides}
        helpText="Find matching pairs as quickly as possible! Click on two items that have both the same shape and color. Speed matters, but accuracy is crucial."
        gameName="Quick Match"
        fetchUserGameProgress={fetchUserGameProgress}
        submitGameScore={submitQuickMatch}
        initialLevel={1}
        maxLevel={10}
        onGameStart={(level, { resetProgress }) => resetProgress(level)}
        onGameRestart={() => window.location.reload()}
        onGameQuit={() => window.location.assign("/games/speed")}
        token={token}
      >
        {(game) => (
          <QuickMatchGame
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
