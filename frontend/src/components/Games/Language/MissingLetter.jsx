import { useState, useEffect, useRef } from "react";
import GameWindow from "../GameWindow.jsx";
import GameLayout from "../Layout/GameLayout.jsx";
import { submitMissingLetter } from "../../../api/games.jsx";
import { fetchUserGameProgress } from "../../../api/score.jsx";

function generatePuzzle(level) {
  const words = [
    // Easy level (3-5 letters)
    ["CAT", "CATS"],
    ["DOG", "DOGS"],
    ["RUN", "RUNS"],
    ["BIG", "HUGE"],
    ["SUN", "SUNNY"],
    ["HOT", "WARM"],
    ["OLD", "AGED"],
    ["NEW", "FRESH"],
    ["RED", "ROSE"],
    ["BLUE", "NAVY"],
    ["HELP", "HELPS"],
    ["WALK", "WALKS"],
    ["TALK", "TALKS"],
    ["PLAY", "PLAYS"],
    ["WORK", "WORKS"],

    // Medium level (5-7 letters)
    ["HAPPY", "JOYFUL"],
    ["ANGRY", "FURIOUS"],
    ["SMART", "CLEVER"],
    ["BRAVE", "BOLD"],
    ["FUNNY", "COMIC"],
    ["MUSIC", "SOUND"],
    ["WATER", "OCEAN"],
    ["HOUSE", "HOME"],
    ["MONEY", "CASH"],
    ["TRAIN", "RAIL"],
    ["FLOWER", "BLOOM"],
    ["GARDEN", "YARD"],
    ["FRIEND", "BUDDY"],
    ["FAMILY", "CLAN"],
    ["SCHOOL", "LEARN"],

    // Hard level (6+ letters)
    ["BEAUTIFUL", "GORGEOUS"],
    ["EXCELLENT", "SUPERB"],
    ["TERRIBLE", "AWFUL"],
    ["AMAZING", "WONDERFUL"],
    ["COMPUTER", "MACHINE"],
    ["TELEPHONE", "PHONE"],
    ["ELEPHANT", "MAMMAL"],
    ["BUTTERFLY", "INSECT"],
    ["MOUNTAIN", "PEAK"],
    ["BUILDING", "TOWER"],
    ["RESTAURANT", "CAFE"],
    ["ADVENTURE", "JOURNEY"],
    ["CHOCOLATE", "CANDY"],
    ["PHOTOGRAPH", "PICTURE"],
    ["VEGETABLE", "PRODUCE"],
  ];

  // Select words based on level
  let availableWords;
  if (level <= 3) {
    availableWords = words.slice(0, 15); // Easy words
  } else if (level <= 6) {
    availableWords = words.slice(5, 30); // Mix of easy and medium
  } else {
    availableWords = words.slice(10); // All levels including hard
  }

  // Pick a random word
  const wordPair =
    availableWords[Math.floor(Math.random() * availableWords.length)];
  const targetWord = wordPair[0];

  // Create word with missing letter(s)
  const missingPositions = [];
  const numMissing = Math.min(Math.floor(targetWord.length / 3) + 1, 3); // 1-3 missing letters

  // Randomly select positions for missing letters
  const possiblePositions = [...Array(targetWord.length).keys()];
  for (let i = 0; i < numMissing; i++) {
    if (possiblePositions.length > 0) {
      const randomIndex = Math.floor(Math.random() * possiblePositions.length);
      const position = possiblePositions.splice(randomIndex, 1)[0];
      missingPositions.push(position);
    }
  }

  missingPositions.sort((a, b) => a - b);

  // Create display word with blanks
  let displayWord = "";
  for (let i = 0; i < targetWord.length; i++) {
    if (missingPositions.includes(i)) {
      displayWord += "_";
    } else {
      displayWord += targetWord[i];
    }
  }

  // Get the missing letters
  const missingLetters = missingPositions.map((pos) => targetWord[pos]);

  // Create distractors (wrong letters)
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const usedLetters = new Set([...targetWord, ...missingLetters]);
  const distractors = [];

  while (distractors.length < Math.min(6, 26 - usedLetters.size)) {
    const randomLetter = alphabet[Math.floor(Math.random() * alphabet.length)];
    if (!usedLetters.has(randomLetter) && !distractors.includes(randomLetter)) {
      distractors.push(randomLetter);
    }
  }

  // Combine missing letters with distractors
  const allOptions = [...missingLetters, ...distractors].sort(
    () => Math.random() - 0.5
  );

  // Create hint based on the related word
  const hint = `Hint: Related to "${wordPair[1]}"`;

  return {
    targetWord,
    displayWord,
    missingPositions,
    missingLetters,
    options: allOptions,
    hint,
    relatedWord: wordPair[1],
  };
}

