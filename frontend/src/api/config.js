/**
 * Single source of truth for where the backend lives.
 *
 * This used to be a hardcoded `http://127.0.0.1:8000` repeated in 14 files, in
 * two spellings (127.0.0.1 and localhost) that browsers treat as different
 * origins for CORS. The app could not be deployed without editing source.
 */

const rawOrigin = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

export const API_ORIGIN = rawOrigin.replace(/\/+$/, "");
export const API_BASE = `${API_ORIGIN}/api`;
export const WS_BASE = API_ORIGIN.replace(/^http/, "ws");

/** Resolve a possibly-relative media/static path against the API origin. */
export function absoluteUrl(path) {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_ORIGIN}${path.startsWith("/") ? "" : "/"}${path}`;
}
