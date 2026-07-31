export const TZ = "Africa/Cairo"

/**
 * Returns "YYYY-MM-DD" in Cairo local time.
 */
export function cairoDayKey(d: Date = new Date()): string {
  if (!d || isNaN(d.getTime())) return ""
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d)
}

/**
 * Returns day of week (0=Sunday ... 6=Saturday) in Cairo local time.
 */
export function cairoDayOfWeek(d: Date = new Date()): number {
  if (!d || isNaN(d.getTime())) return 0
  const short = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    weekday: "short",
  }).format(d)
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(short)
}

/**
 * Returns minutes since Cairo midnight.
 */
export function cairoMinutes(d: Date = new Date()): number {
  if (!d || isNaN(d.getTime())) return 0
  const formatted = new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d)
  const [h, m] = formatted.split(":").map(Number)
  return h * 60 + m
}

/**
 * Add days to a Date.
 */
export function addDays(d: Date, days: number): Date {
  const result = new Date(d)
  result.setDate(result.getDate() + days)
  return result
}
