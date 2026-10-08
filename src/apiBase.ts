/**
 * Base URL for backend API calls.
 * - Web (same origin): leave empty → relative "/api/..."
 * - Capacitor / APK: set VITE_API_BASE_URL to your deployed server
 *   e.g. https://your-memeai.onrender.com
 */
export const API_BASE = String(
  (typeof import.meta !== "undefined" &&
    (import.meta as any).env &&
    (import.meta as any).env.VITE_API_BASE_URL) ||
    ""
).replace(/\/$/, "");

export function apiUrl(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE}${p}`;
}
