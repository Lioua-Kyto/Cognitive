import { useId } from "react";
import { createPortal } from "react-dom";
import useModalSurface from "./useModalSurface.js";

/**
 * Edge-anchored modal panel — a drawer.
 *
 * Same contract as Dialog; different geometry. Used where the content is a
 * standing side channel rather than a decision to make, so a centred box would
 * read as an interruption.
 */
export default function Sheet({ open, onClose, title, header, children, footer }) {
  const panelRef = useModalSurface(open, onClose);
  const titleId = useId();

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0" style={{ zIndex: "var(--z-modal)" }}>
      <div
        className="absolute inset-0 bg-poche/80 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="animate-enter-right absolute inset-y-0 right-0 flex w-full max-w-[24rem] flex-col border-l border-rule bg-surface text-ink shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-rule px-5 py-4">
          <div className="min-w-0">
            <h2 id={titleId} className="font-display text-heading-s text-lit">
              {title}
            </h2>
            {header}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mt-1 -mr-1 flex size-8 shrink-0 items-center justify-center rounded-hair text-ink-faint transition-colors duration-hair hover:text-ink"
          >
            <span aria-hidden="true">×</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">{children}</div>

        {footer && <div className="border-t border-rule p-5">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}
