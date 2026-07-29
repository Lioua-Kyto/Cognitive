import React, { useState, useEffect, useRef } from "react";
import { useSocial } from "../context/SocialContext";
import "./Styles/ModernChat.css";

const ModernChat = ({ onNavigateToProfile }) => {
  const {
    friends,
    onlineFriends,
    globalChatMessages,
    currentChat,
    openChat,
    closeChat,
    sendGlobalMessage,
    sendPrivateMessage,
    chatMessages,
    globalUnreadCount,
    unreadCounts,
    isConnected,
  } = useSocial();

  const [messageInput, setMessageInput] = useState("");
  const [showJumpToBottom, setShowJumpToBottom] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [replyingTo, setReplyingTo] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);

  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (isAtBottom) {
      scrollToBottom();
    }
  }, [globalChatMessages, chatMessages, currentChat]);

  // Handle scroll to detect if user is at bottom
  useEffect(() => {
    const handleScroll = () => {
      if (messagesContainerRef.current) {
        const { scrollTop, scrollHeight, clientHeight } =
          messagesContainerRef.current;
        const isBottom = scrollTop + clientHeight >= scrollHeight - 10;
        setIsAtBottom(isBottom);
        setShowJumpToBottom(!isBottom);
      }
    };

    const container = messagesContainerRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll);
      return () => container.removeEventListener("scroll", handleScroll);
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const jumpToBottom = () => {
    scrollToBottom();
    setShowJumpToBottom(false);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!messageInput.trim()) return;

    const message = {
      content: messageInput.trim(),
      replyTo: replyingTo?.id || null,
    };

    if (currentChat === "global") {
      sendGlobalMessage(message.content);
    } else if (currentChat) {
      sendPrivateMessage(currentChat, message.content);
    }

    setMessageInput("");
    setReplyingTo(null);
    inputRef.current?.focus();
  };

  const handleReply = (message) => {
    setReplyingTo(message);
    inputRef.current?.focus();
  };

  const cancelReply = () => {
    setReplyingTo(null);
  };

  const formatTime = (timestamp) => {
    const now = new Date();
    const messageTime = new Date(timestamp);
    const diffInHours = (now - messageTime) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return messageTime.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else {
      return messageTime.toLocaleDateString([], {
        month: "short",
        day: "numeric",
      });
    }
  };

  const groupMessages = (messages) => {
    const grouped = [];
    let currentGroup = null;

    messages.forEach((message) => {
      const messageTime = new Date(message.timestamp);
      const shouldGroup =
        currentGroup &&
        currentGroup.sender === message.sender &&
        messageTime - new Date(currentGroup.lastTimestamp) < 300000; // 5 minutes

      if (shouldGroup) {
        currentGroup.messages.push(message);
        currentGroup.lastTimestamp = message.timestamp;
      } else {
        currentGroup = {
          sender: message.sender,
          messages: [message],
          lastTimestamp: message.timestamp,
        };
        grouped.push(currentGroup);
      }
    });

    return grouped;
  };

  const renderChatMessages = () => {
    const messages =
      currentChat === "global"
        ? globalChatMessages
        : chatMessages[currentChat] || [];

    const groupedMessages = groupMessages(messages);

    return groupedMessages.map((group, groupIndex) => (
      <div key={groupIndex} className="message-group">
        <div className="message-header">
          <div className="sender-avatar">
            <div className="avatar-placeholder">
              {group.sender.charAt(0).toUpperCase()}
            </div>
          </div>
          <div className="message-meta">
            <span className="sender-name">{group.sender}</span>
            <span className="message-time">
              {formatTime(group.messages[0].timestamp)}
            </span>
          </div>
        </div>

        <div className="message-content">
          {group.messages.map((message, messageIndex) => (
            <div key={messageIndex} className="message-item">
              {message.replyTo && (
                <div className="reply-reference">
                  <span>↳ Replying to message</span>
                </div>
              )}
              <div className="message-text">{message.content}</div>
              {messageIndex > 0 && (
                <div className="message-timestamp">
                  {formatTime(message.timestamp)}
                </div>
              )}
              <div className="message-actions">
                <button
                  className="message-action"
                  onClick={() => handleReply(message)}
                  title="Reply"
                >
                  ↵
                </button>
                <button className="message-action" title="React">
                  😊
                </button>
                <button className="message-action" title="More">
                  ⋯
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    ));
  };

  const emojis = ["😊", "😂", "❤️", "👍", "👎", "😢", "😮", "😡"];

  return (
    <div className="modern-chat">
      <div className="chat-sidebar">
        <div className="chat-header">
          <h3>💬 Chat</h3>
          <div
            className={`connection-status ${
              isConnected ? "connected" : "disconnected"
            }`}
          >
            <span className="status-dot"></span>
            {isConnected ? "Connected" : "Disconnected"}
          </div>
        </div>

        <div className="chat-channels">
          <div className="channel-section">
            <h4>Channels</h4>
            <button
              className={`channel-item ${
                currentChat === "global" ? "active" : ""
              }`}
              onClick={() => openChat("global")}
            >
              <span className="channel-icon">#</span>
              <span className="channel-name">Global</span>
              {globalUnreadCount > 0 && (
                <span className="unread-badge">{globalUnreadCount}</span>
              )}
            </button>
          </div>

          <div className="channel-section">
            <h4>Direct Messages</h4>
            <div className="friends-list">
              {friends.map((friend) => (
                <div key={friend.id} className="friend-item-container">
                  <button
                    className={`friend-item ${
                      currentChat === friend.username ? "active" : ""
                    }`}
                    onClick={() => openChat(friend.username)}
                  >
                    <div className="friend-avatar">
                      <div className="avatar-placeholder">
                        {friend.username.charAt(0).toUpperCase()}
                      </div>
                      <div
                        className={`status-indicator ${
                          onlineFriends.includes(friend.username)
                            ? "online"
                            : "offline"
                        }`}
                      ></div>
                    </div>
                    <div className="friend-info">
                      <span className="friend-name">{friend.username}</span>
                      <span className="friend-status">
                        {onlineFriends.includes(friend.username)
                          ? "Online"
                          : "Offline"}
                      </span>
                    </div>
                    {unreadCounts[friend.username] > 0 && (
                      <span className="unread-badge">
                        {unreadCounts[friend.username]}
                      </span>
                    )}
                  </button>
                  <button
                    className="profile-btn"
                    onClick={() => onNavigateToProfile(friend)}
                    title="View Profile"
                  >
                    👤
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="chat-main">
        {currentChat ? (
          <>
            <div className="chat-header-main">
              <div className="chat-title">
                {currentChat === "global" ? (
                  <>
                    <span className="chat-icon">#</span>
                    <span>Global Chat</span>
                  </>
                ) : (
                  <>
                    <div className="chat-avatar">
                      <div className="avatar-placeholder">
                        {currentChat.charAt(0).toUpperCase()}
                      </div>
                      <div
                        className={`status-indicator ${
                          onlineFriends.includes(currentChat)
                            ? "online"
                            : "offline"
                        }`}
                      ></div>
                    </div>
                    <div className="chat-info">
                      <span className="chat-name">{currentChat}</span>
                      <span className="chat-status">
                        {onlineFriends.includes(currentChat)
                          ? "Online"
                          : "Offline"}
                      </span>
                    </div>
                  </>
                )}
              </div>
              <div className="chat-actions">
                <button className="chat-action" title="Search">
                  🔍
                </button>
                <button className="chat-action" title="Video Call">
                  📹
                </button>
                <button className="chat-action" title="Voice Call">
                  📞
                </button>
                <button className="chat-action" title="Settings">
                  ⚙️
                </button>
                <button className="chat-action" onClick={closeChat}>
                  ✕
                </button>
              </div>
            </div>

            <div className="chat-messages" ref={messagesContainerRef}>
              <div className="messages-container">
                {renderChatMessages()}
                {typingUsers.length > 0 && (
                  <div className="typing-indicator">
                    <div className="typing-dots">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                    <span>
                      {typingUsers.join(", ")}{" "}
                      {typingUsers.length === 1 ? "is" : "are"} typing...
                    </span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {showJumpToBottom && (
              <button className="jump-to-bottom" onClick={jumpToBottom}>
                <span>↓</span>
                Jump to present
              </button>
            )}

            <div className="chat-input-container">
              {replyingTo && (
                <div className="reply-preview">
                  <span>
                    ↳ Replying to <strong>{replyingTo.sender}</strong>
                  </span>
                  <button className="cancel-reply" onClick={cancelReply}>
                    ✕
                  </button>
                </div>
              )}

              <form onSubmit={handleSendMessage} className="chat-input-form">
                <div className="input-wrapper">
                  <button
                    type="button"
                    className="input-action"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  >
                    😊
                  </button>

                  <input
                    ref={inputRef}
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder={`Message ${
                      currentChat === "global" ? "#global" : currentChat
                    }`}
                    className="message-input"
                    disabled={!isConnected}
                  />

                  <button type="button" className="input-action">
                    📎
                  </button>
                  <button type="button" className="input-action">
                    🎤
                  </button>

                  <button
                    type="submit"
                    className="send-button"
                    disabled={!messageInput.trim() || !isConnected}
                  >
                    ➤
                  </button>
                </div>
              </form>

              {showEmojiPicker && (
                <div className="emoji-picker">
                  {emojis.map((emoji, index) => (
                    <button
                      key={index}
                      className="emoji-button"
                      onClick={() => {
                        setMessageInput((prev) => prev + emoji);
                        setShowEmojiPicker(false);
                      }}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="chat-welcome">
            <div className="welcome-icon">💬</div>
            <h3>Welcome to Chat!</h3>
            <p>Select a channel or friend to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ModernChat;
