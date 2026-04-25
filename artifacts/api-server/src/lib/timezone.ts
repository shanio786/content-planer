/**
 * Application timezone helpers.
 *
 * All "today" / "this month" calculations server-side go through these
 * helpers so the dashboard and planner agree with the owner's wall
 * clock (Asia/Karachi, PKT) regardless of where the host (Replit /
 * VPS) is running. PKT is UTC+5 with NO daylight-saving transitions,
 * so a fixed offset is sufficient and avoids the cost / edge cases of
 * `Intl.DateTimeFormat` on every request.
 *
 * If the timezone ever needs to change (e.g. owner moves), update
 * `APP_TIMEZONE` and `APP_TZ_OFFSET_MINUTES` together. For zones with
 * DST, replace the offset arithmetic below with `Intl.DateTimeFormat`.
 */

export const APP_TIMEZONE = "Asia/Karachi";
const APP_TZ_OFFSET_MINUTES = 5 * 60; // PKT = UTC+5, no DST
const APP_TZ_OFFSET_MS = APP_TZ_OFFSET_MINUTES * 60 * 1000;

function pad(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

/** Internal: "now" shifted into the app TZ, expressed as a Date whose
 *  UTC fields read as the wall clock in the app TZ. */
function nowInAppTz(): Date {
  return new Date(Date.now() + APP_TZ_OFFSET_MS);
}

/** "YYYY-MM-DD" string for today in the app timezone. */
export function appTodayString(): string {
  const n = nowInAppTz();
  return `${n.getUTCFullYear()}-${pad(n.getUTCMonth() + 1)}-${pad(n.getUTCDate())}`;
}

/** Convert any Date instant to its calendar date "YYYY-MM-DD" in the app TZ. */
export function appDateString(d: Date): string {
  const shifted = new Date(d.getTime() + APP_TZ_OFFSET_MS);
  return `${shifted.getUTCFullYear()}-${pad(shifted.getUTCMonth() + 1)}-${pad(shifted.getUTCDate())}`;
}

/** UTC instant of 00:00 today in the app TZ. */
export function appStartOfTodayUtc(): Date {
  const n = nowInAppTz();
  return new Date(Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), n.getUTCDate()) - APP_TZ_OFFSET_MS);
}

/** UTC instant of 00:00 on the 1st of the current month in the app TZ. */
export function appStartOfThisMonthUtc(): Date {
  const n = nowInAppTz();
  return new Date(Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), 1) - APP_TZ_OFFSET_MS);
}

/** UTC instant of 00:00 on the date `daysAgo` days before today in the app TZ. */
export function appStartOfNDaysAgoUtc(daysAgo: number): Date {
  return new Date(appStartOfTodayUtc().getTime() - daysAgo * 24 * 60 * 60 * 1000);
}
