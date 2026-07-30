import { useState, useEffect, useRef } from "react";
import GameWindow from "../GameWindow.jsx";
import GameLayout from "../Layout/GameLayout.jsx";
import { submitGrammarFix } from "../../../api/games.jsx";
import { fetchUserGameProgress } from "../../../api/score.jsx";

function generateSentence(level) {
  const sentences = [
    // Easy level - Simple grammar errors
    {
      incorrect: "I goes to school every day.",
      correct: "I go to school every day.",
      error: "Subject-verb agreement",
      explanation: "'I' takes the verb 'go', not 'goes'",
    },
    {
      incorrect: "She have a red car.",
      correct: "She has a red car.",
      error: "Subject-verb agreement",
      explanation: "'She' takes the verb 'has', not 'have'",
    },
    {
      incorrect: "There is two cats in the garden.",
      correct: "There are two cats in the garden.",
      error: "Subject-verb agreement",
      explanation: "'Two cats' is plural, so use 'are' not 'is'",
    },
    {
      incorrect: "Me and my friend went shopping.",
      correct: "My friend and I went shopping.",
      error: "Pronoun usage",
      explanation: "Use 'I' instead of 'me' as the subject",
    },
    {
      incorrect: "The book is laying on the table.",
      correct: "The book is lying on the table.",
      error: "Verb choice",
      explanation:
        "Use 'lying' for resting position, 'laying' for placing something",
    },

    // Medium level - More complex errors
    {
      incorrect: "If I was you, I would study harder.",
      correct: "If I were you, I would study harder.",
      error: "Subjunctive mood",
      explanation: "Use 'were' in hypothetical situations",
    },
    {
      incorrect: "Between you and I, this is a secret.",
      correct: "Between you and me, this is a secret.",
      error: "Pronoun case",
      explanation: "Use 'me' as the object of the preposition 'between'",
    },
    {
      incorrect: "I could care less about that movie.",
      correct: "I couldn't care less about that movie.",
      error: "Idiomatic expression",
      explanation:
        "The phrase means you care so little that you couldn't care any less",
    },
    {
      incorrect: "The team are playing well today.",
      correct: "The team is playing well today.",
      error: "Collective noun",
      explanation:
        "In American English, collective nouns like 'team' are usually singular",
    },
    {
      incorrect: "I seen that movie last week.",
      correct: "I saw that movie last week.",
      error: "Past tense",
      explanation: "Use 'saw' for past tense, 'seen' needs a helping verb",
    },

    // Hard level - Advanced grammar
    {
      incorrect: "Whom do you think will win the game?",
      correct: "Who do you think will win the game?",
      error: "Who vs whom",
      explanation: "'Who' is the subject of 'will win'",
    },
    {
      incorrect: "The reason is because I was sick.",
      correct: "The reason is that I was sick.",
      error: "Redundancy",
      explanation: "Use 'that' after 'reason is', not 'because'",
    },
    {
      incorrect: "Neither the students nor the teacher were ready.",
      correct: "Neither the students nor the teacher was ready.",
      error: "Neither/nor agreement",
      explanation: "The verb agrees with the noun closest to it (teacher)",
    },
    {
      incorrect: "I would of helped you if I could.",
      correct: "I would have helped you if I could.",
      error: "Would have/of",
      explanation: "Use 'would have', not 'would of'",
    },
    {
      incorrect: "Irregardless of the weather, we'll go.",
      correct: "Regardless of the weather, we'll go.",
      error: "Non-standard word",
      explanation: "'Irregardless' is not a standard word; use 'regardless'",
    },
  ];

  // Select sentences based on level
  let availableSentences;
  if (level <= 3) {
    availableSentences = sentences.slice(0, 5); // Easy sentences
  } else if (level <= 6) {
    availableSentences = sentences.slice(2, 12); // Mix of easy and medium
  } else {
    availableSentences = sentences.slice(5); // Medium and hard
  }

  return availableSentences[
    Math.floor(Math.random() * availableSentences.length)
  ];
}

