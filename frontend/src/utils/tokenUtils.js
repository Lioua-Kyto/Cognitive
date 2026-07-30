import { API_BASE } from "../api/config.js";

// Refresh 5 minutes before the access token expires.
const REFRESH_LEAD_MS = 5 * 60 * 1000;

function clearSession() {
  localStorage.removeItem("token");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("userData");
}

export const decodeToken = (token) => {
  if (!token) return null;
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return null;
  }
};

export const refreshToken = async () => {
  const stored = localStorage.getItem("refreshToken");
  if (!stored) {
    // Deliberately does not clear the session. A caller reaching here with a
    // still-valid access token would otherwise be logged out by a missing
    // refresh token, which is a state the app can recover from on its own.
    throw new Error("No refresh token found");
  }

  const response = await fetch(`${API_BASE}/token/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh: stored }),
  });

  if (!response.ok) {
    // There is no /login route — the app renders the login form whenever
    // AuthContext has no token, so clearing storage and reloading is what
    // actually returns the user to the login screen.
    clearSession();
    window.location.assign("/");
    throw new Error("Token refresh failed");
  }

  const data = await response.json();
  localStorage.setItem("token", data.access);
  if (data.refresh) {
    localStorage.setItem("refreshToken", data.refresh);
  }
  return data.access;
};

/**
 * Schedule automatic refresh. Returns a cancel function.
 *
 * The previous version re-armed itself with a bare setTimeout whose id was never
 * kept, and its caller had no cleanup — so every token change stacked another
 * refresh chain that ran forever.
 */
export const setupTokenRefresh = () => {
  let timerId = null;
  let cancelled = false;

  const schedule = () => {
    if (cancelled) return;

    const payload = decodeToken(localStorage.getItem("token"));
    if (!payload?.exp) return;

    const delay = payload.exp * 1000 - Date.now() - REFRESH_LEAD_MS;
    timerId = setTimeout(
      async () => {
        try {
          await refreshToken();
          schedule();
        } catch (error) {
          console.error("Auto token refresh failed:", error);
        }
      },
      Math.max(delay, 0)
    );
  };

  schedule();

  return () => {
    cancelled = true;
    if (timerId) clearTimeout(timerId);
  };
};

export const isTokenExpired = (token) => {
  const payload = decodeToken(token);
  return !payload?.exp || Date.now() >= payload.exp * 1000;
};

// Make authenticated API calls with automatic token refresh
export const apiCallWithRefresh = async (url, options = {}) => {
  let token = localStorage.getItem("token");

  if (isTokenExpired(token)) {
    token = await refreshToken();
  }

  const buildOptions = (accessToken) => ({
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const response = await fetch(url, buildOptions(token));

  if (response.status === 401) {
    token = await refreshToken();
    return fetch(url, buildOptions(token));
  }

  return response;
};
