const BASE_URL = "http://127.0.0.1:8000/api";

// Profile functions
export async function fetchProfile(token, userId = null) {
  const url = userId
    ? `${BASE_URL}/users/profile/${userId}/`
    : `${BASE_URL}/users/profile/`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 401) {
    throw new Error("401 Unauthorized");
  }
  if (!res.ok) throw new Error("Failed to fetch profile");
  return res.json();
}

export async function updateProfile(token, formData) {
  try {
    const res = await fetch(`${BASE_URL}/users/update-profile/`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      console.error("Profile update error:", errorData);
      throw new Error(errorData.message || "Failed to update profile");
    }

    return res.json();
  } catch (error) {
    console.error("Profile update error:", error);
    throw error;
  }
}

export async function fetchCountries(token) {
  const res = await fetch(`${BASE_URL}/users/countries/`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) throw new Error("Failed to fetch countries");
  return res.json();
}

// Analytics functions
export async function fetchGlobalRank(token) {
  const res = await fetch(`${BASE_URL}/leaderboard/user-rank/global/`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) throw new Error("Failed to fetch global rank");
  return res.json();
}

export async function fetchCategoryRank(token, categoryKey) {
  const res = await fetch(
    `${BASE_URL}/leaderboard/user-rank/category/${categoryKey}/`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  if (!res.ok)
    throw new Error(`Failed to fetch rank for category: ${categoryKey}`);
  return res.json();
}

export async function fetchRecentCategoryGames(token, categoryKey) {
  const res = await fetch(
    `${BASE_URL}/leaderboard/user-games/${categoryKey}/`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  if (!res.ok)
    throw new Error(`Failed to fetch games for category: ${categoryKey}`);
  return res.json();
}

export async function fetchCategoryProgressHistory(token, categoryKey) {
  const res = await fetch(
    `${BASE_URL}/leaderboard/user-progress-history/${categoryKey}/`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  if (!res.ok)
    throw new Error(
      `Failed to fetch progress history for category: ${categoryKey}`
    );
  return res.json();
}

export async function fetchAllAnalytics(token, categories) {
  try {
    console.log(
      "Fetching analytics for categories:",
      categories.map((c) => c.key)
    );

    // Fetch global rank
    const globalResponse = await fetchGlobalRank(token);
    console.log("Global rank response:", globalResponse);

    const categoriesData = {};

    // Fetch data for each category in parallel to improve performance
    const categoryPromises = categories.map(async (category) => {
      try {
        // Fetch all data in parallel for better performance
        const [rankData, gamesData, historyData, detailedHistory] =
          await Promise.all([
            fetchCategoryRank(token, category.key),
            fetchRecentCategoryGames(token, category.key),
            fetchCategoryProgressHistory(token, category.key),
            fetchGameHistoryDetails(token, category.key),
          ]);

        console.log(`Data for ${category.key}:`, {
          rankData,
          gamesData,
          historyData,
          detailedHistory,
        });

        // Calculate games played from detailed history
        const gamesPlayed =
          detailedHistory?.games?.reduce(
            (total, game) => total + (game.total_plays || 0),
            0
          ) || 0;

        // Process history data to include game scores for bar chart
        const processedHistory = historyData || [];

        // If we have detailed history, merge the game data with scores
        if (detailedHistory?.games) {
          detailedHistory.games.forEach((game) => {
            if (game.history && game.history.length > 0) {
              // Add each game play to the processed history
              game.history.forEach((play) => {
                processedHistory.push({
                  ...play,
                  game_name: game.name,
                  game_key: game.key,
                  score: play.score || 0,
                  best_score: play.best_score || play.score || 0,
                });
              });
            }
          });
        }

        return {
          key: category.key,
          data: {
            rank: rankData.rank || "N/A",
            total_players: rankData.total_players || 0,
            recent_game: gamesData.length > 0 ? gamesData[0] : null,
            recent_games: gamesData || [], // Store all recent games
            history: processedHistory,
            games_played: gamesPlayed,
            detailed_history: detailedHistory,
          },
        };
      } catch (error) {
        console.error(`Error fetching data for ${category.key}:`, error);
        return {
          key: category.key,
          data: {
            rank: "N/A",
            total_players: 0,
            recent_game: null,
            history: [],
            games_played: 0,
            detailed_history: null,
          },
        };
      }
    });

    // Wait for all category data to be fetched
    const categoryResults = await Promise.all(categoryPromises);

    // Convert results to object format
    categoryResults.forEach((result) => {
      categoriesData[result.key] = result.data;
    });

    console.log("Final analytics data:", {
      global_rank: globalResponse.rank || "N/A",
      global_total: globalResponse.total_players || 0,
      categories: categoriesData,
    });

    return {
      global_rank: globalResponse.rank || "N/A",
      global_total: globalResponse.total_players || 0,
      categories: categoriesData,
    };
  } catch (error) {
    console.error("Failed to fetch analytics:", error);
    throw error;
  }
}

export async function fetchGameHistoryDetails(token, categoryKey) {
  const res = await fetch(
    `${BASE_URL}/leaderboard/detailed-history/${categoryKey}/`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  if (!res.ok)
    throw new Error(
      `Failed to fetch detailed history for category: ${categoryKey}`
    );
  return res.json();
}

// Game Stats functions
export async function fetchGameStats(token) {
  const res = await fetch(`${BASE_URL}/leaderboard/user-stats/`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) throw new Error("Failed to fetch game stats");
  return res.json();
}

export async function fetchRecentGames(token) {
  const res = await fetch(`${BASE_URL}/leaderboard/recent-games/`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) throw new Error("Failed to fetch recent games");
  return res.json();
}

export async function fetchLevelStats(token, level) {
  const res = await fetch(`${BASE_URL}/leaderboard/level-stats/${level}/`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) throw new Error("Failed to fetch level stats");
  return res.json();
}

// Module exports for backward compatibility
export const ProfileAPI = {
  fetchProfile,
  updateProfile,
  fetchCountries,
};

// New profileAPI service for user profile operations
export const profileAPI = {
  async getUserProfile(identifier, token) {
    try {
      console.log(
        `=== ProfileAPI: Fetching profile for identifier: ${identifier}`
      );

      const url = `${BASE_URL}/users/profile/${identifier}/`;
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log(`=== ProfileAPI: Profile data received:`, data);

      return { success: true, data };
    } catch (error) {
      console.error("=== ProfileAPI: Error fetching profile:", error);
      return { success: false, error: error.message };
    }
  },

  async getUserStats(userId, token) {
    try {
      console.log(`=== ProfileAPI: Fetching stats for user: ${userId}`);

      const url = `${BASE_URL}/users/stats/${userId}/`;
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log(`=== ProfileAPI: Stats data received:`, data);

      return { success: true, data };
    } catch (error) {
      console.error("=== ProfileAPI: Error fetching stats:", error);
      return { success: false, error: error.message };
    }
  },

  async getUserAchievements(userId, token) {
    try {
      console.log(`=== ProfileAPI: Fetching achievements for user: ${userId}`);

      const url = `${BASE_URL}/users/achievements/${userId}/`;
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log(`=== ProfileAPI: Achievements data received:`, data);

      return data; // Return array directly
    } catch (error) {
      console.error("=== ProfileAPI: Error fetching achievements:", error);
      return [];
    }
  },

  async getUserBadges(userId, token) {
    try {
      console.log(`=== ProfileAPI: Fetching badges for user: ${userId}`);

      const url = `${BASE_URL}/users/badges/${userId}/`;
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log(`=== ProfileAPI: Badges data received:`, data);

      return data; // Return array directly
    } catch (error) {
      console.error("=== ProfileAPI: Error fetching badges:", error);
      return [];
    }
  },

  async getUserBestScores(userId, token) {
    try {
      console.log(`=== ProfileAPI: Fetching best scores for user: ${userId}`);

      const url = `${BASE_URL}/users/best-scores/${userId}/`;
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log(`=== ProfileAPI: Best scores data received:`, data);

      return data; // Return array directly
    } catch (error) {
      console.error("=== ProfileAPI: Error fetching best scores:", error);
      return [];
    }
  },

  async getUserCategoryRank(userId, category, token) {
    try {
      console.log(
        `=== ProfileAPI: Fetching category rank for user: ${userId}, category: ${category}`
      );

      const url = `${BASE_URL}/users/category-ranks/${userId}/?category=${category}`;
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log(`=== ProfileAPI: Category rank data received:`, data);

      return { success: true, data };
    } catch (error) {
      console.error("=== ProfileAPI: Error fetching category rank:", error);
      return { success: false, error: error.message };
    }
  },
};

export const AnalyticsAPI = {
  fetchGlobalRank,
  fetchCategoryRank,
  fetchRecentCategoryGames,
  fetchCategoryProgressHistory,
  fetchAllAnalytics,
  fetchGameHistoryDetails,
};

export const GameStatsAPI = {
  fetchGameStats,
  fetchRecentGames,
  fetchLevelStats,
};
