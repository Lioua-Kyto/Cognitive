import { describe, expect, it } from "vitest";
import {
  GRADE_Y,
  VIEW,
  layoutRooms,
  roomIntensity,
  shaftPolygon,
  sunPosition,
} from "./sectionGeometry.js";

const rooms = Array.from({ length: 7 }, (_, i) => ({
  key: `r${i}`,
  strength: 0.5,
  lit: true,
}));

describe("the sun's arc", () => {
  it("travels left to right across the frame", () => {
    expect(sunPosition(0).x).toBeLessThan(sunPosition(0.5).x);
    expect(sunPosition(0.5).x).toBeLessThan(sunPosition(1).x);
  });

  it("is highest at noon and lowest at either end", () => {
    // Smaller y is higher on screen.
    expect(sunPosition(0.5).y).toBeLessThan(sunPosition(0).y);
    expect(sunPosition(0.5).y).toBeLessThan(sunPosition(1).y);
    expect(sunPosition(0).y).toBeCloseTo(sunPosition(1).y, 5);
  });

  it("stays above the tallest roof the layout can produce", () => {
    const tallest = layoutRooms(
      rooms.map((r) => ({ ...r, strength: 1 }))
    )[0].roofY;

    for (let p = 0; p <= 1; p += 0.05) {
      expect(sunPosition(p).y).toBeLessThan(tallest);
    }
  });

  it("clamps rather than running off the frame", () => {
    expect(sunPosition(-3).x).toBe(sunPosition(0).x);
    expect(sunPosition(9).x).toBe(sunPosition(1).x);
  });
});

describe("how light falls on a room", () => {
  const bays = layoutRooms(rooms);
  const bay = bays[3];

  it("is strongest directly under the sun", () => {
    expect(roomIntensity(bay.centerX, bay.centerX, bay.bayWidth)).toBeCloseTo(1);
  });

  it("spills onto the neighbours rather than switching on and off", () => {
    // The bug this replaces lit exactly one room and gave its neighbours zero,
    // which is what made it read as a colour switching.
    const neighbour = roomIntensity(
      bays[2].centerX,
      bay.centerX,
      bay.bayWidth
    );
    expect(neighbour).toBeGreaterThan(0);
    expect(neighbour).toBeLessThan(1);
  });

  it("falls off monotonically with distance", () => {
    const at = (d) => roomIntensity(bay.centerX + d, bay.centerX, bay.bayWidth);
    expect(at(0)).toBeGreaterThan(at(40));
    expect(at(40)).toBeGreaterThan(at(120));
    expect(at(120)).toBeGreaterThan(at(220));
  });

  it("reaches zero rather than glowing across the whole building", () => {
    expect(roomIntensity(bay.centerX + 5000, bay.centerX, bay.bayWidth)).toBe(0);
  });
});

describe("the room layout", () => {
  const bays = layoutRooms(rooms);

  it("fits every room inside the frame", () => {
    for (const bay of bays) {
      expect(bay.x).toBeGreaterThanOrEqual(0);
      expect(bay.x + bay.width).toBeLessThanOrEqual(VIEW.width);
      expect(bay.roofY).toBeGreaterThan(0);
    }
  });

  it("stands every room on the grade line", () => {
    for (const bay of bays) {
      expect(bay.roofY + bay.height).toBeCloseTo(GRADE_Y);
    }
  });

  it("gives a stronger domain a taller room", () => {
    const [weak, strong] = layoutRooms([
      { key: "a", strength: 0.1 },
      { key: "b", strength: 0.9 },
    ]);
    expect(strong.height).toBeGreaterThan(weak.height);
  });

  it("puts the aperture inside the room it lights", () => {
    for (const bay of bays) {
      expect(bay.aperture.x).toBeGreaterThan(bay.x);
      expect(bay.aperture.x + bay.aperture.width).toBeLessThan(
        bay.x + bay.width
      );
    }
  });
});

describe("the shaft of light", () => {
  const bay = layoutRooms(rooms)[3];

  it("reaches the floor", () => {
    const shaft = shaftPolygon(sunPosition(0.5), bay);
    const bottom = shaft.points.filter(([, y]) => y === GRADE_Y);
    expect(bottom).toHaveLength(2);
  });

  it("rakes one way in the morning and the other in the afternoon", () => {
    // The whole point of an arc: the angle changes, so the light lands on a
    // different part of the floor as the day moves.
    const morning = shaftPolygon(sunPosition(0.05), bay);
    const noon = shaftPolygon(sunPosition(0.5), bay);
    const evening = shaftPolygon(sunPosition(0.95), bay);

    expect(morning.landingX).toBeGreaterThan(noon.landingX);
    expect(evening.landingX).toBeLessThan(noon.landingX);
  });

  it("falls almost straight down at noon", () => {
    const noon = shaftPolygon(sunPosition(0.5), layoutRooms(rooms)[3]);
    const centre = bay.aperture.x + bay.aperture.width / 2;
    expect(Math.abs(noon.landingX - centre)).toBeLessThan(bay.width);
  });

  it("spreads as it travels, so the pool is wider than the opening", () => {
    const shaft = shaftPolygon(sunPosition(0.5), bay);
    expect(shaft.landingWidth).toBeGreaterThan(bay.aperture.width);
  });
});
