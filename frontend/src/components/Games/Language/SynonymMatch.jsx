import { useState, useEffect, useRef } from "react";
import GameWindow from "../GameWindow.jsx";
import GameLayout from "../Layout/GameLayout.jsx";
import { submitSynonymMatch } from "../../../api/games.jsx";
import { fetchUserGameProgress } from "../../../api/score.jsx";
import "../Styles/games.css";

function generateSynonymPairs(level) {
  const synonymPairs = [
    // Easy level
    ["HAPPY", "GLAD"],
    ["BIG", "LARGE"],
    ["SMALL", "TINY"],
    ["FAST", "QUICK"],
    ["COLD", "COOL"],
    ["HOT", "WARM"],
    ["GOOD", "NICE"],
    ["BAD", "POOR"],
    ["OLD", "AGED"],
    ["NEW", "FRESH"],
    ["HARD", "TOUGH"],
    ["SOFT", "GENTLE"],
    ["LOUD", "NOISY"],
    ["QUIET", "SILENT"],
    ["SMART", "CLEVER"],

    // Medium level
    ["BEAUTIFUL", "LOVELY"],
    ["ANGRY", "MAD"],
    ["AFRAID", "SCARED"],
    ["BRAVE", "BOLD"],
    ["FUNNY", "AMUSING"],
    ["STRANGE", "ODD"],
    ["EMPTY", "VACANT"],
    ["FULL", "COMPLETE"],
    ["RICH", "WEALTHY"],
    ["POOR", "BROKE"],
    ["STRONG", "POWERFUL"],
    ["WEAK", "FEEBLE"],
    ["BRIGHT", "BRILLIANT"],
    ["DARK", "GLOOMY"],
    ["CLEAN", "PURE"],

    // Hard level
    ["ENORMOUS", "GIGANTIC"],
    ["ANCIENT", "PREHISTORIC"],
    ["EXCELLENT", "OUTSTANDING"],
    ["TERRIBLE", "DREADFUL"],
    ["MAGNIFICENT", "SPLENDID"],
    ["DELICIOUS", "TASTY"],
    ["EXHAUSTED", "WEARY"],
    ["FURIOUS", "ENRAGED"],
    ["GORGEOUS", "STUNNING"],
    ["HILARIOUS", "AMUSING"],
    ["INTELLIGENT", "BRILLIANT"],
    ["MYSTERIOUS", "PUZZLING"],
    ["PEACEFUL", "TRANQUIL"],
    ["RIDICULOUS", "ABSURD"],
    ["TREMENDOUS", "ENORMOUS"],
  ];

  // Select pairs based on level
  let availablePairs;
  if (level <= 3) {
    availablePairs = synonymPairs.slice(0, 15); // Easy words
  } else if (level <= 6) {
    availablePairs = synonymPairs.slice(5, 25); // Mix of easy and medium
  } else {
    availablePairs = synonymPairs.slice(10); // All levels including hard
  }

  const pairCount = Math.min(4 + level, 8); // 5-8 pairs per puzzle
  const selectedPairs = [];
  const shuffledPairs = [...availablePairs].sort(() => Math.random() - 0.5);

  for (let i = 0; i < pairCount && i < shuffledPairs.length; i++) {
    selectedPairs.push(shuffledPairs[i]);
  }

  // Create shuffled words array
  const allWords = [];
  selectedPairs.forEach((pair) => {
    allWords.push(pair[0], pair[1]);
  });

  // Shuffle the words
  const shuffledWords = allWords.sort(() => Math.random() - 0.5);

  return {
    pairs: selectedPairs,
    words: shuffledWords,
    pairCount: selectedPairs.length,
  };
}

const introSlides = [
  {
    title: "Why Synonym Match?",
    desc: "This game enhances your vocabulary, word relationships, and semantic understanding. It improves your ability to recognize word meanings and connections.",
    img: "/images/brain-idea.svg",
  },
  {
    title: "Benefits",
    desc: "• Improves vocabulary knowledge\n• Enhances word relationships\n• Develops semantic understanding\n• Builds language connections",
    img: "/images/brain-benefit.svg",
  },
  {
    title: "How to Play",
    desc: "Match words with their synonyms! Click on two words that have similar meanings to pair them up. Find all synonym pairs to complete the puzzle.",
    img: "/images/brain-tutorial.svg",
  },
];

