import { API_ORIGIN } from "../api/config.js";
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useSocial } from "../context/SocialContext";
import { useNotifications } from "../context/NotificationContext";
import UserProfileModal from "../components/UserProfileModal";

// Utility function to ensure absolute URLs for images (same as Profile component)
const ensureAbsoluteUrl = (url) => {
  if (!url) return "";
  if (url.startsWith("http")) return url;

  // Use your backend base URL
  const BASE_URL = API_ORIGIN;
  return `${BASE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
};

// Modern Add Friend Modal Component
const ModernAddFriendModal = ({
  isOpen,
  onClose,
  searchUsers,
  sendFriendRequest,
  onUserSelect,
  friends = [],
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchMessage, setSearchMessage] = useState("");
  const searchTimeoutRef = useRef(null);
  const { showNotification } = useNotifications();

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setSearchQuery("");
      setSearchResults([]);
      setSearchMessage("");
      setIsSearching(false);
    }
  }, [isOpen]);

  // Handle search input change
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (value.trim().length === 0) {
      setSearchResults([]);
      setSearchMessage("");
      return;
    }

    // Set searching state
    setIsSearching(true);
    setSearchMessage("Searching...");

    // Debounce search
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const results = await searchUsers(value.trim());
        setSearchResults(results);
        setIsSearching(false);

        if (results.length === 0) {
          setSearchMessage("No users found");
        } else {
          setSearchMessage("");
        }
      } catch (error) {
        console.error("Search error:", error);
        setSearchResults([]);
        setSearchMessage("Error searching users");
        setIsSearching(false);
      }
    }, 300);
  };

  // Handle user selection - show profile modal
  const handleUserSelect = (user) => {
    onUserSelect(user);
  };

  // Check if user is already a friend
  const isAlreadyFriend = (user) => {
    return friends.some(
      (friend) => friend.id === user.id || friend.username === user.username
    );
  };

  // Handle send friend request
  const handleSendFriendRequest = async (username) => {
    try {
      const result = await sendFriendRequest(username);
      if (result.success) {
        showNotification({
          type: "success",
          title: "Friend Request Sent",
          message: `Friend request sent to ${username}`,
          icon: "👥",
        });
        onClose();
      }
    } catch (error) {
      console.error("Error sending friend request:", error);
    }
  };

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  if (!isOpen) return null;

  return (
    <div className="social-modal-overlay" onClick={onClose}>
      <div
        className="social-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="social-modal-header">
          <h3 className="social-modal-title">Add Friend</h3>
          <button className="social-modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="social-modal-body">
          <div className="social-search-section">
            <input
              type="text"
              placeholder="Search for users by name or email..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="social-search-input"
              autoFocus
            />

            {searchMessage && (
              <div
                className={`social-search-message ${
                  isSearching ? "searching" : "no-results"
                }`}
              >
                {searchMessage}
              </div>
            )}
          </div>

          {searchResults.length > 0 && (
            <div className="social-search-results">
              {searchResults.map((user) => (
                <div
                  key={user.id}
                  className="social-user-result-item"
                  onClick={() => handleUserSelect(user)}
                >
                  <div className="social-user-result-avatar">
                    {user.profile_pic_url ? (
                      <img
                        src={ensureAbsoluteUrl(user.profile_pic_url)}
                        alt={user.display_name}
                      />
                    ) : (
                      (user.display_name || user.username || "U")
                        .charAt(0)
                        .toUpperCase()
                    )}
                  </div>
                  <div className="social-user-result-info">
                    <div className="social-user-result-name">
                      {user.display_name}
                    </div>
                    <div className="social-user-result-email">{user.email}</div>
                  </div>
                  {!isAlreadyFriend(user) && (
                    <button
                      className="social-add-friend-result-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSendFriendRequest(user.display_name);
                      }}
                    >
                      Add Friend
                    </button>
                  )}
                  {isAlreadyFriend(user) && (
                    <div className="social-already-friend-indicator">
                      ✓ Friends
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default function ModernSocial() {
  const {
    friends,
    onlineFriends,
    friendRequests,
    sentFriendRequests,
    globalChatMessages,
    currentChat,
    openChat,
    closeChat,
    sendGlobalMessage,
    sendPrivateMessage,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    cancelFriendRequest,
    removeFriend,
    isConnected,
    getTotalUnreadCount,
    chatMessages,
    globalUnreadCount,
    unreadCounts,
    searchUsers,
  } = useSocial();

  const { showNotification } = useNotifications();
  const [messageInput, setMessageInput] = useState("");
  const [activeTab, setActiveTab] = useState("chat");
  const [friendSearchQuery, setFriendSearchQuery] = useState("");
  const [isAddFriendModalOpen, setIsAddFriendModalOpen] = useState(false);
  const [showJumpToNew, setShowJumpToNew] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isUserProfileModalOpen, setIsUserProfileModalOpen] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedMessageForReaction, setSelectedMessageForReaction] =
    useState(null);
  const [openDropdowns, setOpenDropdowns] = useState({}); // Track open dropdowns

  const navigate = useNavigate();

  const messagesEndRef = useRef(null);
  const chatMessagesRef = useRef(null);
  const emojiPickerRef = useRef(null);

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target)
      ) {
        setShowEmojiPicker(false);
      }
      if (
        selectedMessageForReaction &&
        !event.target.closest(".social-message")
      ) {
        setSelectedMessageForReaction(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [selectedMessageForReaction]);

  // Toggle dropdown for specific friend
  const toggleDropdown = (friendId) => {
    setOpenDropdowns((prev) => ({
      ...prev,
      [friendId]: !prev[friendId],
    }));
  };

  // Close all dropdowns
  const closeAllDropdowns = () => {
    setOpenDropdowns({});
  };

  // State for confirmation modal
  const [confirmationModal, setConfirmationModal] = useState({
    isOpen: false,
    friend: null,
    message: "",
  });

  // Handle remove friend
  const handleRemoveFriend = async (friend) => {
    setConfirmationModal({
      isOpen: true,
      friend: friend,
      message: `Are you sure you want to remove ${
        friend.display_name || friend.username
      } from your friends?`,
    });
  };

  // Confirm remove friend
  const confirmRemoveFriend = async () => {
    try {
      await removeFriend(
        confirmationModal.friend.username ||
          confirmationModal.friend.display_name
      );
      showNotification({
        type: "success",
        title: "Friend Removed",
        message: `${
          confirmationModal.friend.display_name ||
          confirmationModal.friend.username
        } has been removed from your friends`,
        icon: "👥",
      });
      closeAllDropdowns();
    } catch (error) {
      console.error("Error removing friend:", error);
      showNotification({
        type: "error",
        title: "Error",
        message: "Failed to remove friend",
        icon: "❌",
      });
    }
    setConfirmationModal({ isOpen: false, friend: null, message: "" });
  };

  // Visit profile
  const handleVisitProfile = (friend) => {
    navigate(`/profile/${friend.id}`);
    closeAllDropdowns();
  };

  // Auto-scroll to bottom on new messages
  const scrollToBottom = (smooth = true) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: smooth ? "smooth" : "auto",
        block: "end",
        inline: "nearest",
      });
    }
  };

  // Jump to new messages - only scroll chat container
  const jumpToNewMessages = () => {
    if (chatMessagesRef.current && messagesEndRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  };

  // Handle scroll events to show/hide "Jump to new" button
  const handleChatScroll = () => {
    if (chatMessagesRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = chatMessagesRef.current;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShowJumpToNew(
        !isAtBottom &&
          (globalChatMessages.length > 0 ||
            (currentChat && chatMessages[currentChat]?.length > 0))
      );
    }
  };

  // Auto-scroll when messages change - prevent page scrolling
  useEffect(() => {
    if (chatMessagesRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = chatMessagesRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 150;

      if (isNearBottom) {
        setTimeout(() => {
          if (chatMessagesRef.current) {
            chatMessagesRef.current.scrollTop =
              chatMessagesRef.current.scrollHeight;
          }
        }, 50);
      }
    }
  }, [globalChatMessages, chatMessages, currentChat]);

  // Filter friends based on search query
  const filteredFriends = friends.filter((friend) =>
    (friend.username || friend.display_name || "")
      .toLowerCase()
      .includes(friendSearchQuery.toLowerCase())
  );

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!messageInput.trim()) return;

    if (currentChat === "global") {
      sendGlobalMessage(messageInput.trim());
    } else if (currentChat) {
      sendPrivateMessage(currentChat, messageInput.trim());
    }
    setMessageInput("");

    // Scroll only chat container, not the page
    setTimeout(() => {
      if (chatMessagesRef.current) {
        chatMessagesRef.current.scrollTop =
          chatMessagesRef.current.scrollHeight;
      }
    }, 100);
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Handle emoji insertion
  const handleEmojiSelect = (emoji) => {
    setMessageInput((prev) => prev + emoji);
    setShowEmojiPicker(false);
  };

  // Handle message reaction
  const handleReaction = (messageId, emoji) => {
    // This would typically call a function from SocialContext
    console.log(`Reacting to message ${messageId} with ${emoji}`);
    setSelectedMessageForReaction(null);
  };

  const renderChatMessages = () => {
    if (currentChat === "global") {
      return globalChatMessages;
    } else if (currentChat) {
      return chatMessages[currentChat] || [];
    }
    return [];
  };

  // Group consecutive messages from same user (Discord-style)
  const groupMessages = (messages) => {
    if (!messages || messages.length === 0) return [];

    const groups = [];
    let currentGroup = null;

    messages.forEach((message, index) => {
      const prevMessage = messages[index - 1];
      const shouldGroup =
        prevMessage &&
        prevMessage.sender.id === message.sender.id &&
        new Date(message.timestamp) - new Date(prevMessage.timestamp) < 300000; // 5 minutes

      if (!shouldGroup) {
        if (currentGroup) groups.push(currentGroup);
        currentGroup = {
          sender: message.sender,
          timestamp: message.timestamp,
          messages: [message],
        };
      } else {
        currentGroup.messages.push(message);
      }
    });

    if (currentGroup) groups.push(currentGroup);
    return groups;
  };

  const renderMessageGroups = () => {
    const messages = renderChatMessages();
    const messageGroups = groupMessages(messages);

    return messageGroups.map((group, groupIndex) => (
      <div key={groupIndex} className="social-message-group">
        <div className="social-message-group-header">
          <div
            className="social-message-avatar"
            onClick={() => {
              setSelectedUser(group.sender);
              setIsUserProfileModalOpen(true);
            }}
            style={{ cursor: "pointer" }}
            title={`View ${group.sender.username}'s profile`}
          >
            {group.sender.profile_picture || group.sender.profile_pic_url ? (
              <img
                src={ensureAbsoluteUrl(
                  group.sender.profile_picture || group.sender.profile_pic_url
                )}
                alt={group.sender.username}
              />
            ) : (
              (group.sender.username || group.sender.display_name || "U")
                .charAt(0)
                .toUpperCase()
            )}
          </div>
          <span
            className="social-message-sender"
            onClick={() => {
              setSelectedUser(group.sender);
              setIsUserProfileModalOpen(true);
            }}
            style={{ cursor: "pointer" }}
            title={`View ${
              group.sender.username || group.sender.display_name
            }'s profile`}
          >
            {group.sender.username || group.sender.display_name}
          </span>
          <span className="social-message-timestamp">
            {formatTime(group.timestamp)}
          </span>
        </div>

        {group.messages.map((message, messageIndex) => (
          <div
            key={messageIndex}
            className="social-message"
            onDoubleClick={() => setSelectedMessageForReaction(message)}
          >
            <div className="social-message-content">{message.content}</div>
            {selectedMessageForReaction?.id === message.id && (
              <div className="social-reaction-picker">
                {["👍", "❤️", "😂", "😮", "😢", "😡"].map((emoji) => (
                  <button
                    key={emoji}
                    className="social-reaction-btn"
                    onClick={() => handleReaction(message.id, emoji)}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    ));
  };

  return (
    <div className="social-modern-page">
      <div className="social-modern-header">
        <h1 className="social-modern-title">Social Hub</h1>
        <div
          className={`social-connection-status ${
            isConnected ? "connected" : "disconnected"
          }`}
        >
          {isConnected ? "Connected" : "Disconnected"}
        </div>
      </div>

      <div className="social-modern-content">
        {/* Modern Sidebar */}
        <div className="social-modern-sidebar">
          <div className="social-sidebar-tabs">
            <button
              className={`social-tab-button ${
                activeTab === "chat" ? "active" : ""
              }`}
              onClick={() => setActiveTab("chat")}
            >
              💬 Chat
            </button>
            <button
              className={`social-tab-button ${
                activeTab === "friends" ? "active" : ""
              }`}
              onClick={() => setActiveTab("friends")}
            >
              👥 Friends
              {friends.length > 0 && (
                <span className="social-tab-badge">{friends.length}</span>
              )}
            </button>
            <button
              className={`social-tab-button ${
                activeTab === "requests" ? "active" : ""
              }`}
              onClick={() => setActiveTab("requests")}
            >
              📬 Requests
              {friendRequests.length + sentFriendRequests.length > 0 && (
                <span className="social-tab-badge">
                  {friendRequests.length + sentFriendRequests.length}
                </span>
              )}
            </button>
          </div>

          <div className="social-sidebar-content">
            {activeTab === "chat" && (
              <div className="social-chat-list">
                <div
                  className={`social-chat-item ${
                    currentChat === "global" ? "active" : ""
                  }`}
                  onClick={() => openChat("global")}
                >
                  <div className="social-chat-info">
                    <div className="social-chat-icon">🌐</div>
                    <div className="social-chat-details">
                      <div className="social-chat-name">Global Chat</div>
                      <div className="social-chat-preview">
                        {globalChatMessages.length > 0
                          ? globalChatMessages[
                              globalChatMessages.length - 1
                            ].content.slice(0, 30) + "..."
                          : "Start a conversation..."}
                      </div>
                    </div>
                    <div className="social-chat-meta">
                      {globalUnreadCount > 0 && (
                        <div className="social-unread-badge">
                          {globalUnreadCount}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {friends.map((friend) => (
                  <div
                    key={friend.id}
                    className={`social-chat-item ${
                      currentChat === friend.id ? "active" : ""
                    }`}
                    onClick={() => openChat(friend.id)}
                  >
                    <div className="social-chat-info">
                      <div className="social-chat-icon">
                        {friend.profile_picture || friend.profile_pic_url ? (
                          <img
                            src={ensureAbsoluteUrl(
                              friend.profile_picture || friend.profile_pic_url
                            )}
                            alt={friend.display_name || friend.username}
                          />
                        ) : (
                          (friend.display_name || friend.username || "U")
                            .charAt(0)
                            .toUpperCase()
                        )}
                      </div>
                      <div className="social-chat-details">
                        <div className="social-chat-name">
                          {friend.display_name || friend.username}
                        </div>
                        <div className="social-chat-preview">
                          {chatMessages[friend.id]?.length > 0
                            ? chatMessages[friend.id][
                                chatMessages[friend.id].length - 1
                              ].content.slice(0, 30) + "..."
                            : "No messages yet..."}
                        </div>
                      </div>
                      <div className="social-chat-meta">
                        <div
                          className={`social-status-dot ${
                            friend.status || "offline"
                          }`}
                        ></div>
                        {unreadCounts[friend.id] > 0 && (
                          <div className="social-unread-badge">
                            {unreadCounts[friend.id]}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "friends" && (
              <div className="social-friends-section">
                <div className="social-friends-header">
                  <div className="social-friends-search-container">
                    <div className="social-friends-search">
                      <input
                        type="text"
                        placeholder="Search friends..."
                        value={friendSearchQuery}
                        onChange={(e) => setFriendSearchQuery(e.target.value)}
                        className="social-friends-search-input"
                      />
                    </div>
                    <button
                      className="social-add-friend-btn"
                      onClick={() => setIsAddFriendModalOpen(true)}
                      title="Add Friend"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="social-friends-grid">
                  {filteredFriends.length === 0 ? (
                    <div className="social-no-friends">
                      <div className="icon">👥</div>
                      {friendSearchQuery
                        ? "No friends found matching your search."
                        : "No friends yet. Click + to add friends!"}
                    </div>
                  ) : (
                    filteredFriends.map((friend) => (
                      <div key={friend.id} className="social-friend-card">
                        <div className="social-friend-header">
                          <div className="social-friend-avatar">
                            {friend.profile_picture ||
                            friend.profile_pic_url ? (
                              <img
                                src={ensureAbsoluteUrl(
                                  friend.profile_picture ||
                                    friend.profile_pic_url
                                )}
                                alt={friend.display_name || friend.username}
                              />
                            ) : (
                              (friend.display_name || friend.username || "U")
                                .charAt(0)
                                .toUpperCase()
                            )}
                          </div>
                          <div className="social-friend-details">
                            <div className="social-friend-name">
                              {friend.display_name || friend.username}
                            </div>
                            <div
                              className={`social-friend-status ${
                                friend.status || "offline"
                              }`}
                            >
                              {friend.status || "offline"}
                            </div>
                          </div>
                          <div className="friend-dropdown">
                            <button
                              className="friend-dropdown-toggle"
                              onClick={() => toggleDropdown(friend.id)}
                            >
                              ⋮
                            </button>
                            {openDropdowns[friend.id] && (
                              <div className="friend-dropdown-menu">
                                <button
                                  className="dropdown-item"
                                  onClick={() => openChat(friend.id)}
                                >
                                  💬 Message
                                </button>
                                <button
                                  className="dropdown-item"
                                  onClick={() => handleVisitProfile(friend)}
                                >
                                  👤 Visit Profile
                                </button>
                                <button
                                  className="dropdown-item remove"
                                  onClick={() => handleRemoveFriend(friend)}
                                >
                                  🗑️ Remove Friend
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {activeTab === "requests" && (
              <div className="social-requests-container">
                <div className="social-requests-section">
                  <h4 className="social-requests-title">
                    📥 Received Requests
                  </h4>
                  <div className="social-requests-list">
                    {friendRequests.length === 0 ? (
                      <div className="social-no-requests">
                        No pending friend requests received
                      </div>
                    ) : (
                      friendRequests.map((request) => (
                        <div
                          key={request.id}
                          className="social-request-card received"
                        >
                          <div className="social-request-header">
                            <div className="social-request-avatar">
                              {request.requester.profile_picture ||
                              request.requester.profile_pic_url ? (
                                <img
                                  src={ensureAbsoluteUrl(
                                    request.requester.profile_picture ||
                                      request.requester.profile_pic_url
                                  )}
                                  alt="Profile"
                                  className="social-request-avatar-img"
                                />
                              ) : (
                                <div className="social-request-avatar-placeholder">
                                  {(
                                    request.requester.username ||
                                    request.requester.display_name ||
                                    "U"
                                  )
                                    .charAt(0)
                                    .toUpperCase()}
                                </div>
                              )}
                            </div>
                            <div className="social-request-info">
                              <div className="social-request-name">
                                {request.requester.display_name ||
                                  request.requester.username}
                              </div>
                              <div className="social-request-time">
                                {formatTime(request.created_at)}
                              </div>
                            </div>
                          </div>
                          <div className="social-request-actions">
                            <button
                              className="social-request-btn accept"
                              onClick={() => acceptFriendRequest(request.id)}
                            >
                              ✓ Accept
                            </button>
                            <button
                              className="social-request-btn reject"
                              onClick={() => rejectFriendRequest(request.id)}
                            >
                              ✗ Decline
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="social-requests-section">
                  <h4 className="social-requests-title">📤 Sent Requests</h4>
                  <div className="social-requests-list">
                    {sentFriendRequests.length === 0 ? (
                      <div className="social-no-requests">
                        No pending friend requests sent
                      </div>
                    ) : (
                      sentFriendRequests.map((request) => (
                        <div
                          key={request.id}
                          className="social-request-card sent"
                        >
                          <div className="social-request-header">
                            <div className="social-request-avatar">
                              {request.receiver.profile_picture ||
                              request.receiver.profile_pic_url ? (
                                <img
                                  src={ensureAbsoluteUrl(
                                    request.receiver.profile_picture ||
                                      request.receiver.profile_pic_url
                                  )}
                                  alt="Profile"
                                  className="social-request-avatar-img"
                                />
                              ) : (
                                <div className="social-request-avatar-placeholder">
                                  {(
                                    request.receiver.username ||
                                    request.receiver.display_name ||
                                    "U"
                                  )
                                    .charAt(0)
                                    .toUpperCase()}
                                </div>
                              )}
                            </div>
                            <div className="social-request-info">
                              <div className="social-request-name">
                                {request.receiver.display_name ||
                                  request.receiver.username}
                              </div>
                              <div className="social-request-time">
                                {formatTime(request.created_at)}
                              </div>
                            </div>
                          </div>
                          <div className="social-request-actions">
                            <button
                              className="social-request-btn cancel"
                              onClick={() => cancelFriendRequest(request.id)}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modern Chat Area */}
        <div className="social-chat-main">
          {currentChat ? (
            <>
              <div className="social-chat-header">
                <h3 className="social-chat-title">
                  <span className="social-chat-title-icon">
                    {currentChat === "global" ? "🌐" : "💬"}
                  </span>
                  {currentChat === "global"
                    ? "Global Chat"
                    : friends.find((f) => f.id === currentChat)?.display_name ||
                      friends.find((f) => f.id === currentChat)?.username ||
                      "Chat"}
                </h3>
                <button className="social-close-chat-btn" onClick={closeChat}>
                  ✕
                </button>
              </div>

              <div
                className="social-chat-messages"
                ref={chatMessagesRef}
                onScroll={handleChatScroll}
              >
                {renderMessageGroups()}

                {typingUsers.length > 0 && (
                  <div className="social-typing-indicator">
                    <span>
                      {typingUsers.join(", ")}{" "}
                      {typingUsers.length === 1 ? "is" : "are"} typing
                    </span>
                    <div className="social-typing-dots">
                      <div className="social-typing-dot"></div>
                      <div className="social-typing-dot"></div>
                      <div className="social-typing-dot"></div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {showJumpToNew && (
                <button
                  className="social-jump-to-new"
                  onClick={jumpToNewMessages}
                >
                  Jump to new
                </button>
              )}

              <form
                onSubmit={handleSendMessage}
                className="social-message-form"
              >
                <div className="social-message-input-container">
                  <textarea
                    placeholder={`Message ${
                      currentChat === "global"
                        ? "global chat"
                        : friends.find((f) => f.id === currentChat)
                            ?.display_name ||
                          friends.find((f) => f.id === currentChat)?.username ||
                          "chat"
                    }...`}
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    className="social-message-input"
                    disabled={!isConnected}
                    rows="1"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage(e);
                      }
                    }}
                  />
                  <button
                    type="button"
                    className="social-emoji-btn"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  >
                    😊
                  </button>
                  {showEmojiPicker && (
                    <div className="social-emoji-picker" ref={emojiPickerRef}>
                      {[
                        "😀",
                        "😂",
                        "😍",
                        "🤔",
                        "😊",
                        "👍",
                        "👎",
                        "❤️",
                        "🎉",
                        "🔥",
                      ].map((emoji) => (
                        <button
                          key={emoji}
                          className="social-emoji-option"
                          onClick={() => handleEmojiSelect(emoji)}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  type="submit"
                  className="social-send-btn"
                  disabled={!isConnected || !messageInput.trim()}
                ></button>
              </form>
            </>
          ) : (
            <div className="social-no-chat-selected">
              <div className="social-no-chat-icon">💬</div>
              <h3 className="social-no-chat-title">
                Select a chat to start messaging
              </h3>
              <p className="social-no-chat-subtitle">
                Choose from global chat or message a friend directly
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modern Add Friend Modal */}
      <ModernAddFriendModal
        isOpen={isAddFriendModalOpen}
        onClose={() => setIsAddFriendModalOpen(false)}
        searchUsers={searchUsers}
        sendFriendRequest={sendFriendRequest}
        onUserSelect={(user) => {
          setSelectedUser(user);
          setIsUserProfileModalOpen(true);
        }}
        friends={friends}
      />

      {/* User Profile Modal */}
      <UserProfileModal
        isOpen={isUserProfileModalOpen}
        onClose={() => {
          setIsUserProfileModalOpen(false);
          setSelectedUser(null);
        }}
        user={selectedUser}
      />

      {/* Confirmation Modal */}
      {confirmationModal.isOpen && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h3>Confirm Remove Friend</h3>
            </div>
            <div className="modal-body">
              <p>{confirmationModal.message}</p>
            </div>
            <div className="modal-footer">
              <button
                className="btn-secondary"
                onClick={() =>
                  setConfirmationModal({
                    isOpen: false,
                    friend: null,
                    message: "",
                  })
                }
              >
                Cancel
              </button>
              <button className="btn-danger" onClick={confirmRemoveFriend}>
                Remove Friend
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
