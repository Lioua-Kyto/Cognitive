import { useState, useEffect, useRef } from "react";
import GameWindow from "../GameWindow.jsx";
import GameLayout from "../Layout/GameLayout.jsx";
import { submitTilePuzzle } from "../../../api/games.jsx";
import { fetchUserGameProgress } from "../../../api/score.jsx";

function generateTilePuzzle(level) {
  const size = Math.min(3 + Math.floor(level / 3), 4); // 3x3 to 4x4 based on level
  const totalTiles = size * size;
  const numbers = Array.from({ length: totalTiles - 1 }, (_, i) => i + 1);
  numbers.push(null); // Empty space

  // Create solved state
  const solvedState = [];
  for (let i = 0; i < size; i++) {
    solvedState.push(numbers.slice(i * size, (i + 1) * size));
  }

  // Shuffle to create puzzle (ensure solvable)
  let puzzle = JSON.parse(JSON.stringify(solvedState));
  const moves = Math.max(50, level * 10); // More shuffling for higher levels

  // Find empty space
  let emptyRow = size - 1;
  let emptyCol = size - 1;

  // Perform random valid moves to shuffle
  for (let i = 0; i < moves; i++) {
    const possibleMoves = [];

    // Check all 4 directions
    if (emptyRow > 0) possibleMoves.push([-1, 0]); // Up
    if (emptyRow < size - 1) possibleMoves.push([1, 0]); // Down
    if (emptyCol > 0) possibleMoves.push([0, -1]); // Left
    if (emptyCol < size - 1) possibleMoves.push([0, 1]); // Right

    const [dr, dc] =
      possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
    const newRow = emptyRow + dr;
    const newCol = emptyCol + dc;

    // Swap empty space with adjacent tile
    puzzle[emptyRow][emptyCol] = puzzle[newRow][newCol];
    puzzle[newRow][newCol] = null;

    emptyRow = newRow;
    emptyCol = newCol;
  }

  return {
    size: size,
    initialState: JSON.parse(JSON.stringify(puzzle)),
    currentState: JSON.parse(JSON.stringify(puzzle)),
    solvedState: solvedState,
    emptyRow: emptyRow,
    emptyCol: emptyCol,
  };
}

const introSlides = [
  {
    title: "Why Tile Puzzle?",
    desc: "This classic sliding puzzle enhances your spatial reasoning, problem-solving skills, and strategic planning. It develops systematic thinking and patience.",
    img: "/images/brain-idea.svg",
  },
  {
    title: "Benefits",
    desc: "• Improves spatial reasoning\n• Enhances problem-solving skills\n• Develops strategic planning\n• Builds systematic thinking",
    img: "/images/brain-benefit.svg",
  },
  {
    title: "How to Play",
    desc: "Arrange the numbered tiles in order by sliding them into the empty space. Click on tiles adjacent to the empty space to move them!",
    img: "/images/brain-tutorial.svg",
  },
];

