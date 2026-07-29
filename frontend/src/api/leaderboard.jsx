import { API_BASE } from "./config.js";
const BASE_URL = `${API_BASE}/leaderboard/`;

class GlobalLeaderboard {
  static async fetch() {
    const res = await fetch(`${BASE_URL}global/`);
    if (!res.ok) throw new Error("Failed to fetch global leaderboard");
    return res.json();
  }
}

class CategoryLeaderboard {
  static async fetch(categoryName) {
    const res = await fetch(`${BASE_URL}category/${categoryName}/`);
    if (!res.ok) throw new Error("Failed to fetch category leaderboard");
    return res.json();
  }
}

class GameLeaderboard {
  static async fetch(gameName) {
    const res = await fetch(`${BASE_URL}game/${gameName}/`);
    if (!res.ok) throw new Error("Failed to fetch game leaderboard");
    return res.json();
  }
}

class UserGameProgress {
  static async fetch(gameName, token) {
    const res = await fetch(
      `${BASE_URL}user-progress/?game=${encodeURIComponent(gameName)}`,
      {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      }
    );
    if (!res.ok) throw new Error("Failed to fetch user game progress");
    return res.json();
  }
}

export {
  GlobalLeaderboard,
  CategoryLeaderboard,
  GameLeaderboard,
  UserGameProgress,
};
