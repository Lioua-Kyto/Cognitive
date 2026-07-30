import { roomUnderBeam } from "./useSolarPosition.js";

const ROOM_GAP = 2;

/**
 * The seven rooms in section, lit by where the user is strong.
 *
 * An unlit room is not a failure state — it is a room that has not been lit yet.
 * That is the whole reason this direction was chosen over a scoreboard, so the
 * unlit rendering is deliberately calm: no red, no warning, no empty-state face.
 *
 * `beam` is 0..1 from useSolarPosition. Under prefers-reduced-motion it is pinned
 * to noon and nothing animates, but every room still shows its true lit state and
 * every label is present.
 */
export default function SectionDrawing({
  rooms,
  beam = 0.5,
  onSelectRoom,
  className = "",
}) {
  const active = roomUnderBeam(beam, rooms.length);
  const roomWidth = (100 - ROOM_GAP * (rooms.length - 1)) / rooms.length;

  return (
    <figure className={`relative w-full ${className}`}>
      <svg
        viewBox="0 0 100 46"
        preserveAspectRatio="none"
        className="block h-full w-full"
        role="img"
        aria-label={`Your seven cognitive domains in section. ${
          rooms.filter((r) => r.lit).length
        } of ${rooms.length} lit.`}
      >
        {/* Poche: the cut structure the rooms sit in. */}
        <rect x="0" y="0" width="100" height="46" fill="var(--color-poche)" />

        {rooms.map((room, i) => {
          const x = i * (roomWidth + ROOM_GAP);
          const height = 8 + room.strength * 30;
          const y = 40 - height;
          const isActive = i === active;

          return (
            <g key={room.key}>
              {/* Room volume. Lit rooms take the limewash; unlit stay in shadow. */}
              <rect
                x={x}
                y={y}
                width={roomWidth}
                height={height}
                fill={room.lit ? "var(--color-lit)" : "var(--color-shadow)"}
                fillOpacity={room.lit ? 1 : 0.32}
                className="transition-[fill-opacity,fill] duration-warm ease-room"
              />
              {/* The beam falling on the room it is over. */}
              {isActive && (
                <rect
                  x={x}
                  y={y}
                  width={roomWidth}
                  height={height}
                  fill="var(--color-beam)"
                  fillOpacity={room.lit ? 0.9 : 0.35}
                  className="transition-[fill-opacity] duration-warm ease-beam"
                />
              )}
              {/* Floor line: the hairline that makes it read as a drawing. */}
              <line
                x1={x}
                y1="40"
                x2={x + roomWidth}
                y2="40"
                stroke="var(--color-rule-strong)"
                strokeWidth="0.25"
                vectorEffect="non-scaling-stroke"
              />
            </g>
          );
        })}

        {/* Grade line under the whole building. */}
        <line
          x1="0"
          y1="40"
          x2="100"
          y2="40"
          stroke="var(--color-rule-strong)"
          strokeWidth="0.5"
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      {/* Labels live in DOM, not SVG text: selectable, translatable, and they
          scale with the type system instead of the viewBox. */}
      <figcaption className="mt-3 grid gap-2" style={{ gridTemplateColumns: `repeat(${rooms.length}, minmax(0, 1fr))` }}>
        {rooms.map((room, i) => (
          <button
            key={room.key}
            type="button"
            onClick={() => onSelectRoom?.(room)}
            aria-current={i === active ? "true" : undefined}
            className="group flex flex-col items-start gap-0.5 rounded-hair px-1 py-1 text-left transition-colors duration-hair hover:bg-surface"
          >
            <span
              className={`font-label text-label ${
                i === active ? "text-beam" : "text-ink-muted"
              } group-hover:text-ink`}
            >
              {room.label}
            </span>
            <span className="tabular text-body-s text-ink" data-figure>
              {room.lit ? room.value : "—"}
            </span>
          </button>
        ))}
      </figcaption>
    </figure>
  );
}
