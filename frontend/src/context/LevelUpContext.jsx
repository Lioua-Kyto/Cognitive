import { createContext, useContext, useState, useEffect } from "react";

const LevelUpContext = createContext();

export const useLevelUp = () => {
  const context = useContext(LevelUpContext);
  if (!context) {
    throw new Error("useLevelUp must be used within a LevelUpProvider");
  }
  return context;
};

export const LevelUpProvider = ({ children }) => {
  const [levelUpData, setLevelUpData] = useState(null);
  const [lastKnownLevel, setLastKnownLevel] = useState(
    parseInt(localStorage.getItem("lastKnownLevel")) || 1
  );

  const triggerLevelUp = (data) => {
    setLevelUpData(data);
    // Store the new level as the last known level
    localStorage.setItem("lastKnownLevel", data.newLevel.toString());
    setLastKnownLevel(data.newLevel);
  };

  const clearLevelUp = () => {
    setLevelUpData(null);
  };

  // Check for level up on user data change
  const checkForLevelUp = (currentUserLevel) => {
    if (!currentUserLevel) return;

    const currentLevel = parseInt(currentUserLevel);
    if (currentLevel > lastKnownLevel) {
      // User leveled up! Trigger notification
      triggerLevelUp({
        oldLevel: lastKnownLevel,
        newLevel: currentLevel,
        totalXP: null, // Will be filled by backend response if available
      });
    } else {
      // Update last known level if it's the same (for initialization)
      if (currentLevel === lastKnownLevel || lastKnownLevel === 1) {
        localStorage.setItem("lastKnownLevel", currentLevel.toString());
        setLastKnownLevel(currentLevel);
      }
    }
  };

  return (
    <LevelUpContext.Provider
      value={{
        levelUpData,
        triggerLevelUp,
        clearLevelUp,
        checkForLevelUp,
        lastKnownLevel,
      }}
    >
      {children}
    </LevelUpContext.Provider>
  );
};
