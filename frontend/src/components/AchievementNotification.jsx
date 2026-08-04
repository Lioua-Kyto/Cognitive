import { useEffect, useRef, useState } from "react";

/**
 * The achievement/badge toast stack.
 *
 * The version this replaces made the whole card a click-to-dismiss `div`, so the
 * only way to clear a toast was a mouse, and nothing announced it at all.
 */
const AchievementNotification = () => {
  const [notifications, setNotifications] = useState([]);
  const counter = useRef(0);

  useEffect(() => {
    const handleAchievementEarned = (event) => {
      const { achievement, badge } = event.detail;

      counter.current += 1;
      setNotifications((prev) => [
        ...prev,
        {
          id: `${Date.now()}-${counter.current}`,
          type: achievement ? "achievement" : "badge",
          data: achievement || badge,
        },
      ]);
    };

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

  return (
    <div
      // Always mounted so the live region exists before the first toast lands —
      // a region inserted at the same moment as its content is not announced.
      aria-live="polite"
      className="pointer-events-none fixed top-4 right-4 left-4 flex flex-col gap-3 sm:left-auto sm:w-full sm:max-w-sm"
      style={{ zIndex: "var(--z-toast)" }}
    >
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className="animate-enter-right pointer-events-auto flex items-start gap-3 rounded-room border border-rule border-l-2 border-l-beam bg-surface-raised p-4 shadow-2xl"
        >
          {notification.data.icon && (
            <span className="text-heading-s leading-none" aria-hidden="true">
              {notification.data.icon}
            </span>
          )}

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <span className="font-label text-label text-beam">
                {notification.type === "achievement"
                  ? "Achievement unlocked"
                  : "Badge earned"}
              </span>
              <button
                type="button"
                aria-label="Dismiss"
                onClick={() => removeNotification(notification.id)}
                className="-mt-1 -mr-1 flex size-6 shrink-0 items-center justify-center rounded-hair text-ink-faint transition-colors duration-hair hover:text-ink"
              >
                <span aria-hidden="true">×</span>
              </button>
            </div>

            <p className="mt-1 text-body font-semibold text-lit">
              {notification.data.name}
            </p>
            <p className="mt-1 text-body-s text-ink-muted">
              {notification.data.description}
            </p>
            {notification.type === "achievement" &&
              notification.data.points != null && (
                <p data-figure className="mt-2 text-body-s text-beam">
                  +{notification.data.points} XP
                </p>
              )}
          </div>
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
