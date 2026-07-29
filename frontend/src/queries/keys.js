/**
 * Query key factory. Keys are declared in one place so invalidation after a game
 * submission can target exactly the data that went stale.
 */
export const queryKeys = {
  categories: () => ["categories"],
  availableGames: () => ["games", "available"],
  gameProgress: (gameName) => ["games", "progress", gameName],

  leaderboard: {
    global: () => ["leaderboard", "global"],
    category: (category) => ["leaderboard", "category", category],
    game: (gameName) => ["leaderboard", "game", gameName],
  },

  user: {
    stats: (userId) => ["user", userId, "stats"],
    recentGames: (userId) => ["user", userId, "recentGames"],
    achievements: (userId) => ["user", userId, "achievements"],
    badges: (userId) => ["user", userId, "badges"],
    categoryRanks: (userId) => ["user", userId, "categoryRanks"],
    profile: (identifier) => ["user", "profile", identifier],
  },

  achievementStats: (id) => ["achievementStats", id],
  badgeStats: (id) => ["badgeStats", id],
};

/** Everything a completed game invalidates. */
export const staleAfterGameSubmission = (userId) => [
  queryKeys.user.stats(userId),
  queryKeys.user.recentGames(userId),
  queryKeys.user.achievements(userId),
  queryKeys.user.badges(userId),
  queryKeys.user.categoryRanks(userId),
  ["leaderboard"],
  ["games", "progress"],
];
