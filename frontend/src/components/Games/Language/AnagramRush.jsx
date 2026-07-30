import { useState, useEffect, useRef } from "react";
import GameWindow from "../GameWindow.jsx";
import GameLayout from "../Layout/GameLayout.jsx";
import { submitAnagramRush } from "../../../api/games.jsx";
import { fetchUserGameProgress } from "../../../api/score.jsx";

function generateAnagramPuzzle(level) {
  // Word sets for different difficulty levels
  const wordSets = {
    easy: [
      "CAT",
      "DOG",
      "BAT",
      "HAT",
      "RAT",
      "CUT",
      "RUN",
      "SUN",
      "FUN",
      "BUN",
      "TEA",
      "EAR",
      "ARE",
      "ERA",
      "SEA",
      "EAT",
      "ATE",
      "NET",
      "TEN",
      "PEN",
    ],
    medium: [
      "CARE",
      "RACE",
      "ACRE",
      "BEAR",
      "DEAR",
      "READ",
      "DARE",
      "HEAR",
      "NEAR",
      "TEAR",
      "TEAM",
      "MEAT",
      "MATE",
      "TAME",
      "STEM",
      "TERM",
      "TIME",
      "ITEM",
      "EMIT",
      "MITE",
      "LIVE",
      "VILE",
      "EVIL",
      "VINE",
      "NICE",
      "RICE",
      "DICE",
      "MICE",
      "LICE",
      "ONCE",
    ],
    hard: [
      "CHARM",
      "MARCH",
      "CHAIR",
      "TEACH",
      "CHEAT",
      "BEACH",
      "CHEAP",
      "PEACE",
      "PLACE",
      "CLEAN",
      "BRAIN",
      "GRAIN",
      "TRAIN",
      "PLAIN",
      "PLANT",
      "PANEL",
      "PLANE",
      "ANGLE",
      "ANGEL",
      "GLEAN",
      "HEART",
      "EARTH",
      "WATER",
      "TOWER",
      "POWER",
      "LOWER",
      "WRITE",
      "TIGER",
      "GRIFT",
      "GRIPE",
    ],
  };

  // Select difficulty based on level
  let selectedSet;
  if (level <= 3) {
    selectedSet = wordSets.easy;
  } else if (level <= 6) {
    selectedSet = wordSets.medium;
  } else {
    selectedSet = wordSets.hard;
  }

  // Generate a set of letters that can form multiple words
  const targetWordCount = Math.min(3 + Math.floor(level / 2), 8); // 3-8 words to find
  const baseWord = selectedSet[Math.floor(Math.random() * selectedSet.length)];

  // Find words that can be made from the letters of the base word
  const baseLetters = baseWord.split("").sort().join("");
  const possibleWords = selectedSet.filter((word) => {
    if (word === baseWord) return true;
    const wordLetters = word.split("").sort().join("");
    return canFormWord(wordLetters, baseLetters);
  });

  // If not enough words, try a different approach
  if (possibleWords.length < targetWordCount) {
    // Use a common letter set that can form many words
    const commonSets = [
      {
        letters: "AERT",
        words: [
          "TEAR",
          "RATE",
          "TARE",
          "AREA",
          "EAR",
          "EAT",
          "TEA",
          "ATE",
          "ARE",
          "ERA",
          "TAR",
          "RAT",
          "ART",
        ],
      },
      {
        letters: "AERS",
        words: [
          "SEAR",
          "RASE",
          "EARS",
          "ERAS",
          "ARE",
          "EAR",
          "ERA",
          "SEA",
          "ARS",
        ],
      },
      {
        letters: "AEIN",
        words: [
          "NINE",
          "RAIN",
          "REIN",
          "NEAR",
          "EARN",
          "ARE",
          "EAR",
          "ERA",
          "IRE",
        ],
      },
      {
        letters: "AETR",
        words: [
          "TEAR",
          "RATE",
          "TARE",
          "TEAM",
          "MEAT",
          "MATE",
          "EAR",
          "EAT",
          "TEA",
          "ATE",
          "ARE",
          "ERA",
        ],
      },
    ];

    const selectedCommonSet =
      commonSets[Math.floor(Math.random() * commonSets.length)];
    const shuffledLetters = selectedCommonSet.letters
      .split("")
      .sort(() => Math.random() - 0.5)
      .join("");

    return {
      letters: shuffledLetters,
      possibleWords: selectedCommonSet.words.slice(0, targetWordCount),
      wordCount: Math.min(targetWordCount, selectedCommonSet.words.length),
      minWordLength: Math.min(3, selectedCommonSet.words[0]?.length || 3),
    };
  }

  // Shuffle the letters of the base word
  const shuffledLetters = baseWord
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("");

  return {
    letters: shuffledLetters,
    possibleWords: possibleWords.slice(0, targetWordCount),
    wordCount: Math.min(targetWordCount, possibleWords.length),
    minWordLength: Math.min(...possibleWords.map((w) => w.length)),
  };
}

