import { useState, useEffect, useRef } from "react";
import GameWindow from "../GameWindow.jsx";
import GameLayout from "../Layout/GameLayout.jsx";
import { submitSpotTheChange } from "../../../api/games.jsx";
import { fetchUserGameProgress } from "../../../api/score.jsx";

// Grid patterns and colors
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
const SHAPES = ["circle", "square", "triangle", "diamond"];

function generateGrid(level) {
  const gridSize = Math.min(3 + Math.floor(level / 2), 6); // 3x3 to 6x6
  const grid = [];

  for (let i = 0; i < gridSize; i++) {
    const row = [];
    for (let j = 0; j < gridSize; j++) {
      row.push({
        id: `${i}-${j}`,
        row: i,
        col: j,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        shape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
        size: Math.random() > 0.5 ? "large" : "small",
      });
    }
    grid.push(row);
  }

  return grid;
}

function createChangedGrid(originalGrid, level) {
  const grid = originalGrid.map((row) => row.map((cell) => ({ ...cell })));
  const changeCount = Math.min(1 + Math.floor(level / 3), 3); // 1-3 changes
  const changes = [];

  for (let i = 0; i < changeCount; i++) {
    const row = Math.floor(Math.random() * grid.length);
    const col = Math.floor(Math.random() * grid[0].length);

    // Make sure we don't change the same cell twice
    if (changes.some((change) => change.row === row && change.col === col)) {
      i--;
      continue;
    }

    const changeType = Math.floor(Math.random() * 3);
    const originalCell = grid[row][col];

    if (changeType === 0) {
      // Change color
      let newColor;
      do {
        newColor = COLORS[Math.floor(Math.random() * COLORS.length)];
      } while (newColor === originalCell.color);
      grid[row][col].color = newColor;
    } else if (changeType === 1) {
      // Change shape
      let newShape;
      do {
        newShape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
      } while (newShape === originalCell.shape);
      grid[row][col].shape = newShape;
    } else {
      // Change size
      grid[row][col].size = originalCell.size === "large" ? "small" : "large";
    }

    changes.push({
      row,
      col,
      changeType,
      original: originalCell,
      changed: grid[row][col],
    });
  }

  return { grid, changes };
}

const introSlides = [
  {
    title: "Why Spot the Change?",
    desc: "This game enhances your change detection abilities and visual attention. It trains your brain to notice subtle differences quickly and accurately.",
    img: "/images/brain-idea.svg",
  },
  {
    title: "Benefits",
    desc: "• Improves change detection\n• Enhances visual attention\n• Develops comparison skills\n• Strengthens detail observation",
    img: "/images/brain-benefit.svg",
  },
  {
    title: "How to Play",
    desc: "Study the first grid, then look at the second grid and find what changed. Click on the changed cells to identify all differences!",
    img: "/images/brain-tutorial.svg",
  },
];