const introSlides = [
  {
    title: "Why Missing Letter?",
    desc: "This game improves spelling, word recognition, and vocabulary. It enhances your ability to complete patterns and recall word structures.",
    img: "/images/brain-idea.svg",
  },
  {
    title: "Benefits",
    desc: "• Improves spelling skills\n• Enhances pattern recognition\n• Develops vocabulary\n• Builds word structure knowledge",
    img: "/images/brain-benefit.svg",
  },
  {
    title: "How to Play",
    desc: "Complete words by filling in missing letters! Click on letter options to fill in the blanks. Use the hint to help you figure out the word.",
    img: "/images/brain-tutorial.svg",
  },
];

function MissingLetterGame({
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
  const [userInputs, setUserInputs] = useState({});
  const [allUserAnswers, setAllUserAnswers] = useState([]);
  const [solvedPuzzles, setSolvedPuzzles] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackType, setFeedbackType] = useState("");
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [selectedOption, setSelectedOption] = useState(null);
  const gameStartedRef = useRef(false);
  const totalPuzzles = Math.min(5 + level, 10); // 6-10 puzzles

  // Initialize new game when level changes
  useEffect(() => {
    const newPuzzles = [];
    for (let i = 0; i < totalPuzzles; i++) {
      newPuzzles.push(generatePuzzle(level));
    }
    setPuzzles(newPuzzles);
    setCurrentPuzzleIndex(0);
    setCurrentPuzzle(newPuzzles[0]);
    setUserInputs({});
    setAllUserAnswers([]);
    setSolvedPuzzles(0);
    setGameStarted(false);
    setShowFeedback(false);
    setSelectedOption(null);
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

  const handleLetterClick = (letter) => {
    if (!gameStarted || result || showFeedback) return;

    setSelectedOption(letter);

    // Find the first empty position
    const firstEmptyPos = currentPuzzle.missingPositions.find(
      (pos) => !userInputs[pos]
    );

    if (firstEmptyPos !== undefined) {
      const newInputs = { ...userInputs, [firstEmptyPos]: letter };
      setUserInputs(newInputs);

      // Check if all positions are filled
      const allFilled = currentPuzzle.missingPositions.every(
        (pos) => newInputs[pos]
      );

      if (allFilled) {
        // Check if the word is correct
        let userWord = "";
        for (let i = 0; i < currentPuzzle.targetWord.length; i++) {
          if (currentPuzzle.missingPositions.includes(i)) {
            userWord += newInputs[i];
          } else {
            userWord += currentPuzzle.targetWord[i];
          }
        }

        setTimeout(() => {
          if (userWord === currentPuzzle.targetWord) {
            // Correct answer
            if (playCorrect) playCorrect();
            setSolvedPuzzles((prev) => prev + 1);
            setFeedbackType("correct");
            setFeedbackMessage(
              `Correct! The word is "${currentPuzzle.targetWord}"`
            );
            setShowFeedback(true);

            handleSuccess({
              timeLeft: timer,
              timer: 120,
              isCorrect: true,
            });

            setTimeout(() => {
              setShowFeedback(false);

              if (currentPuzzleIndex + 1 >= totalPuzzles) {
                // Game complete
                if (handleGameComplete) {
                  handleGameComplete({
                    word: puzzles.map((puzzle) => puzzle.targetWord).join(","),
                    user_letter: [...allUserAnswers, userWord].join(","),
                    message: "Word master!",
                  });
                }
              } else {
                // Next puzzle
                const nextIndex = currentPuzzleIndex + 1;
                setCurrentPuzzleIndex(nextIndex);
                setCurrentPuzzle(puzzles[nextIndex]);
                setAllUserAnswers((prev) => [...prev, userWord]);
                setUserInputs({});
                setSelectedOption(null);
              }
            }, 2000);
          } else {
            // Incorrect answer
            if (playWrong) playWrong();
            if (handleWrong) handleWrong();
            if (setMistakes) setMistakes((prev) => prev + 1);
            setFeedbackType("wrong");
            setFeedbackMessage(`Incorrect! Try again.`);
            setShowFeedback(true);

            // Clear inputs and allow retry
            setUserInputs({});
            setSelectedOption(null);

            // Penalty: reduce timer
            setTimer((prev) => Math.max(0, prev - 5));
            if (triggerMinusFive) triggerMinusFive();

            setTimeout(() => {
              setShowFeedback(false);
            }, 1500);
          }
        }, 300);
      }
    }

    setTimeout(() => {
      setSelectedOption(null);
    }, 200);
  };

  const handleClear = () => {
    if (!gameStarted || result || showFeedback) return;
    setUserInputs({});
  };

  // Handle game over when timer runs out
  useEffect(() => {
    if (timer === 0 && !result && gameStartedRef.current) {
      const currentAnswer = getCurrentWord();
      handleGameOver({
        word: puzzles.map((puzzle) => puzzle.targetWord).join(","),
        user_letter: [...allUserAnswers, currentAnswer].join(","),
        message: "Time's up!",
      });
    }
  }, [timer, result, handleGameOver, puzzles, allUserAnswers, userInputs]);

  const getCurrentWord = () => {
    if (!currentPuzzle) return "";
    let word = "";
    for (let i = 0; i < currentPuzzle.targetWord.length; i++) {
      if (currentPuzzle.missingPositions.includes(i)) {
        word += userInputs[i] || "_";
      } else {
        word += currentPuzzle.targetWord[i];
      }
    }
    return word;
  };

  const progress = currentPuzzle
    ? Math.round(
        (currentPuzzle.missingPositions.filter((pos) => userInputs[pos])
          .length /
          currentPuzzle.missingPositions.length) *
          100
      )
    : 0;

  return (
    <div className="missing-letter-container">
      {!result && (
        <div className="flex-grow-1 w-100 d-flex flex-column align-items-center justify-content-center">
          {/* Game Stats */}
          <div className="game-stats text-white mb-3 text-center">
            <div className="mb-2">
              Level: {level} | Puzzle: {currentPuzzleIndex + 1}/{totalPuzzles} |
              Solved: {solvedPuzzles}
            </div>
            <div className="mb-2">
              XP: {xp} / {xpToNextLevel} | Progress: {progress}%
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
                  color: "#4ECDC4",
                  marginBottom: "1rem",
                }}
              >
                {currentPuzzle.hint}
              </div>

              {showFeedback && (
                <div
                  style={{
                    fontSize: "1.5rem",
                    fontWeight: "bold",
                    color: feedbackType === "correct" ? "#4ECDC4" : "#FF6B6B",
                    marginBottom: "1rem",
                    minHeight: "60px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {feedbackMessage}
                </div>
              )}

              {!showFeedback && gameStarted && (
                <div className="word-display">
                  <div
                    style={{
                      fontSize: "3rem",
                      fontWeight: "bold",
                      color: "#fff",
                      marginBottom: "2rem",
                      fontFamily: "monospace",
                      letterSpacing: "0.2em",
                    }}
                  >
                    {currentPuzzle.targetWord.split("").map((letter, index) => {
                      const isMissing =
                        currentPuzzle.missingPositions.includes(index);
                      const userLetter = userInputs[index];

                      return (
                        <span
                          key={index}
                          style={{
                            display: "inline-block",
                            width: "60px",
                            height: "70px",
                            lineHeight: "70px",
                            margin: "0 5px",
                            backgroundColor: isMissing
                              ? userLetter
                                ? "#4ECDC4"
                                : "#444"
                              : "#666",
                            color: isMissing
                              ? userLetter
                                ? "#000"
                                : "#fff"
                              : "#fff",
                            border: isMissing
                              ? "3px solid #4ECDC4"
                              : "2px solid #999",
                            borderRadius: "8px",
                            textAlign: "center",
                          }}
                        >
                          {isMissing ? userLetter || "" : letter}
                        </span>
                      );
                    })}
                  </div>

                  {/* Letter Options */}
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      justifyContent: "center",
                      gap: "10px",
                      marginBottom: "1rem",
                      maxWidth: "500px",
                      margin: "0 auto 1rem auto",
                    }}
                  >
                    {currentPuzzle.options.map((letter, index) => (
                      <button
                        key={index}
                        onClick={() => handleLetterClick(letter)}
                        style={{
                          width: "50px",
                          height: "50px",
                          backgroundColor:
                            selectedOption === letter ? "#FFD93D" : "#555",
                          color: selectedOption === letter ? "#000" : "#fff",
                          border: "2px solid #777",
                          borderRadius: "8px",
                          fontSize: "1.5rem",
                          fontWeight: "bold",
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                          transform:
                            selectedOption === letter
                              ? "scale(1.1)"
                              : "scale(1)",
                        }}
                        onMouseEnter={(e) => {
                          if (selectedOption !== letter) {
                            e.target.style.backgroundColor = "#666";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (selectedOption !== letter) {
                            e.target.style.backgroundColor = "#555";
                          }
                        }}
                      >
                        {letter}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={handleClear}
                    style={{
                      backgroundColor: "#FF6B6B",
                      color: "#fff",
                      border: "none",
                      borderRadius: "8px",
                      padding: "10px 20px",
                      fontSize: "1rem",
                      fontWeight: "bold",
                      cursor: "pointer",
                      marginTop: "1rem",
                    }}
                  >
                    Clear All
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
                  Get ready to complete words!
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
              Fill in the missing letters!
            </div>
            <div style={{ fontSize: "0.9rem", opacity: 0.8 }}>
              Click on letter options to fill blanks • Use the hint to help you
              • Complete the word to continue
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MissingLetter({ token }) {
  return (
    <GameWindow>
      <GameLayout
        introSlides={introSlides}
        helpText="Complete words by filling in missing letters! Click on letter options to fill in the blanks. Use the hint to help you figure out the word."
        gameName="Missing Letter"
        fetchUserGameProgress={fetchUserGameProgress}
        submitGameScore={submitMissingLetter}
        initialLevel={1}
        maxLevel={10}
        onGameStart={(level, { resetProgress }) => resetProgress(level)}
        onGameRestart={() => window.location.reload()}
        onGameQuit={() => window.location.assign("/games/language")}
        token={token}
      >
        {(game) => (
          <MissingLetterGame
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
