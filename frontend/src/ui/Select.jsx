/**
 * Native select, styled.
 *
 * Deliberately not a custom listbox: the one place this is used picks from 35
 * games, and the platform control already has type-ahead, keyboard support and a
 * usable mobile presentation that a div-based reimplementation would have to
 * earn back.
 */
export default function Select({ className = "", children, ...props }) {
  return (
    <select
      className={
        "h-10 w-full rounded-hair border border-rule bg-surface px-3 text-body text-ink " +
        "focus:border-beam focus:outline-none transition-colors duration-hair " +
        className
      }
      {...props}
    >
      {children}
    </select>
  );
}
