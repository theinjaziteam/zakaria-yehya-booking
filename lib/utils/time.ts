import { addDays, format } from "date-fns";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import { clientConfig } from "@/config/client";

const DEFAULT_TZ = clientConfig.business.defaultTimezone;

/**
 * Parse a timestamp that may be in PostgreSQL format ("2026-05-28 10:00:00+00")
 * or ISO 8601 format ("2026-05-28T10:00:00+00:00"). Both are normalised to a
 * valid Date before passing to date-fns-tz.
 */
function parseTs(ts: string): Date {
  // Replace the space separator with T, and bare +00 suffix with +00:00
  const iso = ts.replace(" ", "T").replace(/\+00$/, "+00:00");
  const d = new Date(iso);
  if (isNaN(d.getTime())) throw new RangeError(`Cannot parse timestamp: "${ts}"`);
  return d;
}

export function todayDate(tz = DEFAULT_TZ): string {
  return formatInTimeZone(new Date(), tz, "yyyy-MM-dd");
}

export function windowEndDate(tz = DEFAULT_TZ): string {
  return formatInTimeZone(
    addDays(new Date(), clientConfig.business.bookingWindowDays),
    tz,
    "yyyy-MM-dd",
  );
}

/** "Friday, 23 May" */
export function formatDisplayDate(isoDate: string): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  return format(new Date(y!, m! - 1, d!), "EEEE, d MMMM");
}

/** "Friday, 23 May · 15:30" */
export function formatDisplayDatetime(
  isoTimestamp: string,
  tz = DEFAULT_TZ,
): string {
  return formatInTimeZone(parseTs(isoTimestamp), tz, "EEEE, d MMMM · HH:mm");
}

/** "15:30" */
export function formatTime(isoTimestamp: string, tz = DEFAULT_TZ): string {
  return formatInTimeZone(parseTs(isoTimestamp), tz, "HH:mm");
}

/**
 * Converts a local date+time string (yyyy-MM-dd, HH:mm) in the given timezone
 * to a UTC ISO string suitable for the DB.
 */
export function localToUTC(date: string, time: string, tz: string): string {
  const [y, m, d] = date.split("-").map(Number);
  const [h, min] = time.split(":").map(Number);
  const local = new Date(y!, m! - 1, d!, h!, min!, 0, 0);
  return fromZonedTime(local, tz).toISOString();
}
