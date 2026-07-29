import React, { createContext, useContext, useState, useCallback } from "react";

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider"
    );
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const showNotification = useCallback((notification) => {
    const id = Date.now() + Math.random();
    const newNotification = {
      id,
      type: "info",
      duration: 3000,
      ...notification,
    };

    setNotifications((prev) => [...prev, newNotification]);

    // Auto-remove after duration
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, newNotification.duration);

    return id;
  }, []);

  const showAchievement = useCallback(
    (achievement) => {
      return showNotification({
        type: "achievement",
        ...achievement,
      });
    },
    [showNotification]
  );

  const removeNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Make functions available globally for convenience
  React.useEffect(() => {
    window.showNotification = showNotification;
    window.showAchievement = showAchievement;

    return () => {
      delete window.showNotification;
      delete window.showAchievement;
    };
  }, [showNotification, showAchievement]);

  const value = {
    notifications,
    showNotification,
    showAchievement,
    removeNotification,
    clearAllNotifications,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;
