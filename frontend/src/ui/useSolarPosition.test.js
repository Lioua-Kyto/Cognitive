import { describe, expect, it } from "vitest";
import { NOON, roomUnderBeam, solarPosition } from "./useSolarPosition.js";

const at = (hours, minutes = 0) => {
  const d = new Date(2026, 6, 30);
  d.setHours(hours, minutes, 0, 0);
  return d;
};

describe("solarPosition", () => {
  it("puts first light at 0 and last light at 1", () => {
    expect(solarPosition(at(6))).toBe(0);
    expect(solarPosition(at(20))).toBe(1);
  });

  it("puts the midpoint of the lit day at noon", () => {
    expect(solarPosition(at(13))).toBeCloseTo(NOON, 5);
  });

  it("clamps outside daylight instead of going dark", () => {
    // The building must stay readable at 03:00; it does not black out.
    expect(solarPosition(at(3))).toBe(0);
    expect(solarPosition(at(23))).toBe(1);
  });

  it("advances monotonically through the day", () => {
    const samples = [7, 9, 11, 13, 15, 17, 19].map((h) => solarPosition(at(h)));
    const sorted = [...samples].sort((a, b) => a - b);
    expect(samples).toEqual(sorted);
  });

  it("returns noon for a degenerate day", () => {
    expect(solarPosition(at(12), 12, 12)).toBe(NOON);
  });
});

describe("roomUnderBeam", () => {
  it("maps the beam across seven rooms", () => {
    expect(roomUnderBeam(0, 7)).toBe(0);
    expect(roomUnderBeam(1, 7)).toBe(6);
  });

  it("never overruns the last room at full position", () => {
    // Math.floor(1 * 7) is 7, which would be out of bounds.
    for (let count = 1; count <= 12; count += 1) {
      expect(roomUnderBeam(1, count)).toBe(count - 1);
    }
  });

  it("puts noon on the middle room of an odd count", () => {
    expect(roomUnderBeam(NOON, 7)).toBe(3);
  });

  it("handles an empty building", () => {
    expect(roomUnderBeam(0.5, 0)).toBeNull();
  });
});
