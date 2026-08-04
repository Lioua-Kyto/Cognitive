import { useId } from "react";
import {
  GEOMETRY,
  GRADE_Y,
  VIEW,
  layoutRooms,
  pointsAttr,
  roomIntensity,
  shaftPolygon,
  sunPosition,
} from "./sectionGeometry.js";

const { SLAB, PIER } = GEOMETRY;

/**
 * The seven rooms in section, with the sun cutting through.
 *
 * A building drawn in architectural section: poche is the structure you have
 * been cut through — piers, floor slabs, roof — and the rooms are the voids
 * carved out of it. The sun travels an arc overhead, light enters each room
 * through an opening in its roof, and the shaft rakes or falls steeply depending
 * on where the sun is. Where it lands, the room fills with light.
 *
 * An unlit room is not a failure state — it is a room that has not been lit yet.
 * That is the whole reason this direction was chosen over a scoreboard, so the
 * unlit rendering is deliberately calm: no red, no warning, no empty-state face.
 *
 * `beam` is 0..1. Under prefers-reduced-motion it is pinned to noon and nothing
 * animates, but the sun is still overhead, every room still shows its true lit
 * state and every label is present — complete, not degraded.
 */
export default function SectionDrawing({
  rooms,
  beam = 0.5,
  onSelectRoom,
  className = "",
}) {
  const uid = useId().replace(/:/g, "");
  const sun = sunPosition(beam);
  const bays = layoutRooms(rooms);
  const litCount = rooms.filter((r) => r.lit).length;

  const withLight = bays.map((bay) => ({
    ...bay,
    intensity: roomIntensity(sun.x, bay.centerX, bay.bayWidth),
  }));

  const brightest = withLight.reduce(
    (best, bay) => (best === null || bay.intensity > best.intensity ? bay : best),
    null
  );

  return (
    <figure className={`relative w-full ${className}`}>
      <svg
        viewBox={`0 0 ${VIEW.width} ${VIEW.height}`}
        preserveAspectRatio="xMidYMid meet"
        className="block h-auto w-full"
        role="img"
        aria-label={`Your ${rooms.length} cognitive domains drawn as rooms in a building, with the sun overhead. ${litCount} of ${rooms.length} lit.`}
      >
        <defs>
          {/* Light loses strength as it travels. */}
          <linearGradient id={`${uid}-shaft`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-beam)" stopOpacity="0.55" />
            <stop offset="100%" stopColor="var(--color-beam)" stopOpacity="0.06" />
          </linearGradient>
          <radialGradient id={`${uid}-sun`}>
            <stop offset="0%" stopColor="var(--color-beam)" stopOpacity="0.55" />
            <stop offset="100%" stopColor="var(--color-beam)" stopOpacity="0" />
          </radialGradient>
          <radialGradient id={`${uid}-pool`}>
            <stop offset="0%" stopColor="var(--color-beam)" stopOpacity="0.5" />
            <stop offset="100%" stopColor="var(--color-beam)" stopOpacity="0" />
          </radialGradient>

          {withLight.map((bay) => (
            <clipPath key={bay.room.key} id={`${uid}-room-${bay.index}`}>
              <rect
                x={bay.x}
                y={bay.roofY}
                width={bay.width}
                height={bay.height}
              />
            </clipPath>
          ))}
        </defs>

        {/* Sky. Not a backdrop colour — the ground the building is cut out of
            sits below, and the sun needs somewhere to be. */}
        <rect width={VIEW.width} height={VIEW.height} fill="var(--color-ground)" />

        <circle cx={sun.x} cy={sun.y} r="64" fill={`url(#${uid}-sun)`} />
        <circle cx={sun.x} cy={sun.y} r="7" fill="var(--color-beam)" />

        {/* Light in the open air, above the roofs. */}
        {withLight.map((bay) => {
          if (bay.intensity < 0.05) return null;
          return (
            <polygon
              key={`sky-${bay.room.key}`}
              points={pointsAttr([
                [sun.x - 5, sun.y],
                [sun.x + 5, sun.y],
                [bay.aperture.x + bay.aperture.width, bay.roofY - SLAB],
                [bay.aperture.x, bay.roofY - SLAB],
              ])}
              fill="var(--color-beam)"
              fillOpacity={bay.intensity * 0.09}
            />
          );
        })}

        {withLight.map((bay) => {
          const shaft = shaftPolygon(sun, bay);
          const warmth = bay.intensity * (bay.room.lit ? 0.5 : 0.26);

          return (
            <g key={bay.room.key}>
              {/* The room void. Lit rooms hold the limewash; unlit stay in
                  shadow, quietly. */}
              <rect
                x={bay.x}
                y={bay.roofY}
                width={bay.width}
                height={bay.height}
                fill={bay.room.lit ? "var(--color-lit)" : "var(--color-shadow)"}
                fillOpacity={bay.room.lit ? 0.92 : 0.26}
                className="transition-[fill-opacity,fill] duration-warm ease-room"
              />

              <g clipPath={`url(#${uid}-room-${bay.index})`}>
                {shaft && bay.intensity >= 0.05 && (
                  <>
                    <polygon
                      points={pointsAttr(shaft.points)}
                      fill={`url(#${uid}-shaft)`}
                      opacity={bay.intensity}
                    />
                    {/* The pool where the shaft meets the floor. */}
                    <ellipse
                      cx={shaft.landingX}
                      cy={GRADE_Y}
                      rx={Math.max(shaft.landingWidth * 0.7, 12)}
                      ry="10"
                      fill={`url(#${uid}-pool)`}
                      opacity={bay.intensity}
                    />
                  </>
                )}
                {/* Ambient warmth through the whole volume, so the room reads as
                    lit rather than as a stripe with a shape on it. */}
                <rect
                  x={bay.x}
                  y={bay.roofY}
                  width={bay.width}
                  height={bay.height}
                  fill="var(--color-beam)"
                  fillOpacity={warmth}
                  className="transition-[fill-opacity] duration-warm ease-beam"
                />
              </g>

              {/* Poche: the structure, cut. Roof either side of the opening. */}
              <rect
                x={bay.x - PIER / 2}
                y={bay.roofY - SLAB}
                width={bay.aperture.x - (bay.x - PIER / 2)}
                height={SLAB}
                fill="var(--color-poche)"
              />
              <rect
                x={bay.aperture.x + bay.aperture.width}
                y={bay.roofY - SLAB}
                width={
                  bay.x + bay.width + PIER / 2 - (bay.aperture.x + bay.aperture.width)
                }
                height={SLAB}
                fill="var(--color-poche)"
              />

              {/* The piers between rooms. */}
              <rect
                x={bay.x - PIER}
                y={bay.roofY - SLAB}
                width={PIER}
                height={bay.height + SLAB}
                fill="var(--color-poche)"
              />
              {bay.index === rooms.length - 1 && (
                <rect
                  x={bay.x + bay.width}
                  y={bay.roofY - SLAB}
                  width={PIER}
                  height={bay.height + SLAB}
                  fill="var(--color-poche)"
                />
              )}

              {/* Hairline on the cut face — what makes it read as drawn. */}
              <line
                x1={bay.x}
                y1={bay.roofY}
                x2={bay.x + bay.width}
                y2={bay.roofY}
                stroke="var(--color-rule-strong)"
                strokeWidth="1"
                vectorEffect="non-scaling-stroke"
              />
            </g>
          );
        })}

        {/* Floor slab and everything below grade. */}
        <rect
          x={GEOMETRY.MARGIN - PIER}
          y={GRADE_Y}
          width={VIEW.width - (GEOMETRY.MARGIN - PIER) * 2}
          height={SLAB}
          fill="var(--color-poche)"
        />
        <rect
          x="0"
          y={GRADE_Y + SLAB}
          width={VIEW.width}
          height={VIEW.height - GRADE_Y - SLAB}
          fill="var(--color-poche)"
          fillOpacity="0.55"
        />
        <line
          x1="0"
          y1={GRADE_Y}
          x2={VIEW.width}
          y2={GRADE_Y}
          stroke="var(--color-rule-strong)"
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      {/* Labels live in DOM, not SVG text: selectable, translatable, and they
          scale with the type system instead of the viewBox. */}
      <figcaption
        className="mt-3 grid gap-2"
        style={{ gridTemplateColumns: `repeat(${rooms.length}, minmax(0, 1fr))` }}
      >
        {withLight.map((bay) => {
          const isBrightest = bay.index === brightest?.index;
          return (
            <button
              key={bay.room.key}
              type="button"
              onClick={() => onSelectRoom?.(bay.room)}
              aria-current={isBrightest ? "true" : undefined}
              className="group flex flex-col items-start gap-0.5 rounded-hair px-1 py-1 text-left transition-colors duration-hair hover:bg-surface"
            >
              <span
                className={`font-label text-label ${
                  isBrightest ? "text-beam" : "text-ink-muted"
                } group-hover:text-ink`}
              >
                {bay.room.label}
              </span>
              {/* The number resolves when the room is lit. The label never
                  hides — a visitor who does not scroll still gets the map. */}
              <span
                className="tabular text-body-s text-ink transition-opacity duration-warm"
                data-figure
              >
                {bay.room.lit ? bay.room.value : "—"}
              </span>
            </button>
          );
        })}
      </figcaption>
    </figure>
  );
}
