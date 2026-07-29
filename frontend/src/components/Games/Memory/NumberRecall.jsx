import { useState, useEffect, useRef } from "react";
import GameWindow from "../GameWindow.jsx";
import GameLayout from "../Layout/GameLayout.jsx";
import { submitNumberRecall } from "../../../api/games.jsx";
import { fetchUserGameProgress } from "../../../api/score.jsx";
import "../Styles/games.css";

// Enhanced sequence generator: no consecutive duplicates, no repeat of previous sequence
function generateUniqueSequence(length, prevSequence = []) {
  let sequence;
  let attempts = 0;
  do {
    sequence = [];
    for (let i = 0; i < length; i++) {
      let digit;
      do {
        digit = Math.floor(Math.random() * 9) + 1;
      } while (i > 0 && digit === sequence[i - 1]);
      sequence.push(digit);
    }
    attempts++;
    // Avoid same as previous sequence
  } while (
    prevSequence.length === length &&
    sequence.join("") === prevSequence.join("") &&
    attempts < 10
  );
  return sequence;
}

const introSlides = [
  {
    title: "Why Number Recall?",
    desc: "This exercise trains your working memory and attention span. It's great for students, professionals, and anyone wanting to boost mental agility.",
    img: "/images/brain-idea.svg",
  },
  {
    title: "Benefits",
    desc: "• Improves recall and focus\n• Enhances mental calculation\n• Trains your brain to process and retain information quickly.",
    img: "/images/brain-benefit.svg",
  },
  {
    title: "How to Play",
    desc: "Memorize the sequence of digits shown. When they disappear, type them in the correct order.",
    img: "/images/brain-tutorial.svg",
  },
];

