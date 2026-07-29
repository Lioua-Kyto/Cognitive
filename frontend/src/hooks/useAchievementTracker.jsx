import { useState, useEffect, useRef } from "react";
import { AchievementsAPI } from "../api/achievements.jsx";

export function useAchievementTracker(token, user) {
  const [previousAchievements, setPreviousAchievements] = useState([]);
  const [previousBadges, setPreviousBadges] = useState([]);
  const [pendingNotifications, setPendingNotifications] = useState([]);
  const isInGame = useRef(false);
  const achievementsAPI = new AchievementsAPI();

  // Function to check for new achievements/badges
  const checkForNewUnlocks = async () => {
    if (!token || !user) return;

    try {
      const data = await achievementsAPI.fetchAchievementsAndBadges(token);

      // Find newly unlocked achievements
      const newAchievements = data.achievements.filter(
        (achievement) =>
          achievement.is_earned &&
          !previousAchievements.some(
            (prev) => prev.id === achievement.id && prev.is_earned
          )
      );

      // Find newly unlocked badges
      const newBadges = data.badges.filter(
        (badge) =>
          badge.is_earned &&
          !previousBadges.some((prev) => prev.id === badge.id && prev.is_earned)
      );

      // If we have new unlocks
      if (newAchievements.length > 0 || newBadges.length > 0) {
        const newNotifications = [
          ...newAchievements.map((achievement) => ({
            type: "achievement",
            data: achievement,
          })),
          ...newBadges.map((badge) => ({ type: "badge", data: badge })),
        ];

        if (isInGame.current) {
          // Store notifications to show later
          setPendingNotifications((prev) => [...prev, ...newNotifications]);
        } else {
          // Show notifications immediately
          showNotifications(newNotifications);
        }
      }

      // Update previous state
      setPreviousAchievements(data.achievements);
      setPreviousBadges(data.badges);

      return data;
    } catch (error) {
      console.error("Error checking for achievement unlocks:", error);
      return null;
    }
  };

  // Function to show notifications
  const showNotifications = (notifications) => {
    notifications.forEach((notification) => {
      if (notification.type === "achievement") {
        triggerAchievementNotification(notification.data);
      } else if (notification.type === "badge") {
        triggerBadgeNotification(notification.data);
      }
    });
  };

  // Function to set game status
  const setInGame = (inGame) => {
    isInGame.current = inGame;

    // If leaving game and have pending notifications, show them
    if (!inGame && pendingNotifications.length > 0) {
      setTimeout(() => {
        showNotifications(pendingNotifications);
        setPendingNotifications([]);
      }, 1000); // Delay slightly to allow game UI to clear
    }
  };

  // Trigger achievement notification
  const triggerAchievementNotification = (achievement) => {
    const event = new CustomEvent("achievementEarned", {
      detail: { achievement },
    });
    window.dispatchEvent(event);
  };

  // Trigger badge notification
  const triggerBadgeNotification = (badge) => {
    const event = new CustomEvent("badgeEarned", {
      detail: { badge },
    });
    window.dispatchEvent(event);
  };

  return {
    checkForNewUnlocks,
    setInGame,
    pendingNotifications: pendingNotifications.length,
    triggerAchievementNotification,
    triggerBadgeNotification,
  };
}

// Standalone functions for manual triggering
export function triggerAchievementNotification(achievement) {
  const event = new CustomEvent("achievementEarned", {
    detail: { achievement },
  });
  window.dispatchEvent(event);
}

export function triggerBadgeNotification(badge) {
  const event = new CustomEvent("badgeEarned", {
    detail: { badge },
  });
  window.dispatchEvent(event);
}