function SynonymMatchGame({
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
  const [selectedWords, setSelectedWords] = useState([]);
  const [matchedPairs, setMatchedPairs] = useState([]);
  const [allUserMatches, setAllUserMatches] = useState([]);
  const [solvedPuzzles, setSolvedPuzzles] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackType, setFeedbackType] = useState("");
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const gameStartedRef = useRef(false);
  const totalPuzzles = Math.min(4 + level, 8); // 5-8 puzzles

  // Initialize new game when level changes
  useEffect(() => {
    const newPuzzles = [];
    for (let i = 0; i < totalPuzzles; i++) {
      newPuzzles.push(generateSynonymPairs(level));
    }
    setPuzzles(newPuzzles);
    setCurrentPuzzleIndex(0);
    setCurrentPuzzle(newPuzzles[0]);
    setSelectedWords([]);
    setMatchedPairs([]);
    setAllUserMatches([]);
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

  const handleWordClick = (word) => {
    if (!gameStarted || result || showFeedback) return;

    // Check if word is already matched
    if (matchedPairs.some((pair) => pair.includes(word))) return;

    // Check if word is already selected
    if (selectedWords.includes(word)) {
      // Deselect the word
      setSelectedWords((prev) => prev.filter((w) => w !== word));
      return;
    }

    const newSelection = [...selectedWords, word];

    if (newSelection.length === 1) {
      // First word selected
      setSelectedWords(newSelection);
    } else if (newSelection.length === 2) {
      // Two words selected - check if they're synonyms
      setSelectedWords(newSelection);

      const [word1, word2] = newSelection;
      const isMatch = currentPuzzle.pairs.some(
        (pair) =>
          (pair[0] === word1 && pair[1] === word2) ||
          (pair[0] === word2 && pair[1] === word1)
      );

      setTimeout(() => {
        if (isMatch) {
          // Correct match
          if (playCorrect) playCorrect();
          const newMatchedPairs = [...matchedPairs, [word1, word2]];
          setMatchedPairs(newMatchedPairs);
          setSelectedWords([]);
          setFeedbackType("match");
          setFeedbackMessage(
            `Correct! "${word1}" and "${word2}" are synonyms!`
          );
          setShowFeedback(true);

          handleSuccess({
            timeLeft: timer,
            timer: 150,
            isCorrect: true,
          });

          // Check if puzzle is complete
          if (newMatchedPairs.length === currentPuzzle.pairCount) {
            setSolvedPuzzles((prev) => prev + 1);

            setTimeout(() => {
              setShowFeedback(false);

              if (currentPuzzleIndex + 1 >= totalPuzzles) {
                // Game complete
                if (handleGameComplete) {
                  handleGameComplete({
                    words: puzzles
                      .map((puzzle) => puzzle.words.join(","))
                      .join(" | "),
                    user_matches: [...allUserMatches, newMatchedPairs]
                      .map((matches) =>
                        matches.map((pair) => pair.join("-")).join(",")
                      )
                      .join(" | "),
                    message: "Synonym master!",
                  });
                }
              } else {
                // Next puzzle
                const nextIndex = currentPuzzleIndex + 1;
                setCurrentPuzzleIndex(nextIndex);
                setCurrentPuzzle(puzzles[nextIndex]);
                setAllUserMatches((prev) => [...prev, newMatchedPairs]);
                setSelectedWords([]);
                setMatchedPairs([]);
              }
            }, 1500);
          } else {
            setTimeout(() => {
              setShowFeedback(false);
            }, 1000);
          }
        } else {
          // Incorrect match
          if (playWrong) playWrong();
          if (handleWrong) handleWrong();
          if (setMistakes) setMistakes((prev) => prev + 1);
          setSelectedWords([]);
          setFeedbackType("wrong");
          setFeedbackMessage(`"${word1}" and "${word2}" are not synonyms`);
          setShowFeedback(true);

          // Penalty: reduce timer
          setTimer((prev) => Math.max(0, prev - 3));
          if (triggerMinusFive) triggerMinusFive();

          setTimeout(() => {
            setShowFeedback(false);
          }, 1500);
        }
      }, 300);
    } else {
      // More than 2 words selected (shouldn't happen, but reset just in case)
      setSelectedWords([word]);
    }
  };

  // Handle game over when timer runs out
  useEffect(() => {
    if (timer === 0 && !result && gameStartedRef.current) {
      handleGameOver({
        words: puzzles.map((puzzle) => puzzle.words.join(",")).join(" | "),
        user_matches: [...allUserMatches, matchedPairs]
          .map((matches) => matches.map((pair) => pair.join("-")).join(","))
          .join(" | "),
        message: "Time's up!",
      });
    }
  }, [timer, result, handleGameOver, puzzles, allUserMatches, matchedPairs]);

  const getWordStyle = (word) => {
    const isMatched = matchedPairs.some((pair) => pair.includes(word));
    const isSelected = selectedWords.includes(word);

    let backgroundColor = "#333";
    let color = "#fff";
    let transform = "scale(1)";
    let border = "2px solid #666";

    if (isMatched) {
      backgroundColor = "#4ECDC4";
      color = "#000";
      border = "2px solid #4ECDC4";
    } else if (isSelected) {
      backgroundColor = "#FFD93D";
      color = "#000";
      transform = "scale(1.05)";
      border = "2px solid #FFD93D";
    }

    return {
      backgroundColor,
      color,
      border,
      borderRadius: "10px",
      padding: "15px 20px",
      margin: "5px",
      cursor: isMatched ? "default" : "pointer",
      transition: "all 0.2s ease",
      fontSize: "1.1rem",
      fontWeight: "bold",
      textAlign: "center",
      userSelect: "none",
      transform,
      minWidth: "120px",
      opacity: isMatched ? 0.7 : 1,
    };
  };

  const progress = currentPuzzle
    ? Math.round((matchedPairs.length / currentPuzzle.pairCount) * 100)
    : 0;

  return (
    <div className="synonym-match-container">
      {!result && (
        <div className="flex-grow-1 w-100 d-flex flex-column align-items-center justify-content-center">
          {/* Game Stats */}
          <div className="game-stats text-white mb-3 text-center">
            <div className="mb-2">
              Level: {level} | Puzzle: {currentPuzzleIndex + 1}/{totalPuzzles} |
              Solved: {solvedPuzzles}
            </div>
            <div className="mb-2">
              XP: {xp} / {xpToNextLevel} | Matches: {matchedPairs.length}/
              {currentPuzzle?.pairCount || 0} | Progress: {progress}%
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
                minWidth: "800px",
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
                Match words with their synonyms:
              </div>

              {showFeedback && (
                <div
                  style={{
                    fontSize: "1.5rem",
                    fontWeight: "bold",
                    color:
                      feedbackType === "match" || feedbackType === "correct"
                        ? "#4ECDC4"
                        : "#FF6B6B",
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
                <div className="words-grid">
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(140px, 1fr))",
                      gap: "10px",
                      justifyContent: "center",
                      marginBottom: "1rem",
                      maxWidth: "700px",
                      margin: "0 auto",
                    }}
                  >
                    {currentPuzzle.words.map((word, index) => (
                      <div
                        key={index}
                        onClick={() => handleWordClick(word)}
                        style={getWordStyle(word)}
                        onMouseEnter={(e) => {
                          const isMatched = matchedPairs.some((pair) =>
                            pair.includes(word)
                          );
                          if (!isMatched && !selectedWords.includes(word)) {
                            e.target.style.backgroundColor = "#444";
                          }
                        }}
                        onMouseLeave={(e) => {
                          const isMatched = matchedPairs.some((pair) =>
                            pair.includes(word)
                          );
                          const isSelected = selectedWords.includes(word);
                          if (!isMatched && !isSelected) {
                            e.target.style.backgroundColor = "#333";
                          }
                        }}
                      >
                        {word}
                      </div>
                    ))}
                  </div>

                  <div
                    style={{
                      fontSize: "1rem",
                      color: "#ccc",
                      marginTop: "1rem",
                    }}
                  >
                    {selectedWords.length === 1
                      ? "Select another word to match"
                      : "Click on words to select them"}
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
                  Get ready to match synonyms!
                </div>
              )}
            </div>
          )}

          {/* Matched Pairs Display */}
          {matchedPairs.length > 0 && gameStarted && (
            <div
              className="matched-pairs"
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
                Matched Pairs:
              </div>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "10px",
                }}
              >
                {matchedPairs.map((pair, index) => (
                  <div
                    key={index}
                    style={{
                      backgroundColor: "#45B7B8",
                      color: "#fff",
                      padding: "8px 12px",
                      borderRadius: "20px",
                      fontSize: "0.9rem",
                      fontWeight: "bold",
                    }}
                  >
                    {pair[0]} ↔ {pair[1]}
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
              Find all synonym pairs!
            </div>
            <div style={{ fontSize: "0.9rem", opacity: 0.8 }}>
              Click on two words that have similar meanings • Match all pairs to
              complete the puzzle • Wrong matches cost time
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SynonymMatch({ token }) {
  return (
    <GameWindow>
      <GameLayout
        introSlides={introSlides}
        helpText="Match words with their synonyms! Click on two words that have similar meanings to pair them up. Find all synonym pairs to complete each puzzle."
        gameName="Synonym Match"
        fetchUserGameProgress={fetchUserGameProgress}
        submitGameScore={submitSynonymMatch}
        initialLevel={1}
        maxLevel={10}
        onGameStart={(level, { resetProgress }) => resetProgress(level)}
        onGameRestart={() => window.location.reload()}
        onGameQuit={() => window.location.assign("/games/language")}
        token={token}
      >
        {(game) => (
          <SynonymMatchGame
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