function SpotTheChangeGame({
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
  const [originalGrid, setOriginalGrid] = useState([]);
  const [changedGrid, setChangedGrid] = useState([]);
  const [changes, setChanges] = useState([]);
  const [foundChanges, setFoundChanges] = useState([]);
  const [userClicks, setUserClicks] = useState([]);
  const [showOriginal, setShowOriginal] = useState(true);
  const [gamePhase, setGamePhase] = useState("studying"); // 'studying', 'comparing', 'complete'
  const gameStartedRef = useRef(false);

  // Initialize new game when level changes
  useEffect(() => {
    const newOriginalGrid = generateGrid(level);
    const { grid: newChangedGrid, changes: newChanges } = createChangedGrid(
      newOriginalGrid,
      level
    );

    setOriginalGrid(newOriginalGrid);
    setChangedGrid(newChangedGrid);
    setChanges(newChanges);
    setFoundChanges([]);
    setUserClicks([]);
    setShowOriginal(true);
    setGamePhase("studying");
    gameStartedRef.current = false;
  }, [level]);

  // Handle study phase
  useEffect(() => {
    if (gamePhase === "studying" && originalGrid.length > 0) {
      const studyTime = Math.max(3000, 5000 - level * 200); // 5s to 3s

      const timer = setTimeout(() => {
        setShowOriginal(false);
        setGamePhase("comparing");
        gameStartedRef.current = true;
      }, studyTime);

      return () => clearTimeout(timer);
    }
  }, [gamePhase, originalGrid, level]);

  const handleCellClick = (row, col) => {
    if (gamePhase !== "comparing" || result) return;

    const cellKey = `${row}-${col}`;

    // Check if already clicked
    if (userClicks.includes(cellKey)) return;

    setUserClicks((prev) => [...prev, cellKey]);

    // Check if this is a changed cell
    const isChanged = changes.some(
      (change) => change.row === row && change.col === col
    );

    if (isChanged) {
      if (playCorrect) playCorrect();
      const newFoundChanges = [...foundChanges, cellKey];
      setFoundChanges(newFoundChanges);

      handleSuccess({
        timeLeft: timer,
        timer: 90,
        isCorrect: true,
      });

      // Check if all changes found
      if (newFoundChanges.length === changes.length) {
        // Game complete
        setTimeout(() => {
          if (handleGameComplete) {
            handleGameComplete({
              images: [
                JSON.stringify(originalGrid),
                JSON.stringify(changedGrid),
              ],
              user_changes: userClicks,
              message: "All changes found!",
            });
          }
        }, 500);
      }
    } else {
      if (playWrong) playWrong();
      if (handleWrong) handleWrong();
      if (setMistakes) setMistakes((prev) => prev + 1);

      // Penalty: reduce timer
      setTimer((prev) => Math.max(0, prev - 3));
      if (triggerMinusFive) triggerMinusFive();
    }
  };

  // Handle game over when timer runs out
  useEffect(() => {
    if (timer === 0 && !result && gameStartedRef.current) {
      handleGameOver({
        images: [JSON.stringify(originalGrid), JSON.stringify(changedGrid)],
        user_changes: userClicks,
        message: "Time's up!",
      });
    }
  }, [timer, result, handleGameOver, originalGrid, changedGrid, userClicks]);

  const renderCell = (cell, isClickable = false) => {
    const sizeMap = {
      small: "30px",
      large: "45px",
    };

    const cellKey = `${cell.row}-${cell.col}`;
    const isFound = foundChanges.includes(cellKey);
    const isClicked = userClicks.includes(cellKey);
    const isChanged = changes.some(
      (change) => change.row === cell.row && change.col === cell.col
    );

    const style = {
      width: sizeMap[cell.size],
      height: sizeMap[cell.size],
      backgroundColor: cell.color,
      cursor: isClickable ? "pointer" : "default",
      border: isFound
        ? "3px solid #00ff00"
        : isClicked && !isChanged
        ? "3px solid #ff0000"
        : "2px solid #666",
      borderRadius:
        cell.shape === "circle"
          ? "50%"
          : cell.shape === "diamond"
          ? "0"
          : "4px",
      transform: cell.shape === "diamond" ? "rotate(45deg)" : "none",
      clipPath:
        cell.shape === "triangle"
          ? "polygon(50% 0%, 0% 100%, 100% 100%)"
          : "none",
      transition: "all 0.2s ease",
      margin: "2px",
    };

    return (
      <div
        key={cell.id}
        style={style}
        onClick={() => isClickable && handleCellClick(cell.row, cell.col)}
        onMouseEnter={
          isClickable
            ? (e) => {
                e.target.style.transform =
                  cell.shape === "diamond"
                    ? "rotate(45deg) scale(1.1)"
                    : "scale(1.1)";
              }
            : undefined
        }
        onMouseLeave={
          isClickable
            ? (e) => {
                e.target.style.transform =
                  cell.shape === "diamond" ? "rotate(45deg)" : "none";
              }
            : undefined
        }
      />
    );
  };

  const renderGrid = (grid, isClickable = false) => (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${grid.length}, 1fr)`,
        gap: "4px",
        padding: "20px",
        backgroundColor: "#2a2a2a",
        borderRadius: "10px",
        border: "2px solid #4a4a4a",
        minHeight: "300px",
        minWidth: "300px",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {grid.flat().map((cell) => renderCell(cell, isClickable))}
    </div>
  );

  return (
    <div className="spot-the-change-container">
      {!result && (
        <div className="flex-grow-1 w-100 d-flex flex-column align-items-center justify-content-center">
          {/* Game Stats */}
          <div className="game-stats text-white mb-3 text-center">
            <div className="mb-2">
              Level: {level} | Found: {foundChanges.length}/{changes.length} |
              Phase: {gamePhase}
            </div>
            <div className="mb-2">
              XP: {xp} / {xpToNextLevel} | Wrong Clicks:{" "}
              {userClicks.length - foundChanges.length}
            </div>
          </div>

          {/* Phase indicator text removed to avoid in-game instructions */}

          {/* Grid Display */}
          <div className="grid-container">
            {showOriginal ? (
              <div className="text-center">{renderGrid(originalGrid, false)}</div>
            ) : (
              <div className="text-center">{renderGrid(changedGrid, true)}</div>
            )}
          </div>

          {/* In-game instruction text removed; instructions live in intro panel */}
        </div>
      )}
    </div>
  );
}

export default function SpotTheChange({ token }) {
  return (
    <GameWindow>
      <GameLayout
        introSlides={introSlides}
        helpText="First, study the original grid carefully. Then, when it changes, click on all the cells that are different from the original. Look for changes in color, shape, or size!"
        gameName="Spot the Change"
        fetchUserGameProgress={fetchUserGameProgress}
        submitGameScore={submitSpotTheChange}
        initialLevel={1}
        maxLevel={10}
        onGameStart={(level, { resetProgress }) => resetProgress(level)}
        onGameRestart={() => window.location.reload()}
        onGameQuit={() => window.location.assign("/games/attention")}
        token={token}
      >
        {(game) => (
          <SpotTheChangeGame
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
