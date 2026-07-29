import { useState, useEffect, useRef } from "react";
import GameHeader from "./GameHeader.jsx";
import GamePauseModal from "./GamePauseModal.jsx";
import GameHelpModal from "./GameHelpModal.jsx";
import GameIntroPanel from "./GameIntroPanel.jsx";
import GameResultPopup from "./GameResultPopup.jsx";
import GameProgressManager from "./GameProgressManager.jsx";
import { useNavigate } from "react-router-dom";
import {
  playPause,
  playResume,
  playStart,
  playLevelUp,
  playVictory,
  playEnd,
  playCorrect,
  playWrong,
  playTimer10s,
  playTimer30s,
  playTick,
} from "../../../utils/soundEffects";
import "./Styles/GameLayout.css";

export default function GameLayout({
  children,
  introSlides,
  helpText,
  onGameStart,
  onGameRestart,
  onGameQuit,
  onGameSubmit,
  initialLevel = 1,
  maxLevel = 10,
  gameName,
  token,
  fetchUserGameProgress,
  submitGameScore,
}) {
  // UI state
  const [timer, setTimer] = useState(90);
  const [paused, setPaused] = useState(false);
  const [showIntroPanel, setShowIntroPanel] = useState(true);
  const [showPauseModal, setShowPauseModal] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  // Intro panel state for slides and level slider
  const [slideIndex, setSlideIndex] = useState(0);
  const [slideAnim, setSlideAnim] = useState("");
  const [sliderLevel, setSliderLevel] = useState(1);

  const [soundOn, setSoundOn] = useState(true);

  // Timer animation state
  const [timerShake, setTimerShake] = useState(false);
  const [showMinusFive, setShowMinusFive] = useState(false);

  const navigate = useNavigate();

  // --- Streak break logic ---
  const prevStreakRef = useRef(0);
  const [streakBroken, setStreakBroken] = useState(false);
  const [lastStreak, setLastStreak] = useState(0);

  // Timer shake animation reset
  useEffect(() => {
    if (timerShake) {
      const t = setTimeout(() => setTimerShake(false), 600);
      return () => clearTimeout(t);
    }
  }, [timerShake]);

  // Show -5s animation and shake
  const triggerMinusFive = () => {
    setShowMinusFive(true);
    setTimerShake(true);
    setTimeout(() => setShowMinusFive(false), 900);
  };

  // Pause/Resume sound (resume only on explicit resume)
  const handleResume = () => {
    setShowPauseModal(false);
    setPaused(false);
    playResume(soundOn);
  };

  // Timer box class for warning/danger/shake
  const timerBoxClass = [
    "gameheader-timer-box",
    timer <= 10 ? "timer-danger" : timer <= 30 ? "timer-warning" : "",
    timerShake ? "timer-shake" : "",
  ].join(" ");

  // Restart handler: resets timer and shows intro if needed
  const handleRestart = () => {
    setTimer(90);
    setPaused(false);
    setShowPauseModal(false);
    if (onGameRestart) onGameRestart();
  };

  // Quit handler: resets everything and navigates away
  const handleQuit = () => {
    setTimer(90);
    setPaused(false);
    setShowPauseModal(false);
    if (onGameQuit) onGameQuit();
  };

  return (
    <GameProgressManager
      initialLevel={initialLevel}
      fetchUserGameProgress={fetchUserGameProgress}
      gameName={gameName}
      token={token}
      submitGameScore={submitGameScore}
      playVictory={playVictory}
      playEnd={playEnd}
      soundOn={soundOn}
    >
      {({
        level,
        setLevel,
        score,
        setScore,
        xp,
        setXp,
        bestLevel,
        bestScore,
        xpToNextLevel,
        levelProgress,
        handleGameOver,
        handleGameComplete,
        resetProgress,
        isVictory,
        handleSuccess,
        handleWrong,
        streak,
        maxStreak,
        lastCorrectTime,
        mistakes,
        setMistakes,
        correctAnswers,
        result,
        setResult,
        timer: gameTimer,
        setTimer: setGameTimer,
      }) => {
        // Timer logic must be here!
        useEffect(() => {
          if (paused || showIntroPanel || result) return;
          if (timer > 0) {
            const t = setTimeout(() => setTimer(timer - 1), 1000);
            if (timer <= 10 && timer > 0) playTick(soundOn);
            if (timer === 29) playTimer30s(soundOn);
            return () => clearTimeout(t);
          }
          if (timer === 0 && !result) {
            setResult({
              message: "Time's up!",
              score,
              best: bestScore,
              bestLevel: bestLevel,
              isVictory: false,
            });
          }
        }, [
          timer,
          paused,
          showIntroPanel,
          result,
          soundOn,
          score,
          bestScore,
          bestLevel,
        ]);

        // --- Streak break detection ---
        useEffect(() => {
          if (prevStreakRef.current >= 3 && streak < 3) {
            setLastStreak(prevStreakRef.current);
            setStreakBroken(true);
            setTimeout(() => setStreakBroken(false), 700);
          }
          prevStreakRef.current = streak;
        }, [streak]);

        // Clamp slider to bestLevel (not maxLevel)
        const clampedSliderLevel = Math.min(
          sliderLevel,
          bestLevel || initialLevel
        );

        // Start Exercise handler
        const handleIntroStart = (lvl) => {
          setShowIntroPanel(false);
          setTimer(90);
          setSlideIndex(0);
          setSliderLevel(lvl);
          setResult(null);
          playStart(soundOn);
          if (onGameStart)
            onGameStart(lvl, { resetProgress: () => resetProgress(lvl) });
        };

        const handlePrevSlide = () => {
          setSlideAnim("slide-out-right");
          setTimeout(() => {
            setSlideIndex((i) => Math.max(0, i - 1));
            setSlideAnim("slide-in-left");
          }, 250);
          setTimeout(() => setSlideAnim(""), 600);
        };

        const handleNextSlide = () => {
          setSlideAnim("slide-out-left");
          setTimeout(() => {
            setSlideIndex((i) => i + 1);
            setSlideAnim("slide-in-right");
          }, 250);
          setTimeout(() => setSlideAnim(""), 600);
        };

        // Slider change handler (clamped to bestLevel)
        const handleSliderChange = (e) => {
          const value = Number(e.target.value);
          setSliderLevel(Math.min(value, bestLevel || initialLevel));
        };

        // Provide all sound effects and minus five trigger to children
        const soundApiLocal = {
          playPause: () => playPause(soundOn),
          playResume: () => playResume(soundOn),
          playStart: () => playStart(soundOn),
          playLevelUp: () => playLevelUp(soundOn),
          playVictory: () => playVictory(soundOn),
          playEnd: () => playEnd(soundOn),
          playCorrect: () => playCorrect(soundOn),
          playWrong: () => playWrong(soundOn),
          playTimer10s: () => playTimer10s(soundOn),
          playTimer30s: () => playTimer30s(soundOn),
          playTick: () => playTick(soundOn),
          triggerMinusFive,
        };

        // --- MAIN RENDER LOGIC ---
        return (
          <div className="game-layout-root">
            {/* Game Title - only show during intro */}
            {showIntroPanel && (
              <div className="game-title-header">
                <h2 className="game-title">{gameName}</h2>
              </div>
            )}

            {/* Game Header - only show when not in intro */}
            {!showIntroPanel && (
              <div className="game-header-container" style={{ position: "sticky", top: 0, zIndex: 5 }}>
                <GameHeader
                  level={level}
                  levelProgress={levelProgress}
                  timer={timer}
                  score={score}
                  bestScore={bestScore}
                  timerBoxClass={timerBoxClass}
                  showMinusFive={showMinusFive}
                  paused={paused}
                  onPause={() => {
                    setPaused(true);
                    setShowPauseModal(true);
                    playPause(soundOn);
                  }}
                  onResume={() => {
                    setShowPauseModal(false);
                    setPaused(false);
                    playResume(soundOn);
                  }}
                  onHelp={() => setShowHelp(true)}
                  onFullscreen={() => {}}
                  fullscreenIconColor="#bfc8d8"
                  streak={streak}
                  streakBroken={streakBroken}
                  lastStreak={lastStreak}
                  fullscreen={!!document.fullscreenElement}
                  timerShake={timerShake}
                  playPause={() => playPause(soundOn)}
                  playResume={() => playResume(soundOn)}
                />
              </div>
            )}

            {/* Pause Modal */}
            <GamePauseModal
              show={showPauseModal}
              soundOn={soundOn}
              setSoundOn={setSoundOn}
              handleResume={handleResume}
              handleQuit={handleQuit}
              handlePauseRestart={handleRestart}
            />

            {/* Help Modal */}
            <GameHelpModal
              show={showHelp}
              onClose={() => setShowHelp(false)}
              helpText={helpText}
            />

            {/* Main Content */}
            <div className="game-content-wrapper">
              {showIntroPanel ? (
                <GameIntroPanel
                  show={showIntroPanel}
                  introSlides={introSlides}
                  slideIndex={slideIndex}
                  slideAnim={slideAnim}
                  handlePrevSlide={handlePrevSlide}
                  handleNextSlide={handleNextSlide}
                  sliderLevel={clampedSliderLevel}
                  bestLevel={bestLevel}
                  maxLevel={maxLevel}
                  handleSliderChange={handleSliderChange}
                  handleStart={handleIntroStart}
                  navigate={() => navigate("/games")}
                />
              ) : (
                <div className="game-layout-content">
                  {result ? (
                    <GameResultPopup
                      result={{
                        ...result,
                        best: bestScore,
                        bestLevel: bestLevel,
                        isVictory,
                        newBest: result.score > bestScore,
                      }}
                      showConfetti={result.score > bestScore}
                      onRestart={handleRestart}
                      fullscreen={!!document.fullscreenElement}
                    />
                  ) : (
                    children({
                      level,
                      setLevel,
                      score,
                      setScore,
                      xp,
                      setXp,
                      bestLevel,
                      bestScore,
                      xpToNextLevel,
                      levelProgress,
                      handleGameOver,
                      handleGameComplete,
                      resetProgress,
                      handleWrong,
                      isVictory,
                      handleSuccess,
                      streak,
                      maxStreak,
                      lastCorrectTime,
                      correctAnswers,
                      result,
                      timer,
                      setTimer,
                      mistakes,
                      setMistakes,
                      ...soundApiLocal,
                    })
                  )}
                </div>
              )}
            </div>
          </div>
        );
      }}
    </GameProgressManager>
  );
}
