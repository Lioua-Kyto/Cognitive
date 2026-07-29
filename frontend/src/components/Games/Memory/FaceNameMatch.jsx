import { useState, useEffect, useRef } from "react";
import GameWindow from "../GameWindow.jsx";
import GameLayout from "../Layout/GameLayout.jsx";
import { submitFaceNameMatch } from "../../../api/games.jsx";
import { fetchUserGameProgress } from "../../../api/score.jsx";
import "../Styles/games.css";

// Sample face data with emoji faces and names
const faceData = [
  { id: 1, face: "👨‍💼", name: "JAMES" },
  { id: 2, face: "👩‍🔬", name: "SARAH" },
  { id: 3, face: "👨‍🎨", name: "DAVID" },
  { id: 4, face: "👩‍⚕️", name: "EMMA" },
  { id: 5, face: "👨‍🍳", name: "MIKE" },
  { id: 6, face: "👩‍🏫", name: "LISA" },
  { id: 7, face: "👨‍💻", name: "ALEX" },
  { id: 8, face: "👩‍🎤", name: "ANNA" },
  { id: 9, face: "👨‍🔧", name: "RYAN" },
  { id: 10, face: "👩‍✈️", name: "KATE" },
  { id: 11, face: "👨‍🚀", name: "JOHN" },
  { id: 12, face: "👩‍💻", name: "NINA" },
  { id: 13, face: "👨‍🎓", name: "MARK" },
  { id: 14, face: "👩‍🎨", name: "ZARA" },
  { id: 15, face: "👨‍⚕️", name: "CARL" },
  { id: 16, face: "👩‍🔬", name: "RUBY" },
  { id: 17, face: "👨‍🏫", name: "PAUL" },
  { id: 18, face: "👩‍🍳", name: "LILY" },
  { id: 19, face: "👨‍🎤", name: "NOAH" },
  { id: 20, face: "👩‍🔧", name: "SARA" },
];

function generateFaceNamePairs(level) {
  const pairCount = Math.min(4 + level, 8); // 5 to 8 pairs based on level
  const shuffled = [...faceData].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, pairCount);

  // Shuffle the selected pairs for display randomization
  return selected
    .map((person) => ({
      face: person.face,
      name: person.name,
      id: person.id,
    }))
    .sort(() => Math.random() - 0.5);
}

const introSlides = [
  {
    title: "Why Face-Name Match?",
    desc: "This game trains your associative memory and social cognition. It's great for improving your ability to remember people's names in real life.",
    img: "/images/brain-idea.svg",
  },
  {
    title: "Benefits",
    desc: "• Improves name-face association\n• Enhances social memory\n• Develops attention to detail\n• Strengthens associative learning",
    img: "/images/brain-benefit.svg",
  },
  {
    title: "How to Play",
    desc: "Study the faces and names carefully. Then match each face with the correct name from memory. Perfect matches advance you to the next level!",
    img: "/images/brain-tutorial.svg",
  },
];

