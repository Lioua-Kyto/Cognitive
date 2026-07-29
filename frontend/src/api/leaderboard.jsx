import { API_BASE } from "./config.js";

const BASE_URL = `${API_BASE}/leaderboard/`;

// These endpoints require authentication now — they used to be anonymous and
// returned every user's email address to any caller.
async function get(path, token) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  if (!res.ok) {
    throw new Error(`Request failed (${res.status}): ${path}`);
  }
  return res.json();
}

class GlobalLeaderboard {
  static fetch(token) {
    return get("global/", token);
  }
}

class CategoryLeaderboard {
  static fetch(categoryName, token) {
    return get(`category/${encodeURIComponent(categoryName)}/`, token);
  }
}

class GameLeaderboard {
  static fetch(gameName, token) {
    return get(`game/${encodeURIComponent(gameName)}/`, token);
  }
}

class UserGameProgress {
  static fetch(gameName, token) {
    return get(`user-progress/?game=${encodeURIComponent(gameName)}`, token);
  }
}

export {
  GlobalLeaderboard,
  CategoryLeaderboard,
  GameLeaderboard,
  UserGameProgress,
};
