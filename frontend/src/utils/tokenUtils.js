// Token refresh utility
const API_BASE_URL = "http://localhost:8000/api";

export const refreshToken = async () => {
  try {
    const refreshToken = localStorage.getItem("refreshToken");

    if (!refreshToken) {
      throw new Error("No refresh token found");
    }

    const response = await fetch(`${API_BASE_URL}/token/refresh/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        refresh: refreshToken,
      }),
    });

    if (!response.ok) {
      throw new Error("Token refresh failed");
    }

    const data = await response.json();

    // Update tokens in localStorage
    localStorage.setItem("token", data.access);
    if (data.refresh) {
      localStorage.setItem("refreshToken", data.refresh);
    }

    return data.access;
  } catch (error) {
    console.error("Error refreshing token:", error);

    // Clear tokens and redirect to login
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("userData");

    // Redirect to login page
    window.location.href = "/login";

    throw error;
  }
};

// Setup automatic token refresh
export const setupTokenRefresh = () => {
  const token = localStorage.getItem("token");

  if (!token) {
    return;
  }

  try {
    // Parse JWT token to get expiration
    const payload = JSON.parse(atob(token.split(".")[1]));
    const exp = payload.exp * 1000; // Convert to milliseconds
    const now = Date.now();

    // Refresh 5 minutes before expiration
    const refreshTime = exp - now - 5 * 60 * 1000;

    if (refreshTime > 0) {
      setTimeout(async () => {
        try {
          await refreshToken();
          // Setup next refresh
          setupTokenRefresh();
        } catch (error) {
          console.error("Auto token refresh failed:", error);
        }
      }, refreshTime);
    } else {
      // Token already expired or expiring soon, refresh immediately
      refreshToken()
        .then(() => {
          setupTokenRefresh();
        })
        .catch((error) => {
          console.error("Immediate token refresh failed:", error);
        });
    }
  } catch (error) {
    console.error("Error parsing token:", error);
  }
};

// Check if token is expired
export const isTokenExpired = (token) => {
  if (!token) return true;

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const exp = payload.exp * 1000;
    return Date.now() >= exp;
  } catch {
    return true;
  }
};

// Make authenticated API calls with automatic token refresh
export const apiCallWithRefresh = async (url, options = {}) => {
  let token = localStorage.getItem("token");

  // Check if token is expired
  if (isTokenExpired(token)) {
    try {
      token = await refreshToken();
    } catch (error) {
      throw error;
    }
  }

  const defaultOptions = {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    ...options,
  };

  const response = await fetch(url, defaultOptions);

  // If we get a 401, try to refresh token once
  if (response.status === 401) {
    try {
      token = await refreshToken();

      // Retry the request with new token
      const retryOptions = {
        ...defaultOptions,
        headers: {
          ...defaultOptions.headers,
          Authorization: `Bearer ${token}`,
        },
      };

      return await fetch(url, retryOptions);
    } catch (error) {
      throw error;
    }
  }

  return response;
};