function FaceNameMatchGame({
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
  const [pairs, setPairs] = useState(() => generateFaceNamePairs(level));
  const [showPairs, setShowPairs] = useState(true);
  const [userMatches, setUserMatches] = useState({});
  const [gamePhase, setGamePhase] = useState("studying"); // 'studying', 'matching'
  const [shuffledNames, setShuffledNames] = useState([]);
  const gameStartedRef = useRef(false);

  // Generate new pairs when level changes
  useEffect(() => {
    const newPairs = generateFaceNamePairs(level);
    setPairs(newPairs);
    setShowPairs(true);
    setUserMatches({});
    setGamePhase("studying");

    // Create shuffled names for the matching phase
    const names = newPairs.map((p) => p.name);
    const shuffled = [...names].sort(() => Math.random() - 0.5);
    setShuffledNames(shuffled);
    gameStartedRef.current = false;
  }, [level]);

  // Show pairs for studying, then move to matching phase
  useEffect(() => {
    if (gamePhase === "studying" && showPairs) {
      const studyTime = Math.max(2000, 4000 - level * 200); // 4s to 2s based on level (reduced from 8s-4s)

      const timer = setTimeout(() => {
        setShowPairs(false);
        setGamePhase("matching");
        gameStartedRef.current = true;

        // Shuffle both cards and names after study phase
        const shuffledPairs = [...pairs].sort(() => Math.random() - 0.5);
        setPairs(shuffledPairs);

        const names = shuffledPairs.map((p) => p.name);
        const shuffledNames = [...names].sort(() => Math.random() - 0.5);
        setShuffledNames(shuffledNames);
      }, studyTime);

      return () => clearTimeout(timer);
    }
  }, [gamePhase, showPairs, level]);

  // Handle name selection for a face
  const handleNameSelect = (faceId, selectedName) => {
    if (gamePhase !== "matching" || result) return;

    const newMatches = { ...userMatches, [faceId]: selectedName };
    setUserMatches(newMatches);

    // Check if all faces have been matched
    if (Object.keys(newMatches).length === pairs.length) {
      // Calculate score
      let correctCount = 0;
      pairs.forEach((pair) => {
        if (newMatches[pair.id] === pair.name) {
          correctCount++;
        }
      });

      const accuracy = (correctCount / pairs.length) * 100;

      if (correctCount === pairs.length) {
        // Perfect match! Generate new sequence instead of ending game
        if (playCorrect) playCorrect();

        handleSuccess({
          timeLeft: timer,
          timer: 90,
          isCorrect: true,
        });

        // Generate new sequence instead of completing game
        setTimeout(() => {
          const newPairs = generateFaceNamePairs(level);
          setPairs(newPairs);
          setUserMatches({});
          setShowPairs(true);
          setGamePhase("studying");

          // Create shuffled names for the new matching phase
          const names = newPairs.map((p) => p.name);
          const shuffled = [...names].sort(() => Math.random() - 0.5);
          setShuffledNames(shuffled);
        }, 1000);
      } else {
        // Some mistakes
        if (playWrong) playWrong();
        if (handleWrong) handleWrong(); // Reset streak
        const mistakeCount = pairs.length - correctCount;
        if (setMistakes) setMistakes((prev) => prev + mistakeCount);

        // Penalty: reduce timer by 5 seconds per mistake
        setTimer((prev) => Math.max(0, prev - mistakeCount * 5));
        if (triggerMinusFive) triggerMinusFive();

        // Reset for another try
        setTimeout(() => {
          setUserMatches({});
          setShowPairs(true);
          setGamePhase("studying");
        }, 2000);
      }
    }
  };

  // Handle game over when timer runs out
  useEffect(() => {
    if (timer === 0 && !result && gameStartedRef.current) {
      handleGameOver({
        faces: pairs.map((p) => p.face),
        names: pairs.map((p) => p.name),
        user_matches: pairs.map((p) => userMatches[p.id] || ""),
        message: "Time's up!",
      });
    }
  }, [timer, result, handleGameOver, pairs, userMatches]);

  return (
    <div
      className="face-name-match-container"
      style={{ display: "flex", flexDirection: "column", height: "100%" }}
    >
      {!result && (
        <>
          {/* Game Stats - Always at top */}
          <div
            className="game-stats text-dark mb-4 text-center"
            style={{ flexShrink: 0 }}
          >
            <div className="mb-2">
              People: {pairs.length} | Matched:{" "}
              {Object.keys(userMatches).length}/{pairs.length}
            </div>
          </div>

          {/* Game Phase Indicator - Always at top */}
          <div
            className="phase-indicator text-dark text-center mb-4"
            style={{ flexShrink: 0 }}
          >
            {gamePhase === "studying" && (
              <div>
                <h4>Study the Faces and Names</h4>
                <div style={{ fontSize: "0.9rem", opacity: 0.8 }}>
                  Memorize who is who
                </div>
              </div>
            )}
            {gamePhase === "matching" && (
              <div>
                <h4>Match Each Face with a Name</h4>
                <div style={{ fontSize: "0.9rem", opacity: 0.8 }}>
                  Click on a name to assign it to a face
                </div>
              </div>
            )}
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
            {gamePhase === "studying" && showPairs && (
              // Study Phase: Show all face-name pairs
              <div className="study-phase">
                <div
                  className="face-name-grid"
                  style={{
                    display: "grid",
                    gridTemplateColumns: `repeat(${Math.min(
                      pairs.length,
                      4
                    )}, 1fr)`,
                    gap: "1.5rem",
                    maxWidth: "800px",
                    margin: "0 auto",
                  }}
                >
                  {pairs.map((pair) => (
                    <div
                      key={pair.id}
                      className="face-name-pair"
                      style={{
                        backgroundColor: "#4f46e5",
                        borderRadius: "1rem",
                        padding: "1rem",
                        textAlign: "center",
                        color: "white",
                        minWidth: "120px",
                      }}
                    >
                      <div
                        className="face"
                        style={{
                          fontSize: "3rem",
                          marginBottom: "0.5rem",
                        }}
                      >
                        {pair.face}
                      </div>
                      <div
                        className="name"
                        style={{
                          fontSize: "1.1rem",
                          fontWeight: "bold",
                        }}
                      >
                        {pair.name}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {gamePhase === "matching" && (
              // Matching Phase: Show faces and name options
              <div
                className="matching-phase"
                style={{ maxWidth: "800px", margin: "0 auto" }}
              >
                {/* Faces Grid */}
                <div
                  className="faces-for-matching"
                  style={{
                    display: "grid",
                    gridTemplateColumns: `repeat(${Math.min(
                      pairs.length,
                      4
                    )}, 1fr)`,
                    gap: "1rem",
                    marginBottom: "2rem",
                  }}
                >
                  {pairs.map((pair) => {
                    const selectedName = userMatches[pair.id];
                    const isCorrect = selectedName === pair.name;
                    const isCompleted =
                      Object.keys(userMatches).length === pairs.length;

                    return (
                      <div
                        key={pair.id}
                        className="face-for-matching"
                        style={{
                          backgroundColor: selectedName
                            ? isCompleted && !isCorrect
                              ? "#ef4444"
                              : "#4f46e5"
                            : "#6b7280",
                          borderRadius: "1rem",
                          padding: "1rem",
                          textAlign: "center",
                          color: "white",
                          minWidth: "120px",
                          border:
                            selectedName && isCompleted && isCorrect
                              ? "3px solid #10b981"
                              : "3px solid transparent",
                        }}
                      >
                        <div
                          className="face"
                          style={{
                            fontSize: "3rem",
                            marginBottom: "0.5rem",
                          }}
                        >
                          {pair.face}
                        </div>
                        <div
                          className="selected-name"
                          style={{
                            fontSize: "1rem",
                            fontWeight: "bold",
                            minHeight: "1.5rem",
                          }}
                        >
                          {selectedName || "?"}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Name Options */}
                <div className="name-options">
                  <div
                    className="text-dark text-center mb-3"
                    style={{ fontSize: "1rem" }}
                  >
                    Available Names:
                  </div>
                  <div
                    className="names-grid"
                    style={{
                      display: "grid",
                      gridTemplateColumns: `repeat(${Math.min(
                        shuffledNames.length,
                        4
                      )}, 1fr)`,
                      gap: "0.5rem",
                      justifyContent: "center",
                    }}
                  >
                    {shuffledNames.map((name, index) => {
                      const isUsed = Object.values(userMatches).includes(name);

                      return (
                        <button
                          key={index}
                          className="name-option"
                          onClick={() => {
                            // Find the first unmatched face
                            const unmatchedFace = pairs.find(
                              (pair) => !userMatches[pair.id]
                            );
                            if (unmatchedFace) {
                              handleNameSelect(unmatchedFace.id, name);
                            }
                          }}
                          disabled={isUsed}
                          style={{
                            backgroundColor: isUsed ? "#6b7280" : "#10b981",
                            color: "white",
                            border: "none",
                            borderRadius: "0.5rem",
                            padding: "0.5rem 1rem",
                            fontSize: "0.9rem",
                            fontWeight: "bold",
                            cursor: isUsed ? "default" : "pointer",
                            opacity: isUsed ? 0.5 : 1,
                            minWidth: "80px",
                          }}
                        >
                          {name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* In-game instruction text removed; instructions live in intro panel */}
        </>
      )}
    </div>
  );
}

export default function FaceNameMatch({ token }) {
  return (
    <GameWindow>
      <GameLayout
        introSlides={introSlides}
        helpText="Study each face-name pair carefully during the preview. Then match each face with the correct name from the options. Perfect accuracy is required to advance!"
        gameName="Face-Name Match"
        fetchUserGameProgress={fetchUserGameProgress}
        submitGameScore={submitFaceNameMatch}
        initialLevel={1}
        maxLevel={10}
        onGameStart={(level, { resetProgress }) => resetProgress(level)}
        onGameRestart={() => window.location.reload()}
        onGameQuit={() => window.location.assign("/games/memory")}
        token={token}
      >
        {(game) => (
          <FaceNameMatchGame
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
