import { API_BASE } from "./config.js";
const BASE_URL = API_BASE;

// Achievement API functions
class AchievementAPI {
  // Get all achievements (earned and unearned) with progress
  async fetchAllAchievements(token) {
    try {
      const res = await fetch(`${BASE_URL}/users/achievements/all/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch all achievements");
      return res.json();
    } catch (error) {
      console.error("Error fetching all achievements:", error);
      throw error;
    }
  }

  // Get user's earned achievements
  async fetchUserAchievements(token, userId) {
    try {
      const res = await fetch(`${BASE_URL}/users/achievements/${userId}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch user achievements");
      return res.json();
    } catch (error) {
      console.error("Error fetching user achievements:", error);
      throw error;
    }
  }

  // Get achievement statistics (for tooltips)
  async fetchAchievementStats(token, achievementId) {
    try {
      const res = await fetch(
        `${BASE_URL}/users/achievements/${achievementId}/stats/`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) throw new Error("Failed to fetch achievement stats");
      return res.json();
    } catch (error) {
      console.error("Error fetching achievement stats:", error);
      throw error;
    }
  }
}

// Badge API functions
class BadgeAPI {
  // Get all badges (earned and unearned)
  async fetchAllBadges(token) {
    try {
      const res = await fetch(`${BASE_URL}/users/badges/all/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch all badges");
      return res.json();
    } catch (error) {
      console.error("Error fetching all badges:", error);
      throw error;
    }
  }

  // Get user's earned badges
  async fetchUserBadges(token, userId) {
    try {
      const res = await fetch(`${BASE_URL}/users/badges/${userId}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch user badges");
      return res.json();
    } catch (error) {
      console.error("Error fetching user badges:", error);
      throw error;
    }
  }

  // Get badge statistics (for tooltips)
  async fetchBadgeStats(token, badgeId) {
    try {
      const res = await fetch(`${BASE_URL}/users/badges/${badgeId}/stats/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch badge stats");
      return res.json();
    } catch (error) {
      console.error("Error fetching badge stats:", error);
      throw error;
    }
  }
}

// Combined API class for both achievements and badges
class AchievementsAPI {
  // Combined method to fetch both achievements and badges with progress
  async fetchAchievementsAndBadges(token) {
    try {
      const achievementAPI = new AchievementAPI();
      const badgeAPI = new BadgeAPI();

      const [achievements, badges] = await Promise.all([
        achievementAPI.fetchAllAchievements(token),
        badgeAPI.fetchAllBadges(token),
      ]);

      return {
        achievements,
        badges,
      };
    } catch (error) {
      console.error("Error fetching achievements and badges:", error);
      throw error;
    }
  }

  // Get user progress for a specific achievement/badge type
  async fetchUserProgress(token, type, itemId) {
    try {
      const res = await fetch(`${BASE_URL}/users/progress/${type}/${itemId}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch user progress");
      return res.json();
    } catch (error) {
      console.error("Error fetching user progress:", error);
      throw error;
    }
  }

  // Handle achievement notifications from game submissions
  async handleGameSubmissionResponse(responseData, achievementTracker) {
    if (!responseData || !achievementTracker) return;

    const { newly_earned_achievements = [], newly_earned_badges = [] } =
      responseData;

    // If we have new achievements or badges, trigger notifications
    if (
      newly_earned_achievements.length > 0 ||
      newly_earned_badges.length > 0
    ) {
      // Create notification objects
      const notifications = [
        ...newly_earned_achievements.map((achievement) => ({
          type: "achievement",
          data: achievement,
        })),
        ...newly_earned_badges.map((badge) => ({
          type: "badge",
          data: badge,
        })),
      ];

      // Use achievement tracker to handle notifications (respects game state)
      notifications.forEach((notification) => {
        if (notification.type === "achievement") {
          achievementTracker.triggerAchievementNotification(notification.data);
        } else {
          achievementTracker.triggerBadgeNotification(notification.data);
        }
      });
    }
  }
}

export { AchievementAPI, BadgeAPI, AchievementsAPI };

// Utility functions for game integration
export const GameAchievementUtils = {
  // Initialize achievement tracking for a game
  initializeGameTracking: (achievementTracker) => {
    if (achievementTracker && achievementTracker.setInGame) {
      achievementTracker.setInGame(true);
    }
  },

  // Finalize achievement tracking when game ends
  finalizeGameTracking: (achievementTracker) => {
    if (achievementTracker && achievementTracker.setInGame) {
      achievementTracker.setInGame(false);
    }
  },

  // Handle game submission response and trigger notifications
  handleGameResponse: async (responseData, achievementTracker) => {
    const achievementsAPI = new AchievementsAPI();
    await achievementsAPI.handleGameSubmissionResponse(
      responseData,
      achievementTracker
    );
  },
};
