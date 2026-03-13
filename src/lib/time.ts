/**
 * PST time utilities for SQL Server TIME column storage.
 *
 * SQL Server TIME columns store time-of-day only (no date, no timezone).
 * Prisma maps them to JavaScript Date objects with epoch date (1970-01-01).
 * The tedious driver reads/writes UTC components to TIME columns.
 *
 * Convention: all times are stored as PST (America/Los_Angeles) wall-clock values.
 * We create Date objects where UTC components equal PST hours/minutes/seconds,
 * so tedious writes the PST time into the TIME column.
 */

const TZ = 'America/Los_Angeles';

/**
 * Get current PST wall-clock time as a UTC-epoch Date.
 * Example: 6:15 AM PST → Date(1970-01-01T06:15:00Z)
 */
export function nowPstAsUtc(): Date {
  const now = new Date();
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TZ,
    hourCycle: 'h23',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
  }).formatToParts(now);

  const h = parseInt(parts.find(p => p.type === 'hour')?.value ?? '0');
  const m = parseInt(parts.find(p => p.type === 'minute')?.value ?? '0');
  const s = parseInt(parts.find(p => p.type === 'second')?.value ?? '0');

  return new Date(Date.UTC(1970, 0, 1, h, m, s));
}

/**
 * Get the current PST hour (0-23).
 */
export function getPstHour(): number {
  return parseInt(
    new Intl.DateTimeFormat('en-US', {
      timeZone: TZ,
      hourCycle: 'h23',
      hour: 'numeric',
    }).format(new Date())
  );
}

/**
 * Get today's PST date boundaries as UTC midnight dates.
 * logDate in the database is stored as midnight UTC representing the PST calendar date.
 */
export function getTodayRangePST(): { todayStart: Date; todayEnd: Date } {
  const now = new Date();
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TZ,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  }).formatToParts(now);

  const y = parseInt(parts.find(p => p.type === 'year')?.value ?? '2026');
  const mo = parseInt(parts.find(p => p.type === 'month')?.value ?? '1') - 1;
  const d = parseInt(parts.find(p => p.type === 'day')?.value ?? '1');

  const todayStart = new Date(Date.UTC(y, mo, d));
  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayEnd.getDate() + 1);
  return { todayStart, todayEnd };
}

/**
 * Convert an HH:mm string (PST) to a UTC-epoch Date for TIME column storage.
 * Example: "06:15" → Date(1970-01-01T06:15:00Z)
 */
export function timeStringToUtcDate(timeStr: string): Date {
  const [h, m] = timeStr.split(':').map(Number);
  return new Date(Date.UTC(1970, 0, 1, h, m, 0));
}

/**
 * Extract seconds-of-day from a stored time (Date from Prisma TIME column).
 * Since we store PST as UTC, getUTCHours() gives the PST hour.
 */
export function storedTimeToSeconds(d: Date): number {
  return d.getUTCHours() * 3600 + d.getUTCMinutes() * 60 + d.getUTCSeconds();
}

/**
 * Get current PST seconds-of-day.
 */
export function nowPstSeconds(): number {
  const pst = nowPstAsUtc();
  return pst.getUTCHours() * 3600 + pst.getUTCMinutes() * 60 + pst.getUTCSeconds();
}

/**
 * Compute elapsed minutes between a stored time (Prisma Date from TIME column)
 * and the current PST time. Both are in PST convention.
 */
export function minutesSinceStored(stored: Date): number {
  const storedSec = storedTimeToSeconds(stored);
  const currentSec = nowPstSeconds();
  return Math.max(0, (currentSec - storedSec) / 60);
}
