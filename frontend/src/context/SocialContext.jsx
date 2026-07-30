import { API_BASE, WS_BASE } from "../api/config.js";
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
} from "react";
import { useNotifications } from "./NotificationContext";
import { apiCallWithRefresh } from "../utils/tokenUtils";

const SocialContext = createContext();

export const useSocial = () => {
  const context = useContext(SocialContext);
  if (!context) {
    throw new Error("useSocial must be used within a SocialProvider");
  }
  return context;
};

export const SocialProvider = ({ children, token, userId }) => {
  console.log("SocialProvider initialized with:", {
    token: token ? "present" : "missing",
    userId: userId ? userId : "missing",
    tokenLength: token ? token.length : 0,
  });

  const [friends, setFriends] = useState([]);
  const [onlineFriends, setOnlineFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [sentFriendRequests, setSentFriendRequests] = useState([]);
  const [chatMessages, setChatMessages] = useState({});
  const [unreadCounts, setUnreadCounts] = useState({});
  const [isConnected, setIsConnected] = useState(false);
  const [currentChat, setCurrentChat] = useState(null);
  const [currentModalChat, setCurrentModalChat] = useState(null);
  const [globalChatMessages, setGlobalChatMessages] = useState([]);
  const [globalUnreadCount, setGlobalUnreadCount] = useState(0);

  const wsRef = useRef(null);
  const { showNotification } = useNotifications();

  // API base URL
  const API_BASE_URL = API_BASE;

  // Helper function to make API calls with auto token refresh
  const apiCall = async (endpoint, options = {}) => {
    const url = `${API_BASE_URL}${endpoint}`;

    try {
      const response = await apiCallWithRefresh(url, options);

      if (!response.ok) {
        throw new Error(`API call failed: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error("API call error:", error);
      throw error;
    }
  };

  // Initialize WebSocket connection
  useEffect(() => {
    console.log(
      "WebSocket effect triggered. Token:",
      token ? "present" : "missing",
      "UserId:",
      userId
    );

    if (!token || !userId) {
      console.log("Missing token or userId, not connecting WebSocket");
      return;
    }

    let isConnecting = false;
    let reconnectTimer = null;

    const connectWebSocket = () => {
      if (isConnecting) {
        console.log("Already connecting, skipping...");
        return;
      }

      const wsUrl = `${WS_BASE}/ws/social/?token=${token}`;

      console.log("Attempting to connect to WebSocket:", wsUrl);
      console.log(
        "Token being used:",
        token ? token.substring(0, 20) + "..." : "MISSING"
      );

      try {
        isConnecting = true;
        wsRef.current = new WebSocket(wsUrl);
        console.log("WebSocket object created:", wsRef.current);
        console.log("Initial WebSocket state:", wsRef.current.readyState);

        wsRef.current.onopen = () => {
          isConnecting = false;
          setIsConnected(true);
          console.log("Social WebSocket connected successfully");
          console.log("WebSocket state after open:", wsRef.current.readyState);

          // Clear any reconnect timer
          if (reconnectTimer) {
            clearTimeout(reconnectTimer);
            reconnectTimer = null;
          }

          // Set user status to online when connected
          setTimeout(() => {
            updateUserStatus("online");
          }, 1000); // Wait 1 second for connection to stabilize
        };

        wsRef.current.onclose = (event) => {
          isConnecting = false;
          setIsConnected(false);
          console.log(
            "Social WebSocket disconnected. Code:",
            event.code,
            "Reason:",
            event.reason
          );

          // Only attempt to reconnect if this wasn't a clean close
          if (event.code !== 1000 && !reconnectTimer) {
            console.log("Attempting to reconnect WebSocket in 3 seconds...");
            reconnectTimer = setTimeout(() => {
              if (wsRef.current?.readyState === WebSocket.CLOSED) {
                connectWebSocket();
              }
            }, 3000);
          }
        };

        wsRef.current.onmessage = (event) => {
          const data = JSON.parse(event.data);
          console.log("WebSocket message received:", data);
          handleWebSocketMessage(data);
        };

        wsRef.current.onerror = (error) => {
          isConnecting = false;
          console.error("WebSocket error:", error);
          console.error(
            "WebSocket state during error:",
            wsRef.current?.readyState
          );
          setIsConnected(false);
        };
      } catch (error) {
        isConnecting = false;
        console.error("Error creating WebSocket:", error);
        setIsConnected(false);
      }
    };

    connectWebSocket();

    return () => {
      console.log("Cleaning up WebSocket connection");

      // Clear reconnect timer
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }

      // Close WebSocket if it exists
      if (wsRef.current) {
        // Set isConnecting to false to prevent reconnection
        isConnecting = false;

        // Close with a clean close code
        if (
          wsRef.current.readyState === WebSocket.OPEN ||
          wsRef.current.readyState === WebSocket.CONNECTING
        ) {
          wsRef.current.close(1000, "Component unmounting");
        }
      }
    };
  }, [token, userId]);

  // Set user offline when leaving the page
  useEffect(() => {
    // Only meaningful with a session. Registered unconditionally before, so an
    // unauthenticated page unload went down the token-refresh path with no token
    // and threw "No refresh token found" into the console.
    if (!token) return;

    const handleBeforeUnload = () => {
      updateUserStatus("offline");
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [token]);

  // Handle WebSocket messages
  const handleWebSocketMessage = (data) => {
    switch (data.type) {
      case "initial_data":
        console.log("Initial data received:", data);
        setFriends(data.friends || []);
        updateOnlineFriends(data.friends || []);
        break;

      case "chat_message":
        console.log("Chat message received:", data.message);
        handleNewMessage(data.message);
        break;

      case "friend_request":
        console.log("Friend request received:", data.data);
        // Add the new friend request to the list
        setFriendRequests((prev) => [...prev, data.data]);

        // Also reload the friend requests to ensure we have the latest data
        loadFriendRequests();

        showNotification({
          type: "info",
          title: "New Friend Request",
          message: `${data.data.requester.username} sent you a friend request`,
          icon: "👥",
        });
        break;

      case "friend_accepted":
        console.log("Friend accepted:", data.data);
        setFriends((prev) => [...prev, data.data]);
        // Also reload friends list to ensure we have the latest data
        loadFriends();
        showNotification({
          type: "success",
          title: "Friend Request Accepted",
          message: `${data.data.username} accepted your friend request`,
          icon: "✅",
        });
        break;

      case "status_update":
        console.log("Status update received:", data.data);
        updateFriendStatus(data.data);
        break;

      case "notification":
        showNotification({
          type: "info",
          title: data.data.title,
          message: data.data.message,
          icon: "🔔",
        });
        break;

      default:
        console.log("Unknown message type:", data.type);
    }
  };

  // Update friend status
  const updateFriendStatus = (statusUpdate) => {
    console.log("Updating friend status:", statusUpdate);
    setFriends((prev) => {
      const updated = prev.map((friend) =>
        friend.id === statusUpdate.user_id
          ? { ...friend, status: statusUpdate.status }
          : friend
      );
      console.log("Friends after status update:", updated);

      // Update online friends list with the new data
      const online = updated.filter((friend) => friend.status === "online");
      console.log("Online friends after status update:", online);
      setOnlineFriends(online);

      return updated;
    });
  };

  // Update online friends list
  const updateOnlineFriends = (friendsList = null) => {
    const currentFriends = friendsList || friends;
    const online = currentFriends.filter(
      (friend) => friend.status === "online"
    );
    setOnlineFriends(online);
  };

  // Handle new message
  const handleNewMessage = (message) => {
    console.log("Processing new message:", message);
    if (message.message_type === "global") {
      setGlobalChatMessages((prev) => {
        const updated = [...prev, message];
        console.log("Updated global messages:", updated);
        return updated;
      });
      if (currentChat !== "global") {
        setGlobalUnreadCount((prev) => prev + 1);
      }
    } else {
      const chatId =
        message.sender.id === parseInt(userId)
          ? message.receiver.id
          : message.sender.id;
      console.log("Chat ID for private message:", chatId);
      setChatMessages((prev) => {
        const updated = {
          ...prev,
          [chatId]: [...(prev[chatId] || []), message],
        };
        console.log("Updated chat messages:", updated);
        return updated;
      });

      if (currentChat !== chatId) {
        setUnreadCounts((prev) => ({
          ...prev,
          [chatId]: (prev[chatId] || 0) + 1,
        }));
      }
    }
  };

  // Load initial data
  useEffect(() => {
    if (!token) return;

    const loadInitialData = async () => {
      try {
        // Load friends
        const friendsData = await apiCall("/social/friends/");
        setFriends(friendsData);
        updateOnlineFriends(friendsData);

        // Load friend requests
        const requestsData = await apiCall("/social/friend_requests/");
        setFriendRequests(requestsData.received || []);
        setSentFriendRequests(requestsData.sent || []);

        // Load global chat messages
        const globalMessages = await apiCall("/social/messages/?type=global");
        setGlobalChatMessages(globalMessages);
      } catch (error) {
        console.error("Error loading initial data:", error);
      }
    };

    loadInitialData();
  }, [token]);

  // Load initial data when component mounts
  useEffect(() => {
    if (token && userId) {
      loadFriends();
      loadFriendRequests();
    }
  }, [token, userId]);

  // Load friends from API
  const loadFriends = async () => {
    try {
      const friendsData = await apiCall("/social/friends/");
      console.log("Friends loaded:", friendsData);
      setFriends(friendsData || []);
      updateOnlineFriends(friendsData || []);
    } catch (error) {
      console.error("Error loading friends:", error);
    }
  };

  // Load friend requests from API
  const loadFriendRequests = async () => {
    try {
      const requestsData = await apiCall("/social/friend_requests/");
      console.log("Friend requests loaded:", requestsData);
      setFriendRequests(requestsData.received || []);
      setSentFriendRequests(requestsData.sent || []);
    } catch (error) {
      console.error("Error loading friend requests:", error);
    }
  };

  // Send message via WebSocket
  const sendMessage = (content, messageType = "global", receiverId = null) => {
    console.log("Attempting to send message:", {
      content,
      messageType,
      receiverId,
    });
    console.log("WebSocket state:", wsRef.current?.readyState);
    console.log(
      "WebSocket states: CONNECTING =",
      WebSocket.CONNECTING,
      "OPEN =",
      WebSocket.OPEN,
      "CLOSING =",
      WebSocket.CLOSING,
      "CLOSED =",
      WebSocket.CLOSED
    );

    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.error(
        "WebSocket not connected. Current state:",
        wsRef.current?.readyState
      );
      showNotification({
        type: "error",
        title: "Connection Error",
        message: "Not connected to chat server. Please wait for connection.",
        icon: "🔴",
      });
      return;
    }

    const message = {
      type: "send_message",
      content,
      message_type: messageType,
      receiver_id: receiverId,
    };

    console.log("Sending WebSocket message:", message);
    console.log("WebSocket state:", wsRef.current.readyState);
    wsRef.current.send(JSON.stringify(message));
    console.log("Message sent successfully");
  };

  // Convenience functions for friend requests
  const acceptFriendRequest = (requestId) => {
    respondToFriendRequest(requestId, "accept");
  };

  const rejectFriendRequest = (requestId) => {
    respondToFriendRequest(requestId, "reject");
  };

  // Convenience functions for sending messages
  const sendGlobalMessage = (content) => {
    sendMessage(content, "global");
  };

  const sendPrivateMessage = (receiverId, content) => {
    sendMessage(content, "private", receiverId);
  };

  // API functions
  const sendFriendRequest = async (username) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/social/send_friend_request/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ username }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.error("Friend request failed:", data);

        // Handle specific case where friend request already exists
        if (
          data.error === "Request exists" ||
          data.message === "Friend request already exists" ||
          data.error === "Friend request already exists"
        ) {
          showNotification({
            type: "info",
            title: "Friend Request Already Sent",
            message: `Friend request already sent to ${username}`,
            icon: "ℹ️",
          });
          return {
            success: false,
            error: "Request already exists",
            alreadyExists: true,
          };
        }

        // Handle case where user tries to send friend request to themselves
        if (
          data.error === "Invalid request" ||
          data.message === "Cannot send friend request to yourself"
        ) {
          showNotification({
            type: "warning",
            title: "Cannot Add Yourself",
            message: "You cannot send a friend request to yourself",
            icon: "⚠️",
          });
          return {
            success: false,
            error: "Cannot add yourself",
            selfRequest: true,
          };
        }

        // Handle token expiration
        if (
          data.detail === "Given token not valid for any token type" ||
          data.code === "token_not_valid"
        ) {
          showNotification({
            type: "error",
            title: "Session Expired",
            message: "Please log in again to continue",
            icon: "🔐",
          });
          return { success: false, error: "Token expired", tokenExpired: true };
        }

        // Handle other errors
        throw new Error(
          data.error || data.message || "Failed to send friend request"
        );
      }

      showNotification({
        type: "success",
        title: "Friend Request Sent",
        message: `Friend request sent to ${username}`,
        icon: "👥",
      });

      // Reload sent friend requests to show the new request
      try {
        const requestsData = await apiCall("/social/friend_requests/");
        setSentFriendRequests(requestsData.sent || []);
      } catch (error) {
        console.error("Error reloading sent friend requests:", error);
      }

      return { success: true, data };
    } catch (error) {
      console.error("Error sending friend request:", error);
      const errorMessage = error.message || "Failed to send friend request";

      showNotification({
        type: "error",
        title: "Error",
        message: errorMessage,
        icon: "❌",
      });

      return { success: false, error: errorMessage };
    }
  };

  const respondToFriendRequest = async (friendshipId, action) => {
    try {
      await apiCall("/social/respond_friend_request/", {
        method: "POST",
        body: JSON.stringify({
          friendship_id: friendshipId,
          action,
        }),
      });

      setFriendRequests((prev) =>
        prev.filter((req) => req.id !== friendshipId)
      );

      if (action === "accept") {
        // Reload friends list
        await loadFriends();
      }

      showNotification({
        type: "success",
        title:
          "Friend Request " + (action === "accept" ? "Accepted" : "Rejected"),
        message: `Friend request ${action}ed`,
        icon: action === "accept" ? "✅" : "❌",
      });
    } catch (error) {
      console.error("Error responding to friend request:", error);
      showNotification({
        type: "error",
        title: "Error",
        message: "Failed to respond to friend request",
        icon: "❌",
      });
    }
  };

  const searchUsers = async (query) => {
    try {
      // Don't search if no token
      if (!token) {
        console.error("No token available for search");
        return [];
      }

      const results = await apiCall(
        `/social/search_users/?q=${encodeURIComponent(query)}`
      );

      return results;
    } catch (error) {
      console.error("Error searching users:", error);

      // If it's an authentication error, don't trigger the logout from here
      // Let the apiCall handle it
      if (error.message?.includes("401")) {
        console.log("Search failed due to authentication, stopping search");
        return [];
      }

      return [];
    }
  };

  // Load chat messages for a specific chat
  const loadChatMessages = async (chatId) => {
    try {
      if (chatId === "global") {
        const messagesData = await apiCall("/social/messages/?type=global");
        setGlobalChatMessages(messagesData || []);
      } else {
        // For private messages, chatId is the friend's ID
        const friend = friends.find((f) => f.id === chatId);
        if (friend) {
          const messagesData = await apiCall(
            `/social/messages/?type=private&receiver_id=${friend.id}`
          );
          setChatMessages((prev) => ({
            ...prev,
            [chatId]: messagesData || [],
          }));
        } else {
          // If friend not found in current friends list, try to load by ID directly
          const messagesData = await apiCall(
            `/social/messages/?type=private&receiver_id=${chatId}`
          );
          setChatMessages((prev) => ({
            ...prev,
            [chatId]: messagesData || [],
          }));
        }
      }
    } catch (error) {
      console.error("Error loading chat messages:", error);
    }
  };

  const openChat = (chatId) => {
    setCurrentChat(chatId);

    if (chatId === "global") {
      setGlobalUnreadCount(0);
      // Load global messages if not already loaded
      if (globalChatMessages.length === 0) {
        loadChatMessages("global");
      }
    } else {
      setUnreadCounts((prev) => ({
        ...prev,
        [chatId]: 0,
      }));

      // Load messages if not already loaded
      if (!chatMessages[chatId]) {
        loadChatMessages(chatId);
      }
    }
  };

  const openModalChat = (chatId) => {
    setCurrentModalChat(chatId);

    if (chatId === "global") {
      setGlobalUnreadCount(0);
    } else {
      setUnreadCounts((prev) => ({
        ...prev,
        [chatId]: 0,
      }));

      // Load messages if not already loaded
      if (!chatMessages[chatId]) {
        loadChatMessages(chatId);
      }
    }
  };

  const closeChat = () => {
    setCurrentChat(null);
  };

  const closeModalChat = () => {
    setCurrentModalChat(null);
  };

  const getTotalUnreadCount = () => {
    const privateUnread = Object.values(unreadCounts).reduce(
      (sum, count) => sum + count,
      0
    );
    return privateUnread + globalUnreadCount;
  };

  const updateUserStatus = async (status) => {
    try {
      // First, update via API
      const response = await apiCall("/social/update_status/", {
        method: "POST",
        body: JSON.stringify({ status }),
      });

      if (response.success) {
        console.log("Status updated successfully:", response.status);
      }

      // Also send via WebSocket if connected
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: "update_status",
            status,
          })
        );
      }
    } catch (error) {
      console.error("Error updating user status:", error);
    }
  };

  const cancelFriendRequest = async (friendshipId) => {
    try {
      await apiCall("/social/cancel_friend_request/", {
        method: "POST",
        body: JSON.stringify({
          friendship_id: friendshipId,
        }),
      });

      // Remove from sent requests
      setSentFriendRequests((prev) =>
        prev.filter((req) => req.id !== friendshipId)
      );

      showNotification({
        type: "success",
        title: "Friend Request Cancelled",
        message: "Friend request has been cancelled",
        icon: "✅",
      });
    } catch (error) {
      console.error("Error cancelling friend request:", error);
      showNotification({
        type: "error",
        title: "Error",
        message: "Failed to cancel friend request",
        icon: "❌",
      });
    }
  };

  const removeFriend = async (username) => {
    try {
      await apiCall("/social/remove_friend/", {
        method: "POST",
        body: JSON.stringify({
          username: username,
        }),
      });

      // Remove from friends list
      setFriends((prev) =>
        prev.filter((friend) => friend.username !== username)
      );

      // Remove from online friends
      setOnlineFriends((prev) => prev.filter((friend) => friend !== username));

      // Close chat if it's open with this friend
      if (currentChat === username) {
        closeChat();
      }

      showNotification({
        type: "success",
        title: "Friend Removed",
        message: `${username} has been removed from your friends`,
        icon: "👥",
      });
    } catch (error) {
      console.error("Error removing friend:", error);
      showNotification({
        type: "error",
        title: "Error",
        message: "Failed to remove friend",
        icon: "❌",
      });
    }
  };

  const value = {
    friends,
    onlineFriends,
    friendRequests,
    sentFriendRequests,
    chatMessages,
    unreadCounts,
    isConnected,
    currentChat,
    currentModalChat,
    globalChatMessages,
    globalUnreadCount,
    sendMessage,
    sendGlobalMessage,
    sendPrivateMessage,
    sendFriendRequest,
    respondToFriendRequest,
    searchUsers,
    openChat,
    openModalChat,
    closeChat,
    closeModalChat,
    getTotalUnreadCount,
    updateUserStatus,
    acceptFriendRequest,
    rejectFriendRequest,
    cancelFriendRequest,
    removeFriend,
    loadFriends,
    loadFriendRequests,
    loadChatMessages,
  };

  return (
    <SocialContext.Provider value={value}>{children}</SocialContext.Provider>
  );
};
