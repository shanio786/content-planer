/**
 * Application timezone helpers (client side).
 *
 * All "today" calculations and any YYYY-MM-DD ↔ Date conversions in
 * the planner go through these helpers so the dashboard agrees with
 * the owner's wall clock (Asia/Karachi, PKT) regardless of the
 * browser's local timezone. PKT is UTC+5 with NO daylight-saving
 * transitions, so a fixed offset is sufficient.
 *
 * If the timezone ever needs to change, update `APP_TIMEZONE` and
 * `APP_TZ_OFFSET_MINUTES` together (and the matching constants in
 * `artifacts/api-server/src/lib/timezone.ts`).
 */

export const APP_TIMEZONE = "Asia/Karachi";
const APP_TZ_OFFSET_MINUTES = 5 * 60; // PKT = UTC+5, no DST
const APP_TZ_OFFSET_MS = APP_TZ_OFFSET_MINUTES * 60 * 1000;

function pad(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

/** "YYYY-MM-DD" string for today in the app timezone. */
export function appTodayString(): string {
  const n = new Date(Date.now() + APP_TZ_OFFSET_MS);
  return `${n.getUTCFullYear()}-${pad(n.getUTCMonth() + 1)}-${pad(n.getUTCDate())}`;
}

/**
 * Add `days` to a "YYYY-MM-DD" calendar-date string and return the
 * resulting "YYYY-MM-DD" string. Pure calendar arithmetic — does not
 * depend on browser timezone or DST.
 */
export function shiftDateString(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`;
}

/**
 * Format a "YYYY-MM-DD" calendar-date string as a human label
 * (e.g. "Mon, Apr 24") using en-US conventions. Constructed via UTC
 * so the displayed weekday/month always matches the calendar date,
 * regardless of browser timezone.
 */
export function formatDateLabel(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}
