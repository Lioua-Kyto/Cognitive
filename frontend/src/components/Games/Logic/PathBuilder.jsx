import { useState, useEffect, useRef } from "react";
import GameWindow from "../GameWindow.jsx";
import GameLayout from "../Layout/GameLayout.jsx";
import { submitPathBuilder } from "../../../api/games.jsx";
import { fetchUserGameProgress } from "../../../api/score.jsx";

function generatePathPuzzle(level) {
  const gridSize = Math.min(5 + Math.floor(level / 2), 8); // 5x5 to 8x8 grid
  const grid = Array(gridSize)
    .fill()
    .map(() => Array(gridSize).fill(0));

  // Place start and end points
  const start = { row: 0, col: 0 };
  const end = { row: gridSize - 1, col: gridSize - 1 };

  // Generate obstacles (walls)
  const obstacleCount = Math.floor(gridSize * gridSize * (0.2 + level * 0.02)); // More obstacles at higher levels
  const obstacles = new Set();

  // Ensure we don't block start or end
  obstacles.add(`${start.row},${start.col}`);
  obstacles.add(`${end.row},${end.col}`);

  for (let i = 0; i < obstacleCount; i++) {
    let row, col;
    do {
      row = Math.floor(Math.random() * gridSize);
      col = Math.floor(Math.random() * gridSize);
    } while (obstacles.has(`${row},${col}`));

    obstacles.add(`${row},${col}`);
    grid[row][col] = 1; // 1 = obstacle
  }

  // Remove start and end from obstacles set, but keep them accessible
  obstacles.delete(`${start.row},${start.col}`);
  obstacles.delete(`${end.row},${end.col}`);

  // Generate collectible items (bonuses)
  const collectibleCount = Math.max(1, Math.floor(level / 2));
  const collectibles = [];

  for (let i = 0; i < collectibleCount; i++) {
    let row, col;
    do {
      row = Math.floor(Math.random() * gridSize);
      col = Math.floor(Math.random() * gridSize);
    } while (
      grid[row][col] !== 0 ||
      (row === start.row && col === start.col) ||
      (row === end.row && col === end.col) ||
      collectibles.some((c) => c.row === row && c.col === col)
    );

    collectibles.push({ row, col, collected: false });
    grid[row][col] = 2; // 2 = collectible
  }

  // Find optimal path using A* algorithm for reference
  const optimalPath = findOptimalPath(grid, start, end, gridSize);

  return {
    gridSize: gridSize,
    grid: grid,
    start: start,
    end: end,
    collectibles: collectibles,
    optimalPathLength: optimalPath ? optimalPath.length : null,
    obstacles: Array.from(obstacles).map((pos) => {
      const [row, col] = pos.split(",").map(Number);
      return { row, col };
    }),
  };
}

function findOptimalPath(grid, start, end, gridSize) {
  const openSet = [{ ...start, g: 0, h: 0, f: 0, parent: null }];
  const closedSet = new Set();

  const heuristic = (a, b) => Math.abs(a.row - b.row) + Math.abs(a.col - b.col);

  while (openSet.length > 0) {
    openSet.sort((a, b) => a.f - b.f);
    const current = openSet.shift();

    if (current.row === end.row && current.col === end.col) {
      // Reconstruct path
      const path = [];
      let node = current;
      while (node) {
        path.unshift({ row: node.row, col: node.col });
        node = node.parent;
      }
      return path;
    }

    closedSet.add(`${current.row},${current.col}`);

    // Check neighbors
    const directions = [
      { row: -1, col: 0 },
      { row: 1, col: 0 },
      { row: 0, col: -1 },
      { row: 0, col: 1 },
    ];

    for (const dir of directions) {
      const neighbor = {
        row: current.row + dir.row,
        col: current.col + dir.col,
      };

      if (
        neighbor.row < 0 ||
        neighbor.row >= gridSize ||
        neighbor.col < 0 ||
        neighbor.col >= gridSize ||
        grid[neighbor.row][neighbor.col] === 1 ||
        closedSet.has(`${neighbor.row},${neighbor.col}`)
      ) {
        continue;
      }

      const g = current.g + 1;
      const h = heuristic(neighbor, end);
      const f = g + h;

      const existingNode = openSet.find(
        (n) => n.row === neighbor.row && n.col === neighbor.col
      );

      if (!existingNode) {
        openSet.push({
          ...neighbor,
          g: g,
          h: h,
          f: f,
          parent: current,
        });
      } else if (g < existingNode.g) {
        existingNode.g = g;
        existingNode.f = g + existingNode.h;
        existingNode.parent = current;
      }
    }
  }

  return null; // No path found
}