function canFormWord(word, availableLetters) {
  const wordLetterCount = {};
  const availableLetterCount = {};

  // Count letters in word
  for (const letter of word) {
    wordLetterCount[letter] = (wordLetterCount[letter] || 0) + 1;
  }

  // Count available letters
  for (const letter of availableLetters) {
    availableLetterCount[letter] = (availableLetterCount[letter] || 0) + 1;
  }

  // Check if word can be formed
  for (const letter in wordLetterCount) {
    if (
      !availableLetterCount[letter] ||
      wordLetterCount[letter] > availableLetterCount[letter]
    ) {
      return false;
    }
  }

  return true;
}

const introSlides = [
  {
    title: "Why Anagram Rush?",
    desc: "This game enhances your vocabulary, pattern recognition, and mental flexibility. It improves your ability to see words from different perspectives and think creatively.",
    img: "/images/brain-idea.svg",
  },
  {
    title: "Benefits",
    desc: "• Improves vocabulary skills\n• Enhances pattern recognition\n• Develops mental flexibility\n• Builds word formation skills",
    img: "/images/brain-benefit.svg",
  },
  {
    title: "How to Play",
    desc: "Find as many words as possible using the given letters! Each letter can only be used once per word. Longer words score more points.",
    img: "/images/brain-tutorial.svg",
  },
];

