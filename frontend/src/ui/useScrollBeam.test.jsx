import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { act, render } from "@testing-library/react";

const created = vi.hoisted(() => []);
const killed = vi.hoisted(() => ({ count: 0 }));
const refreshed = vi.hoisted(() => ({ count: 0 }));

vi.mock("gsap", () => ({ gsap: { registerPlugin: vi.fn() } }));

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
    refresh: () => {
      refreshed.count += 1;
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
  refreshed.count = 0;
  vi.resetModules();
  ({ useScrollBeam } = await import("./useScrollBeam.js"));
});

afterEach(() => vi.restoreAllMocks());

// Renders a real component so React attaches the ref during commit, before
// effects run — which is the ordering the hook relies on.
function mount() {
  const seen = { current: null };

  function Probe() {
    const beam = useScrollBeam({ distance: 2 });
    seen.current = beam;
    return <div ref={beam.ref} />;
  }

  const view = render(<Probe />);
  return { ...view, result: seen };
}

describe("useScrollBeam", () => {
  it("creates a pinned trigger over the requested distance by default", () => {
    setReducedMotion(false);
    mount();

    expect(created).toHaveLength(1);
    expect(created[0]).toMatchObject({
      pin: true,
      pinSpacing: true,
      start: "top top",
      end: "+=200%",
    });
  });

  it("never sets scrub, which would stop onUpdate reporting progress", () => {
    // scrub ties a tween to the scrollbar. This trigger has no animation — it
    // drives React state through onUpdate — and setting scrub without one left
    // progress pinned at 0.
    setReducedMotion(false);
    mount();
    expect(created[0].scrub).toBeUndefined();
  });

  it("still runs the reveal under reduced motion, without pinning it", () => {
    // The flag targets motion the user did not ask for. A scroll-linked reveal
    // is direct manipulation, so it stays — what goes is the pin.
    setReducedMotion(true);
    const { result } = mount();

    expect(created).toHaveLength(1);
    expect(created[0]).toMatchObject({ pin: false, end: "bottom top" });
    expect(created[0].scrub).toBeUndefined();
    expect(result.current.pinned).toBe(false);
  });

  it("maps trigger progress onto the beam in both modes", () => {
    for (const calm of [false, true]) {
      created.length = 0;
      setReducedMotion(calm);
      const { result, unmount } = mount();

      act(() => created[0].onUpdate({ progress: 0.75 }));
      expect(result.current.progress).toBeCloseTo(0.75, 5);
      unmount();
    }
  });

  it("uses the window scroller, not a nested container", () => {
    // The legacy shell scrolled an inner div, which left ScrollTrigger watching
    // a window that never moved. The document scrolls now.
    setReducedMotion(false);
    mount();
    expect(created[0].scroller).toBeUndefined();
  });

  it("refreshes once layout settles", async () => {
    setReducedMotion(false);
    mount();
    await act(async () => {
      await new Promise((r) => setTimeout(r, 350));
    });
    expect(refreshed.count).toBeGreaterThan(0);
  });

  it("kills the trigger on unmount so a route change leaves no pin behind", () => {
    setReducedMotion(false);
    const { unmount } = mount();

    unmount();
    expect(killed.count).toBeGreaterThan(0);
  });
});
