import { useState, useEffect, useRef } from "react";
import GameWindow from "../GameWindow.jsx";
import GameLayout from "../Layout/GameLayout.jsx";
import { submitCardFlipMemory } from "../../../api/games.jsx";
import { fetchUserGameProgress } from "../../../api/score.jsx";

// Card symbols for different levels
const cardSymbols = [
  "🌟",
  "🎈",
  "🎮",
  "🎵",
  "🍀",
  "🦋",
  "🌈",
  "🎭",
  "🎨",
  "🎯",
  "🏆",
  "💎",
  "🌺",
  "🎪",
  "🎊",
  "🎁",
  "🌸",
  "🍄",
  "🦄",
  "🌙",
  "⭐",
  "💫",
  "✨",
  "🔥",
];

function generateCards(level) {
  const pairCount = Math.min(level + 4, 12); // 5-12 pairs based on level
  const symbols = cardSymbols.slice(0, pairCount);
  const cards = [...symbols, ...symbols]; // Create pairs

  // Shuffle the cards
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }

  return cards.map((symbol, index) => ({
    id: index,
    symbol,
    isFlipped: false,
    isMatched: false,
  }));
}

const introSlides = [
  {
    title: "Why Card Flip Memory?",
    desc: "This classic memory game trains your visual memory and spatial recall. It improves concentration and helps develop memory strategies.",
    img: "/images/brain-idea.svg",
  },
  {
    title: "Benefits",
    desc: "• Strengthens visual memory\n• Improves concentration\n• Develops pattern recognition\n• Enhances spatial awareness",
    img: "/images/brain-benefit.svg",
  },
  {
    title: "How to Play",
    desc: "Click cards to flip them over. Find matching pairs by remembering where you saw each symbol. Match all pairs to complete the level!",
    img: "/images/brain-tutorial.svg",
  },
];

