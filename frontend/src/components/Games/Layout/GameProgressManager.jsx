import { useState, useEffect, useRef } from "react";
import { useLevelUp } from "../../../context/LevelUpContext";
import { useUserRefresh } from "../../../hooks/useUserRefresh";
import { useInvalidateAfterGame } from "../../../queries/useUserData.js";
import { playCorrect, playLevelUp } from "../../../utils/soundEffects";

export default function GameProgressManager({
  initialLevel = 1,
  fetchUserGameProgress,
  gameName,
  token,
  submitGameScore,
  playVictory,
  playEnd, // <-- make sure this is passed!
  soundOn,
  children,
}) {
  const { triggerLevelUp } = useLevelUp();
  const refreshUserData = useUserRefresh();
  // Marks stats, recent games, awards, leaderboards and per-game progress stale
  // so screens re-read them instead of relying on a full page reload.
  const invalidateAfterGame = useInvalidateAfterGame();
  const [level, setLevel] = useState(initialLevel);
  const [score, setScore] = useState(0);
  const [xp, setXp] = useState(0);
  const [bestLevel, setBestLevel] = useState(initialLevel);
  const [bestScore, setBestScore] = useState(0);
  const [isVictory, setIsVictory] = useState(false);
  const [result, setResult] = useState(null);

  // Streak and lastCorrectTime state
  const [streak, setStreak] = useState(0);
  const [lastCorrectTime, setLastCorrectTime] = useState(Date.now());
  const [mistakes, setMistakes] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const streakRef = useRef(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const maxStreakRef = useRef(0);
  const correctAnswersRef = useRef(0);

  const didInit = useRef(false);
  const didManualReset = useRef(false);

  // --- EASY TO TUNE SCORE VARIABLES ---
  const XP_PER_CORRECT = 10;
  const SCORE_BASE = 100; // base score for each correct answer
  const SCORE_LEVEL_MULT = 40; // score per level
  const SCORE_STREAK_MULT = 30; // score per streak count (quadratic)
  const SCORE_SPEED_MAX = 60; // max speed bonus
  const SCORE_SPEED_FACTOR = 2.5; // higher = less effect per second

  // XP required per level
  const xpToNextLevel = 40 + 10 * level;
  const levelProgress = Math.min(xp / xpToNextLevel, 1);

  // Track current level in ref to avoid stale closure
  const levelRef = useRef(level);
  useEffect(() => {
    levelRef.current = level;
  }, [level]);

  useEffect(() => {
    streakRef.current = streak;
    // Update max streak whenever current streak increases
    if (streak > maxStreakRef.current) {
      maxStreakRef.current = streak;
      setMaxStreak(streak);
    }
  }, [streak]);

  useEffect(() => {
    console.log(
      "Current Score:",
      score,
      "/",
      "Streak:",
      streak,
      "/",
      "Mistakes:",
      mistakes
    );
  }, [score, streak, mistakes]);

  useEffect(() => {
    let isMounted = true;
    async function fetchProgress() {
      if (!token || !gameName) return;
      try {
        const data = await fetchUserGameProgress(gameName, token);
        if (!isMounted) return;
        setBestLevel(data.level_reached || initialLevel);
        setBestScore(data.score || 0);
        if (!didInit.current && !didManualReset.current) {
          setLevel(data.level_reached || initialLevel);
          didInit.current = true;
        }
        setScore(0);
        setXp(0);
        setStreak(0);
        setMistakes(0);
        setCorrectAnswers(0);
        streakRef.current = 0;
        correctAnswersRef.current = 0;

        // Log the best scores data received from backend
        console.log("User Game Progress Data:", data);
      } catch (e) {
        console.error("Failed to fetch progress", e);
      }
    }
    fetchProgress();
    return () => {
      isMounted = false;
    };
  }, [token, gameName]);

  function handleSuccess({
    level: overrideLevel,
    timeLeft = 0,
    timer = 0,
    isCorrect = true,
  } = {}) {
    // Increment correct answers - one per correct sequence
    const newCorrectAnswers = correctAnswers + 1;
    setCorrectAnswers(newCorrectAnswers);
    correctAnswersRef.current = newCorrectAnswers;
    console.log("Correct answers incremented to:", newCorrectAnswers);

    // Note: XP calculation is now handled by the backend when game is submitted
    // Local XP display is just for UI feedback during the game
    setXp((prevXp) => {
      const newXp = prevXp + XP_PER_CORRECT;

      // Check if we should level up during the game
      const currentLevelXpRequired = 40 + 10 * level;
      if (newXp >= currentLevelXpRequired) {
        const newLevel = level + 1;
        setLevel(newLevel);
        levelRef.current = newLevel;
        console.log(`Local level up during game: ${level} → ${newLevel}`);

        // Play level up sound
        if (playLevelUp) playLevelUp(soundOn);

        // Reset XP for the new level (carry over the excess)
        const excessXp = newXp - currentLevelXpRequired;
        return excessXp;
      }

      return newXp; // Just for local display, not sent to backend
    });

    // Streak and score (use ref to avoid stale state after wrong)
    const newStreak = streakRef.current + 1;
    setStreak(newStreak);
    streakRef.current = newStreak;

    setScore((prevScore) => {
      // Level bonus
      const levelBonus = level * SCORE_LEVEL_MULT;
      // Streak bonus (quadratic for bigger margins)
      const streakBonus = Math.floor((newStreak ** 2 * SCORE_STREAK_MULT) / 5);
      // Speed bonus (the faster, the more)
      let speedBonus = 0;
      if (timer && timeLeft) {
        const secondsTaken = timer - timeLeft;
        speedBonus = Math.max(
          0,
          Math.round(SCORE_SPEED_MAX - secondsTaken * SCORE_SPEED_FACTOR)
        );
      }
      const total = SCORE_BASE + levelBonus + streakBonus + speedBonus;
      setLastCorrectTime(Date.now());
      return prevScore + total;
    });
  }

  // Call this on wrong answer to reset streak
  function handleWrong() {
    setStreak(0);
    streakRef.current = 0;
    // Don't reset maxStreak when we handle a wrong answer
    setMistakes((prev) => prev + 1);
    console.log(
      "[GameProgressManager] handleWrong called! Current Score:",
      score,
      "/",
      "Streak:",
      0,
      "Mistakes:",
      mistakes + 1
    );
  }

  // Call this when game is completed successfully
  const handleGameComplete = (gameData) => {
    // Create base payload with score/progress data (NO XP - backend calculates it)
    const basePayload = {
      score: Number(score),
      level_reached: Number(level),
      // XP removed - backend calculates based on performance
      streaks: Number(maxStreak > streak ? maxStreak : streak),
      mistakes: Number(mistakes || 0),
      correct_answers: correctAnswersRef.current,
    };

    // Merge game-specific data with base payload
    const payload = { ...gameData, ...basePayload };

    // Extract the message for display
    const message = gameData?.message || "Game Complete!";

    // Set the result to show completion screen
    const victory = score > bestScore;
    setIsVictory(victory);

    // Update best score if this is a new record
    if (victory) {
      setBestScore(score);
      if (playVictory) playVictory(soundOn);
    } else {
      if (playEnd) playEnd(soundOn);
    }

    // Update best level if this is a new record
    const newBestLevel = level > bestLevel ? level : bestLevel;
    if (level > bestLevel) {
      setBestLevel(level);
    }

    // Set initial result without XP data
    const initialResult = {
      message,
      score,
      level_reached: level,
      streaks: maxStreak > streak ? maxStreak : streak,
      best: victory ? score : bestScore,
      bestLevel: newBestLevel,
      bestStreak: maxStreak > streak ? maxStreak : streak, // Use current game's max streak as temp best
      isVictory: victory,
      newBest: victory,
      xp_earned: 0, // Will be updated by backend response
      level_up: false,
      old_level: 1,
      new_level: 1,
      total_xp: 0,
    };

    setResult(initialResult);

    // Submit to backend
    if (submitGameScore) {
      console.log(
        "Game completed successfully! Submitting score with data:",
        payload
      );
      // Remove the message from payload (not needed for backend)
      const backendPayload = { ...payload };
      delete backendPayload.message;

      // Submit score and handle achievements/badges
      submitGameScore(backendPayload, token)
        .then((response) => {
          console.log("Game submission response:", response);

          // Handle achievements
          if (
            response.newly_earned_achievements &&
            response.newly_earned_achievements.length > 0
          ) {
            response.newly_earned_achievements.forEach((achievement) => {
              // Trigger achievement notification
              const event = new CustomEvent("achievementEarned", {
                detail: { achievement },
              });
              window.dispatchEvent(event);
            });
          }

          // Handle badges
          if (
            response.newly_earned_badges &&
            response.newly_earned_badges.length > 0
          ) {
            response.newly_earned_badges.forEach((badge) => {
              // Trigger badge notification
              const event = new CustomEvent("badgeEarned", {
                detail: { badge },
              });
              window.dispatchEvent(event);
            });
          }

          // Handle level up
          if (response.level_up) {
            console.log(
              `Level up! ${response.old_level} → ${response.new_level}`
            );

            // Trigger level-up notification immediately
            triggerLevelUp({
              oldLevel: response.old_level,
              newLevel: response.new_level,
              totalXP: response.total_xp,
            });

            // Also refresh user data for context updates
            setTimeout(async () => {
              await refreshUserData();
            invalidateAfterGame();
            }, 100);
          }

          // Always refresh user data to update XP progress
          setTimeout(async () => {
            await refreshUserData();
            invalidateAfterGame();
          }, 1000);

          // Update payload with XP info for the result popup
          payload.xp_earned = response.xp_earned;
          payload.level_up = response.level_up;
          payload.old_level = response.old_level;
          payload.new_level = response.new_level;
          payload.total_xp = response.total_xp;

          // Update the result state with backend response data
          setResult((prevResult) => ({
            ...prevResult,
            best: response.best_score,
            bestLevel: response.best_level,
            bestStreak: response.best_streak,
            level_reached: response.level_reached,
            streaks: response.streaks,
            xp_earned: response.xp_earned || 0,
            level_up: response.level_up,
            old_level: response.old_level,
            new_level: response.new_level,
            total_xp: response.total_xp,
          }));

          console.log("Updated result with XP data:", {
            xp_earned: response.xp_earned,
            level_reached: response.level_reached,
            streaks: response.streaks,
          });
        })
        .catch((error) => {
          console.error("Error submitting game score:", error);
        });
    }
  };

  const handleGameOver = (gameData) => {
    // Extract the message if provided
    const message = gameData?.message || "Game Over";

    // Create base payload with score/progress data (NO XP - backend calculates it)
    const basePayload = {
      score: Number(score),
      level_reached: Number(level),
      // XP removed - backend calculates based on performance
      // Send the maximum streak achieved during the game, not the current streak
      streaks: Number(maxStreak > streak ? maxStreak : streak),
      mistakes: Number(mistakes || 0),
      correct_answers: correctAnswersRef.current, // Use actual count, not estimate
    };

    // Merge game-specific data with base payload
    const payload = { ...gameData, ...basePayload };

    // Remove the message from payload (not needed for backend)
    delete payload.message;

    const victory = score > bestScore;
    setIsVictory(victory);
    if (victory) {
      if (playVictory) playVictory(soundOn);
      setBestScore(score);
      // Do NOT play playEnd if victory
    } else {
      if (typeof playEnd === "function") playEnd(soundOn); // <-- fix: play end sound on loss
    }

    if (submitGameScore) {
      setTimeout(() => {
        console.log(
          "Submitting game score with correct answers:",
          correctAnswersRef.current
        );
        console.log("Full payload:", payload);

        submitGameScore(payload, token)
          .then((response) => {
            console.log("Game over submission response:", response);

            // Handle achievements
            if (
              response.newly_earned_achievements &&
              response.newly_earned_achievements.length > 0
            ) {
              response.newly_earned_achievements.forEach((achievement) => {
                // Trigger achievement notification
                const event = new CustomEvent("achievementEarned", {
                  detail: { achievement },
                });
                window.dispatchEvent(event);
              });
            }

            // Handle badges
            if (
              response.newly_earned_badges &&
              response.newly_earned_badges.length > 0
            ) {
              response.newly_earned_badges.forEach((badge) => {
                // Trigger badge notification
                const event = new CustomEvent("badgeEarned", {
                  detail: { badge },
                });
                window.dispatchEvent(event);
              });
            }

            // Handle level up
            if (response.level_up) {
              console.log(
                `Level up! ${response.old_level} → ${response.new_level}`
              );

              // Trigger level-up notification immediately
              triggerLevelUp({
                oldLevel: response.old_level,
                newLevel: response.new_level,
                totalXP: response.total_xp,
              });

              // Refresh user data for context updates
              setTimeout(async () => {
                await refreshUserData();
            invalidateAfterGame();
              }, 100);
            }

            // Always refresh user data to update XP progress, but after level up handling
            setTimeout(
              async () => {
                await refreshUserData();
            invalidateAfterGame();
              },
              response.level_up ? 500 : 200
            );

            // Update the result state with backend response data
            setResult((prevResult) => {
              const newResult = {
                ...prevResult,
                best: response.best_score,
                bestLevel: response.best_level,
                bestStreak: response.best_streak,
                level_reached: response.level_reached,
                streaks: response.streaks,
                xp_earned: response.xp_earned || 0,
                level_up: response.level_up,
                old_level: response.old_level,
                new_level: response.new_level,
                total_xp: response.total_xp,
              };

              // Debug log the final result data
              console.log("📊 Final result data being set:", {
                level_reached: response.level_reached,
                streaks: response.streaks,
                xp_earned: response.xp_earned,
                score: prevResult?.score,
              });

              return newResult;
            });
          })
          .catch((error) => {
            console.error("Error submitting game over score:", error);
          });
      }, 0);
    }
  };

  const resetProgress = (newLevel = level) => {
    didManualReset.current = true;
    didInit.current = true;
    setLevel(newLevel);
    setScore(0);
    setXp(0);
    setStreak(0);
    streakRef.current = 0;
    setMaxStreak(0);
    maxStreakRef.current = 0;
    setCorrectAnswers(0);
    correctAnswersRef.current = 0;
    console.log("Progress reset - correct answers reset to 0");
  };

  return children({
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
  });
}
