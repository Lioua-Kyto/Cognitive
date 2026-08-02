import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { NOON } from "./useSolarPosition.js";

gsap.registerPlugin(ScrollTrigger);

/**
 * Pins a container and maps scroll progress onto the sun's arc.
 *
 * The signature interaction: one scroll gesture walks the beam across the seven
 * rooms, lighting each in turn, so a visitor learns the whole product without
 * reading anything.
 *
 * Under prefers-reduced-motion nothing is pinned and nothing scrubs — the beam
 * sits at noon and every room is shown in its true state. That is this world's
 * documented still state, so the reduced-motion page is complete rather than a
 * stripped-down version of the real one.
 *
 * Returns { ref, progress, pinned }. Attach ref to the element to pin.
 */
export function useScrollBeam({ distance = 2 } = {}) {
  const ref = useRef(null);
  const [progress, setProgress] = useState(NOON);
  const [pinned, setPinned] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (media.matches || !ref.current) {
      setProgress(NOON);
      setPinned(false);
      return;
    }

    setPinned(true);

    // Progress is written to state rather than tweened onto the DOM because the
    // rooms are React-rendered; the only thing GSAP animates directly is nothing,
    // which keeps every frame to a fill-opacity change on already-composited SVG.
    const trigger = ScrollTrigger.create({
      trigger: ref.current,
      start: "top top",
      end: `+=${distance * 100}%`,
      pin: true,
      pinSpacing: true,
      scrub: 0.4,
      onUpdate: (self) => setProgress(self.progress),
      onRefreshInit: () => setProgress(0),
    });

    return () => {
      trigger.kill();
      setPinned(false);
    };
  }, [distance]);

  return { ref, progress, pinned };
}
