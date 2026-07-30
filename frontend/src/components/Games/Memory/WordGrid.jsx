import { useState, useEffect, useRef } from "react";
import GameWindow from "../GameWindow.jsx";
import GameLayout from "../Layout/GameLayout.jsx";
import { submitWordGrid } from "../../../api/games.jsx";
import { fetchUserGameProgress } from "../../../api/score.jsx";

// Word lists for different categories
const wordCategories = {
  animals: [
    "CAT",
    "DOG",
    "BIRD",
    "FISH",
    "BEAR",
    "WOLF",
    "LION",
    "DEER",
    "FROG",
    "DUCK",
  ],
  colors: [
    "RED",
    "BLUE",
    "GREEN",
    "PINK",
    "GOLD",
    "GRAY",
    "NAVY",
    "LIME",
    "TEAL",
    "CYAN",
  ],
  food: [
    "APPLE",
    "BREAD",
    "CAKE",
    "MEAT",
    "RICE",
    "SOUP",
    "MILK",
    "FISH",
    "CORN",
    "BEAN",
  ],
  nature: [
    "TREE",
    "ROCK",
    "LAKE",
    "HILL",
    "SAND",
    "WIND",
    "RAIN",
    "SNOW",
    "FIRE",
    "STAR",
  ],
  home: [
    "CHAIR",
    "TABLE",
    "LAMP",
    "DOOR",
    "WALL",
    "FLOOR",
    "ROOF",
    "YARD",
    "BATH",
    "ROOM",
  ],
  body: [
    "HAND",
    "FOOT",
    "HEAD",
    "KNEE",
    "BACK",
    "NECK",
    "CHEST",
    "ARM",
    "LEG",
    "FACE",
  ],
};

// Filler letters that are commonly used
const fillerLetters = "AEIOURLSTNCHMPDGBFYWKVXZJQ";

function generateWordGrid(level) {
  const gridSize = Math.min(4 + level, 8); // 5x5 to 8x8 grid
  const categories = Object.keys(wordCategories);
  const selectedCategory =
    categories[Math.floor(Math.random() * categories.length)];
  const availableWords = wordCategories[selectedCategory];

  // Select words that fit in the grid
  const validWords = availableWords.filter((word) => word.length <= gridSize);
  const wordCount = Math.min(3 + Math.floor(level / 2), validWords.length, 6);
  const selectedWords = [];

  // Pick random words
  for (let i = 0; i < wordCount; i++) {
    const randomIndex = Math.floor(Math.random() * validWords.length);
    const word = validWords[randomIndex];
    if (!selectedWords.includes(word)) {
      selectedWords.push(word);
    }
  }

  // Create empty grid
  const grid = Array(gridSize)
    .fill()
    .map(() => Array(gridSize).fill(""));

  // Place words randomly (horizontal or vertical)
  const placedWords = [];
  selectedWords.forEach((word) => {
    let placed = false;
    let attempts = 0;

    while (!placed && attempts < 50) {
      const horizontal = Math.random() > 0.5;
      const row = Math.floor(Math.random() * gridSize);
      const col = Math.floor(Math.random() * gridSize);

      // Check if word fits
      if (horizontal) {
        if (col + word.length <= gridSize) {
          // Check for conflicts
          let canPlace = true;
          for (let i = 0; i < word.length; i++) {
            if (grid[row][col + i] !== "" && grid[row][col + i] !== word[i]) {
              canPlace = false;
              break;
            }
          }

          if (canPlace) {
            // Place the word
            for (let i = 0; i < word.length; i++) {
              grid[row][col + i] = word[i];
            }
            placedWords.push(word);
            placed = true;
          }
        }
      } else {
        if (row + word.length <= gridSize) {
          // Check for conflicts
          let canPlace = true;
          for (let i = 0; i < word.length; i++) {
            if (grid[row + i][col] !== "" && grid[row + i][col] !== word[i]) {
              canPlace = false;
              break;
            }
          }

          if (canPlace) {
            // Place the word
            for (let i = 0; i < word.length; i++) {
              grid[row + i][col] = word[i];
            }
            placedWords.push(word);
            placed = true;
          }
        }
      }
      attempts++;
    }
  });

  // Fill empty spaces with random letters
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      if (grid[row][col] === "") {
        grid[row][col] =
          fillerLetters[Math.floor(Math.random() * fillerLetters.length)];
      }
    }
  }

  return { grid, words: placedWords, category: selectedCategory };
}

