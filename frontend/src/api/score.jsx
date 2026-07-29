import { API_BASE } from "./config.js";

const BASE_URL = `${API_BASE}/leaderboard/`;

// Fetch the current user's progress for a specific game
export async function fetchUserGameProgress(gameName, token) {
  const res = await fetch(
    `${BASE_URL}user-progress/?game=${encodeURIComponent(gameName)}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) {
    throw new Error(`Failed to fetch progress for ${gameName} (${res.status})`);
  }
  return res.json();
}