const introSlides = [
  {
    title: "Why Grammar Fix?",
    desc: "This game improves grammar knowledge, writing skills, and language precision. It helps you identify and correct common grammatical errors.",
    img: "/images/brain-idea.svg",
  },
  {
    title: "Benefits",
    desc: "• Improves grammar skills\n• Enhances writing ability\n• Develops language precision\n• Builds error recognition",
    img: "/images/brain-benefit.svg",
  },
  {
    title: "How to Play",
    desc: "Fix grammatical errors in sentences! Type the corrected version of each sentence. Pay attention to verb tenses, pronouns, and other grammar rules.",
    img: "/images/brain-tutorial.svg",
  },
];

function GrammarFixGame({
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
  const [sentences, setSentences] = useState([]);
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
  const [currentSentence, setCurrentSentence] = useState(null);
  const [userInput, setUserInput] = useState("");
  const [allUserFixes, setAllUserFixes] = useState([]);
  const [solvedSentences, setSolvedSentences] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackType, setFeedbackType] = useState("");
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [showHint, setShowHint] = useState(false);
  const gameStartedRef = useRef(false);
  const inputRef = useRef(null);
  const totalSentences = Math.min(4 + level, 8); // 5-8 sentences

  // Initialize new game when level changes
  useEffect(() => {
    const newSentences = [];
    for (let i = 0; i < totalSentences; i++) {
      newSentences.push(generateSentence(level));
    }
    setSentences(newSentences);
    setCurrentSentenceIndex(0);
    setCurrentSentence(newSentences[0]);
    setUserInput("");
    setAllUserFixes([]);
    setSolvedSentences(0);
    setGameStarted(false);
    setShowFeedback(false);
    setShowHint(false);
    gameStartedRef.current = false;
  }, [level, totalSentences]);

  // Start game
  useEffect(() => {
    if (sentences.length > 0 && !gameStarted) {
      const startTimer = setTimeout(() => {
        setGameStarted(true);
        gameStartedRef.current = true;
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 1000);

      return () => clearTimeout(startTimer);
    }
  }, [sentences, gameStarted]);

  // Focus input when sentence changes
  useEffect(() => {
    if (gameStarted && inputRef.current) {
      inputRef.current.focus();
    }
  }, [currentSentence, gameStarted]);

  const handleSubmit = () => {
    if (!gameStarted || result || showFeedback || !userInput.trim()) return;

    const userFix = userInput.trim();
    const correctAnswer = currentSentence.correct;

    // Simple text comparison (case-insensitive, ignoring extra spaces)
    const normalizeText = (text) =>
      text.toLowerCase().replace(/\s+/g, " ").trim();
    const isCorrect = normalizeText(userFix) === normalizeText(correctAnswer);

    if (isCorrect) {
      // Correct answer
      if (playCorrect) playCorrect();
      setSolvedSentences((prev) => prev + 1);
      setFeedbackType("correct");
      setFeedbackMessage(`Correct! ${currentSentence.explanation}`);
      setShowFeedback(true);

      handleSuccess({
        timeLeft: timer,
        timer: 180,
        isCorrect: true,
      });

      setTimeout(() => {
        setShowFeedback(false);

        if (currentSentenceIndex + 1 >= totalSentences) {
          // Game complete
          if (handleGameComplete) {
            handleGameComplete({
              sentence: sentences.map((s) => s.incorrect).join(" | "),
              user_fix: [...allUserFixes, userFix].join(" | "),
              message: "Grammar master!",
            });
          }
        } else {
          // Next sentence
          const nextIndex = currentSentenceIndex + 1;
          setCurrentSentenceIndex(nextIndex);
          setCurrentSentence(sentences[nextIndex]);
          setAllUserFixes((prev) => [...prev, userFix]);
          setUserInput("");
          setShowHint(false);
        }
      }, 2500);
    } else {
      // Incorrect answer
      if (playWrong) playWrong();
      if (handleWrong) handleWrong();
      if (setMistakes) setMistakes((prev) => prev + 1);
      setFeedbackType("wrong");
      setFeedbackMessage(
        `Incorrect. The correct answer is: "${correctAnswer}"`
      );
      setShowFeedback(true);

      // Penalty: reduce timer
      setTimer((prev) => Math.max(0, prev - 8));
      if (triggerMinusFive) triggerMinusFive();

      setTimeout(() => {
        setShowFeedback(false);
        setUserInput("");
      }, 3000);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSubmit();
    }
  };

  const handleHint = () => {
    if (!gameStarted || result || showFeedback) return;
    setShowHint(true);
    // Small penalty for using hint
    setTimer((prev) => Math.max(0, prev - 3));
  };

  const handleSkip = () => {
    if (!gameStarted || result || showFeedback) return;

    // Large penalty for skipping
    setTimer((prev) => Math.max(0, prev - 15));
    if (setMistakes) setMistakes((prev) => prev + 1);

    setFeedbackType("skip");
    setFeedbackMessage(
      `Skipped. The correct answer was: "${currentSentence.correct}"`
    );
    setShowFeedback(true);

    setTimeout(() => {
      setShowFeedback(false);

      if (currentSentenceIndex + 1 >= totalSentences) {
        // Game complete
        if (handleGameComplete) {
          handleGameComplete({
            sentence: sentences.map((s) => s.incorrect).join(" | "),
            user_fix: [...allUserFixes, ""].join(" | "),
            message: "Keep practicing!",
          });
        }
      } else {
        // Next sentence
        const nextIndex = currentSentenceIndex + 1;
        setCurrentSentenceIndex(nextIndex);
        setCurrentSentence(sentences[nextIndex]);
        setAllUserFixes((prev) => [...prev, ""]);
        setUserInput("");
        setShowHint(false);
      }
    }, 2500);
  };

  // Handle game over when timer runs out
  useEffect(() => {
    if (timer === 0 && !result && gameStartedRef.current) {
      handleGameOver({
        sentence: sentences.map((s) => s.incorrect).join(" | "),
        user_fix: [...allUserFixes, userInput.trim()].join(" | "),
        message: "Time's up!",
      });
    }
  }, [timer, result, handleGameOver, sentences, allUserFixes, userInput]);

  const progress = Math.round((solvedSentences / totalSentences) * 100);

  return (
    <div className="grammar-fix-container">
      {!result && (
        <div className="flex-grow-1 w-100 d-flex flex-column align-items-center justify-content-center">
          {/* Game Stats */}
          <div className="game-stats text-white mb-3 text-center">
            <div className="mb-2">
              Level: {level} | Sentence: {currentSentenceIndex + 1}/
              {totalSentences} | Solved: {solvedSentences}
            </div>
            <div className="mb-2">
              XP: {xp} / {xpToNextLevel} | Progress: {progress}%
            </div>
          </div>

          {/* Sentence Display */}
          {currentSentence && (
            <div
              className="sentence-display"
              style={{
                backgroundColor: "#2a2a2a",
                border: "3px solid #4a4a4a",
                borderRadius: "15px",
                padding: "2rem",
                marginBottom: "2rem",
                minWidth: "800px",
                maxWidth: "900px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: "1.3rem",
                  fontWeight: "bold",
                  color: "#4ECDC4",
                  marginBottom: "1.5rem",
                }}
              >
                Fix the grammar error in this sentence:
              </div>

              {showFeedback && (
                <div
                  style={{
                    fontSize: "1.3rem",
                    fontWeight: "bold",
                    color: feedbackType === "correct" ? "#4ECDC4" : "#FF6B6B",
                    marginBottom: "1rem",
                    minHeight: "80px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    textAlign: "center",
                  }}
                >
                  {feedbackMessage}
                </div>
              )}

              {!showFeedback && gameStarted && (
                <div className="sentence-content">
                  <div
                    style={{
                      fontSize: "1.8rem",
                      color: "#FFD93D",
                      marginBottom: "2rem",
                      padding: "1rem",
                      backgroundColor: "#1a1a1a",
                      borderRadius: "10px",
                      border: "2px solid #FF6B6B",
                      fontStyle: "italic",
                    }}
                  >
                    "{currentSentence.incorrect}"
                  </div>

                  {showHint && (
                    <div
                      style={{
                        fontSize: "1.1rem",
                        color: "#4ECDC4",
                        marginBottom: "1rem",
                        padding: "0.8rem",
                        backgroundColor: "#0a3a3a",
                        borderRadius: "8px",
                        border: "1px solid #4ECDC4",
                      }}
                    >
                      <strong>Hint:</strong> {currentSentence.error} -{" "}
                      {currentSentence.explanation}
                    </div>
                  )}

                  <div
                    style={{
                      fontSize: "1.2rem",
                      color: "#fff",
                      marginBottom: "1rem",
                    }}
                  >
                    Type the corrected sentence:
                  </div>

                  <input
                    ref={inputRef}
                    type="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Enter the corrected sentence..."
                    style={{
                      width: "100%",
                      maxWidth: "700px",
                      padding: "15px",
                      fontSize: "1.2rem",
                      borderRadius: "8px",
                      border: "2px solid #666",
                      backgroundColor: "#333",
                      color: "#fff",
                      marginBottom: "1.5rem",
                    }}
                  />

                  <div
                    className="button-group"
                    style={{
                      display: "flex",
                      gap: "15px",
                      justifyContent: "center",
                    }}
                  >
                    <button
                      onClick={handleSubmit}
                      disabled={!userInput.trim()}
                      style={{
                        backgroundColor: userInput.trim() ? "#4ECDC4" : "#666",
                        color: userInput.trim() ? "#000" : "#ccc",
                        border: "none",
                        borderRadius: "8px",
                        padding: "12px 25px",
                        fontSize: "1.1rem",
                        fontWeight: "bold",
                        cursor: userInput.trim() ? "pointer" : "not-allowed",
                      }}
                    >
                      Submit
                    </button>

                    <button
                      onClick={handleHint}
                      disabled={showHint}
                      style={{
                        backgroundColor: showHint ? "#666" : "#FFD93D",
                        color: showHint ? "#ccc" : "#000",
                        border: "none",
                        borderRadius: "8px",
                        padding: "12px 25px",
                        fontSize: "1.1rem",
                        fontWeight: "bold",
                        cursor: showHint ? "not-allowed" : "pointer",
                      }}
                    >
                      Hint (-3s)
                    </button>

                    <button
                      onClick={handleSkip}
                      style={{
                        backgroundColor: "#FF6B6B",
                        color: "#fff",
                        border: "none",
                        borderRadius: "8px",
                        padding: "12px 25px",
                        fontSize: "1.1rem",
                        fontWeight: "bold",
                        cursor: "pointer",
                      }}
                    >
                      Skip (-15s)
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
                  Get ready to fix grammar errors!
                </div>
              )}
            </div>
          )}

          {/* Instructions */}
          <div
            className="text-white text-center"
            style={{ fontSize: "1.1rem", maxWidth: "700px" }}
          >
            <div
              className="mb-2"
              style={{ fontSize: "1.3rem", fontWeight: "bold" }}
            >
              Find and fix the grammar error!
            </div>
            <div style={{ fontSize: "0.9rem", opacity: 0.8 }}>
              Type the corrected sentence • Use hints if you're stuck • Press
              Enter to submit
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function GrammarFix({ token }) {
  return (
    <GameWindow>
      <GameLayout
        introSlides={introSlides}
        helpText="Fix grammatical errors in sentences! Type the corrected version of each sentence. Pay attention to verb tenses, pronouns, and other grammar rules."
        gameName="Grammar Fix"
        fetchUserGameProgress={fetchUserGameProgress}
        submitGameScore={submitGrammarFix}
        initialLevel={1}
        maxLevel={10}
        onGameStart={(level, { resetProgress }) => resetProgress(level)}
        onGameRestart={() => window.location.reload()}
        onGameQuit={() => window.location.assign("/games/language")}
        token={token}
      >
        {(game) => (
          <GrammarFixGame
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
