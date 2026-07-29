import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "../context/NotificationContext";
import { useSocial } from "../context/SocialContext";
import { AuthContext } from "../context/AuthContext";
import { profileAPI } from "../api/profile.jsx";
import "./Styles/UserProfileModal.css";

// Utility function to ensure absolute URLs for images (same as Profile component)
const ensureAbsoluteUrl = (url) => {
  if (!url) return "";
  if (url.startsWith("http")) return url;

  // Use your backend base URL
  const BASE_URL = "http://127.0.0.1:8000";
  return `${BASE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
};

const UserProfileModal = ({ isOpen, onClose, user, isCurrentUser = false }) => {
  const { user: currentUser, token } = useContext(AuthContext);
  const { showNotification } = useNotifications();
  const { sendFriendRequest, friends, openChat, onlineFriends } = useSocial();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isFriend, setIsFriend] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [userStats, setUserStats] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [badges, setBadges] = useState([]);
  const [userBestScores, setUserBestScores] = useState([]);

  // Determine if this is the current user's own profile
  const isOwnProfile = currentUser && user && currentUser.id === user.id;

  useEffect(() => {
    if (user && friends) {
      setIsFriend(friends.some((friend) => friend.id === user.id));
    }
  }, [user, friends]);

  // Fetch detailed user profile data using the new API service
  useEffect(() => {
    const fetchUserData = async () => {
      if (user && isOpen) {
        setIsLoadingProfile(true);
        try {
          console.log("===== USER PROFILE MODAL DEBUG =====");
          console.log("Fetching profile data for user:", user.id);

          // Check if user is online by looking in onlineFriends list
          const isUserOnline =
            onlineFriends.some((friend) => friend.id === user.id) ||
            user.status === "online" ||
            user.is_online === true;

          // Use the user data we already have for basic info
          const basicProfileData = {
            id: user.id,
            username: user.username || user.display_name,
            display_name: user.display_name || user.username,
            profile_picture: user.profile_picture || user.profile_pic_url,
            status: isUserOnline ? "online" : user.status || "offline",
            country: user.country,
            country_name: user.country_name || user.country,
            country_flag: user.country_flag,
            bio: user.bio || user.description || "",
            date_joined:
              user.date_joined ||
              user.created_at ||
              user.join_date ||
              new Date().toISOString(),
            // Default values that will be updated if API succeeds
            level: parseInt(user.level || 1),
            games_played: parseInt(user.games_played || user.total_games || 0),
            global_rank: user.global_rank || null,
          };

          setUserProfile(basicProfileData);

          // Fetch additional stats using API service if token is available
          if (token) {
            try {
              console.log(
                "=== UserModal: Attempting to fetch stats for user:",
                user.id
              );
              const statsData = await profileAPI.getUserStats(user.id, token);
              if (statsData.success) {
                console.log(
                  "=== UserModal: Stats data received:",
                  statsData.data
                );

                // Update profile with real stats data
                setUserProfile((prev) => ({
                  ...prev,
                  level: statsData.data.level || prev.level,
                  games_played: statsData.data.total_games || prev.games_played,
                  global_rank: statsData.data.global_rank || prev.global_rank,
                }));

                // Set user stats for additional display
                setUserStats(statsData.data);
              } else {
                console.log(
                  "=== UserModal: Stats fetch failed:",
                  statsData.error
                );
              }
            } catch (error) {
              console.error("=== UserModal: Error fetching user stats:", error);
              // Keep using basic data if API fails
            }
          } else {
            console.log(
              "=== UserModal: No token available, using basic profile data only"
            );
          }

          console.log("Profile data loaded successfully");
          console.log("=====================================");
        } catch (error) {
          console.error("Error fetching user data:", error);
          showNotification({
            type: "error",
            title: "Error",
            message: "Failed to load profile data",
            icon: "❌",
          });
        } finally {
          setIsLoadingProfile(false);
        }
      }
    };

    fetchUserData();
  }, [user, isOpen, onlineFriends, token, isOwnProfile, showNotification]);

  const handleAddFriend = async () => {
    if (!userProfile) return;

    setIsLoading(true);
    try {
      const result = await sendFriendRequest(
        userProfile.display_name || userProfile.username
      );
      if (result.success) {
        showNotification({
          type: "success",
          title: "Friend Request Sent",
          message: `Friend request sent to ${
            userProfile.display_name || userProfile.username
          }`,
          icon: "👥",
        });
        onClose();
      }
    } catch (error) {
      showNotification({
        type: "error",
        title: "Error",
        message: "Failed to send friend request",
        icon: "❌",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleMessage = () => {
    if (!userProfile) return;

    const friend = friends.find((f) => f.id === userProfile.id);
    if (friend) {
      openChat(friend.id);
      onClose();
    }
  };

  const handleViewFullProfile = () => {
    // Navigate to the user's profile page
    if (isOwnProfile) {
      // If it's own profile, navigate to profile page
      navigate("/profile");
    } else {
      // For other users, use their user ID to ensure proper lookup
      console.log("Navigating to user profile with ID:", userProfile.id);

      // Use the user ID which is more reliable than username/display_name
      navigate(`/profile/${userProfile.id}`);
    }
    onClose();
  };

  if (!isOpen || !user || !userProfile) return null;

  return (
    <div className="user-profile-modal-overlay" onClick={onClose}>
      <div
        className="user-profile-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with close button */}
        <div className="user-profile-modal-header">
          <button className="user-profile-modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* User Avatar and Basic Info */}
        <div className="user-profile-modal-main">
          <div className="user-profile-modal-avatar">
            {userProfile.profile_picture ? (
              <img
                src={ensureAbsoluteUrl(userProfile.profile_picture)}
                alt={userProfile.display_name || userProfile.username}
              />
            ) : (
              <div className="user-profile-modal-avatar-placeholder">
                {(
                  userProfile.username?.[0] ||
                  userProfile.display_name?.[0] ||
                  "?"
                ).toUpperCase()}
              </div>
            )}
            <div
              className={`user-profile-modal-status ${
                userProfile.status || "offline"
              }`}
            >
              <div className="status-dot"></div>
              <span>{userProfile.status || "offline"}</span>
            </div>
          </div>

          <div className="user-profile-modal-info">
            <h2 className="user-profile-modal-name">
              {userProfile.username ||
                userProfile.display_name ||
                "Unknown User"}
            </h2>

            {(userProfile.country || userProfile.country_name) && (
              <div className="user-profile-modal-country">
                {userProfile.country_name && (
                  <img
                    src={(() => {
                      // Map country names to ISO codes for your backend static flags
                      const countryCodeMap = {
                        algeria: "dz",
                        "united states": "us",
                        "united kingdom": "gb",
                        france: "fr",
                        germany: "de",
                        spain: "es",
                        italy: "it",
                        canada: "ca",
                        australia: "au",
                        // Add more mappings as needed
                      };

                      const countryName =
                        userProfile.country_name.toLowerCase();
                      const countryCode =
                        countryCodeMap[countryName] || countryName.slice(0, 2);

                      // Use your backend static flags first, same as Profile.jsx
                      return `http://127.0.0.1:8000/static/flags/${countryCode}.svg`;
                    })()}
                    alt=""
                    className="country-flag"
                    onError={(e) => {
                      console.log(
                        "Backend flag failed, trying CDN for:",
                        userProfile.country_name
                      );
                      // Fallback to CDN if backend flag fails
                      const countryName =
                        userProfile.country_name.toLowerCase();
                      if (countryName === "algeria") {
                        e.target.src =
                          "http://127.0.0.1:8000/static/flags/dz.svg";
                        e.target.onerror = () => {
                          e.target.style.display = "none";
                        };
                      } else {
                        e.target.style.display = "none";
                      }
                    }}
                  />
                )}
                <span className="country-name">
                  {userProfile.country_name || userProfile.country}
                </span>
              </div>
            )}

            {userProfile.bio && (
              <p className="user-profile-modal-bio">{userProfile.bio}</p>
            )}
          </div>
        </div>

        {/* Stats Section */}
        {isLoadingProfile ? (
          <div className="user-profile-modal-loading">
            <div className="loading-spinner-small"></div>
            <span>Loading additional profile data...</span>
          </div>
        ) : (
          <div className="user-profile-modal-stats">
            <div className="user-profile-stat">
              <div className="stat-icon">⭐</div>
              <div className="stat-info">
                <div className="stat-value">{userProfile.level || 1}</div>
                <div className="stat-label">Level</div>
              </div>
            </div>
            <div className="user-profile-stat">
              <div className="stat-icon">🎮</div>
              <div className="stat-info">
                <div className="stat-value">
                  {userProfile.games_played || 0}
                </div>
                <div className="stat-label">Games Played</div>
              </div>
            </div>
            <div className="user-profile-stat">
              <div className="stat-icon">🌍</div>
              <div className="stat-info">
                <div className="stat-value">
                  {userProfile.global_rank
                    ? `#${userProfile.global_rank}`
                    : "N/A"}
                </div>
                <div className="stat-label">Global Rank</div>
              </div>
            </div>
          </div>
        )}

        {/* Join Date */}
        {userProfile.date_joined && (
          <div className="user-profile-modal-joined">
            Member since{" "}
            {new Date(userProfile.date_joined).toLocaleDateString()}
          </div>
        )}

        {/* Action Buttons with improved logic */}
        <div className="user-profile-modal-actions">
          {isOwnProfile ? (
            // If viewing own profile, show only one wide "View Profile" button
            <button
              className="user-profile-action-btn primary wide"
              onClick={handleViewFullProfile}
            >
              👤 View Full Profile
            </button>
          ) : isFriend ? (
            // If viewing a friend's profile, show "View Profile" and "Message" buttons
            <>
              <button
                className="user-profile-action-btn secondary"
                onClick={handleViewFullProfile}
              >
                👤 View Profile
              </button>
              <button
                className="user-profile-action-btn primary"
                onClick={handleMessage}
              >
                💬 Message
              </button>
            </>
          ) : (
            // If viewing a non-friend's profile, show "View Profile" and "Add Friend" buttons
            <>
              <button
                className="user-profile-action-btn secondary"
                onClick={handleViewFullProfile}
              >
                👤 View Profile
              </button>
              <button
                className="user-profile-action-btn primary"
                onClick={handleAddFriend}
                disabled={isLoading}
              >
                {isLoading ? "Sending..." : "👥 Add Friend"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfileModal;