const introSlides = [
  {
    title: "Why Path Builder?",
    desc: "This game enhances your spatial planning, strategic thinking, and pathfinding skills. It develops your ability to think ahead and find efficient solutions.",
    img: "/images/brain-idea.svg",
  },
  {
    title: "Benefits",
    desc: "• Improves spatial planning\n• Enhances strategic thinking\n• Develops pathfinding skills\n• Builds forward thinking",
    img: "/images/brain-benefit.svg",
  },
  {
    title: "How to Play",
    desc: "Draw a path from start to finish while avoiding obstacles! Collect bonus items for extra points. Find the most efficient route possible.",
    img: "/images/brain-tutorial.svg",
  },
];

function PathBuilderGame({
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
  const [userPath, setUserPath] = useState([]);
  const [allUserPaths, setAllUserPaths] = useState([]);
  const [currentPosition, setCurrentPosition] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [collectedItems, setCollectedItems] = useState([]);
  const [solvedPuzzles, setSolvedPuzzles] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackType, setFeedbackType] = useState("");
  const gameStartedRef = useRef(false);
  const totalPuzzles = Math.min(4 + level, 8); // 5-8 puzzles

  // Initialize new game when level changes
  useEffect(() => {
    const newPuzzles = [];
    for (let i = 0; i < totalPuzzles; i++) {
      newPuzzles.push(generatePathPuzzle(level));
    }
    setPuzzles(newPuzzles);
    setCurrentPuzzleIndex(0);
    setCurrentPuzzle(newPuzzles[0]);
    setUserPath([]);
    setAllUserPaths([]);
    setCurrentPosition(newPuzzles[0]?.start || null);
    setIsDrawing(false);
    setCollectedItems([]);
    setSolvedPuzzles(0);
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

  const handleCellClick = (row, col) => {
    if (!gameStarted || result || showFeedback || !currentPuzzle) return;

    // Check if clicking on start to begin drawing
    if (
      row === currentPuzzle.start.row &&
      col === currentPuzzle.start.col &&
      userPath.length === 0
    ) {
      setUserPath([{ row, col }]);
      setCurrentPosition({ row, col });
      setIsDrawing(true);
      return;
    }

    // If not drawing, ignore clicks
    if (!isDrawing) return;

    // Check if clicked cell is adjacent to current position
    const isAdjacent =
      Math.abs(row - currentPosition.row) +
        Math.abs(col - currentPosition.col) ===
      1;

    if (!isAdjacent) return;

    // Check if cell is obstacle
    if (currentPuzzle.grid[row][col] === 1) return;

    // Check if cell is already in path (prevent backtracking on same cell)
    if (userPath.some((p) => p.row === row && p.col === col)) return;

    // Add to path
    const newPath = [...userPath, { row, col }];
    setUserPath(newPath);
    setCurrentPosition({ row, col });

    // Check for collectible
    const collectible = currentPuzzle.collectibles.find(
      (c) => c.row === row && c.col === col
    );
    if (collectible && !collectedItems.includes(`${row},${col}`)) {
      setCollectedItems((prev) => [...prev, `${row},${col}`]);
    }

    // Check if reached end
    if (row === currentPuzzle.end.row && col === currentPuzzle.end.col) {
      setIsDrawing(false);

      // Calculate efficiency
      const pathLength = newPath.length;
      const optimalLength = currentPuzzle.optimalPathLength || pathLength;
      const efficiency = optimalLength / pathLength;
      const bonusMultiplier = 1 + collectedItems.length * 0.2;

      if (playCorrect) playCorrect();
      setSolvedPuzzles((prev) => prev + 1);
      setFeedbackType("correct");
      setShowFeedback(true);

      handleSuccess({
        timeLeft: timer,
        timer: 150,
        isCorrect: true,
        efficiency: efficiency,
        bonus: bonusMultiplier,
      });

      setTimeout(() => {
        setShowFeedback(false);

        if (currentPuzzleIndex + 1 >= totalPuzzles) {
          // Game complete
          if (handleGameComplete) {
            handleGameComplete({
              path: puzzles.map((puzzle) => ({
                start: puzzle.start,
                end: puzzle.end,
                gridSize: puzzle.gridSize,
              })),
              user_path: [...allUserPaths, newPath],
              message: "Pathfinding master!",
            });
          }
        } else {
          // Next puzzle
          const nextIndex = currentPuzzleIndex + 1;
          setCurrentPuzzleIndex(nextIndex);
          setCurrentPuzzle(puzzles[nextIndex]);
          setAllUserPaths((prev) => [...prev, newPath]);
          setUserPath([]);
          setCurrentPosition(puzzles[nextIndex].start);
          setIsDrawing(false);
          setCollectedItems([]);
        }
      }, 2000);
    }
  };

  const handleResetPath = () => {
    if (!gameStarted || result || showFeedback) return;
    setUserPath([]);
    setCurrentPosition(currentPuzzle?.start || null);
    setIsDrawing(false);
    setCollectedItems([]);
  };

  // Handle game over when timer runs out
  useEffect(() => {
    if (timer === 0 && !result && gameStartedRef.current) {
      handleGameOver({
        path: puzzles.map((puzzle) => ({
          start: puzzle.start,
          end: puzzle.end,
          gridSize: puzzle.gridSize,
        })),
        user_path: allUserPaths,
        message: "Time's up!",
      });
    }
  }, [timer, result, handleGameOver, puzzles, allUserPaths]);

  const getCellStyle = (row, col) => {
    const baseStyle = {
      width: "40px",
      height: "40px",
      border: "1px solid #666",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      cursor: "pointer",
      fontSize: "0.8rem",
      fontWeight: "bold",
      transition: "all 0.2s ease",
    };

    if (!currentPuzzle) return baseStyle;

    // Start cell
    if (row === currentPuzzle.start.row && col === currentPuzzle.start.col) {
      return {
        ...baseStyle,
        backgroundColor: "#4ECDC4",
        color: "#000",
      };
    }

    // End cell
    if (row === currentPuzzle.end.row && col === currentPuzzle.end.col) {
      return {
        ...baseStyle,
        backgroundColor: "#FF6B6B",
        color: "#fff",
      };
    }

    // Obstacle
    if (currentPuzzle.grid[row][col] === 1) {
      return {
        ...baseStyle,
        backgroundColor: "#333",
        cursor: "not-allowed",
      };
    }

    // Collectible
    const isCollectible = currentPuzzle.collectibles.some(
      (c) => c.row === row && c.col === col
    );
    const isCollected = collectedItems.includes(`${row},${col}`);
    if (isCollectible) {
      return {
        ...baseStyle,
        backgroundColor: isCollected ? "#666" : "#FFD93D",
        color: "#000",
      };
    }

    // Path
    const isInPath = userPath.some((p) => p.row === row && p.col === col);
    if (isInPath) {
      return {
        ...baseStyle,
        backgroundColor: "#45B7B8",
        color: "#fff",
      };
    }

    // Current position
    if (
      currentPosition &&
      row === currentPosition.row &&
      col === currentPosition.col
    ) {
      return {
        ...baseStyle,
        backgroundColor: "#4ECDC4",
        color: "#000",
        transform: "scale(1.1)",
      };
    }

    // Empty cell
    return {
      ...baseStyle,
      backgroundColor: "#1a1a1a",
      color: "#666",
    };
  };

  const getCellContent = (row, col) => {
    if (!currentPuzzle) return "";

    if (row === currentPuzzle.start.row && col === currentPuzzle.start.col) {
      return "S";
    }
    if (row === currentPuzzle.end.row && col === currentPuzzle.end.col) {
      return "E";
    }
    if (currentPuzzle.grid[row][col] === 1) {
      return "■";
    }

    const isCollectible = currentPuzzle.collectibles.some(
      (c) => c.row === row && c.col === col
    );
    const isCollected = collectedItems.includes(`${row},${col}`);
    if (isCollectible) {
      return isCollected ? "✓" : "★";
    }

    return "";
  };

  return (
    <div className="path-builder-container">
      {!result && (
        <div className="flex-grow-1 w-100 d-flex flex-column align-items-center justify-content-center">
          {/* Game Stats */}
          <div className="game-stats text-white mb-3 text-center">
            <div className="mb-2">
              Level: {level} | Puzzle: {currentPuzzleIndex + 1}/{totalPuzzles} |
              Solved: {solvedPuzzles}
            </div>
            <div className="mb-2">
              XP: {xp} / {xpToNextLevel} | Path Length: {userPath.length} |
              Collected: {collectedItems.length}
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
                Draw path from S to E
              </div>

              {showFeedback && (
                <div
                  style={{
                    fontSize: "2rem",
                    fontWeight: "bold",
                    color: "#4ECDC4",
                    marginBottom: "1rem",
                  }}
                >
                  ✓ Path Complete! Length: {userPath.length} steps
                </div>
              )}

              {!showFeedback && gameStarted && (
                <div className="grid-container">
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: `repeat(${currentPuzzle.gridSize}, 40px)`,
                      gap: "1px",
                      justifyContent: "center",
                      marginBottom: "1rem",
                      backgroundColor: "#666",
                      border: "2px solid #666",
                      borderRadius: "8px",
                      padding: "5px",
                    }}
                  >
                    {Array.from({ length: currentPuzzle.gridSize }, (_, row) =>
                      Array.from(
                        { length: currentPuzzle.gridSize },
                        (_, col) => (
                          <div
                            key={`${row}-${col}`}
                            onClick={() => handleCellClick(row, col)}
                            style={getCellStyle(row, col)}
                          >
                            {getCellContent(row, col)}
                          </div>
                        )
                      )
                    )}
                  </div>

                  <button
                    onClick={handleResetPath}
                    style={{
                      backgroundColor: "#FF6B6B",
                      color: "#fff",
                      border: "none",
                      borderRadius: "8px",
                      padding: "8px 16px",
                      fontSize: "1rem",
                      fontWeight: "bold",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) =>
                      (e.target.style.backgroundColor = "#E74C3C")
                    }
                    onMouseLeave={(e) =>
                      (e.target.style.backgroundColor = "#FF6B6B")
                    }
                  >
                    Reset Path
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
                  Get ready to build paths!
                </div>
              )}
            </div>
          )}

          {/* Legend */}
          {currentPuzzle && gameStarted && !showFeedback && (
            <div
              className="legend"
              style={{
                backgroundColor: "#1a1a1a",
                border: "2px solid #666",
                borderRadius: "10px",
                padding: "1rem",
                marginBottom: "1rem",
                display: "flex",
                gap: "15px",
                alignItems: "center",
                fontSize: "0.9rem",
                color: "#ccc",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "5px" }}
              >
                <div
                  style={{
                    width: "20px",
                    height: "20px",
                    backgroundColor: "#4ECDC4",
                    borderRadius: "3px",
                  }}
                ></div>
                <span>Start (S)</span>
              </div>
              <div
                style={{ display: "flex", alignItems: "center", gap: "5px" }}
              >
                <div
                  style={{
                    width: "20px",
                    height: "20px",
                    backgroundColor: "#FF6B6B",
                    borderRadius: "3px",
                  }}
                ></div>
                <span>End (E)</span>
              </div>
              <div
                style={{ display: "flex", alignItems: "center", gap: "5px" }}
              >
                <div
                  style={{
                    width: "20px",
                    height: "20px",
                    backgroundColor: "#333",
                    borderRadius: "3px",
                  }}
                ></div>
                <span>Wall</span>
              </div>
              <div
                style={{ display: "flex", alignItems: "center", gap: "5px" }}
              >
                <div
                  style={{
                    width: "20px",
                    height: "20px",
                    backgroundColor: "#FFD93D",
                    borderRadius: "3px",
                  }}
                ></div>
                <span>Bonus (★)</span>
              </div>
              <div
                style={{ display: "flex", alignItems: "center", gap: "5px" }}
              >
                <div
                  style={{
                    width: "20px",
                    height: "20px",
                    backgroundColor: "#45B7B8",
                    borderRadius: "3px",
                  }}
                ></div>
                <span>Path</span>
              </div>
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
              Navigate from start to finish!
            </div>
            <div style={{ fontSize: "0.9rem", opacity: 0.8 }}>
              Click adjacent cells to draw your path • Avoid walls • Collect
              bonus stars • Shorter paths score better
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PathBuilder({ token }) {
  return (
    <GameWindow>
      <GameLayout
        introSlides={introSlides}
        helpText="Draw efficient paths from start to finish while avoiding obstacles! Click on adjacent cells to build your path. Collect bonus items for extra points."
        gameName="Path Builder"
        fetchUserGameProgress={fetchUserGameProgress}
        submitGameScore={submitPathBuilder}
        initialLevel={1}
        maxLevel={10}
        onGameStart={(level, { resetProgress }) => resetProgress(level)}
        onGameRestart={() => window.location.reload()}
        onGameQuit={() => window.location.assign("/games/logic")}
        token={token}
      >
        {(game) => (
          <PathBuilderGame
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
