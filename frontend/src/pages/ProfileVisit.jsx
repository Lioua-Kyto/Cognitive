import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { useContext } from "react";
import { useSocial } from "../context/SocialContext";
import { useNotifications } from "../context/NotificationContext";
import { profileAPI } from "../api/profile.jsx";
import { gamesAPI } from "../api/games.jsx";
import "./Styles/ProfileVisit.css";

// Utility function to ensure absolute URLs for images (same as Profile component)
const ensureAbsoluteUrl = (url) => {
  if (!url) return "";
  if (url.startsWith("http")) return url;

  // Use your backend base URL
  const BASE_URL = "http://127.0.0.1:8000";
  return `${BASE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
};

export default function ProfileVisit() {
  const { username } = useParams(); // This could be either username or user ID
  const navigate = useNavigate();
  const { user, token } = useContext(AuthContext);
  const { friends, sendFriendRequest, openChat, onlineFriends } = useSocial();
  const { showNotification } = useNotifications();

  const [profileData, setProfileData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCurrentUser, setIsCurrentUser] = useState(false);
  const [isFriend, setIsFriend] = useState(false);
  const [selectedGame, setSelectedGame] = useState("all");
  const [userStats, setUserStats] = useState(null);
  const [userBestScores, setUserBestScores] = useState([]);
  const [availableGames, setAvailableGames] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [badges, setBadges] = useState([]);

  useEffect(() => {
    if (username) {
      // Check if the parameter is the current user
      setIsCurrentUser(
        username === user?.username || username === user?.id?.toString()
      );
      setIsFriend(
        friends.some(
          (friend) =>
            friend.username === username ||
            friend.id?.toString() === username ||
            friend.display_name === username
        )
      );
      fetchProfileData();
    }
  }, [username, user?.username, user?.id, friends]);

  const fetchProfileData = async () => {
    try {
      setIsLoading(true);
      console.log("=== ProfileVisit: Starting data fetch for:", username);

      // Fetch user profile using the API service
      const profileResponse = await profileAPI.getUserProfile(username, token);

      if (!profileResponse.success) {
        throw new Error(profileResponse.error);
      }

      const userData = profileResponse.data;
      console.log("=== ProfileVisit: Profile data received:", userData);

      // Set profile data
      setProfileData(userData);

      // Fetch user statistics
      const statsResponse = await profileAPI.getUserStats(userData.id, token);
      if (statsResponse.success) {
        setUserStats(statsResponse.data);
        console.log("=== ProfileVisit: Stats data:", statsResponse.data);
      } else {
        console.log(
          "=== ProfileVisit: Stats fetch failed:",
          statsResponse.error
        );
        // Set empty stats to avoid undefined errors
        setUserStats({
          total_games: 0,
          level: 1,
          global_rank: null,
          category_stats: {},
        });
      }

      // Fetch user best scores
      const scoresResponse = await profileAPI.getUserBestScores(
        userData.id,
        token
      );
      if (scoresResponse.success) {
        setUserBestScores(scoresResponse.data);
        console.log("=== ProfileVisit: Best scores:", scoresResponse.data);
      }

      // Fetch achievements
      const achievementsResponse = await profileAPI.getUserAchievements(
        userData.id,
        token
      );
      if (achievementsResponse.success) {
        setAchievements(achievementsResponse.data);
      }

      // Fetch badges
      const badgesResponse = await profileAPI.getUserBadges(userData.id, token);
      if (badgesResponse.success) {
        setBadges(badgesResponse.data);
      }

      // Fetch available games
      const gamesResponse = await gamesAPI.getAvailableGames(token);
      setAvailableGames(gamesResponse);
    } catch (error) {
      console.error("=== ProfileVisit: Error fetching profile data:", error);
      showNotification({
        type: "error",
        title: "Error",
        message: "Failed to load profile data",
        icon: "❌",
      });

      // Redirect after showing error
      setTimeout(() => {
        navigate("/social");
      }, 2000);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to fetch game stats
  const fetchGameStats = async (userId) => {
    try {
      const statsResponse = await fetch(
        `http://127.0.0.1:8000/api/leaderboard/user-stats/${userId}/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        console.log("Stats data received:", statsData);
        setGameStats(statsData);
      } else {
        console.log("Stats endpoint returned:", statsResponse.status);
      }
    } catch (error) {
      console.log("Failed to fetch stats:", error);
    }
  };

  const handleSendFriendRequest = async () => {
    if (profileData) {
      const result = await sendFriendRequest(profileData.username);
      if (result.success) {
        showNotification({
          type: "success",
          title: "Friend Request Sent",
          message: `Friend request sent to ${profileData.username}`,
          icon: "👥",
        });
      } else {
        showNotification({
          type: "error",
          title: "Error",
          message: result.error || "Failed to send friend request",
          icon: "❌",
        });
      }
    }
  };

  const handleSendMessage = () => {
    if (profileData) {
      openChat(profileData.id);
      navigate("/social");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "online":
        return "#4caf50";
      case "away":
        return "#ffaa00";
      case "busy":
        return "#f44336";
      default:
        return "#666";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "online":
        return "Online";
      case "away":
        return "Away";
      case "busy":
        return "Busy";
      default:
        return "Offline";
    }
  };

  if (isLoading) {
    return (
      <div className="user-profile-page">
        <div className="profile-loading">
          <div className="loading-spinner"></div>
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="user-profile-page">
        <div className="profile-error">
          <h2>Profile Not Found</h2>
          <p>
            The user you're looking for doesn't exist or you don't have
            permission to view their profile.
          </p>
          <button onClick={() => navigate("/social")} className="back-btn">
            Back to Social
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-visit-container">
      {/* Header with back button */}
      <div className="profile-visit-header">
        <button
          onClick={() => navigate("/social")}
          className="profile-visit-back-btn"
        >
          <span className="back-icon">←</span>
          Back to Social
        </button>
      </div>

      {/* Main Profile Section */}
      <div className="profile-visit-main">
        <div className="profile-visit-card">
          {/* Profile Avatar Section */}
          <div className="profile-visit-avatar-section">
            <div className="profile-visit-avatar">
              {profileData.profile_picture ? (
                <img
                  src={ensureAbsoluteUrl(profileData.profile_picture)}
                  alt={profileData.display_name}
                />
              ) : (
                <div className="profile-visit-avatar-placeholder">
                  {(
                    profileData.username?.[0] ||
                    profileData.display_name?.charAt(0) ||
                    "?"
                  ).toUpperCase()}
                </div>
              )}

              {/* Online Status Indicator */}
              <div
                className={`profile-visit-status-indicator ${
                  onlineFriends.some((friend) => friend.id === profileData.id)
                    ? "online"
                    : "offline"
                }`}
              >
                <div className="status-dot"></div>
              </div>
            </div>

            <div className="profile-visit-basic-info">
              <h1 className="profile-visit-name">
                {profileData.username ||
                  profileData.display_name ||
                  "Unknown User"}
              </h1>

              {/* Country Display */}
              {profileData.country_name && (
                <div className="profile-visit-country">
                  {profileData.country_flag && (
                    <img
                      src={ensureAbsoluteUrl(profileData.country_flag)}
                      alt=""
                      className="profile-visit-country-flag"
                      onError={(e) => {
                        e.target.style.display = "none";
                      }}
                    />
                  )}
                  <span className="profile-visit-country-name">
                    {profileData.country_name}
                  </span>
                </div>
              )}

              {/* Bio */}
              {profileData.bio && (
                <div className="profile-visit-bio">
                  <p>{profileData.bio}</p>
                </div>
              )}

              {/* Member Since */}
              <div className="profile-visit-member-since">
                Member since{" "}
                {new Date(profileData.date_joined).toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                })}
              </div>
            </div>
          </div>

          {/* Enhanced Stats Section */}
          {userStats ? (
            <>
              {/* Main Stats Grid */}
              <div className="profile-visit-stats">
                <h3 className="profile-visit-stats-title">
                  Profile Statistics
                </h3>
                <div className="profile-visit-stats-grid">
                  <div className="profile-visit-stat-card">
                    <div className="stat-icon">🏆</div>
                    <div className="stat-content">
                      <div className="stat-value">{userStats.level || 1}</div>
                      <div className="stat-label">Level</div>
                    </div>
                  </div>

                  <div className="profile-visit-stat-card">
                    <div className="stat-icon">🎮</div>
                    <div className="stat-content">
                      <div className="stat-value">
                        {userStats.total_games || 0}
                      </div>
                      <div className="stat-label">Games Played</div>
                    </div>
                  </div>

                  <div className="profile-visit-stat-card">
                    <div className="stat-icon">🌍</div>
                    <div className="stat-content">
                      <div className="stat-value">
                        {userStats.global_rank
                          ? `#${userStats.global_rank}`
                          : "N/A"}
                      </div>
                      <div className="stat-label">Global Rank</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Category Rankings */}
              <div className="profile-visit-categories">
                <h3 className="profile-visit-stats-title">Category Rankings</h3>
                <div className="category-ranks-grid">
                  {Object.entries(userStats.category_stats).map(
                    ([categoryKey, categoryData]) => {
                      const categoryInfo =
                        gamesAPI.getCategoryInfo(categoryKey);
                      return (
                        <div key={categoryKey} className="category-rank-card">
                          <div
                            className="category-icon"
                            style={{ color: categoryInfo.color }}
                          >
                            {categoryInfo.icon}
                          </div>
                          <div className="category-info">
                            <div className="category-name">
                              {categoryInfo.name}
                            </div>
                            <div className="category-rank">
                              {categoryData.has_played ? (
                                `#${categoryData.rank}`
                              ) : (
                                <span className="locked">🔒</span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>
              </div>

              {/* Favorite Game, Best Score, Achievements */}
              <div className="profile-visit-highlights">
                <h3 className="profile-visit-stats-title">Highlights</h3>
                <div className="highlights-grid">
                  <div className="highlight-card">
                    <div className="highlight-icon">🎯</div>
                    <div className="highlight-info">
                      <div className="highlight-label">Favorite Game</div>
                      <div className="highlight-value">
                        {userBestScores.length > 0
                          ? userBestScores[0].game_name
                          : "None yet"}
                      </div>
                    </div>
                  </div>

                  <div className="highlight-card">
                    <div className="highlight-icon">�</div>
                    <div className="highlight-info">
                      <div className="highlight-label">Best Overall Score</div>
                      <div className="highlight-value">
                        {userBestScores.length > 0
                          ? Math.max(
                              ...userBestScores.map((score) => score.score)
                            ).toLocaleString()
                          : "0"}
                      </div>
                    </div>
                  </div>

                  <div className="highlight-card">
                    <div className="highlight-icon">🎖️</div>
                    <div className="highlight-info">
                      <div className="highlight-label">Achievements</div>
                      <div className="highlight-value">
                        {achievements.length}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="profile-visit-stats-loading">
              <p>Loading statistics...</p>
            </div>
          )}

          {/* Game-specific Stats Section */}
          <div className="profile-visit-game-stats">
            <h3 className="profile-visit-stats-title">Best Scores by Game</h3>
            <div className="game-selector">
              <select
                value={selectedGame}
                onChange={(e) => setSelectedGame(e.target.value)}
                className="game-select"
              >
                <option value="all">All Games</option>
                {availableGames.map((game) => (
                  <option key={game.id} value={game.id}>
                    {game.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="game-stats-display">
              {selectedGame === "all" ? (
                <div className="all-games-overview">
                  {userBestScores.length > 0 ? (
                    userBestScores.map((score) => (
                      <div key={score.game_id} className="game-score-card">
                        <div className="game-info">
                          <div
                            className="game-icon"
                            style={{
                              color: gamesAPI.getCategoryInfo(score.category)
                                .color,
                            }}
                          >
                            {gamesAPI.getCategoryInfo(score.category).icon}
                          </div>
                          <div className="game-details">
                            <div className="game-name">{score.game_name}</div>
                            <div className="game-stats">
                              <div className="game-stat">
                                <span className="stat-label">Best Score:</span>
                                <span className="stat-value">
                                  {score.score.toLocaleString()}
                                </span>
                              </div>
                              <div className="game-stat">
                                <span className="stat-label">
                                  Times Played:
                                </span>
                                <span className="stat-value">
                                  {score.times_played}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="no-games-played">
                      <p>No games played yet</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="specific-game-stats">
                  {(() => {
                    const gameScore = userBestScores.find(
                      (score) => score.game_id.toString() === selectedGame
                    );
                    if (!gameScore) {
                      return (
                        <div className="no-game-data">
                          <p>No data for this game yet</p>
                        </div>
                      );
                    }
                    return (
                      <div className="game-stat-card">
                        <h4>{gameScore.game_name}</h4>
                        <div className="game-stat-grid">
                          <div className="game-stat-item">
                            <span className="stat-label">Best Score</span>
                            <span className="stat-value">
                              {gameScore.score.toLocaleString()}
                            </span>
                          </div>
                          <div className="game-stat-item">
                            <span className="stat-label">Times Played</span>
                            <span className="stat-value">
                              {gameScore.times_played}
                            </span>
                          </div>
                          <div className="game-stat-item">
                            <span className="stat-label">Best Streak</span>
                            <span className="stat-value">
                              {gameScore.best_streak}
                            </span>
                          </div>
                          <div className="game-stat-item">
                            <span className="stat-label">Fewest Mistakes</span>
                            <span className="stat-value">
                              {gameScore.fewest_mistakes}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>

          {/* Achievements Section */}
          <div className="profile-visit-achievements">
            <h3 className="profile-visit-stats-title">Achievements</h3>
            <div className="profile-visit-achievements-grid">
              {achievements.length > 0 ? (
                achievements.map((achievement) => (
                  <div
                    key={achievement.id}
                    className="profile-visit-achievement-card"
                  >
                    <div className="achievement-icon">{achievement.icon}</div>
                    <div className="achievement-details">
                      <div className="achievement-name">{achievement.name}</div>
                      <div className="achievement-description">
                        {achievement.description}
                      </div>
                      <div className="achievement-date">
                        {new Date(achievement.date_earned).toLocaleDateString(
                          "en-US",
                          {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          }
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-achievements">
                  <div className="no-achievements-icon">🏆</div>
                  <p>No achievements earned yet</p>
                  <p className="no-achievements-hint">
                    Start playing games to unlock achievements!
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Badges Section */}
          <div className="profile-visit-badges">
            <h3 className="profile-visit-stats-title">Badges</h3>
            <div className="profile-visit-badges-grid">
              {badges.length > 0 ? (
                badges.map((badge) => (
                  <div
                    key={badge.id}
                    className={`profile-visit-badge-card ${badge.rarity.toLowerCase()}`}
                  >
                    <div className="badge-icon">{badge.icon}</div>
                    <div className="badge-details">
                      <div className="badge-name">{badge.name}</div>
                      <div className="badge-rarity">{badge.rarity} Badge</div>
                      <div className="badge-date">
                        {new Date(badge.date_earned).toLocaleDateString(
                          "en-US",
                          {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          }
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-badges">
                  <div className="no-badges-icon">🎖️</div>
                  <p>No badges earned yet</p>
                  <p className="no-badges-hint">
                    Achieve milestones to earn badges!
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          {!isCurrentUser && (
            <div className="profile-visit-actions">
              {isFriend ? (
                <button
                  onClick={handleSendMessage}
                  className="profile-visit-action-btn primary"
                >
                  💬 Send Message
                </button>
              ) : (
                <button
                  onClick={handleSendFriendRequest}
                  className="profile-visit-action-btn secondary"
                >
                  👥 Send Friend Request
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
