/**
 * The geometry of the section drawing, as pure functions.
 *
 * Kept out of the component so the drawing can be reasoned about and tested
 * without a DOM — and because the thing that was wrong with the first version
 * was never the React, it was that there was no geometry at all. Seven bars and
 * a fill swap is a bar chart; a section needs structure it has been cut through,
 * and light needs a direction.
 *
 * All coordinates are in the fixed viewBox below. The drawing is rendered with
 * `preserveAspectRatio="xMidYMid meet"` — a drawing stretched non-uniformly
 * stops being a drawing, because its angles start lying.
 */

export const VIEW = { width: 1200, height: 420 };

const MARGIN = 40;
export const GRADE_Y = 360; // the ground the building stands on
const SLAB = 10; // roof and floor thickness
const PIER = 8; // the wall between two rooms
const MIN_ROOM_H = 70;
const ROOM_H_RANGE = 190;

/** The sun's arc: low at each end of the day, high at noon. */
export function sunPosition(progress) {
  const clamped = Math.min(1, Math.max(0, progress));
  return {
    x: MARGIN + clamped * (VIEW.width - MARGIN * 2),
    // Above the tallest possible roof (100) at every point in the arc.
    y: 78 - 45 * Math.sin(Math.PI * clamped),
  };
}

/**
 * How strongly the sun falls on a room, 0..1.
 *
 * A cosine-shaped falloff over roughly one and a half bays, so the rooms either
 * side of the beam catch some of it. The first version lit exactly one room at
 * full strength and its neighbours at nothing, which is what made it read as a
 * colour switching rather than a light arriving.
 */
export function roomIntensity(sunX, roomCenterX, bayWidth) {
  const distance = Math.abs(roomCenterX - sunX) / (bayWidth * 1.6);
  if (distance >= 1) return 0;
  return Math.cos((distance * Math.PI) / 2) ** 2;
}

/** Room rectangles and their apertures, laid out across the frame. */
export function layoutRooms(rooms) {
  const innerWidth = VIEW.width - MARGIN * 2;
  const bayWidth = innerWidth / Math.max(rooms.length, 1);

  return rooms.map((room, index) => {
    const bayX = MARGIN + index * bayWidth;
    const x = bayX + PIER / 2;
    const width = bayWidth - PIER;
    const height = MIN_ROOM_H + Math.min(1, Math.max(0, room.strength)) * ROOM_H_RANGE;
    const roofY = GRADE_Y - height;
    const apertureWidth = width * 0.34;

    return {
      room,
      index,
      x,
      width,
      height,
      roofY,
      centerX: x + width / 2,
      bayX,
      bayWidth,
      aperture: {
        x: x + width / 2 - apertureWidth / 2,
        width: apertureWidth,
      },
    };
  });
}

/**
 * The shaft of light from an aperture down to the floor.
 *
 * Projected from the sun through the opening, so the angle changes as the sun
 * travels: raking at either end of the day, near vertical at noon. This is the
 * part that makes it a section with the sun cutting through rather than a
 * highlighted bar.
 */
export function shaftPolygon(sun, bay) {
  const openingY = bay.roofY;
  const rise = openingY - sun.y;
  if (rise <= 0) return null;

  const scale = (GRADE_Y - sun.y) / rise;
  const project = (x) => sun.x + scale * (x - sun.x);

  const left = bay.aperture.x;
  const right = bay.aperture.x + bay.aperture.width;

  return {
    points: [
      [left, openingY],
      [right, openingY],
      [project(right), GRADE_Y],
      [project(left), GRADE_Y],
    ],
    // Where the light actually lands, for the pool on the floor.
    landingX: project(bay.aperture.x + bay.aperture.width / 2),
    landingWidth: Math.abs(project(right) - project(left)),
  };
}

export const pointsAttr = (points) => points.map((p) => p.join(",")).join(" ");

export const GEOMETRY = { MARGIN, SLAB, PIER, MIN_ROOM_H, ROOM_H_RANGE };
