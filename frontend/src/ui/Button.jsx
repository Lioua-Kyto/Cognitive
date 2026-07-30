const BASE =
  "inline-flex items-center justify-center gap-2 rounded-hair font-sans text-body font-medium " +
  "transition-colors duration-hair ease-room disabled:cursor-not-allowed disabled:opacity-45";

const VARIANTS = {
  // The beam is the only accent in the system, so the primary action is the one
  // place it appears as a surface.
  primary: "bg-beam text-poche hover:bg-beam-deep",
  // A drawn hairline, not a filled box.
  secondary:
    "border border-rule-strong bg-transparent text-ink hover:border-beam hover:text-beam",
  ghost: "bg-transparent text-ink-muted hover:text-ink",
  destructive:
    "border border-negative bg-transparent text-negative hover:bg-negative hover:text-lit",
};

const SIZES = {
  sm: "h-8 px-3 text-body-s",
  md: "h-10 px-4",
  lg: "h-12 px-6",
};

export default function Button({
  variant = "primary",
  size = "md",
  type = "button",
  busy = false,
  className = "",
  children,
  ...props
}) {
  return (
    <button
      type={type}
      // A busy button that stays clickable is how double submissions happen.
      disabled={props.disabled || busy}
      aria-busy={busy || undefined}
      className={`${BASE} ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
