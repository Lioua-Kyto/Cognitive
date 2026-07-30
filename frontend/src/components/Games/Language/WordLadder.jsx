import { useState, useEffect, useRef } from "react";
import GameWindow from "../GameWindow.jsx";
import GameLayout from "../Layout/GameLayout.jsx";
import { submitWordLadder } from "../../../api/games.jsx";
import { fetchUserGameProgress } from "../../../api/score.jsx";

function generateWordLadder(level) {
  // Word pairs with known ladder solutions
  const wordPairs = [
    // 4-letter words (easier)
    { start: "COLD", end: "WARM", steps: ["CORD", "WORD", "WORM"] },
    { start: "HEAD", end: "TAIL", steps: ["HEAL", "TEAL"] },
    { start: "LOVE", end: "HATE", steps: ["HOVE", "HAVE"] },
    { start: "MILD", end: "WILD", steps: [] },
    { start: "BACK", end: "PACK", steps: [] },
    { start: "CARE", end: "DARE", steps: [] },
    { start: "FAKE", end: "TAKE", steps: [] },
    { start: "GAME", end: "SAME", steps: [] },
    { start: "MAKE", end: "TAKE", steps: [] },
    { start: "LAND", end: "HAND", steps: [] },

    // 5-letter words (harder)
    { start: "HORSE", end: "HOUSE", steps: ["HORDE"] },
    { start: "PEACE", end: "PLACE", steps: [] },
    { start: "LIGHT", end: "NIGHT", steps: [] },
    { start: "SMART", end: "START", steps: [] },
    { start: "BREAD", end: "BREAK", steps: [] },
    { start: "CLEAN", end: "CLEAR", steps: [] },
    { start: "PLANT", end: "PLAIN", steps: [] },
    { start: "BRAIN", end: "TRAIN", steps: [] },
    { start: "BEACH", end: "TEACH", steps: [] },
    { start: "GRAND", end: "BRAND", steps: [] },
  ];

  // Filter by word length based on level
  const maxLength = Math.min(4 + Math.floor(level / 3), 5);
  const availablePairs = wordPairs.filter(
    (pair) => pair.start.length <= maxLength
  );

  const selectedPair =
    availablePairs[Math.floor(Math.random() * availablePairs.length)];

  // Add some common words that could be intermediate steps
  const commonWords4 = [
    "ABLE",
    "BACK",
    "CALL",
    "CAME",
    "CARE",
    "CASE",
    "COME",
    "DONE",
    "DOWN",
    "EACH",
    "FACE",
    "FACT",
    "FIND",
    "FIRE",
    "FORM",
    "GAME",
    "GAVE",
    "GIVE",
    "GOOD",
    "HAND",
    "HAVE",
    "HEAD",
    "HELP",
    "HERE",
    "HIGH",
    "HOME",
    "HOPE",
    "JUST",
    "KEEP",
    "KIND",
    "KNOW",
    "LAND",
    "LAST",
    "LATE",
    "LEFT",
    "LIFE",
    "LIKE",
    "LINE",
    "LIVE",
    "LONG",
    "LOOK",
    "MADE",
    "MAKE",
    "MANY",
    "MUCH",
    "NAME",
    "NEED",
    "NEXT",
    "OPEN",
    "OVER",
    "PART",
    "PAST",
    "PLAY",
    "REAL",
    "ROOM",
    "SAID",
    "SAME",
    "SEEM",
    "SIDE",
    "SUCH",
    "TAKE",
    "THAN",
    "THAT",
    "THEN",
    "THEY",
    "THIS",
    "TIME",
    "TURN",
    "VERY",
    "WANT",
    "WAYS",
    "WELL",
    "WENT",
    "WERE",
    "WHAT",
    "WHEN",
    "WITH",
    "WORD",
    "WORK",
    "YEAR",
  ];

  const commonWords5 = [
    "ABOUT",
    "AFTER",
    "AGAIN",
    "AMONG",
    "BEING",
    "BELOW",
    "BRING",
    "BUILD",
    "CARRY",
    "CHECK",
    "CLEAR",
    "CLOSE",
    "COUNT",
    "COVER",
    "DOING",
    "EARLY",
    "ENTER",
    "EVERY",
    "FIELD",
    "FINAL",
    "FIRST",
    "FOUND",
    "GIVEN",
    "GOING",
    "GREAT",
    "GROUP",
    "HANDS",
    "HAPPY",
    "HEARD",
    "HEART",
    "HORSE",
    "HOUSE",
    "HUMAN",
    "LARGE",
    "LEARN",
    "LEAVE",
    "LIGHT",
    "LIVED",
    "LOCAL",
    "MAKES",
    "MEANS",
    "MIGHT",
    "MONEY",
    "MOVED",
    "MUSIC",
    "NIGHT",
    "NORTH",
    "OFTEN",
    "ORDER",
    "OTHER",
    "PAPER",
    "PARTS",
    "PEACE",
    "PLACE",
    "PLANT",
    "POINT",
    "POWER",
    "PRESS",
    "QUITE",
    "RIGHT",
    "RIVER",
    "ROUND",
    "SHALL",
    "SHORT",
    "SHOWN",
    "SINCE",
    "SMALL",
    "SOUND",
    "SOUTH",
    "SPACE",
    "SPEAK",
    "SPENT",
    "START",
    "STATE",
    "STILL",
    "STORY",
    "STUDY",
    "THEIR",
    "THERE",
    "THESE",
    "THINK",
    "THREE",
    "TODAY",
    "TOTAL",
    "TOUCH",
    "TRACK",
    "TRAIN",
    "UNDER",
    "UNTIL",
    "USING",
    "VALUE",
    "VOICE",
    "WATCH",
    "WATER",
    "WHERE",
    "WHICH",
    "WHILE",
    "WHITE",
    "WHOLE",
    "WOMAN",
    "WORDS",
    "WORLD",
    "WOULD",
    "WRITE",
    "YEARS",
    "YOUNG",
  ];

  const dictionary =
    selectedPair.start.length === 4 ? commonWords4 : commonWords5;

  return {
    startWord: selectedPair.start,
    endWord: selectedPair.end,
    optimalSteps: selectedPair.steps,
    dictionary: dictionary,
    wordLength: selectedPair.start.length,
  };
}

