import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * Maps scroll position onto the sun's arc across the seven rooms.
 *
 * The signature interaction: scrolling walks the beam across the domains,
 * lighting each in turn, so a visitor learns the product without reading.
 *
 * On prefers-reduced-motion the reveal still happens. That flag is about
 * unexpected, non-user-driven motion — parallax, auto-playing sweeps, things
 * that move while you sit still. A scroll-linked reveal is direct manipulation:
 * you move, it moves, and stopping means it stops. What reduced motion turns off
 * here is the *pin* (which makes the page feel stuck) and the scrub smoothing
 * (which keeps moving after you do). The content is identical either way.
 *
 * Returns { ref, progress, pinned }.
 */
export function useScrollBeam({ distance = 2 } = {}) {
  const ref = useRef(null);
  const [progress, setProgress] = useState(0);
  const [pinned, setPinned] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    let trigger = null;

    const build = () => {
      trigger?.kill();
      const calm = media.matches;
      setPinned(!calm);

      trigger = ScrollTrigger.create({
        trigger: element,
        start: "top top",
        // Pinned: the section holds while the sun crosses it. Unpinned: the beam
        // tracks the section's own travel through the viewport instead.
        end: calm ? "bottom top" : `+=${distance * 100}%`,
        pin: !calm,
        pinSpacing: !calm,
        // No `scrub` here on purpose. Scrub ties a *tween* to the scrollbar;
        // this trigger has no animation attached — it drives React state — and
        // setting scrub without one stops onUpdate reporting progress.
        onUpdate: (self) => setProgress(self.progress),
      });
    };

    build();
    if (import.meta.env.DEV) {
      window.__beamDebug = () => ({
        triggers: ScrollTrigger.getAll().length,
        progress: trigger?.progress,
        start: trigger?.start,
        end: trigger?.end,
        isActive: trigger?.isActive,
        scrollerIsWindow: ScrollTrigger.getAll()[0]?.scroller === window,
      });
    }
    media.addEventListener("change", build);

    // Fonts and lazily-rendered content settle after mount and change the
    // measurements ScrollTrigger cached.
    const refresh = () => ScrollTrigger.refresh();
    const settle = setTimeout(refresh, 300);
    document.fonts?.ready.then(refresh);

    return () => {
      clearTimeout(settle);
      media.removeEventListener("change", build);
      trigger?.kill();
      setPinned(false);
    };
  }, [distance]);

  return { ref, progress, pinned };
}
