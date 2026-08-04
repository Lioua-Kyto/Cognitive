import { createPortal } from "react-dom";
import { useNotifications } from "../context/NotificationContext";

const TONE = {
  success: "border-l-positive",
  error: "border-l-negative",
  warning: "border-l-caution",
  info: "border-l-beam",
};

/**
 * Renders the notification queue.
 *
 * NotificationProvider has always collected notifications into state, exposed
 * `showNotification`, and dropped each one three seconds later — but nothing in
 * the app ever rendered the list. Every "Friend request sent", every "Failed to
 * load profile data", every save confirmation across the whole codebase went
 * into an array that no component read. This is the missing half.
 *
 * Anchored bottom-right so it does not collide with the achievement stack, which
 * owns the top-right corner and is a celebration rather than a confirmation.
 */
export default function Toaster() {
  const { notifications, removeNotification } = useNotifications();

  return createPortal(
    <div
      aria-live="polite"
      className="pointer-events-none fixed right-4 bottom-4 left-4 flex flex-col gap-2 sm:left-auto sm:w-full sm:max-w-sm"
      style={{ zIndex: "var(--z-toast)" }}
    >
      {notifications.map((notification) => (
        <div
          key={notification.id}
          role={notification.type === "error" ? "alert" : undefined}
          className={`animate-enter-up pointer-events-auto flex items-start gap-3 rounded-room border border-rule border-l-2 bg-surface-raised p-4 shadow-2xl ${
            TONE[notification.type] ?? TONE.info
          }`}
        >
          <div className="min-w-0 flex-1">
            {notification.title && (
              <p className="text-body-s font-semibold text-lit">
                {notification.title}
              </p>
            )}
            {notification.message && (
              <p className="mt-0.5 text-body-s text-ink-muted">
                {notification.message}
              </p>
            )}
          </div>
          <button
            type="button"
            aria-label="Dismiss"
            onClick={() => removeNotification(notification.id)}
            className="-mt-1 -mr-1 flex size-6 shrink-0 items-center justify-center rounded-hair text-ink-faint transition-colors duration-hair hover:text-ink"
          >
            <span aria-hidden="true">×</span>
          </button>
        </div>
      ))}
    </div>,
    document.body
  );
}