function isValidWord(word, dictionary) {
  return dictionary.includes(word.toUpperCase());
}

function isOneLetterDifferent(word1, word2) {
  if (word1.length !== word2.length) return false;

  let differences = 0;
  for (let i = 0; i < word1.length; i++) {
    if (word1[i] !== word2[i]) {
      differences++;
      if (differences > 1) return false;
    }
  }
  return differences === 1;
}

const introSlides = [
  {
    title: "Why Word Ladder?",
    desc: "This game enhances your vocabulary, spelling skills, and logical thinking. It builds word relationships and improves your ability to find creative solutions.",
    img: "/images/brain-idea.svg",
  },
  {
    title: "Benefits",
    desc: "• Improves vocabulary skills\n• Enhances spelling ability\n• Develops logical thinking\n• Builds word relationships",
    img: "/images/brain-benefit.svg",
  },
  {
    title: "How to Play",
    desc: "Transform one word into another by changing one letter at a time! Each step must be a valid English word. Find the shortest path possible.",
    img: "/images/brain-tutorial.svg",
  },
];

function WordLadderGame({
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
  const [userSteps, setUserSteps] = useState([]);
  const [allUserSteps, setAllUserSteps] = useState([]);
  const [currentWord, setCurrentWord] = useState("");
  const [inputWord, setInputWord] = useState("");
  const [solvedPuzzles, setSolvedPuzzles] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackType, setFeedbackType] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const inputRef = useRef();
  const gameStartedRef = useRef(false);
  const totalPuzzles = Math.min(4 + level, 8); // 5-8 puzzles

  // Initialize new game when level changes
  useEffect(() => {
    const newPuzzles = [];
    for (let i = 0; i < totalPuzzles; i++) {
      newPuzzles.push(generateWordLadder(level));
    }
    setPuzzles(newPuzzles);
    setCurrentPuzzleIndex(0);
    setCurrentPuzzle(newPuzzles[0]);
    setUserSteps([]);
    setAllUserSteps([]);
    setCurrentWord(newPuzzles[0]?.startWord || "");
    setInputWord("");
    setSolvedPuzzles(0);
    setGameStarted(false);
    setShowFeedback(false);
    setErrorMessage("");
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

    // Validate word length
    if (word.length !== currentPuzzle.wordLength) {
      setErrorMessage(`Word must be ${currentPuzzle.wordLength} letters long`);
      return;
    }

    // Check if word already used
    if ([currentPuzzle.startWord, ...userSteps].includes(word)) {
      setErrorMessage("Word already used in this ladder");
      return;
    }

    // Check if only one letter different from current word
    if (!isOneLetterDifferent(currentWord, word)) {
      setErrorMessage("Must change exactly one letter");
      return;
    }

    // Check if valid word
    if (!isValidWord(word, currentPuzzle.dictionary)) {
      setErrorMessage("Not a valid English word");
      if (playWrong) playWrong();
      if (handleWrong) handleWrong();
      if (setMistakes) setMistakes((prev) => prev + 1);
      setTimer((prev) => Math.max(0, prev - 3));
      if (triggerMinusFive) triggerMinusFive();
      return;
    }

    // Valid step
    const newSteps = [...userSteps, word];
    setUserSteps(newSteps);
    setCurrentWord(word);
    setInputWord("");

    // Check if reached end word
    if (word === currentPuzzle.endWord) {
      if (playCorrect) playCorrect();
      setSolvedPuzzles((prev) => prev + 1);
      setFeedbackType("correct");
      setShowFeedback(true);

      // Calculate efficiency bonus
      const stepCount = newSteps.length;
      const optimalCount = Math.max(1, currentPuzzle.optimalSteps.length + 1);
      const efficiency =
        stepCount <= optimalCount ? 2 : stepCount <= optimalCount + 1 ? 1.5 : 1;

      handleSuccess({
        timeLeft: timer,
        timer: 180,
        isCorrect: true,
        efficiency: efficiency,
      });

      setTimeout(() => {
        setShowFeedback(false);

        if (currentPuzzleIndex + 1 >= totalPuzzles) {
          // Game complete
          if (handleGameComplete) {
            handleGameComplete({
              start_word: puzzles.map((puzzle) => puzzle.startWord),
              end_word: puzzles.map((puzzle) => puzzle.endWord),
              user_steps: [...allUserSteps, newSteps],
              message: "Word master!",
            });
          }
        } else {
          // Next puzzle
          const nextIndex = currentPuzzleIndex + 1;
          setCurrentPuzzleIndex(nextIndex);
          setCurrentPuzzle(puzzles[nextIndex]);
          setAllUserSteps((prev) => [...prev, newSteps]);
          setUserSteps([]);
          setCurrentWord(puzzles[nextIndex].startWord);
          setInputWord("");
          setErrorMessage("");
          if (inputRef.current) {
            inputRef.current.focus();
          }
        }
      }, 2000);
    } else {
      // Continue ladder
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  };

  const handleUndo = () => {
    if (userSteps.length > 0) {
      const newSteps = userSteps.slice(0, -1);
      setUserSteps(newSteps);
      setCurrentWord(
        newSteps.length > 0
          ? newSteps[newSteps.length - 1]
          : currentPuzzle.startWord
      );
      setErrorMessage("");
    }
  };

  const handleReset = () => {
    setUserSteps([]);
    setCurrentWord(currentPuzzle?.startWord || "");
    setInputWord("");
    setErrorMessage("");
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Handle game over when timer runs out
  useEffect(() => {
    if (timer === 0 && !result && gameStartedRef.current) {
      handleGameOver({
        start_word: puzzles.map((puzzle) => puzzle.startWord),
        end_word: puzzles.map((puzzle) => puzzle.endWord),
        user_steps: allUserSteps,
        message: "Time's up!",
      });
    }
  }, [timer, result, handleGameOver, puzzles, allUserSteps]);

  return (
    <div className="word-ladder-container">
      {!result && (
        <div className="flex-grow-1 w-100 d-flex flex-column align-items-center justify-content-center">
          {/* Game Stats */}
          <div className="game-stats text-white mb-3 text-center">
            <div className="mb-2">
              Level: {level} | Puzzle: {currentPuzzleIndex + 1}/{totalPuzzles} |
              Solved: {solvedPuzzles}
            </div>
            <div className="mb-2">
              XP: {xp} / {xpToNextLevel} | Steps: {userSteps.length}
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
                  fontSize: "1.5rem",
                  fontWeight: "bold",
                  color: "#4ECDC4",
                  marginBottom: "1.5rem",
                }}
              >
                Transform "{currentPuzzle.startWord}" into "
                {currentPuzzle.endWord}"
              </div>

              {/* Word Ladder Display */}
              <div
                className="ladder-display"
                style={{
                  backgroundColor: "#1a1a1a",
                  border: "2px solid #666",
                  borderRadius: "10px",
                  padding: "1.5rem",
                  marginBottom: "2rem",
                  minHeight: "200px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "10px",
                  }}
                >
                  {/* Start word */}
                  <div
                    style={{
                      backgroundColor: "#4ECDC4",
                      color: "#000",
                      padding: "10px 20px",
                      borderRadius: "8px",
                      fontSize: "1.5rem",
                      fontWeight: "bold",
                      letterSpacing: "2px",
                    }}
                  >
                    {currentPuzzle.startWord}
                  </div>

                  {/* User steps */}
                  {userSteps.map((step, index) => (
                    <div key={index}>
                      <div style={{ color: "#666", fontSize: "1.5rem" }}>↓</div>
                      <div
                        style={{
                          backgroundColor: "#45B7B8",
                          color: "#fff",
                          padding: "10px 20px",
                          borderRadius: "8px",
                          fontSize: "1.5rem",
                          fontWeight: "bold",
                          letterSpacing: "2px",
                        }}
                      >
                        {step}
                      </div>
                    </div>
                  ))}

                  {/* Next step or end */}
                  {currentWord !== currentPuzzle.endWord && (
                    <div>
                      <div style={{ color: "#666", fontSize: "1.5rem" }}>↓</div>
                      <div
                        style={{
                          backgroundColor: "#666",
                          color: "#ccc",
                          padding: "10px 20px",
                          borderRadius: "8px",
                          fontSize: "1.5rem",
                          fontWeight: "bold",
                          letterSpacing: "2px",
                          border: "2px dashed #999",
                        }}
                      >
                        ?????
                      </div>
                    </div>
                  )}

                  {/* Target word */}
                  {userSteps.length > 0 && (
                    <div>
                      <div style={{ color: "#666", fontSize: "1.5rem" }}>⋮</div>
                      <div
                        style={{
                          backgroundColor:
                            currentWord === currentPuzzle.endWord
                              ? "#4ECDC4"
                              : "#FF6B6B",
                          color:
                            currentWord === currentPuzzle.endWord
                              ? "#000"
                              : "#fff",
                          padding: "10px 20px",
                          borderRadius: "8px",
                          fontSize: "1.5rem",
                          fontWeight: "bold",
                          letterSpacing: "2px",
                          opacity:
                            currentWord === currentPuzzle.endWord ? 1 : 0.7,
                        }}
                      >
                        {currentPuzzle.endWord}
                      </div>
                    </div>
                  )}
                </div>
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
                  ✓ Word Ladder Complete in {userSteps.length} steps!
                </div>
              )}

              {!showFeedback && gameStarted && (
                <div className="input-area">
                  <div
                    style={{
                      fontSize: "1.2rem",
                      color: "#ccc",
                      marginBottom: "1rem",
                    }}
                  >
                    Current word:{" "}
                    <span style={{ color: "#4ECDC4", fontWeight: "bold" }}>
                      {currentWord}
                    </span>
                  </div>

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
                      placeholder="Enter next word..."
                      maxLength={currentPuzzle.wordLength}
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
                        width: "200px",
                        letterSpacing: "2px",
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
                      display: "flex",
                      gap: "10px",
                      justifyContent: "center",
                    }}
                  >
                    <button
                      onClick={handleUndo}
                      disabled={userSteps.length === 0}
                      style={{
                        backgroundColor:
                          userSteps.length > 0 ? "#FFD93D" : "#666",
                        color: userSteps.length > 0 ? "#000" : "#999",
                        border: "none",
                        borderRadius: "6px",
                        padding: "8px 16px",
                        fontSize: "1rem",
                        fontWeight: "bold",
                        cursor:
                          userSteps.length > 0 ? "pointer" : "not-allowed",
                      }}
                    >
                      Undo
                    </button>
                    <button
                      onClick={handleReset}
                      style={{
                        backgroundColor: "#FF6B6B",
                        color: "#fff",
                        border: "none",
                        borderRadius: "6px",
                        padding: "8px 16px",
                        fontSize: "1rem",
                        fontWeight: "bold",
                        cursor: "pointer",
                      }}
                    >
                      Reset
                    </button>
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
                  Get ready to build word ladders!
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
              Change one letter at a time to reach the target!
            </div>
            <div style={{ fontSize: "0.9rem", opacity: 0.8 }}>
              Each step must be a valid English word • Change exactly one letter
              per step • Shorter ladders score better
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function WordLadder({ token }) {
  return (
    <GameWindow>
      <GameLayout
        introSlides={introSlides}
        helpText="Transform one word into another by changing one letter at a time! Each intermediate step must be a valid English word. Try to find the shortest possible path."
        gameName="Word Ladder"
        fetchUserGameProgress={fetchUserGameProgress}
        submitGameScore={submitWordLadder}
        initialLevel={1}
        maxLevel={10}
        onGameStart={(level, { resetProgress }) => resetProgress(level)}
        onGameRestart={() => window.location.reload()}
        onGameQuit={() => window.location.assign("/games/language")}
        token={token}
      >
        {(game) => (
          <WordLadderGame
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
