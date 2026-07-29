import { useEffect, useContext, useRef } from "react";
import { AuthContext } from "../context/AuthContext";
import { useLevelUp } from "../context/LevelUpContext";

export const useLevelTracker = () => {
  const { user, updateUser, token } = useContext(AuthContext);
  const { triggerLevelUp, checkForLevelUp } = useLevelUp();
  const previousLevelRef = useRef(null);
  const hasCheckedInitialLevel = useRef(false);

  useEffect(() => {
    if (!user || !user.level) return;

    // On first load, check against stored level in localStorage
    if (!hasCheckedInitialLevel.current) {
      checkForLevelUp(user.level);
      hasCheckedInitialLevel.current = true;
      previousLevelRef.current = user.level;
      return;
    }

    // Initialize previous level on first load
    if (previousLevelRef.current === null) {
      previousLevelRef.current = user.level;
      return;
    }

    // Check for level up
    if (user.level > previousLevelRef.current) {
      console.log(
        `🎉 Level up detected: ${previousLevelRef.current} -> ${user.level}`
      );

      triggerLevelUp({
        oldLevel: previousLevelRef.current,
        newLevel: user.level,
        totalXP: user.experience,
      });

      previousLevelRef.current = user.level;
    } else if (user.level !== previousLevelRef.current) {
      // Update previous level if it changed for any reason
      previousLevelRef.current = user.level;
    }
  }, [user?.level, user?.experience, triggerLevelUp, checkForLevelUp]);

  return null; // This hook doesn't return anything, just tracks level changes
};
