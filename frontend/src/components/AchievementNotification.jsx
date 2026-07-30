import React, { useState, useEffect } from "react";

const AchievementNotification = () => {
  const [notifications, setNotifications] = useState([]);
  const [notificationCounter, setNotificationCounter] = useState(0);

  useEffect(() => {
    const handleAchievementEarned = (event) => {
      const { achievement, badge } = event.detail;

      const newNotification = {
        id: `${Date.now()}-${notificationCounter}`, // Unique ID
        type: achievement ? "achievement" : "badge",
        data: achievement || badge,
        timestamp: Date.now(),
      };

      setNotificationCounter((prev) => prev + 1);
      setNotifications((prev) => [...prev, newNotification]);

      // Notifications will only be removed manually - no auto-dismiss
    };

    // Listen for custom achievement events
    window.addEventListener("achievementEarned", handleAchievementEarned);
    window.addEventListener("badgeEarned", handleAchievementEarned);

    return () => {
      window.removeEventListener("achievementEarned", handleAchievementEarned);
      window.removeEventListener("badgeEarned", handleAchievementEarned);
    };
  }, []);

  const removeNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  if (notifications.length === 0) return null;

  return (
    <div className="achievement-notifications-container">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`achievement-notification ${notification.type}`}
          onClick={() => removeNotification(notification.id)}
        >
          <div className="notification-icon">
            {notification.type === "achievement" ? "🏆" : "🎖️"}
          </div>
          <div className="notification-content">
            <div className="notification-header">
              <span className="notification-type">
                {notification.type === "achievement"
                  ? "Achievement Unlocked!"
                  : "Badge Earned!"}
              </span>
              <button
                className="notification-close"
                onClick={(e) => {
                  e.stopPropagation();
                  removeNotification(notification.id);
                }}
              >
                ×
              </button>
            </div>
            <div className="notification-title">{notification.data.name}</div>
            <div className="notification-description">
              {notification.data.description}
            </div>
            {notification.type === "achievement" &&
              notification.data.points && (
                <div className="notification-points">
                  +{notification.data.points} XP
                </div>
              )}
          </div>
          <div className="notification-emoji">{notification.data.icon}</div>
        </div>
      ))}
    </div>
  );
};

// Helper function to trigger notifications
export const triggerAchievementNotification = (achievement) => {
  const event = new CustomEvent("achievementEarned", {
    detail: { achievement },
  });
  window.dispatchEvent(event);
};

export const triggerBadgeNotification = (badge) => {
  const event = new CustomEvent("badgeEarned", {
    detail: { badge },
  });
  window.dispatchEvent(event);
};

export default AchievementNotification;
