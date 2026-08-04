/**
 * One measured figure with its label.
 *
 * Use inside a `grid gap-px bg-rule` so the hairlines between tiles are the grid
 * gap showing through — drawn separations, not borders on boxes.
 */
export default function StatTile({ label, value, note, className = "" }) {
  return (
    <div className={`bg-surface p-4 text-center ${className}`}>
      <div data-figure className="text-figure text-lit">
        {value}
      </div>
      <div className="font-label mt-1 text-label text-ink-faint">{label}</div>
      {note && <div className="mt-1 text-body-s text-ink-muted">{note}</div>}
    </div>
  );
}
