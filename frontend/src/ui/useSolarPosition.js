import { useEffect, useState } from "react";

/** Noon. The reduced-motion state the whole system falls back to. */
export const NOON = 0.5;

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/**
 * Where the sun is, as 0..1 across the lit part of the day.
 *
 * 0 is first light, 0.5 is noon, 1 is last light. Outside those hours it clamps
 * to the nearer end rather than going dark — the building is always readable.
 *
 * Honours prefers-reduced-motion by pinning to noon and never updating, which is
 * this world's own documented still state rather than a degraded fallback.
 */
export function useSolarPosition({ sunriseHour = 6, sunsetHour = 20 } = {}) {
  const [position, setPosition] = useState(() =>
    prefersReducedMotion() ? NOON : solarPosition(new Date(), sunriseHour, sunsetHour)
  );

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");

    let timer = null;

    const sync = () => {
      if (media.matches) {
        setPosition(NOON);
        if (timer) clearInterval(timer);
        timer = null;
        return;
      }
      setPosition(solarPosition(new Date(), sunriseHour, sunsetHour));
      // The sun does not need more than a minute's resolution.
      timer ??= setInterval(
        () => setPosition(solarPosition(new Date(), sunriseHour, sunsetHour)),
        60_000
      );
    };

    sync();
    media.addEventListener("change", sync);

    return () => {
      media.removeEventListener("change", sync);
      if (timer) clearInterval(timer);
    };
  }, [sunriseHour, sunsetHour]);

  return position;
}

export function solarPosition(date, sunriseHour = 6, sunsetHour = 20) {
  const hours = date.getHours() + date.getMinutes() / 60;
  const span = sunsetHour - sunriseHour;
  if (span <= 0) return NOON;
  return Math.min(1, Math.max(0, (hours - sunriseHour) / span));
}

/**
 * Which of `count` rooms the beam is currently over, or null when it sits
 * between two. Drives the "active now" highlight.
 */
export function roomUnderBeam(position, count) {
  if (count <= 0) return null;
  const index = Math.floor(position * count);
  return Math.min(index, count - 1);
}
