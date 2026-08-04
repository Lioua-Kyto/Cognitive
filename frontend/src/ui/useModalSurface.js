import { useEffect, useRef } from "react";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * The behaviour every modal surface owes a keyboard user: focus moves in, Tab
 * cycles inside, Escape closes, focus returns where it came from, and the page
 * behind stops scrolling.
 *
 * Extracted from Dialog so the Sheet gets the same contract rather than a second
 * hand-rolled approximation of it — which is how the six modals this redesign
 * replaces ended up with six different sets of missing pieces.
 *
 * Returns the ref to put on the panel element.
 */
export default function useModalSurface(open, onClose) {
  const panelRef = useRef(null);
  const restoreRef = useRef(null);

  useEffect(() => {
    if (!open) return;

    restoreRef.current = document.activeElement;

    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";

    const panel = panelRef.current;
    // Prefer the first control over the panel itself.
    const initial = panel?.querySelector(FOCUSABLE);
    (initial ?? panel)?.focus();

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose?.();
        return;
      }
      if (event.key !== "Tab") return;

      const focusable = Array.from(panel?.querySelectorAll(FOCUSABLE) ?? []);
      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown, true);

    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      document.body.style.overflow = overflow;
      // Focus restore is what makes a surface dismissable without losing your place.
      restoreRef.current?.focus?.();
    };
  }, [open, onClose]);

  return panelRef;
}