function AnagramRushGame({
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
  const [foundWords, setFoundWords] = useState([]);
  const [allFoundWords, setAllFoundWords] = useState([]);
  const [inputWord, setInputWord] = useState("");
  const [solvedPuzzles, setSolvedPuzzles] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackType, setFeedbackType] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [score, setScore] = useState(0);
  const inputRef = useRef();
  const gameStartedRef = useRef(false);
  const totalPuzzles = Math.min(4 + level, 8); // 5-8 puzzles

  // Initialize new game when level changes
  useEffect(() => {
    const newPuzzles = [];
    for (let i = 0; i < totalPuzzles; i++) {
      newPuzzles.push(generateAnagramPuzzle(level));
    }
    setPuzzles(newPuzzles);
    setCurrentPuzzleIndex(0);
    setCurrentPuzzle(newPuzzles[0]);
    setFoundWords([]);
    setAllFoundWords([]);
    setInputWord("");
    setSolvedPuzzles(0);
    setGameStarted(false);
    setShowFeedback(false);
    setErrorMessage("");
    setScore(0);
    gameStartedRef.current = false;
  }, [level, totalPuzzles]);

  // Start game
  useEffect(() => {
    if (puzzles.length > 0 && !gameStarted) {
      const startTimer = setTimeout(() => {
        setGameStarted(true);
        gameStartedRef.current = true;
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 1000);

      return () => clearTimeout(startTimer);
    }
  }, [puzzles, gameStarted]);

  const handleWordSubmit = (e) => {
    e.preventDefault();
    if (!gameStarted || result || showFeedback || !inputWord.trim()) return;

    const word = inputWord.trim().toUpperCase();
    setErrorMessage("");

    // Check minimum length
    if (word.length < currentPuzzle.minWordLength) {
      setErrorMessage(
        `Word must be at least ${currentPuzzle.minWordLength} letters long`
      );
      return;
    }

    // Check if word already found
    if (foundWords.includes(word)) {
      setErrorMessage("Word already found");
      return;
    }

    // Check if word can be formed from available letters
    if (!canFormWord(word, currentPuzzle.letters)) {
      setErrorMessage("Cannot form this word from available letters");
      if (playWrong) playWrong();
      if (handleWrong) handleWrong();
      if (setMistakes) setMistakes((prev) => prev + 1);
      setTimer((prev) => Math.max(0, prev - 2));
      if (triggerMinusFive) triggerMinusFive();
      return;
    }

    // Check if it's a valid word in our set
    if (!currentPuzzle.possibleWords.includes(word)) {
      setErrorMessage("Not a valid word for this puzzle");
      if (playWrong) playWrong();
      if (handleWrong) handleWrong();
      if (setMistakes) setMistakes((prev) => prev + 1);
      setTimer((prev) => Math.max(0, prev - 2));
      if (triggerMinusFive) triggerMinusFive();
      return;
    }

    // Valid word found!
    if (playCorrect) playCorrect();
    const newFoundWords = [...foundWords, word];
    setFoundWords(newFoundWords);
    setInputWord("");

    // Calculate score based on word length
    const wordScore = word.length * 10;
    setScore((prev) => prev + wordScore);

    handleSuccess({
      timeLeft: timer,
      timer: 120,
      isCorrect: true,
      wordLength: word.length,
    });

    // Check if puzzle is complete (found all words or enough words)
    const requiredWords = Math.ceil(currentPuzzle.wordCount * 0.7); // Need 70% of possible words
    if (newFoundWords.length >= requiredWords) {
      setSolvedPuzzles((prev) => prev + 1);
      setFeedbackType("correct");
      setShowFeedback(true);

      setTimeout(() => {
        setShowFeedback(false);

        if (currentPuzzleIndex + 1 >= totalPuzzles) {
          // Game complete
          if (handleGameComplete) {
            handleGameComplete({
              letters: puzzles.map((puzzle) => puzzle.letters),
              user_words: [...allFoundWords, newFoundWords],
              message: "Anagram master!",
            });
          }
        } else {
          // Next puzzle
          const nextIndex = currentPuzzleIndex + 1;
          setCurrentPuzzleIndex(nextIndex);
          setCurrentPuzzle(puzzles[nextIndex]);
          setAllFoundWords((prev) => [...prev, newFoundWords]);
          setFoundWords([]);
          setInputWord("");
          setErrorMessage("");
          if (inputRef.current) {
            inputRef.current.focus();
          }
        }
      }, 2000);
    } else {
      // Continue with current puzzle
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  };

  // Handle game over when timer runs out
  useEffect(() => {
    if (timer === 0 && !result && gameStartedRef.current) {
      // Check if current puzzle has enough words found
      const requiredWords = Math.ceil(currentPuzzle?.wordCount * 0.7 || 1);
      if (foundWords.length >= requiredWords) {
        // Complete current puzzle before game over
        if (handleGameComplete) {
          handleGameComplete({
            letters: puzzles.map((puzzle) => puzzle.letters),
            user_words: [...allFoundWords, foundWords],
            message: "Time's up but puzzle completed!",
          });
        }
      } else {
        handleGameOver({
          letters: puzzles.map((puzzle) => puzzle.letters),
          user_words: [...allFoundWords, foundWords],
          message: "Time's up!",
        });
      }
    }
  }, [
    timer,
    result,
    handleGameOver,
    handleGameComplete,
    puzzles,
    allFoundWords,
    foundWords,
    currentPuzzle,
  ]);

  const progress = currentPuzzle
    ? Math.round(
        (foundWords.length / Math.ceil(currentPuzzle.wordCount * 0.7)) * 100
      )
    : 0;

  return (
    <div className="anagram-rush-container">
      {!result && (
        <div className="flex-grow-1 w-100 d-flex flex-column align-items-center justify-content-center">
          {/* Game Stats */}
          <div className="game-stats text-white mb-3 text-center">
            <div className="mb-2">
              Level: {level} | Puzzle: {currentPuzzleIndex + 1}/{totalPuzzles} |
              Solved: {solvedPuzzles}
            </div>
            <div className="mb-2">
              XP: {xp} / {xpToNextLevel} | Score: {score} | Progress: {progress}
              %
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
                Find words using these letters:
              </div>

              {/* Letters Display */}
              <div
                className="letters-display"
                style={{
                  backgroundColor: "#1a1a1a",
                  border: "2px solid #666",
                  borderRadius: "10px",
                  padding: "1.5rem",
                  marginBottom: "2rem",
                  display: "flex",
                  justifyContent: "center",
                  gap: "10px",
                  flexWrap: "wrap",
                }}
              >
                {currentPuzzle.letters.split("").map((letter, index) => (
                  <div
                    key={index}
                    style={{
                      backgroundColor: "#4ECDC4",
                      color: "#000",
                      width: "60px",
                      height: "60px",
                      borderRadius: "10px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "2rem",
                      fontWeight: "bold",
                      boxShadow: "0 4px 8px rgba(0,0,0,0.3)",
                    }}
                  >
                    {letter}
                  </div>
                ))}
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
                  ✓ Puzzle Complete! Found {foundWords.length} words!
                </div>
              )}

              {!showFeedback && gameStarted && (
                <div className="input-area">
                  <form
                    onSubmit={handleWordSubmit}
                    style={{ marginBottom: "1rem" }}
                  >
                    <input
                      ref={inputRef}
                      type="text"
                      value={inputWord}
                      onChange={(e) =>
                        setInputWord(e.target.value.toUpperCase())
                      }
                      placeholder="Type a word..."
                      style={{
                        fontSize: "1.5rem",
                        padding: "10px 15px",
                        border: errorMessage
                          ? "2px solid #FF6B6B"
                          : "2px solid #666",
                        borderRadius: "8px",
                        backgroundColor: "#1a1a1a",
                        color: "#fff",
                        textAlign: "center",
                        width: "250px",
                        letterSpacing: "1px",
                        fontWeight: "bold",
                      }}
                      autoComplete="off"
                    />
                  </form>

                  {errorMessage && (
                    <div
                      style={{
                        color: "#FF6B6B",
                        fontSize: "1rem",
                        marginBottom: "1rem",
                        fontWeight: "bold",
                      }}
                    >
                      {errorMessage}
                    </div>
                  )}

                  <div
                    style={{
                      fontSize: "1rem",
                      color: "#ccc",
                      marginBottom: "1rem",
                    }}
                  >
                    Found {foundWords.length} /{" "}
                    {Math.ceil(currentPuzzle.wordCount * 0.7)} required words
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
                  Get ready to find anagrams!
                </div>
              )}
            </div>
          )}

          {/* Found Words Display */}
          {foundWords.length > 0 && gameStarted && !showFeedback && (
            <div
              className="found-words"
              style={{
                backgroundColor: "#1a1a1a",
                border: "2px solid #666",
                borderRadius: "10px",
                padding: "1rem",
                marginBottom: "1rem",
                maxWidth: "700px",
              }}
            >
              <div
                style={{
                  fontSize: "1.2rem",
                  color: "#4ECDC4",
                  marginBottom: "0.5rem",
                  fontWeight: "bold",
                }}
              >
                Found Words:
              </div>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "8px",
                }}
              >
                {foundWords.map((word, index) => (
                  <div
                    key={index}
                    style={{
                      backgroundColor: "#45B7B8",
                      color: "#fff",
                      padding: "5px 10px",
                      borderRadius: "15px",
                      fontSize: "0.9rem",
                      fontWeight: "bold",
                    }}
                  >
                    {word} ({word.length * 10}pts)
                  </div>
                ))}
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
              Find words using the given letters!
            </div>
            <div style={{ fontSize: "0.9rem", opacity: 0.8 }}>
              Each letter can only be used once per word • Longer words score
              more points • Find 70% of possible words to advance
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AnagramRush({ token }) {
  return (
    <GameWindow>
      <GameLayout
        introSlides={introSlides}
        helpText="Find as many words as possible using the given letters! Each letter can only be used once per word. Longer words score more points."
        gameName="Anagram Rush"
        fetchUserGameProgress={fetchUserGameProgress}
        submitGameScore={submitAnagramRush}
        initialLevel={1}
        maxLevel={10}
        onGameStart={(level, { resetProgress }) => resetProgress(level)}
        onGameRestart={() => window.location.reload()}
        onGameQuit={() => window.location.assign("/games/language")}
        token={token}
      >
        {(game) => (
          <AnagramRushGame
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