function TilePuzzleGame({
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
  const [puzzleState, setPuzzleState] = useState(null);
  const [emptyPosition, setEmptyPosition] = useState({ row: 0, col: 0 });
  const [moves, setMoves] = useState([]);
  const [allMoves, setAllMoves] = useState([]);
  const [solvedPuzzles, setSolvedPuzzles] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackType, setFeedbackType] = useState("");
  const [moveCount, setMoveCount] = useState(0);
  const gameStartedRef = useRef(false);
  const totalPuzzles = Math.min(3 + level, 8); // 4-8 puzzles

  // Initialize new game when level changes
  useEffect(() => {
    const newPuzzles = [];
    for (let i = 0; i < totalPuzzles; i++) {
      newPuzzles.push(generateTilePuzzle(level));
    }
    setPuzzles(newPuzzles);
    setCurrentPuzzleIndex(0);
    setCurrentPuzzle(newPuzzles[0]);
    setPuzzleState(newPuzzles[0]?.currentState);
    setEmptyPosition({
      row: newPuzzles[0]?.emptyRow,
      col: newPuzzles[0]?.emptyCol,
    });
    setMoves([]);
    setAllMoves([]);
    setSolvedPuzzles(0);
    setGameStarted(false);
    setShowFeedback(false);
    setMoveCount(0);
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

  const handleTileClick = (row, col) => {
    if (!gameStarted || result || showFeedback || !puzzleState) return;

    // Check if tile is adjacent to empty space
    const isAdjacent =
      (Math.abs(row - emptyPosition.row) === 1 && col === emptyPosition.col) ||
      (Math.abs(col - emptyPosition.col) === 1 && row === emptyPosition.row);

    if (!isAdjacent) return;

    // Move tile
    const newState = puzzleState.map((row) => [...row]);
    const tileValue = newState[row][col];

    // Swap tile with empty space
    newState[row][col] = null;
    newState[emptyPosition.row][emptyPosition.col] = tileValue;

    setPuzzleState(newState);
    setEmptyPosition({ row, col });
    setMoves((prev) => [...prev, { from: { row, col }, to: emptyPosition }]);
    setMoveCount((prev) => prev + 1);

    // Check if puzzle is solved
    if (isPuzzleSolved(newState)) {
      if (playCorrect) playCorrect();
      setSolvedPuzzles((prev) => prev + 1);
      setFeedbackType("correct");
      setShowFeedback(true);

      const efficiency =
        moveCount < currentPuzzle.size * currentPuzzle.size * 3 ? 1.5 : 1;

      handleSuccess({
        timeLeft: timer,
        timer: 150,
        isCorrect: true,
        efficiency: efficiency,
      });

      setTimeout(() => {
        setShowFeedback(false);

        if (currentPuzzleIndex + 1 >= totalPuzzles) {
          // Game complete
          if (handleGameComplete) {
            handleGameComplete({
              initial_state: puzzles.map((puzzle) => puzzle.initialState),
              moves: [...allMoves, moves],
              message: "Puzzle master!",
            });
          }
        } else {
          // Next puzzle
          const nextIndex = currentPuzzleIndex + 1;
          setCurrentPuzzleIndex(nextIndex);
          setCurrentPuzzle(puzzles[nextIndex]);
          setPuzzleState(puzzles[nextIndex].currentState);
          setEmptyPosition({
            row: puzzles[nextIndex].emptyRow,
            col: puzzles[nextIndex].emptyCol,
          });
          setAllMoves((prev) => [...prev, moves]);
          setMoves([]);
          setMoveCount(0);
        }
      }, 2000);
    }
  };

  const isPuzzleSolved = (state) => {
    if (!currentPuzzle) return false;

    for (let i = 0; i < currentPuzzle.size; i++) {
      for (let j = 0; j < currentPuzzle.size; j++) {
        if (state[i][j] !== currentPuzzle.solvedState[i][j]) {
          return false;
        }
      }
    }
    return true;
  };

  // Handle game over when timer runs out
  useEffect(() => {
    if (timer === 0 && !result && gameStartedRef.current) {
      handleGameOver({
        initial_state: puzzles.map((puzzle) => puzzle.initialState),
        moves: [...allMoves, moves],
        message: "Time's up!",
      });
    }
  }, [timer, result, handleGameOver, puzzles, allMoves, moves]);

  const renderTile = (value, row, col) => {
    const isClickable =
      puzzleState &&
      ((Math.abs(row - emptyPosition.row) === 1 && col === emptyPosition.col) ||
        (Math.abs(col - emptyPosition.col) === 1 && row === emptyPosition.row));

    return (
      <div
        key={`${row}-${col}`}
        onClick={() => handleTileClick(row, col)}
        style={{
          width: "80px",
          height: "80px",
          backgroundColor:
            value === null ? "transparent" : isClickable ? "#4ECDC4" : "#333",
          color: value === null ? "transparent" : "#fff",
          border: value === null ? "2px dashed #666" : "2px solid #666",
          borderRadius: "8px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "1.5rem",
          fontWeight: "bold",
          cursor: isClickable ? "pointer" : "default",
          transition: "all 0.2s ease",
          userSelect: "none",
          transform: isClickable ? "scale(1)" : "scale(0.95)",
          opacity: value === null ? 0.3 : 1,
        }}
        onMouseEnter={(e) => {
          if (isClickable && value !== null) {
            e.target.style.backgroundColor = "#45B7B8";
            e.target.style.transform = "scale(1.05)";
          }
        }}
        onMouseLeave={(e) => {
          if (isClickable && value !== null) {
            e.target.style.backgroundColor = "#4ECDC4";
            e.target.style.transform = "scale(1)";
          }
        }}
      >
        {value}
      </div>
    );
  };

  return (
    <div className="tile-puzzle-container">
      {!result && (
        <div className="flex-grow-1 w-100 d-flex flex-column align-items-center justify-content-center">
          {/* Game Stats */}
          <div className="game-stats text-white mb-3 text-center">
            <div className="mb-2">
              Level: {level} | Puzzle: {currentPuzzleIndex + 1}/{totalPuzzles} |
              Solved: {solvedPuzzles}
            </div>
            <div className="mb-2">
              XP: {xp} / {xpToNextLevel} | Moves: {moveCount}
            </div>
          </div>

          {/* Puzzle Display */}
          {currentPuzzle && puzzleState && (
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
                {currentPuzzle.size}×{currentPuzzle.size} Sliding Puzzle
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
                  ✓ Puzzle Solved in {moveCount} moves!
                </div>
              )}

              {!showFeedback && gameStarted && (
                <div className="puzzle-grid">
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: `repeat(${currentPuzzle.size}, 80px)`,
                      gap: "5px",
                      justifyContent: "center",
                      marginBottom: "1rem",
                    }}
                  >
                    {puzzleState.map((row, rowIndex) =>
                      row.map((value, colIndex) =>
                        renderTile(value, rowIndex, colIndex)
                      )
                    )}
                  </div>

                  <div style={{ color: "#ccc", fontSize: "0.9rem" }}>
                    Click tiles adjacent to the empty space to move them
                  </div>
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
                  Get ready to solve sliding puzzles!
                </div>
              )}
            </div>
          )}

          {/* Target Pattern */}
          {currentPuzzle && gameStarted && !showFeedback && (
            <div
              className="target-display"
              style={{
                backgroundColor: "#1a1a1a",
                border: "2px solid #666",
                borderRadius: "10px",
                padding: "1rem",
                marginBottom: "1rem",
              }}
            >
              <div
                style={{
                  fontSize: "1rem",
                  color: "#4ECDC4",
                  marginBottom: "0.5rem",
                  fontWeight: "bold",
                }}
              >
                Target Pattern:
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: `repeat(${currentPuzzle.size}, 40px)`,
                  gap: "2px",
                  justifyContent: "center",
                }}
              >
                {currentPuzzle.solvedState.map((row, rowIndex) =>
                  row.map((value, colIndex) => (
                    <div
                      key={`target-${rowIndex}-${colIndex}`}
                      style={{
                        width: "40px",
                        height: "40px",
                        backgroundColor:
                          value === null ? "transparent" : "#555",
                        color: "#ccc",
                        border: "1px solid #666",
                        borderRadius: "4px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "0.8rem",
                        fontWeight: "bold",
                      }}
                    >
                      {value}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* In-game instruction text removed; instructions live in intro panel */}
        </div>
      )}
    </div>
  );
}

export default function TilePuzzle({ token }) {
  return (
    <GameWindow>
      <GameLayout
        introSlides={introSlides}
        helpText="Solve sliding tile puzzles by arranging numbered tiles in order! Click on tiles adjacent to the empty space to move them. Try to solve with as few moves as possible."
        gameName="Tile Puzzle"
        fetchUserGameProgress={fetchUserGameProgress}
        submitGameScore={submitTilePuzzle}
        initialLevel={1}
        maxLevel={10}
        onGameStart={(level, { resetProgress }) => resetProgress(level)}
        onGameRestart={() => window.location.reload()}
        onGameQuit={() => window.location.assign("/games/logic")}
        token={token}
      >
        {(game) => (
          <TilePuzzleGame
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
