import React, { useState, useEffect } from "react";
import { useSocial } from "../../context/SocialContext";
import { useNotifications } from "../../context/NotificationContext";
import "./SocialSidebar.css";

const SocialSidebar = ({ isOpen, onClose, onNavigateToSocial }) => {
  const {
    friends,
    friendRequests,
    globalUnreadCount,
    unreadCounts,
    getTotalUnreadCount,
    isConnected,
    openChat,
    sendGlobalMessage,
    sendPrivateMessage,
    acceptFriendRequest,
    rejectFriendRequest,
  } = useSocial();

  const { showNotification } = useNotifications();
  const [activeQuickTab, setActiveQuickTab] = useState("notifications");

  const totalUnreadCount = getTotalUnreadCount();
  const totalRequests = friendRequests.length;

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleQuickMessage = (friendId) => {
    openChat(friendId);
    onNavigateToSocial();
    onClose();
  };

  const handleAcceptRequest = async (requestId) => {
    try {
      await acceptFriendRequest(requestId);
      showNotification({
        type: "success",
        title: "Friend Request Accepted",
        message: "You are now friends!",
        icon: "👥",
      });
    } catch (error) {
      console.error("Error accepting friend request:", error);
    }
  };

  const handleRejectRequest = async (requestId) => {
    try {
      await rejectFriendRequest(requestId);
      showNotification({
        type: "info",
        title: "Friend Request Declined",
        message: "Request has been declined.",
        icon: "👋",
      });
    } catch (error) {
      console.error("Error rejecting friend request:", error);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="social-sidebar-overlay" onClick={onClose} />
      <div className="social-sidebar-panel">
        <div className="social-sidebar-header">
          <div className="social-sidebar-title">
            <span className="social-sidebar-icon">🌐</span>
            <span>Social Hub</span>
          </div>
          <div className="social-sidebar-status">
            <div
              className={`social-status-indicator ${
                isConnected ? "connected" : "disconnected"
              }`}
            >
              {isConnected ? "Online" : "Offline"}
            </div>
          </div>
          <button className="social-sidebar-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="social-sidebar-tabs">
          <button
            className={`social-sidebar-tab ${
              activeQuickTab === "notifications" ? "active" : ""
            }`}
            onClick={() => setActiveQuickTab("notifications")}
          >
            🔔 Notifications
            {totalUnreadCount + totalRequests > 0 && (
              <span className="social-sidebar-badge">
                {totalUnreadCount + totalRequests}
              </span>
            )}
          </button>
          <button
            className={`social-sidebar-tab ${
              activeQuickTab === "friends" ? "active" : ""
            }`}
            onClick={() => setActiveQuickTab("friends")}
          >
            👥 Friends
            <span className="social-sidebar-badge-subtle">
              {friends.length}
            </span>
          </button>
        </div>

        <div className="social-sidebar-content">
          {activeQuickTab === "notifications" && (
            <div className="social-notifications-section">
              {/* Friend Requests */}
              {friendRequests.length > 0 && (
                <div className="social-notification-group">
                  <h4 className="social-notification-group-title">
                    📬 Friend Requests ({friendRequests.length})
                  </h4>
                  {friendRequests.slice(0, 3).map((request) => (
                    <div
                      key={request.id}
                      className="social-notification-item request"
                    >
                      <div className="social-notification-avatar">
                        {request.requester.username.charAt(0).toUpperCase()}
                      </div>
                      <div className="social-notification-content">
                        <div className="social-notification-text">
                          <strong>{request.requester.username}</strong> sent you
                          a friend request
                        </div>
                        <div className="social-notification-time">
                          {formatTime(request.created_at)}
                        </div>
                        <div className="social-notification-actions">
                          <button
                            className="social-notification-btn accept"
                            onClick={() => handleAcceptRequest(request.id)}
                          >
                            Accept
                          </button>
                          <button
                            className="social-notification-btn decline"
                            onClick={() => handleRejectRequest(request.id)}
                          >
                            Decline
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {friendRequests.length > 3 && (
                    <button
                      className="social-view-all-btn"
                      onClick={onNavigateToSocial}
                    >
                      View all {friendRequests.length} requests
                    </button>
                  )}
                </div>
              )}

              {/* Unread Messages */}
              {totalUnreadCount > 0 && (
                <div className="social-notification-group">
                  <h4 className="social-notification-group-title">
                    💬 Unread Messages ({totalUnreadCount})
                  </h4>

                  {globalUnreadCount > 0 && (
                    <div className="social-notification-item message">
                      <div className="social-notification-avatar global">
                        🌐
                      </div>
                      <div className="social-notification-content">
                        <div className="social-notification-text">
                          <strong>Global Chat</strong> has {globalUnreadCount}{" "}
                          new messages
                        </div>
                        <button
                          className="social-notification-btn view"
                          onClick={onNavigateToSocial}
                        >
                          View Chat
                        </button>
                      </div>
                    </div>
                  )}

                  {friends
                    .filter((friend) => unreadCounts[friend.id] > 0)
                    .slice(0, 3)
                    .map((friend) => (
                      <div
                        key={friend.id}
                        className="social-notification-item message"
                      >
                        <div className="social-notification-avatar">
                          {friend.profile_picture ? (
                            <img
                              src={friend.profile_picture}
                              alt={friend.username}
                            />
                          ) : (
                            friend.username.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="social-notification-content">
                          <div className="social-notification-text">
                            <strong>{friend.username}</strong> sent{" "}
                            {unreadCounts[friend.id]} new message
                            {unreadCounts[friend.id] > 1 ? "s" : ""}
                          </div>
                          <button
                            className="social-notification-btn view"
                            onClick={() => handleQuickMessage(friend.id)}
                          >
                            Reply
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}

              {/* Empty State */}
              {totalUnreadCount === 0 && totalRequests === 0 && (
                <div className="social-empty-state">
                  <div className="social-empty-icon">🔕</div>
                  <div className="social-empty-title">All caught up!</div>
                  <div className="social-empty-text">
                    No new notifications or messages
                  </div>
                </div>
              )}
            </div>
          )}

          {activeQuickTab === "friends" && (
            <div className="social-friends-section">
              {friends.length === 0 ? (
                <div className="social-empty-state">
                  <div className="social-empty-icon">👥</div>
                  <div className="social-empty-title">No friends yet</div>
                  <div className="social-empty-text">
                    Start building your network by adding friends
                  </div>
                  <button
                    className="social-view-all-btn"
                    onClick={onNavigateToSocial}
                  >
                    Add Friends
                  </button>
                </div>
              ) : (
                <>
                  <div className="social-friends-list">
                    {friends.slice(0, 6).map((friend) => (
                      <div key={friend.id} className="social-friend-quick-item">
                        <div className="social-friend-quick-avatar">
                          {friend.profile_picture ? (
                            <img
                              src={friend.profile_picture}
                              alt={friend.username}
                            />
                          ) : (
                            friend.username.charAt(0).toUpperCase()
                          )}
                          <div
                            className={`social-friend-status-dot ${
                              friend.status || "offline"
                            }`}
                          ></div>
                        </div>
                        <div className="social-friend-quick-info">
                          <div className="social-friend-quick-name">
                            {friend.username}
                          </div>
                          <div
                            className={`social-friend-quick-status ${
                              friend.status || "offline"
                            }`}
                          >
                            {friend.status || "offline"}
                          </div>
                        </div>
                        <button
                          className="social-friend-quick-message"
                          onClick={() => handleQuickMessage(friend.id)}
                          title="Send message"
                        >
                          💬
                        </button>
                      </div>
                    ))}
                  </div>

                  {friends.length > 6 && (
                    <button
                      className="social-view-all-btn"
                      onClick={onNavigateToSocial}
                    >
                      View all {friends.length} friends
                    </button>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        <div className="social-sidebar-footer">
          <button
            className="social-sidebar-open-full"
            onClick={onNavigateToSocial}
          >
            <span>🚀</span>
            Open Social Hub
          </button>
        </div>
      </div>
    </>
  );
};

export default SocialSidebar;