function CardFlipMemoryGame({
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
  const [cards, setCards] = useState(() => generateCards(level));
  const [flippedCards, setFlippedCards] = useState([]);
  const [moves, setMoves] = useState(0);
  const [matchedPairs, setMatchedPairs] = useState(0);
  const [gamePhase, setGamePhase] = useState("preview"); // "preview", "memorize", "playing"
  const [wrongMoves, setWrongMoves] = useState(0);
  const gameStartedRef = useRef(false);
  const totalPairs = Math.min(level + 3, 12);

  // Initialize new game when level changes
  useEffect(() => {
    const newCards = generateCards(level);
    setCards(newCards);
    setFlippedCards([]);
    setMoves(0);
    setMatchedPairs(0);
    setWrongMoves(0);
    setGamePhase("preview");
    gameStartedRef.current = false;
  }, [level]);

  // Handle game phases: preview -> memorize -> playing
  useEffect(() => {
    if (gamePhase === "preview") {
      // Show all cards face up initially
      setCards((prev) => prev.map((c) => ({ ...c, isFlipped: true })));

      const timer = setTimeout(() => {
        setGamePhase("memorize");
      }, 2000); // Show for 2 seconds

      return () => clearTimeout(timer);
    } else if (gamePhase === "memorize") {
      // Flip all cards face down and shuffle them
      setCards((prev) => {
        const shuffledCards = [...prev].sort(() => Math.random() - 0.5);
        return shuffledCards.map((c) => ({ ...c, isFlipped: false }));
      });

      const timer = setTimeout(() => {
        setGamePhase("playing");
        gameStartedRef.current = true;
      }, 1000); // 1 second pause

      return () => clearTimeout(timer);
    }
  }, [gamePhase]);

  // Handle card click
  const handleCardClick = (cardId) => {
    if (gamePhase !== "playing" || result || flippedCards.length >= 2) return;

    const card = cards.find((c) => c.id === cardId);
    if (card.isFlipped || card.isMatched) return;

    const newFlippedCards = [...flippedCards, cardId];
    setFlippedCards(newFlippedCards);

    // Flip the card
    setCards((prev) =>
      prev.map((c) => (c.id === cardId ? { ...c, isFlipped: true } : c))
    );

    // If two cards are flipped, check for match
    if (newFlippedCards.length === 2) {
      setMoves((prev) => prev + 1);

      const [firstId, secondId] = newFlippedCards;
      const firstCard = cards.find((c) => c.id === firstId);
      const secondCard = cards.find((c) => c.id === secondId);

      setTimeout(() => {
        if (firstCard.symbol === secondCard.symbol) {
          // Match found!
          if (playCorrect) playCorrect();

          // Reset wrong moves counter on correct match
          setWrongMoves(0);

          setCards((prev) =>
            prev.map((c) =>
              c.id === firstId || c.id === secondId
                ? { ...c, isMatched: true }
                : c
            )
          );

          setMatchedPairs((prev) => {
            const newMatched = prev + 1;

            // Check if all pairs are matched
            if (newMatched === totalPairs) {
              const finalMoves = moves + 1;

              handleSuccess({
                timeLeft: timer,
                timer: 90,
                isCorrect: true,
              });

              // Generate new sequence instead of completing game
              setTimeout(() => {
                const newCards = generateCards(level);
                setCards(newCards);
                setFlippedCards([]);
                setMoves(0);
                setMatchedPairs(0);
                setWrongMoves(0);
                setGamePhase("preview");
              }, 1000);

              return newMatched;
            }

            return newMatched;
          });
        } else {
          // No match - increment wrong moves counter
          setWrongMoves((prev) => {
            const newWrongMoves = prev + 1;

            // Only count as mistake after 2 wrong moves
            if (newWrongMoves >= 2) {
              if (playWrong) playWrong();
              if (handleWrong) handleWrong(); // Reset streak
              if (setMistakes) setMistakes((prev) => prev + 1);

              // Penalty: reduce timer by 5 seconds
              setTimer((prev) => Math.max(0, prev - 5));
              if (triggerMinusFive) triggerMinusFive();

              return 0; // Reset wrong moves counter
            }

            return newWrongMoves;
          });

          setCards((prev) =>
            prev.map((c) =>
              c.id === firstId || c.id === secondId
                ? { ...c, isFlipped: false }
                : c
            )
          );
        }

        setFlippedCards([]);
      }, 300); // Reduced delay from 1000ms to 300ms
    }
  };

  // Handle game over when timer runs out
  useEffect(() => {
    if (timer === 0 && !result && gameStartedRef.current) {
      handleGameOver({
        moves: [moves.toString()], // Backend expects array of strings
        message: "Time's up!",
      });
    }
  }, [timer, result, handleGameOver, moves]);

  const getGridCols = () => {
    const cardCount = cards.length;
    if (cardCount <= 8) return 4;
    if (cardCount <= 12) return 4;
    if (cardCount <= 16) return 4;
    return 5;
  };

  return (
    <div
      className="card-flip-container"
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
              Moves: {moves} | Pairs: {matchedPairs}/{totalPairs} | Wrong:{" "}
              {wrongMoves}/2
            </div>
            <div
              className="mb-2"
              style={{ fontSize: "1rem", fontWeight: "bold" }}
            >
              {gamePhase === "preview" && "💡 Memorize the card positions"}
              {gamePhase === "memorize" && "🔄 Cards flipping..."}
              {gamePhase === "playing" && "🎮 Find the matching pairs!"}
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
            {/* Cards Grid */}
            <div
              className="cards-grid"
              style={{
                display: "grid",
                gridTemplateColumns: `repeat(${getGridCols()}, 1fr)`,
                gap: "0.5rem",
                maxWidth: "600px",
                margin: "0 auto",
              }}
            >
              {cards.map((card) => (
                <div
                  key={card.id}
                  className={`memory-card ${
                    card.isFlipped || card.isMatched ? "flipped" : ""
                  } ${card.isMatched ? "matched" : ""}`}
                  onClick={() => handleCardClick(card.id)}
                  style={{
                    width: "4rem",
                    height: "4rem",
                    backgroundColor:
                      card.isFlipped || card.isMatched ? "#4f46e5" : "#6b7280",
                    border: "2px solid #374151",
                    borderRadius: "0.5rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor:
                      card.isFlipped ||
                      card.isMatched ||
                      flippedCards.length >= 2
                        ? "default"
                        : "pointer",
                    fontSize: "1.5rem",
                    transition: "all 0.3s ease",
                    transform: card.isMatched ? "scale(0.95)" : "scale(1)",
                    opacity: card.isMatched ? 0.7 : 1,
                  }}
                >
                  {card.isFlipped || card.isMatched ? card.symbol : "?"}
                </div>
              ))}
            </div>
          </div>

          {/* In-game instruction text removed; instructions live in intro panel */}
        </>
      )}
    </div>
  );
}

export default function CardFlipMemory({ token }) {
  return (
    <GameWindow>
      <GameLayout
        introSlides={introSlides}
        helpText="Click cards to flip them over and find matching pairs. Remember where each symbol is located! Match all pairs to complete the level. Wrong matches will cost you time."
        gameName="Card Flip Memory"
        fetchUserGameProgress={fetchUserGameProgress}
        submitGameScore={submitCardFlipMemory}
        initialLevel={1}
        maxLevel={10}
        onGameStart={(level, { resetProgress }) => resetProgress(level)}
        onGameRestart={() => window.location.reload()}
        onGameQuit={() => window.location.assign("/games/memory")}
        token={token}
      >
        {(game) => (
          <CardFlipMemoryGame
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
