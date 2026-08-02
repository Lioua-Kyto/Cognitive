import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { act, render, renderHook } from "@testing-library/react";
import { NOON } from "./useSolarPosition.js";

const created = vi.hoisted(() => []);
const killed = vi.hoisted(() => ({ count: 0 }));

vi.mock("gsap", () => ({
  gsap: { registerPlugin: vi.fn() },
}));

vi.mock("gsap/ScrollTrigger", () => ({
  ScrollTrigger: {
    create: (config) => {
      created.push(config);
      return {
        kill: () => {
          killed.count += 1;
        },
      };
    },
  },
}));

function setReducedMotion(reduce) {
  window.matchMedia = vi.fn().mockImplementation((query) => ({
    matches: query.includes("prefers-reduced-motion") ? reduce : false,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
}

let useScrollBeam;

beforeEach(async () => {
  created.length = 0;
  killed.count = 0;
  vi.resetModules();
  ({ useScrollBeam } = await import("./useScrollBeam.js"));
});

afterEach(() => vi.restoreAllMocks());

describe("useScrollBeam under prefers-reduced-motion", () => {
  it("pins nothing and holds the beam at noon", () => {
    setReducedMotion(true);
    const { result } = renderHook(() => useScrollBeam());

    // The still noon state: complete, not degraded.
    expect(result.current.progress).toBe(NOON);
    expect(result.current.pinned).toBe(false);
    expect(created).toHaveLength(0);
  });
});

describe("useScrollBeam with motion allowed", () => {
  // Renders a real component so React attaches the ref during commit, before
  // effects run — which is the ordering the hook relies on.
  function mountWithElement() {
    const seen = { current: null };

    function Probe() {
      const beam = useScrollBeam({ distance: 2 });
      seen.current = beam;
      return <div ref={beam.ref} />;
    }

    const view = render(<Probe />);
    return { ...view, result: seen };
  }

  it("creates a pinned, scrubbed ScrollTrigger over the requested distance", () => {
    setReducedMotion(false);
    mountWithElement();

    expect(created).toHaveLength(1);
    const config = created[0];
    expect(config.pin).toBe(true);
    expect(config.scrub).toBeTruthy();
    expect(config.start).toBe("top top");
    expect(config.end).toBe("+=200%");
  });

  it("maps ScrollTrigger progress straight onto the beam", () => {
    setReducedMotion(false);
    const { result } = mountWithElement();

    // ScrollTrigger drives this from outside React, so the state update needs
    // flushing before it can be read.
    act(() => created[0].onUpdate({ progress: 0.75 }));
    expect(result.current.progress).toBeCloseTo(0.75, 5);
  });

  it("kills the trigger on unmount so a route change leaves no pin behind", () => {
    setReducedMotion(false);
    const { unmount } = mountWithElement();

    unmount();
    expect(killed.count).toBe(1);
  });
});
