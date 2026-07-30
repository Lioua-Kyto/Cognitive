import { useId } from "react";

/**
 * Labelled form control.
 *
 * The auth forms this replaces used `placeholder` as the only field identifier.
 * A placeholder is not an accessible name and it disappears the moment you type,
 * which is exactly when you need it.
 */
export default function Field({
  label,
  hint,
  error,
  required = false,
  children,
  className = "",
}) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;

  const describedBy = [hint && hintId, error && errorId].filter(Boolean).join(" ");

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={id} className="font-label text-label text-ink-muted">
        {label}
        {required && (
          <span className="ml-1 text-beam" aria-hidden="true">
            *
          </span>
        )}
      </label>

      {children({
        id,
        required,
        "aria-describedby": describedBy || undefined,
        "aria-invalid": error ? true : undefined,
      })}

      {hint && !error && (
        <p id={hintId} className="text-body-s text-ink-faint">
          {hint}
        </p>
      )}
      {error && (
        // role="alert" so the failure is announced, not just coloured.
        <p id={errorId} role="alert" className="text-body-s text-negative">
          {error}
        </p>
      )}
    </div>
  );
}

export function Input({ className = "", ...props }) {
  return (
    <input
      className={
        "h-10 w-full rounded-hair border border-rule bg-surface px-3 text-body text-ink " +
        "placeholder:text-ink-faint focus:border-beam focus:outline-none " +
        `transition-colors duration-hair ${className}`
      }
      {...props}
    />
  );
}
