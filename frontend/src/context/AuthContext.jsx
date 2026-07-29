import { createContext, useState, useEffect, useContext } from "react";
import { fetchProfile } from "../api/auth";
import {
  setupTokenRefresh,
  isTokenExpired,
  refreshToken,
} from "../utils/tokenUtils";

export const AuthContext = createContext();

// Custom hook to use the AuthContext
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Log out and clear everything
  const logout = () => {
    setToken("");
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("userData");
  };

  // Fetch user profile on mount or when token changes
  useEffect(() => {
    const getUser = async () => {
      if (token) {
        try {
          // Check if token is expired
          if (isTokenExpired(token)) {
            try {
              const newToken = await refreshToken();
              setToken(newToken);
              // Continue with fetching profile using new token
              const userData = await fetchProfile(newToken);
              if (userData && userData.email) {
                setUser(userData);
                localStorage.setItem("userData", JSON.stringify(userData));
              } else {
                logout();
              }
            } catch (error) {
              console.error("Failed to refresh token:", error);
              logout();
            }
          } else {
            const userData = await fetchProfile(token);
            if (userData && userData.email) {
              setUser(userData);
              localStorage.setItem("userData", JSON.stringify(userData));
            } else {
              logout();
            }
          }
        } catch (e) {
          console.error("Error fetching profile:", e);
          logout();
        }
      } else {
        setUser(null);
      }
      setIsLoading(false);
    };

    getUser();
  }, [token]);

  // Setup automatic token refresh on mount
  useEffect(() => {
    if (token && !isTokenExpired(token)) {
      setupTokenRefresh();
    }
  }, [token]);

  const login = async (jwt, refreshTokenValue) => {
    setToken(jwt);
    localStorage.setItem("token", jwt);

    if (refreshTokenValue) {
      localStorage.setItem("refreshToken", refreshTokenValue);
    }

    try {
      const userData = await fetchProfile(jwt);
      setUser(userData);
      localStorage.setItem("userData", JSON.stringify(userData));

      // Setup automatic token refresh
      setupTokenRefresh();
    } catch (error) {
      console.error("Login failed:", error);
      logout();
    }
  };

  // Update user data (for live updates)
  const updateUser = (userData) => {
    // Check for level ups before updating user data
    if (window.levelUpChecker && user && userData) {
      window.levelUpChecker(userData.level);
    }

    setUser(userData);
    localStorage.setItem("userData", JSON.stringify(userData));
  };

  return (
    <AuthContext.Provider
      value={{ token, user, login, logout, isLoading, updateUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}