function NumberRecallGame({
  level,
  xp,
  xpToNextLevel,
  timer,
  setTimer,
  result,
  handleSuccess,
  handleGameOver,
  handleWrong,
  playWrong,
  playCorrect,
  triggerMinusFive,
  playTimer10s,
  playTimer30s,
  mistakes,
  setMistakes,
}) {
  const prevSequence = useRef([]);
  const [sequence, setSequence] = useState(() =>
    generateUniqueSequence(level + 2, prevSequence.current)
  );
  const [showSequence, setShowSequence] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);
  const [userInput, setUserInput] = useState("");
  const [mistakeCount, setMistakeCount] = useState(0);
  const inputRef = useRef();
  const successCalledRef = useRef(false);
  const timer10sAudioRef = useRef(null);

  // Reset sequence on level up
  useEffect(() => {
    const newSeq = generateUniqueSequence(level + 2, prevSequence.current);
    setSequence(newSeq);
    prevSequence.current = newSeq;
    setShowSequence(true);
    setFadeOut(false);
    setUserInput("");
    successCalledRef.current = false;
  }, [level]);

  useEffect(() => {
    console.log("Current XP:", xp, "/", xpToNextLevel);
  }, [xp, xpToNextLevel]);

  // Show/fade sequence effect
  useEffect(() => {
    if (showSequence) {
      setFadeOut(false);
      const t = setTimeout(() => setFadeOut(true), 2000);
      const t2 = setTimeout(() => {
        setShowSequence(false);
        setTimeout(() => {
          if (inputRef.current) inputRef.current.focus();
        }, 10);
      }, 2200);
      return () => {
        clearTimeout(t);
        clearTimeout(t2);
      };
    }
  }, [showSequence, sequence]);

  // Handle correct answer
  useEffect(() => {
    if (
      !showSequence &&
      !result &&
      !successCalledRef.current &&
      userInput.length === sequence.length &&
      userInput === sequence.join("")
    ) {
      successCalledRef.current = true;
      if (playCorrect) playCorrect();
      handleSuccess({});
      setUserInput("");
      // Generate a new sequence that is not the same as the previous
      const newSeq = generateUniqueSequence(level + 2, prevSequence.current);
      setSequence(newSeq);
      prevSequence.current = newSeq;
      setShowSequence(true);
      setFadeOut(false);
      setTimeout(() => {
        if (inputRef.current) inputRef.current.focus();
      }, 2200);
      setTimeout(() => {
        successCalledRef.current = false;
      }, 100);
    }
  }, [
    userInput,
    showSequence,
    result,
    sequence,
    level,
    handleSuccess,
    playCorrect,
  ]);

  // Timer sound cleanup
  useEffect(() => {
    if (timer === 0 && timer10sAudioRef.current) {
      timer10sAudioRef.current.pause();
      timer10sAudioRef.current.currentTime = 0;
      timer10sAudioRef.current = null;
    }
    if (result && timer10sAudioRef.current) {
      timer10sAudioRef.current.pause();
      timer10sAudioRef.current.currentTime = 0;
      timer10sAudioRef.current = null;
    }
  }, [timer, result]);

  useEffect(() => {
    if (timer === 0 && !result) {
      handleGameOver({
        sequence: sequence.join(""),
        user_response: userInput,
        message: "Time's up!",
      });
    }
  }, [timer, result, handleGameOver, sequence, userInput]);

  function renderFadingSequence() {
    return (
      <span>
        {sequence.map((num, idx) => (
          <span
            key={idx}
            className={`fade-digit${fadeOut ? " fade-to-dot" : ""}`}
          >
            {fadeOut ? "•" : num}
          </span>
        ))}
      </span>
    );
  }

  const handleInputChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, "");
    setUserInput(value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (showSequence || result || successCalledRef.current) return;

    if (
      userInput.length === sequence.length &&
      userInput !== sequence.join("")
    ) {
      setTimer((prev) => {
        const newTime = Math.max(0, prev - 5);
        if (prev > 30 && newTime <= 30 && playTimer30s) playTimer30s();
        if (prev > 10 && newTime <= 10 && playTimer10s) {
          if (timer10sAudioRef.current) {
            timer10sAudioRef.current.pause();
            timer10sAudioRef.current.currentTime = 0;
          }
          timer10sAudioRef.current = playTimer10s();
        }
        return newTime;
      });
      if (triggerMinusFive) triggerMinusFive();
      if (playWrong) playWrong();
      
      // Track mistakes
      setMistakeCount((prev) => prev + 1);
      if (setMistakes) setMistakes((prev) => prev + 1);
      handleWrong();
      
      setUserInput("");
      // Generate a new sequence that is not the same as the previous
      const newSeq = generateUniqueSequence(level + 2, prevSequence.current);
      setSequence(newSeq);
      prevSequence.current = newSeq;
      setShowSequence(true);
      setFadeOut(false);
      return;
    }
  };

  return (
    <div>
      {!result && (
        <div className="flex-grow-1 w-100 d-flex flex-column align-items-center justify-content-center">
          <div
            className="mb-3 digit-sequence big-digit-sequence"
            style={{
              minHeight: "3.5em",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginTop: "4.5rem",
              marginBottom: "2.2rem",
            }}
          >
            {showSequence
              ? renderFadingSequence()
              : "• ".repeat(sequence.length)}
          </div>

          <div className="text-white mb-3">
            XP: {xp} / {xpToNextLevel}
          </div>

          <form
            className="game-form d-flex flex-column align-items-center w-100"
            onSubmit={handleSubmit}
            style={{ marginTop: "0.5rem" }}
          >
            <input
              ref={inputRef}
              autoFocus
              value={userInput}
              onChange={handleInputChange}
              maxLength={sequence.length}
              className="digit-input custom-digit-input"
              style={{
                width: "60%",
                minWidth: 180,
                marginBottom: 12,
              }}
              disabled={showSequence}
            />
            <button
              className="game-btn btn btn-playful-main mt-2"
              type="submit"
              disabled={showSequence || result}
            >
              Submit
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default function NumberRecall({ token }) {
  return (
    <GameWindow>
      <GameLayout
        introSlides={introSlides}
        helpText="Memorize the sequence of digits shown. When the digits disappear, type them in the correct order. Each correct answer gives you XP. Earn enough XP to level up and face longer sequences!"
        gameName="Number Recall"
        fetchUserGameProgress={fetchUserGameProgress}
        submitGameScore={submitNumberRecall}
        initialLevel={1}
        maxLevel={10}
        onGameStart={(level, { resetProgress }) => resetProgress(level)}
        onGameRestart={() => window.location.reload()}
        onGameQuit={() => window.location.assign("/games/memory")}
        token={token}
        // --- Confetti fix: render confetti outside popup on victory ---
        renderConfetti={(isVictory) =>
          isVictory ? (
            <div
              style={{
                position: "fixed",
                left: 0,
                top: 0,
                width: "100vw",
                height: "100vh",
                pointerEvents: "none",
                zIndex: 9999,
              }}
            >
              {/* You can use your Confetti component here if you want global confetti */}
            </div>
          ) : null
        }
      >
        {(game) => (
          <NumberRecallGame
            level={game.level}
            xp={game.xp}
            xpToNextLevel={game.xpToNextLevel}
            timer={game.timer}
            setTimer={game.setTimer}
            result={game.result}
            handleSuccess={game.handleSuccess}
            handleGameOver={game.handleGameOver}
            handleWrong={game.handleWrong}
            playWrong={game.playWrong}
            playCorrect={game.playCorrect}
            triggerMinusFive={game.triggerMinusFive}
            playTimer10s={game.playTimer10s}
            playTimer30s={game.playTimer30s}
            mistakes={game.mistakes}
            setMistakes={game.setMistakes}
          />
        )}
      </GameLayout>
    </GameWindow>
  );
}