const introSlides = [
  {
    title: "Why Word Grid?",
    desc: "This game trains your visual scanning and word recognition abilities. It improves reading speed and pattern recognition skills.",
    img: "/images/brain-idea.svg",
  },
  {
    title: "Benefits",
    desc: "• Enhances visual scanning\n• Improves word recognition\n• Develops pattern detection\n• Strengthens reading skills",
    img: "/images/brain-benefit.svg",
  },
  {
    title: "How to Play",
    desc: "Study the grid of letters for a few seconds. Then type all the words you remember seeing. Words can be horizontal or vertical!",
    img: "/images/brain-tutorial.svg",
  },
];

function WordGridGame({
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
  const [gameData, setGameData] = useState(() => generateWordGrid(level));
  const [showGrid, setShowGrid] = useState(true);
  const [userWords, setUserWords] = useState([]);
  const [currentWord, setCurrentWord] = useState("");
  const [foundWords, setFoundWords] = useState([]);
  const inputRef = useRef();
  const gameStartedRef = useRef(false);

  // Generate new grid when level changes
  useEffect(() => {
    const newGameData = generateWordGrid(level);
    setGameData(newGameData);
    setShowGrid(true);
    setUserWords([]);
    setCurrentWord("");
    setFoundWords([]);
    gameStartedRef.current = false;
  }, [level]);

  // Show grid for a few seconds, then hide it
  useEffect(() => {
    if (showGrid) {
      const showTime = Math.max(4000, 7000 - level * 200); // 7s to 4s based on level
      const timer = setTimeout(() => {
        setShowGrid(false);
        gameStartedRef.current = true;
        setTimeout(() => {
          if (inputRef.current) inputRef.current.focus();
        }, 100);
      }, showTime);

      return () => clearTimeout(timer);
    }
  }, [showGrid, level]);

  // Handle word input
  const handleWordSubmit = (e) => {
    e.preventDefault();
    if (!currentWord.trim() || showGrid || result) return;

    const word = currentWord.trim().toUpperCase();

    // Check if word is already found
    if (foundWords.includes(word)) {
      setCurrentWord("");
      return;
    }

    // Check if word exists in the grid
    if (gameData.words.includes(word)) {
      if (playCorrect) playCorrect();
      setFoundWords((prev) => {
        const newFound = [...prev, word];

        // Check if all words are found
        if (newFound.length === gameData.words.length) {
          const efficiency =
            (newFound.length /
              Math.max(userWords.length + 1, newFound.length)) *
            100;
          const timeBonus = timer * 2;

          handleSuccess({
            timeLeft: timer,
            timer: 90,
            isCorrect: true,
          });

          // Generate new grid instead of completing the game
          setTimeout(() => {
            setGameData(generateWordGrid(level));
            setFoundWords([]);
            setUserWords([]);
            setShowGrid(true);
            setCurrentWord("");
            // Brief success feedback
            setTimeout(() => {
              setShowGrid(false);
              if (inputRef.current) inputRef.current.focus();
            }, 3000);
          }, 1000);
        }

        return newFound;
      });

      // Only add to userWords for correct words
      setUserWords((prev) => [...prev, word]);
    } else {
      if (playWrong) playWrong();
      if (setMistakes) setMistakes((prev) => prev + 1);
      if (handleWrong) handleWrong(); // Reset streak

      // Penalty: reduce timer by 5 seconds
      setTimer((prev) => Math.max(0, prev - 5));
      if (triggerMinusFive) triggerMinusFive();

      // Show grid again briefly after mistake
      setShowGrid(true);
      setTimeout(() => {
        setShowGrid(false);
        if (inputRef.current) inputRef.current.focus();
      }, 2000);

      // Add wrong words to userWords for tracking
      setUserWords((prev) => [...prev, word]);
    }

    setCurrentWord("");
  };

  // Handle game over when timer runs out
  useEffect(() => {
    if (timer === 0 && !result && gameStartedRef.current) {
      handleGameOver({
        grid: gameData.grid.flat(), // Flatten grid to array of strings
        user_words: userWords,
        message: "Time's up!",
      });
    }
  }, [timer, result, handleGameOver, gameData.grid, userWords]);

  // Auto-focus input when grid disappears
  useEffect(() => {
    if (!showGrid && inputRef.current) {
      setTimeout(() => {
        inputRef.current.focus();
      }, 100);
    }
  }, [showGrid]);

  const handleInputChange = (e) => {
    const newWord = e.target.value.toUpperCase();
    setCurrentWord(newWord);

    // Auto-submit when a valid word is typed (3+ characters)
    if (
      newWord.length >= 3 &&
      gameData.words.includes(newWord) &&
      !foundWords.includes(newWord) &&
      !userWords.includes(newWord)
    ) {
      setTimeout(() => {
        handleWordSubmit({ preventDefault: () => {} });
      }, 100);
    }
  };

  const gridSize = gameData.grid.length;

  return (
    <div
      className="word-grid-container"
      style={{ display: "flex", flexDirection: "column", height: "100%" }}
    >
      {!result && (
        <>
          {/* Game Stats - Always at top */}
          <div
            className="game-stats text-dark mb-3 text-center"
            style={{ flexShrink: 0 }}
          >
            <div className="mb-2">
              Category: {gameData.category} | Found: {foundWords.length}/
              {gameData.words.length}
            </div>
          </div>

          {/* Main game content - Always centered */}
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {showGrid ? (
              // Show the grid for memorization
              <div className="grid-memorization">
                <div className="text-dark text-center mb-3">
                  <h4>Memorize the words in this grid!</h4>
                  <div style={{ fontSize: "0.9rem", opacity: 0.8 }}>
                    Words can be horizontal or vertical
                  </div>
                </div>

                <div
                  className="letter-grid"
                  style={{
                    display: "grid",
                    gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
                    gap: "3px", // Uniform gap for both rows and columns
                    maxWidth: "400px",
                    margin: "0 auto",
                    backgroundColor: "#374151",
                    padding: "6px",
                    borderRadius: "8px",
                  }}
                >
                  {gameData.grid.flat().map((letter, index) => (
                    <div
                      key={index}
                      style={{
                        width: "2.5rem",
                        height: "2.5rem",
                        backgroundColor: "#4f46e5",
                        color: "white",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "1.2rem",
                        fontWeight: "bold",
                        borderRadius: "4px",
                      }}
                    >
                      {letter}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              // Input phase
              <div className="word-input-phase">
                <div className="text-dark text-center mb-4">
                  <h4>Type the words you remember!</h4>
                  <div style={{ fontSize: "0.9rem", opacity: 0.8 }}>
                    Press Enter after each word
                  </div>
                </div>

                {/* Input form */}
                <form
                  onSubmit={handleWordSubmit}
                  className="word-input-form mb-4"
                >
                  <div
                    className="input-group"
                    style={{ maxWidth: "300px", margin: "0 auto" }}
                  >
                    <input
                      ref={inputRef}
                      type="text"
                      value={currentWord}
                      onChange={handleInputChange}
                      className="form-control"
                      placeholder="Enter a word..."
                      style={{
                        fontSize: "1.1rem",
                        padding: "0.75rem",
                        textAlign: "center",
                        textTransform: "uppercase",
                      }}
                    />
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={!currentWord.trim()}
                    >
                      Submit
                    </button>
                  </div>
                </form>

                {/* Found words display */}
                {foundWords.length > 0 && (
                  <div className="found-words text-center">
                    <div
                      className="text-white mb-2"
                      style={{ fontSize: "0.9rem", opacity: 0.8 }}
                    >
                      Found Words:
                    </div>
                    <div className="d-flex flex-wrap justify-content-center gap-2">
                      {foundWords.map((word, index) => (
                        <span
                          key={index}
                          className="badge bg-success"
                          style={{
                            fontSize: "0.9rem",
                            padding: "0.4rem 0.8rem",
                          }}
                        >
                          {word}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* In-game instruction text removed; instructions live in intro panel */}
        </>
      )}
    </div>
  );
}

export default function WordGrid({ token }) {
  return (
    <GameWindow>
      <GameLayout
        introSlides={introSlides}
        helpText="Study the grid carefully to memorize all the words hidden inside. Words can be placed horizontally or vertically. When the grid disappears, type all the words you remember!"
        gameName="Word Grid"
        fetchUserGameProgress={fetchUserGameProgress}
        submitGameScore={submitWordGrid}
        initialLevel={1}
        maxLevel={10}
        onGameStart={(level, { resetProgress }) => resetProgress(level)}
        onGameRestart={() => window.location.reload()}
        onGameQuit={() => window.location.assign("/games/memory")}
        token={token}
      >
        {(game) => (
          <WordGridGame
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
