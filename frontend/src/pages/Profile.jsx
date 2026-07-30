import { API_ORIGIN } from "../api/config.js";
import React, {
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Line, Bar } from "react-chartjs-2";
import { useAchievementTracker } from "../hooks/useAchievementTracker.jsx";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import {
  fetchProfile,
  fetchCountries,
  updateProfile,
  fetchAllAnalytics,
  fetchGameHistoryDetails,
} from "../api/profile.jsx";
import { AchievementsAPI } from "../api/achievements.jsx";
import AchievementTooltip from "../components/AchievementTooltip.jsx";
import Dashboard from "./Dashboard";
import { fetchCategories } from "../api/categories";
import {
  enhanceCategories,
  gamesByCategory,
} from "../components/Categories/CategoryData";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Utility function to ensure absolute URLs for images
const ensureAbsoluteUrl = (url) => {
  if (!url) return "";
  if (url.startsWith("http")) return url;

  // Use your backend base URL
  const BASE_URL = API_ORIGIN;
  return `${BASE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
};

// Define fixed color values per category key
const categoryColors = {
  memory: "#5b9bd5",
  attention: "#ed7d31",
  speed: "#70ad47",
  logic: "#7030a0",
  language: "#ffc000",
  multi: "#4472c4",
  competitive: "#ff6666",
};

export default function Profile() {
  const [categories, setCategories] = useState([]);

  const { token, user, logout, updateUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    country: "",
    bio: "",
    profile_picture: null,
  });
  const [previewUrl, setPreviewUrl] = useState("");
  const [activeTab, setActiveTab] = useState("dashboard");
  const [analytics, setAnalytics] = useState({
    global_rank: null,
    global_total: 0,
    categories: {},
  });
  const [loading, setLoading] = useState(true);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [countryOptions, setCountryOptions] = useState([]);
  const [activeCategory, setActiveCategory] = useState("memory");
  const [gameDetails, setGameDetails] = useState({});
  const [selectedGameKey, setSelectedGameKey] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [badges, setBadges] = useState([]);
  const [achievementsLoading, setAchievementsLoading] = useState(false);

  // Achievement tracking
  const achievementTracker = useAchievementTracker(token, user);

  // Add periodic user data refresh for live updates
  useEffect(() => {
    if (!token) return;

    const refreshUserData = async () => {
      try {
        const userData = await fetchProfile(token);
        updateUser(userData);
      } catch (error) {
        console.error("Failed to refresh user data:", error);
        // If it's an authentication error, logout the user
        if (
          error.message?.includes("401") ||
          error.message?.includes("Unauthorized") ||
          error.message?.includes("Failed to fetch profile")
        ) {
          console.log("Token expired, logging out user");
          logout();
          navigate("/");
          return;
        }
      }
    };

    // Refresh user data every 5 minutes instead of 30 seconds to reduce server load
    const interval = setInterval(refreshUserData, 300000); // 5 minutes

    // Also refresh when component mounts if user data is stale
    if (user && (!user.level || !user.experience)) {
      refreshUserData();
    }

    return () => clearInterval(interval);
  }, [token, updateUser]);

  // Initialize form data when user data is available
  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || "",
        email: user.email || "",
        country: user.country || "",
        bio: user.bio || "",
        profile_picture: null,
      });
      setPreviewUrl(user.profile_picture || "");
    }
  }, [user]);

  const loadInitialData = useCallback(async () => {
    try {
      // Load categories and countries in parallel
      const [fetchedCategories, countryData] = await Promise.all([
        fetchCategories(token),
        fetchCountries(token),
      ]);

      const enhancedCategories = enhanceCategories(fetchedCategories);
      setCategories(enhancedCategories);

      setCountryOptions(
        countryData.map((country) => ({
          value: country.code,
          label: country.name,
        }))
      );

      // Load analytics after categories are set
      if (enhancedCategories.length > 0) {
        const data = await fetchAllAnalytics(token, enhancedCategories);
        console.log("Analytics data received:", data);
        setAnalytics(data);
      }
    } catch (error) {
      console.error("Failed to load initial data:", error);
      setAnalytics({
        global_rank: "N/A",
        global_total: 0,
        categories: {},
      });
    } finally {
      setLoading(false);
      setInitialLoadComplete(true);
    }
  }, [token]);

  // Fetch categories, countries, and analytics when component mounts
  useEffect(() => {
    if (token && !initialLoadComplete) {
      setLoading(true);
      loadInitialData();
    }
  }, [token, loadInitialData, initialLoadComplete]);

  // Debug log when analytics data changes
  useEffect(() => {
    console.log("Analytics data changed:", {
      hasData: !!analytics.categories,
      categoriesCount: Object.keys(analytics.categories || {}).length,
      loading,
    });

    if (analytics && analytics.categories) {
      Object.entries(analytics.categories).forEach(([key, categoryData]) => {
        console.log(`Analytics for ${key}:`, categoryData);
        console.log(`History structure:`, categoryData?.history);
        if (categoryData?.history?.length) {
          console.log(
            `History data available for ${key}: ${categoryData.history.length} entries`
          );
        } else {
          console.log(`No history data for ${key}`);
        }
      });
    }
  }, [analytics, loading]);

  // Load game details when tab changes to "progress"
  useEffect(() => {
    if (activeTab === "progress" && token && activeCategory) {
      loadGameDetails(activeCategory);
    }
  }, [activeTab, activeCategory, token]);

  // Load achievements when tab changes to "achievements"
  useEffect(() => {
    if (activeTab === "achievements" && token && achievements.length === 0) {
      loadAchievementsAndBadges();
    }
  }, [activeTab, token, achievements.length]);

  const loadGameDetails = async (categoryKey) => {
    setLoading(true);
    try {
      const data = await fetchGameHistoryDetails(token, categoryKey);
      setGameDetails((prev) => ({ ...prev, [categoryKey]: data }));
    } catch (error) {
      console.error(`Failed to fetch game details for ${categoryKey}:`, error);
    } finally {
      setLoading(false);
    }
  };

  const loadAchievementsAndBadges = async () => {
    setAchievementsLoading(true);
    try {
      // Direct API fetch for tab loading - no notifications
      const achievementsAPI = new AchievementsAPI();
      const data = await achievementsAPI.fetchAchievementsAndBadges(token);
      if (data) {
        setAchievements(data.achievements);
        setBadges(data.badges);
      }
    } catch (error) {
      console.error("Failed to fetch achievements and badges:", error);
    } finally {
      setAchievementsLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, profile_picture: file });
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const data = new FormData();
    data.append("username", formData.username);
    data.append("email", formData.email);
    data.append("country", formData.country);
    data.append("bio", formData.bio);

    if (formData.profile_picture && formData.profile_picture instanceof File) {
      data.append("profile_picture", formData.profile_picture);
    }

    try {
      const updatedUser = await updateProfile(token, data);

      // Refresh user data to ensure UI is up to date
      try {
        const userData = await fetchProfile(token);
        updateUser(userData);

        // Close editing mode after successful update and refresh
        setIsEditing(false);

        // Show success message after UI is updated
        setTimeout(() => {
          alert("Profile updated successfully!");
        }, 100);
      } catch (e) {
        console.error("Failed to refresh user data after update:", e);
        // Still close editing mode even if refresh failed
        setIsEditing(false);
        alert(
          "Profile updated, but failed to refresh display. Please refresh the page."
        );
      }
    } catch (error) {
      console.error("Profile update error:", error);
      alert(
        "Failed to update profile. Please try again. " + (error.message || "")
      );

      // Try to refresh user data anyway as the update might have succeeded partially
      try {
        const userData = await fetchProfile(token);
        updateUser(userData);
      } catch (e) {
        console.error("Failed to refresh user data after update error:", e);
      }
    }
  };

  // Generate line chart data for a category
  const getChartData = (categoryKey) => {
    const categoryData = analytics.categories[categoryKey];
    const categoryInfo = categories.find((cat) => cat.key === categoryKey);

    // Define fixed color values per category key
    const categoryColors = {
      memory: { main: "#5b9bd5", light: "rgba(91, 155, 213, 0.2)" },
      attention: { main: "#ed7d31", light: "rgba(237, 125, 49, 0.2)" },
      speed: { main: "#70ad47", light: "rgba(112, 173, 71, 0.2)" },
      logic: { main: "#7030a0", light: "rgba(112, 48, 160, 0.2)" },
      language: { main: "#ffc000", light: "rgba(255, 192, 0, 0.2)" },
      multi: { main: "#4472c4", light: "rgba(68, 114, 196, 0.2)" },
      competitive: { main: "#ff6666", light: "rgba(255, 102, 102, 0.2)" },
    };

    // Get colors from the fixed map or use the categoryInfo if available
    const mainColor =
      categoryInfo?.color || categoryColors[categoryKey]?.main || "#5b9bd5";
    const lightColor =
      categoryInfo?.lightColor ||
      categoryColors[categoryKey]?.light ||
      "rgba(91, 155, 213, 0.2)";

    // Extract actual color values if they are CSS variables
    const extractColor = (color) => {
      if (color.startsWith("var(--")) {
        return categoryColors[categoryKey]?.main || "#5b9bd5";
      }
      return color;
    };

    if (
      !categoryData ||
      !categoryData.history ||
      categoryData.history.length === 0
    ) {
      return {
        labels: [],
        datasets: [
          {
            label: "Score",
            data: [],
            borderColor: extractColor(mainColor),
            backgroundColor: extractColor(lightColor),
            tension: 0.3,
            fill: true,
          },
        ],
      };
    }

    return {
      labels: categoryData.history.map((item) =>
        new Date(item.date).toLocaleDateString()
      ),
      datasets: [
        {
          label: "Score",
          data: categoryData.history.map((item) => item.score),
          borderColor: extractColor(mainColor),
          backgroundColor: extractColor(lightColor),
          tension: 0.3,
          fill: true,
        },
      ],
    };
  };

  // Generate bar chart data for games in a category
  const getGameBarChartData = (categoryKey) => {
    const categoryData = analytics.categories[categoryKey];
    const categoryInfo = categories.find((cat) => cat.key === categoryKey);
    const gamesInCategory = gamesByCategory?.[categoryKey] || [];

    console.log(`Generating bar chart for ${categoryKey}:`, {
      categoryData,
      gamesInCategory,
      hasHistory: categoryData?.history?.length > 0,
      detailedHistory: categoryData?.detailed_history,
    });

    // Define fixed color values per category key
    const categoryColors = {
      memory: "#5b9bd5",
      attention: "#ed7d31",
      speed: "#70ad47",
      logic: "#7030a0",
      language: "#ffc000",
      multi: "#4472c4",
      competitive: "#ff6666",
    };

    const getColor = (category) => {
      if (categoryInfo?.color) {
        if (categoryInfo.color.startsWith("var(--")) {
          return categoryColors[category] || "#ff5a5f";
        }
        return categoryInfo.color;
      }
      return categoryColors[category] || "#ff5a5f";
    };

    const barColor = getColor(categoryKey);

    // Initialize game scores with all games from category
    const gameScores = {};

    // First, add all games from gamesByCategory with zero scores
    gamesInCategory.forEach((game) => {
      gameScores[game.label] = 0;
    });

    // Use detailed history if available (more accurate)
    if (categoryData?.detailed_history?.games?.length > 0) {
      categoryData.detailed_history.games.forEach((game) => {
        const gameName = game.name;

        // Find matching game in gamesByCategory
        const matchingGame = gamesInCategory.find(
          (g) =>
            g.label === gameName ||
            g.label.toLowerCase() === gameName.toLowerCase() ||
            g.key === game.key
        );

        if (matchingGame && game.history?.length > 0) {
          // Get the highest score from all plays of this game
          const bestScore = Math.max(
            ...game.history.map((play) => play.score || 0)
          );
          gameScores[matchingGame.label] = bestScore;
        }
      });
    }
    // Fallback to regular history if detailed history is not available
    else if (categoryData?.history?.length > 0) {
      categoryData.history.forEach((item) => {
        const gameName = item.game_name || item.name;
        if (!gameName) return;

        // Find matching game in gamesByCategory
        const matchingGame = gamesInCategory.find(
          (game) =>
            game.label === gameName ||
            game.label.toLowerCase() === gameName.toLowerCase() ||
            game.key === gameName
        );

        if (matchingGame) {
          // Try different score properties and use the highest
          const score = Math.max(
            item.score || 0,
            item.best_score || 0,
            item.total_score || 0
          );

          // Update with the highest score found for this game
          if (score > (gameScores[matchingGame.label] || 0)) {
            gameScores[matchingGame.label] = score;
          }
        }
      });
    }

    const labels = Object.keys(gameScores);
    const data = Object.values(gameScores);

    console.log(`Bar chart data for ${categoryKey}:`, {
      labels,
      data,
      gameScores,
    });

    return {
      labels: labels,
      datasets: [
        {
          label: "Best Score",
          data: data,
          backgroundColor: barColor,
          borderColor: "rgba(255, 255, 255, 0.8)",
          borderWidth: 1,
          borderRadius: 8,
          maxBarThickness: 60,
        },
      ],
    };
  };

  // Memoized bar chart data to prevent unnecessary recalculations
  const memoizedBarChartData = useMemo(() => {
    if (
      !analytics.categories ||
      Object.keys(analytics.categories).length === 0
    ) {
      return {};
    }

    const chartData = {};
    categories.forEach((category) => {
      chartData[category.key] = getGameBarChartData(category.key);
    });

    return chartData;
  }, [analytics.categories, categories]);

  // Generate detailed game history data for progress tab
  const getGameDetailedHistory = (gameKey) => {
    try {
      const categoryInfo = categories.find((cat) => cat.key === activeCategory);

      // Define fixed color values per category key
      const categoryColors = {
        memory: "#5b9bd5",
        attention: "#ed7d31",
        speed: "#70ad47",
        logic: "#7030a0",
        language: "#ffc000",
        multi: "#4472c4",
        competitive: "#ff6666",
      };

      // Get color based on category
      const getColor = (category) => {
        if (categoryInfo?.color) {
          if (categoryInfo.color.startsWith("var(--")) {
            return categoryColors[category] || "#ff5a5f";
          }
          return categoryInfo.color;
        }
        return categoryColors[category] || "#ff5a5f";
      };

      const chartColor = getColor(activeCategory);

      if (
        !gameDetails ||
        !gameDetails[activeCategory] ||
        !gameDetails[activeCategory].games ||
        !gameKey
      ) {
        return {
          labels: [],
          datasets: [
            {
              label: "Score History",
              data: [],
              borderColor: chartColor,
              backgroundColor: chartColor,
              tension: 0.3,
              fill: false,
            },
          ],
        };
      }

      const game = gameDetails[activeCategory].games.find(
        (g) => g.key === gameKey
      );

      if (!game || !game.history || game.history.length === 0) {
        return {
          labels: [],
          datasets: [
            {
              label: "Score History",
              data: [],
              borderColor: chartColor,
              backgroundColor: chartColor,
              tension: 0.3,
              fill: false,
            },
          ],
        };
      }

      // Sort history by date
      const sortedHistory = [...game.history].sort(
        (a, b) => new Date(a.date) - new Date(b.date)
      );

      return {
        labels: sortedHistory.map((item) =>
          new Date(item.date).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })
        ),
        datasets: [
          {
            label: "Score History",
            data: sortedHistory.map((item) => item.score),
            borderColor: chartColor,
            backgroundColor: chartColor,
            tension: 0.3,
            fill: false,
          },
        ],
      };
    } catch (error) {
      console.error("Error in getGameDetailedHistory:", error);
      const categoryInfo = categories.find((cat) => cat.key === activeCategory);
      const chartColor = categoryInfo?.color
        ? categoryInfo.color.startsWith("var(--")
          ? "#ff5a5f"
          : categoryInfo.color
        : "#ff5a5f";

      return {
        labels: [],
        datasets: [
          {
            label: "Score History",
            data: [],
            borderColor: chartColor,
            backgroundColor: chartColor,
            tension: 0.3,
            fill: false,
          },
        ],
      };
    }
  };

  // Chart options - make it a function to get dynamic colors
  const getChartOptions = (categoryKey) => {
    const categoryInfo = categories.find((cat) => cat.key === categoryKey);

    // Define fixed color values per category key
    const categoryColors = {
      memory: "#5b9bd5",
      attention: "#ed7d31",
      speed: "#70ad47",
      logic: "#7030a0",
      language: "#ffc000",
      multi: "#4472c4",
      competitive: "#ff6666",
    };

    // Get color based on category
    const getColor = (category) => {
      if (categoryInfo?.color) {
        if (categoryInfo.color.startsWith("var(--")) {
          return categoryColors[category] || "#ff5a5f";
        }
        return categoryInfo.color;
      }
      return categoryColors[category] || "#ff5a5f";
    };

    const chartColor = getColor(categoryKey);

    return {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: "rgba(0, 0, 0, 0.05)",
          },
          ticks: {
            color: "var(--color-text)",
            font: {
              size: 12,
              weight: "500",
            },
          },
        },
        x: {
          grid: {
            display: false,
          },
          ticks: {
            color: "var(--color-text-light)",
            font: {
              size: 11,
            },
            maxRotation: 45,
            minRotation: 45,
          },
        },
      },
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          backgroundColor: "white",
          titleColor: "#333",
          bodyColor: "#333",
          borderColor: chartColor,
          borderWidth: 1,
          padding: 12,
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
          titleFont: {
            size: 14,
            weight: "bold",
          },
          bodyFont: {
            size: 13,
          },
          callbacks: {
            title: function (tooltipItems) {
              return new Date(tooltipItems[0].label).toLocaleDateString(
                undefined,
                {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                }
              );
            },
          },
        },
      },
    };
  };

  // Original chart options for backward compatibility
  const chartOptions = getChartOptions(activeCategory);

  // Bar chart options
  const getBarChartOptions = (categoryKey) => {
    const baseOptions = getChartOptions(categoryKey);
    return {
      ...baseOptions,
      indexAxis: "y",
      scales: {
        ...baseOptions.scales,
        x: {
          ...baseOptions.scales.x,
          ticks: {
            ...baseOptions.scales.x.ticks,
            maxRotation: 0,
            minRotation: 0,
          },
        },
      },
    };
  };

  if (!token) {
    return (
      <div className="profile-container not-logged">
        <div className="profile-card">
          <h2 className="profile-title">Profile</h2>
          <div className="mb-3">
            <span className="badge bg-danger fs-5">Not logged in</span>
          </div>
          <p className="profile-message">
            Please{" "}
            <a href="#" onClick={() => navigate("/")}>
              log in
            </a>{" "}
            to access your profile and progress.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        {/* Left section: Profile picture and name */}
        <div className="profile-header-primary">
          <div className="profile-picture-container">
            {previewUrl ? (
              <img
                src={ensureAbsoluteUrl(previewUrl)}
                alt="Profile"
                className="profile-picture"
              />
            ) : (
              <div className="profile-picture-placeholder">
                {user?.username?.[0] || user?.email?.[0] || "?"}
              </div>
            )}

            {/* Level display under profile picture */}
            <div className="profile-level-display">
              <div className="level-number">
                Level {loading ? "..." : user?.level || 1}
              </div>

              {/* XP Progress Bar */}
              <div
                className="xp-progress-bar"
                title={`${user?.experience || 0} / ${
                  user?.xp_for_next_level || 100
                } XP`}
              >
                <div
                  className="xp-progress-fill"
                  style={{
                    width: `${Math.min(
                      100,
                      user?.current_level_xp &&
                        user?.xp_for_next_level &&
                        user?.xp_for_current_level_base
                        ? (user.current_level_xp /
                            (user.xp_for_next_level -
                              user.xp_for_current_level_base)) *
                            100
                        : user?.xp_progress_in_current_level || 0
                    )}%`,
                  }}
                ></div>
              </div>
            </div>
          </div>

          <div className="profile-header-details">
            <h2 className="profile-name">
              {user?.username || user?.email?.split("@")[0] || "User"}
            </h2>

            {user?.country && (
              <div className="profile-country">
                {user.country_flag && (
                  <img
                    src={ensureAbsoluteUrl(user.country_flag)}
                    alt=""
                    className="country-flag"
                  />
                )}
                {user.country_name || user.country}
              </div>
            )}

            <div className="profile-bio">
              <p>{user?.bio || "No bio added yet."}</p>
            </div>
          </div>
        </div>

        {/* Right section: Stats in a row */}
        <div className="profile-stats-row">
          {/* Rank card with dynamic class based on rank */}
          <div
            className={`profile-stat-card rank-card ${
              !loading && analytics.global_rank === 1
                ? "rank-1"
                : !loading && analytics.global_rank === 2
                ? "rank-2"
                : !loading && analytics.global_rank === 3
                ? "rank-3"
                : !loading && analytics.global_rank <= 10
                ? "rank-10"
                : !loading && analytics.global_rank <= 100
                ? "rank-100"
                : ""
            }`}
          >
            <div className="stat-icon">🏆</div>
            <div className="stat-content">
              <div className="stat-label">Global Rank</div>
              <div className="stat-value">
                {loading ? "..." : analytics.global_rank}
              </div>
            </div>
          </div>

          <div className="profile-stat-card games-card">
            <div className="stat-icon">🎮</div>
            <div className="stat-content">
              <div className="stat-label">Games Played</div>
              <div className="stat-value">
                {loading
                  ? "..."
                  : Object.values(analytics.categories).reduce((total, cat) => {
                      let categoryPlays = 0;
                      if (cat.games_played) {
                        categoryPlays = cat.games_played;
                      }
                      return total + categoryPlays;
                    }, 0)}
              </div>
            </div>
          </div>

          <div className="profile-stat-card category-card">
            <div className="stat-icon">🥇</div>
            <div className="stat-content">
              <div className="stat-label">Best Category</div>
              <div className="stat-value">
                {loading
                  ? "..."
                  : Object.entries(analytics.categories)
                      .filter(([_, data]) => data.rank !== "N/A")
                      .sort(
                        ([_, a], [__, b]) =>
                          (a.rank || Infinity) - (b.rank || Infinity)
                      )
                      .map(
                        ([key, _]) =>
                          categories.find((c) => c.key === key)?.label || key
                      )[0] || "N/A"}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="profile-tabs">
        <button
          className={`profile-tab ${activeTab === "dashboard" ? "active" : ""}`}
          onClick={() => setActiveTab("dashboard")}
        >
          <span className="tab-icon">🎮</span> Dashboard
        </button>
        <button
          className={`profile-tab ${activeTab === "profile" ? "active" : ""}`}
          onClick={() => setActiveTab("profile")}
        >
          <span className="tab-icon">👤</span> Profile
        </button>
        <button
          className={`profile-tab ${activeTab === "analytics" ? "active" : ""}`}
          onClick={() => setActiveTab("analytics")}
        >
          <span className="tab-icon">📊</span> Analytics
        </button>
        <button
          className={`profile-tab ${activeTab === "progress" ? "active" : ""}`}
          onClick={() => setActiveTab("progress")}
        >
          <span className="tab-icon">📈</span> Detailed Progress
        </button>
        <button
          className={`profile-tab ${
            activeTab === "achievements" ? "active" : ""
          }`}
          onClick={() => setActiveTab("achievements")}
        >
          <span className="tab-icon">🏆</span> Achievements
        </button>
      </div>

      {activeTab === "dashboard" && <Dashboard user={user} />}

      {activeTab === "profile" && (
        <div className="profile-section">
          <div className="profile-section-header">
            <h3 className="profile-section-title">Personal Information</h3>
            <button
              className="btn-edit"
              onClick={() => setIsEditing(!isEditing)}
            >
              {isEditing ? "Cancel" : "Edit Profile"}
            </button>
          </div>

          {isEditing ? (
            <form onSubmit={handleSubmit} className="profile-edit-form">
              <div className="form-group">
                <label htmlFor="profile_picture">Profile Picture</label>
                <div className="profile-picture-edit">
                  {previewUrl && (
                    <img
                      src={ensureAbsoluteUrl(previewUrl)}
                      alt="Preview"
                      className="profile-picture-preview"
                    />
                  )}
                  <input
                    type="file"
                    id="profile_picture"
                    name="profile_picture"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="form-control"
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="username">Username</label>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    className="form-control"
                    placeholder="Enter your display name (spaces and symbols allowed)"
                  />
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="form-control"
                />
              </div>
              <div className="form-group">
                <label htmlFor="country">Country</label>
                <select
                  id="country"
                  name="country"
                  value={formData.country}
                  onChange={handleInputChange}
                  className="form-control"
                >
                  <option value="">Select a country</option>
                  {countryOptions.map((country) => (
                    <option key={country.value} value={country.value}>
                      {country.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="bio">Bio</label>
                <textarea
                  id="bio"
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  className="form-control"
                  placeholder="Tell us a little about yourself"
                  rows="3"
                  maxLength="150"
                ></textarea>
              </div>
              <div className="form-actions">
                <button type="submit" className="btn-save">
                  Save Changes
                </button>
              </div>
            </form>
          ) : (
            <div className="profile-info">
              <div className="profile-info-item">
                <span className="profile-info-label">Username:</span>
                <span className="profile-info-value">
                  {user?.username || "Not set"}
                </span>
              </div>
              <div className="profile-info-item">
                <span className="profile-info-label">Email:</span>
                <span className="profile-info-value">{user?.email}</span>
              </div>
              <div className="profile-info-item">
                <span className="profile-info-label">Country:</span>
                <span className="profile-info-value">
                  {user?.country_flag && (
                    <img
                      src={ensureAbsoluteUrl(user.country_flag)}
                      alt=""
                      className="country-flag"
                    />
                  )}
                  {user?.country_name || user?.country || "Not set"}
                </span>
              </div>
              <div className="profile-info-item">
                <span className="profile-info-label">Bio:</span>
                <span className="profile-info-value">
                  {user?.bio || "No bio added yet."}
                </span>
              </div>
              <div className="profile-info-item">
                <span className="profile-info-label">Member Since:</span>
                <span className="profile-info-value">
                  {user?.date_joined
                    ? new Date(user.date_joined).toLocaleDateString()
                    : "Unknown"}
                </span>
              </div>
            </div>
          )}

          <div className="profile-actions">
            <button className="btn-logout" onClick={handleLogout}>
              Log Out
            </button>
          </div>
        </div>
      )}

      {activeTab === "analytics" && (
        <div className="analytics-section">
          <h3 className="analytics-title">Performance Analytics</h3>

          {loading ? (
            <div className="loading-spinner">
              <p>Loading your analytics...</p>
            </div>
          ) : (
            <>
              <div className="category-navigation">
                {categories.map((category) => (
                  <button
                    key={category.key}
                    className={`category-nav-button ${
                      activeCategory === category.key ? "active" : ""
                    }`}
                    onClick={() => setActiveCategory(category.key)}
                    style={{
                      "--category-color": category.color,
                    }}
                  >
                    <span className="category-icon">
                      <img src={category.icon} alt={category.label} />
                    </span>
                    {category.label}
                    <span className="category-rank-badge">
                      {(() => {
                        const categoryData = analytics.categories[category.key];
                        const hasPlayedGames = categoryData?.games_played > 0;

                        if (!hasPlayedGames) {
                          return "🔒";
                        }

                        return categoryData?.rank || "N/A";
                      })()}
                    </span>
                  </button>
                ))}
              </div>

              <div className="category-dashboard">
                {categories.map((category) => (
                  <div
                    key={category.key}
                    className={`category-dashboard-item ${
                      activeCategory === category.key ? "active" : ""
                    }`}
                  >
                    <div
                      className="category-header-section"
                      style={{ "--category-color": category.color }}
                    >
                      <div className="category-header-main">
                        <div className="category-header-icon">
                          <img src={category.icon} alt={category.label} />
                        </div>
                        <div className="category-header-title">
                          <h3>{category.label}</h3>
                          <div className="category-rank-info">
                            {(() => {
                              const categoryData =
                                analytics.categories[category.key];
                              const hasPlayedGames =
                                categoryData?.games_played > 0;

                              if (!hasPlayedGames) {
                                return "🔒 Not played yet";
                              }

                              return `Rank: ${categoryData?.rank || "N/A"}`;
                            })()}
                          </div>
                        </div>
                      </div>

                      <div className="category-stats-summary">
                        <div className="category-stat-item">
                          <div className="stat-title">Games Played</div>
                          <div className="stat-value">
                            {analytics.categories[category.key]?.games_played ||
                              0}
                          </div>
                        </div>

                        <div className="category-stat-item">
                          <div className="stat-title">Best Score</div>
                          <div className="stat-value">
                            {(() => {
                              const categoryData =
                                analytics.categories[category.key];

                              if (!categoryData) {
                                return 0;
                              }

                              let maxScore = 0;

                              // Use detailed history if available (more accurate)
                              if (
                                categoryData.detailed_history?.games?.length > 0
                              ) {
                                categoryData.detailed_history.games.forEach(
                                  (game) => {
                                    if (game.history?.length > 0) {
                                      const gameMaxScore = Math.max(
                                        ...game.history.map(
                                          (play) => play.score || 0
                                        )
                                      );
                                      if (gameMaxScore > maxScore) {
                                        maxScore = gameMaxScore;
                                      }
                                    }
                                  }
                                );
                              }
                              // Fallback to regular history
                              else if (categoryData.history?.length > 0) {
                                categoryData.history.forEach((item) => {
                                  if (item.score && item.score > maxScore) {
                                    maxScore = item.score;
                                  }
                                  if (
                                    item.best_score &&
                                    item.best_score > maxScore
                                  ) {
                                    maxScore = item.best_score;
                                  }
                                });
                              }

                              return maxScore;
                            })()}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div
                      className="category-content-section"
                      style={{
                        display: "flex",
                        gap: "20px",
                        alignItems: "stretch",
                      }}
                    >
                      <div
                        className="category-bar-chart-section"
                        style={{ flex: "3" }}
                      >
                        <h4 className="profile-section-title">
                          Games Performance
                        </h4>
                        <div className="chart-container">
                          {" "}
                          <Bar
                            data={
                              memoizedBarChartData[category.key] || {
                                labels: [],
                                datasets: [],
                              }
                            }
                            options={{
                              responsive: true,
                              maintainAspectRatio: false,
                              animation: {
                                duration: 200,
                              },
                              interaction: {
                                intersect: false,
                                mode: "index",
                              },
                              plugins: {
                                title: {
                                  display: true,

                                  color:
                                    categoryColors[category.key] || "#ff5a5f",
                                  font: {
                                    size: 16,
                                    weight: "bold",
                                  },
                                },
                                legend: {
                                  display: false,
                                },
                                tooltip: {
                                  backgroundColor: "white",
                                  titleColor: "#333",
                                  bodyColor: "#333",
                                  borderColor:
                                    categoryColors[category.key] || "#ff5a5f",
                                  borderWidth: 1,
                                  padding: 12,
                                  titleFont: {
                                    size: 14,
                                    weight: "bold",
                                  },
                                  bodyFont: {
                                    size: 13,
                                  },
                                },
                              },
                              scales: {
                                x: {
                                  grid: {
                                    color: "rgba(0, 0, 0, 0.05)",
                                  },
                                  ticks: {
                                    color: "#333",
                                    font: {
                                      size: 12,
                                    },
                                  },
                                },
                                y: {
                                  beginAtZero: true,
                                  grid: {
                                    display: false,
                                  },
                                  ticks: {
                                    color:
                                      categoryColors[category.key] || "#ff5a5f",
                                    font: {
                                      size: 13,
                                      weight: "500",
                                    },
                                  },
                                },
                              },
                            }}
                          />
                        </div>
                      </div>

                      <div
                        className="category-recent-games-section"
                        style={{ flex: "1", maxWidth: "280px" }}
                      >
                        <h4 className="profile-section-title">
                          Recent Activity
                        </h4>
                        <div className="recent-games-container">
                          {analytics.categories[category.key]?.recent_games?.length > 0 ? (
                            analytics.categories[category.key].recent_games.slice(0, 3).map((game, index) => (
                              <div key={index} className="recent-game-item">
                                <div className="recent-game-info">
                                  <div className="recent-game-name">
                                    {game.game_name}
                                  </div>
                                </div>
                                <div className="recent-game-stats">
                                  <div className="recent-game-score">
                                    Score: {game.score}
                                  </div>
                                  <div className="recent-game-level">
                                    Level: {game.level}
                                  </div>
                                </div>
                                <div className="recent-game-date">
                                  {new Date(game.date).toLocaleDateString(undefined, {
                                    month: "short",
                                    day: "numeric",
                                  })}
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="no-recent-activity">
                              No recent games in this category
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {activeTab === "progress" && (
        <div className="analytics-section progress-section">
          <h3 className="analytics-title">Detailed Progress Tracking</h3>

          {loading ? (
            <div className="loading-spinner">
              <p>Loading your progress data...</p>
            </div>
          ) : (
            <>
              <div className="category-navigation">
                {categories.map((category) => (
                  <button
                    key={category.key}
                    className={`category-nav-button ${
                      activeCategory === category.key ? "active" : ""
                    }`}
                    onClick={() => {
                      setActiveCategory(category.key);
                      setSelectedGameKey(null);
                    }}
                    style={{
                      "--category-color": category.color,
                    }}
                  >
                    <span className="category-icon">
                      <img src={category.icon} alt={category.label} />
                    </span>
                    {category.label}
                  </button>
                ))}
              </div>

              <div className="progress-content">
                <div className="games-selection-panel">
                  <h4 className="profile-section-title">Select Game</h4>
                  <div className="games-list">
                    {gameDetails[activeCategory] &&
                    gameDetails[activeCategory].games ? (
                      gameDetails[activeCategory].games.map((game) => (
                        <div
                          key={game.key}
                          className={`game-item ${
                            selectedGameKey === game.key ? "active" : ""
                          }`}
                          onClick={() => setSelectedGameKey(game.key)}
                          style={{
                            borderColor:
                              selectedGameKey === game.key
                                ? categories.find(
                                    (cat) => cat.key === activeCategory
                                  )?.color || "var(--color-primary)"
                                : "transparent",
                          }}
                        >
                          <div className="game-item-name">{game.name}</div>
                          <div className="game-item-plays">
                            {game.history?.length || 0} plays
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="no-games-message">
                        No games data available for this category
                      </div>
                    )}
                  </div>
                </div>

                <div className="game-progress-details">
                  {selectedGameKey ? (
                    (() => {
                      // Check if the selected game has any history data
                      const selectedGame = gameDetails[
                        activeCategory
                      ]?.games?.find((g) => g.key === selectedGameKey);
                      const hasHistory =
                        selectedGame?.history &&
                        selectedGame.history.length > 0;

                      if (!hasHistory) {
                        // Show creative no-data message with play button
                        return (
                          <div className="no-game-data-container">
                            <div className="no-game-data-icon">🎮</div>
                            <h4 className="no-game-data-title">
                              Ready for Your First Adventure?
                            </h4>
                            <p className="no-game-data-message">
                              You haven't explored{" "}
                              <strong>
                                {selectedGame?.name || "this game"}
                              </strong>{" "}
                              yet! Every expert was once a beginner. Start your
                              journey and watch your skills grow with each play.
                            </p>
                            <div className="no-game-data-stats">
                              <div className="stat-preview">
                                <span className="stat-icon">🎯</span>
                                <span>Track your accuracy</span>
                              </div>
                              <div className="stat-preview">
                                <span className="stat-icon">⚡</span>
                                <span>Monitor your speed</span>
                              </div>
                              <div className="stat-preview">
                                <span className="stat-icon">📈</span>
                                <span>Watch your progress</span>
                              </div>
                            </div>
                            <button
                              className="play-game-btn"
                              onClick={() => {
                                // Navigate to the specific game
                                window.location.href = `/games/${activeCategory}`;
                              }}
                              style={{
                                backgroundColor:
                                  categories.find(
                                    (cat) => cat.key === activeCategory
                                  )?.color || "var(--color-primary)",
                              }}
                            >
                              Start Playing {selectedGame?.name || "Game"}
                            </button>
                          </div>
                        );
                      }

                      // Normal game progress display
                      return (
                        <>
                          <div className="game-progress-header">
                            <h4 className="progress-game-title">
                              {(() => {
                                try {
                                  return (
                                    gameDetails[activeCategory]?.games?.find(
                                      (g) => g.key === selectedGameKey
                                    )?.name || "Game"
                                  );
                                } catch (e) {
                                  console.error(
                                    "Error accessing game name:",
                                    e
                                  );
                                  return "Game";
                                }
                              })()}{" "}
                              Progress
                            </h4>
                            <div className="progress-game-stats">
                              <div className="progress-stat">
                                <span className="progress-stat-label">
                                  Total Plays:
                                </span>
                                <span className="progress-stat-value">
                                  {(() => {
                                    try {
                                      return (
                                        gameDetails[
                                          activeCategory
                                        ]?.games?.find(
                                          (g) => g.key === selectedGameKey
                                        )?.history?.length || 0
                                      );
                                    } catch (e) {
                                      console.error(
                                        "Error accessing game history:",
                                        e
                                      );
                                      return 0;
                                    }
                                  })()}
                                </span>
                              </div>
                              <div className="progress-stat">
                                <span className="progress-stat-label">
                                  Best Score:
                                </span>
                                <span className="progress-stat-value">
                                  {(() => {
                                    try {
                                      return (
                                        gameDetails[
                                          activeCategory
                                        ]?.games?.find(
                                          (g) => g.key === selectedGameKey
                                        )?.best_score || 0
                                      );
                                    } catch (e) {
                                      console.error(
                                        "Error accessing best score:",
                                        e
                                      );
                                      return 0;
                                    }
                                  })()}
                                </span>
                              </div>
                              <div className="progress-stat">
                                <span className="progress-stat-label">
                                  Best Level:
                                </span>
                                <span className="progress-stat-value">
                                  {(() => {
                                    try {
                                      return (
                                        gameDetails[
                                          activeCategory
                                        ]?.games?.find(
                                          (g) => g.key === selectedGameKey
                                        )?.best_level || 1
                                      );
                                    } catch (e) {
                                      console.error(
                                        "Error accessing best level:",
                                        e
                                      );
                                      return 1;
                                    }
                                  })()}
                                </span>
                              </div>
                              <div className="progress-stat">
                                <span className="progress-stat-label">
                                  Best Streak:
                                </span>
                                <span className="progress-stat-value">
                                  {(() => {
                                    try {
                                      return (
                                        gameDetails[
                                          activeCategory
                                        ]?.games?.find(
                                          (g) => g.key === selectedGameKey
                                        )?.best_streak || 0
                                      );
                                    } catch (e) {
                                      console.error(
                                        "Error accessing best streak:",
                                        e
                                      );
                                      return 0;
                                    }
                                  })()}
                                </span>
                              </div>
                              <div className="progress-stat">
                                <span className="progress-stat-label">
                                  Fewest Mistakes:
                                </span>
                                <span className="progress-stat-value">
                                  {(() => {
                                    try {
                                      const fewestMistakes = gameDetails[
                                        activeCategory
                                      ]?.games?.find(
                                        (g) => g.key === selectedGameKey
                                      )?.fewest_mistakes;
                                      return fewestMistakes &&
                                        fewestMistakes < 999
                                        ? fewestMistakes
                                        : "-";
                                    } catch (e) {
                                      console.error(
                                        "Error accessing fewest mistakes:",
                                        e
                                      );
                                      return "-";
                                    }
                                  })()}
                                </span>
                              </div>
                              <div className="progress-stat">
                                <span className="progress-stat-label">
                                  Most Correct:
                                </span>
                                <span className="progress-stat-value">
                                  {(() => {
                                    try {
                                      return (
                                        gameDetails[
                                          activeCategory
                                        ]?.games?.find(
                                          (g) => g.key === selectedGameKey
                                        )?.most_correct || 0
                                      );
                                    } catch (e) {
                                      console.error(
                                        "Error accessing most correct:",
                                        e
                                      );
                                      return 0;
                                    }
                                  })()}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="game-progress-chart">
                            <Line
                              data={getGameDetailedHistory(selectedGameKey)}
                              options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                animation: {
                                  duration: 750,
                                },
                                interaction: {
                                  intersect: false,
                                  mode: "index",
                                },
                                scales: {
                                  y: {
                                    beginAtZero: true,
                                    grid: {
                                      color: "rgba(0, 0, 0, 0.05)",
                                    },
                                    ticks: {
                                      color:
                                        categories.find(
                                          (cat) => cat.key === activeCategory
                                        )?.color || "#ff5a5f",
                                      font: {
                                        size: 12,
                                        weight: "500",
                                      },
                                    },
                                  },
                                  x: {
                                    grid: {
                                      display: false,
                                    },
                                    ticks: {
                                      color: "var(--color-text-light)",
                                      font: {
                                        size: 11,
                                      },
                                      maxRotation: 45,
                                      minRotation: 45,
                                    },
                                  },
                                },
                                plugins: {
                                  legend: {
                                    display: false,
                                  },
                                  tooltip: {
                                    backgroundColor: "var(--color-white)",
                                    titleColor: "var(--color-text)",
                                    bodyColor: "var(--color-text)",
                                    borderColor:
                                      categories.find(
                                        (cat) => cat.key === activeCategory
                                      )?.color || "#ff5a5f",
                                    borderWidth: 1,
                                    padding: 12,
                                    titleFont: {
                                      size: 14,
                                      weight: "bold",
                                    },
                                    bodyFont: {
                                      size: 13,
                                    },
                                    callbacks: {
                                      title: function (tooltipItems) {
                                        return tooltipItems[0].label;
                                      },
                                    },
                                  },
                                },
                              }}
                            />
                          </div>

                          <div className="game-progress-history">
                            <h5>Play History</h5>
                            <div className="history-table-container">
                              <table className="history-table">
                                <thead>
                                  <tr>
                                    <th>Date & Time</th>
                                    <th>Score</th>
                                    <th>Level</th>
                                    <th>Streaks</th>
                                    <th>Mistakes</th>
                                    <th>Correct</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {(() => {
                                    try {
                                      const gameHistory = gameDetails[
                                        activeCategory
                                      ]?.games?.find(
                                        (g) => g.key === selectedGameKey
                                      )?.history;

                                      if (
                                        !gameHistory ||
                                        !Array.isArray(gameHistory)
                                      ) {
                                        return null;
                                      }

                                      return [...gameHistory]
                                        .sort(
                                          (a, b) =>
                                            new Date(b.date) - new Date(a.date)
                                        )
                                        .map((play, index) => (
                                          <tr key={index}>
                                            <td>
                                              {new Date(
                                                play.date
                                              ).toLocaleDateString(undefined, {
                                                month: "short",
                                                day: "numeric",
                                                year: "numeric",
                                                hour: "2-digit",
                                                minute: "2-digit",
                                              })}
                                            </td>
                                            <td>{play.score}</td>
                                            <td>{play.level}</td>
                                            <td>{play.streaks || 0}</td>
                                            <td>{play.mistakes || 0}</td>
                                            <td>
                                              {play.correct_answers ||
                                                Math.floor(play.score / 100) ||
                                                0}
                                            </td>
                                          </tr>
                                        ));
                                    } catch (e) {
                                      console.error(
                                        "Error rendering game history:",
                                        e
                                      );
                                      return null;
                                    }
                                  })()}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </>
                      );
                    })()
                  ) : (
                    <div className="select-game-prompt">
                      <div className="prompt-icon">👈</div>
                      <div className="prompt-text">
                        Select a game from the list to view detailed progress
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {activeTab === "achievements" && (
        <div className="achievements-section">
          <h3 className="analytics-title">Achievements & Badges</h3>

          {achievementsLoading ? (
            <div className="loading-spinner">
              <p>Loading achievements and badges...</p>
            </div>
          ) : (
            <div className="achievements-badges-container">
              {/* Achievements Section */}
              <div className="profile-achievements-grid-section">
                <h4 className="section-title">🏆 Achievements</h4>
                <div className="profile-achievements-grid">
                  {achievements.map((achievement) => (
                    <AchievementTooltip
                      key={achievement.id}
                      achievement={achievement}
                      isVisible={true}
                    >
                      <div
                        className={`profile-achievement-card ${
                          achievement.is_earned ? "earned" : "locked"
                        }`}
                      >
                        <div className="achievement-icon">
                          <span className="achievement-emoji">
                            {achievement.icon}
                          </span>
                        </div>
                        <div className="achievement-content">
                          <div className="achievement-main">
                            <h5 className="achievement-name">
                              {achievement.name}
                            </h5>
                            <p className="achievement-description">
                              {achievement.description}
                            </p>
                          </div>
                          <div className="achievement-xp">
                            <div className="xp-separator"></div>
                            <span className="achievement-points">
                              {achievement.points} XP
                            </span>
                          </div>
                        </div>
                        {achievement.is_earned && achievement.earned_date && (
                          <div className="achievement-earned-date">
                            Earned:{" "}
                            {new Date(
                              achievement.earned_date
                            ).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </AchievementTooltip>
                  ))}
                </div>
              </div>

              {/* Badges Section */}
              <div className="profile-badges-grid-section">
                <h4 className="section-title">🎖️ Badges</h4>
                <div className="profile-badges-grid">
                  {badges.map((badge) => (
                    <AchievementTooltip
                      key={badge.id}
                      badge={badge}
                      isVisible={true}
                    >
                      <div
                        className={`profile-badge-card ${
                          badge.is_earned ? "earned" : "locked"
                        } ${badge.is_rare ? "rare" : ""}`}
                        data-rank={badge.rank}
                      >
                        <div className="badge-icon">
                          <span
                            className="badge-emoji"
                            style={{ color: badge.color }}
                          >
                            {badge.icon}
                          </span>
                        </div>
                        <div className="badge-content">
                          <h5 className="badge-name">{badge.name}</h5>
                          <p className="badge-description">
                            {badge.description}
                          </p>
                          <div className="badge-meta">
                            {badge.rank && (
                              <span className="rank-indicator">
                                {badge.rank}
                              </span>
                            )}
                          </div>
                          {badge.is_earned && badge.earned_date && (
                            <div className="badge-earned-date">
                              Earned:{" "}
                              {new Date(badge.earned_date).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                        {badge.rank && (
                          <div className="badge-rank-display">{badge.rank}</div>
                        )}
                      </div>
                    </AchievementTooltip>
                  ))}
                </div>
              </div>

              {/* Stats Section */}
              <div className="achievements-stats">
                <div className="achievements-summary">
                  <div className="stat-card">
                    <div className="stat-number">
                      {achievements.filter((a) => a.is_earned).length}
                    </div>
                    <div className="stat-label">Achievements Earned</div>
                    <div className="stat-progress">
                      {achievements.length > 0 &&
                        `${Math.round(
                          (achievements.filter((a) => a.is_earned).length /
                            achievements.length) *
                            100
                        )}% Complete`}
                    </div>
                  </div>

                  <div className="stat-card">
                    <div className="stat-number">
                      {badges.filter((b) => b.is_earned).length}
                    </div>
                    <div className="stat-label">Badges Earned</div>
                    <div className="stat-progress">
                      {badges.length > 0 &&
                        `${Math.round(
                          (badges.filter((b) => b.is_earned).length /
                            badges.length) *
                            100
                        )}% Complete`}
                    </div>
                  </div>

                  <div className="stat-card">
                    <div className="stat-number">
                      {achievements
                        .filter((a) => a.is_earned)
                        .reduce((total, a) => total + a.points, 0)}
                    </div>
                    <div className="stat-label">Achievement Points</div>
                    <div className="stat-progress">
                      From {achievements.filter((a) => a.is_earned).length}{" "}
                      achievements
                    </div>
                  </div>

                  <div className="stat-card">
                    <div className="stat-number">
                      {badges.filter((b) => b.is_earned && b.is_rare).length}
                    </div>
                    <div className="stat-label">Rare Badges</div>
                    <div className="stat-progress">Exclusive achievements</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
