export type Blocker =
  | "NOT_CONFIRMED"       // Payment/booking not confirmed yet
  | "EXPIRED"             // Subscription period expired
  | "SESSIONS_EXHAUSTED"  // All sessions (regular + carried) consumed
  | "PAYMENT_LIMIT"       // Paid sessions consumed (for partial payment)
  | "ALREADY_CHECKED_IN"  // Already checked in today for this enrollment
  | "CANCELLED"           // Enrollment was cancelled

export type Warning =
  | "OFF_SCHEDULE_DAY"    // Today is not a scheduled day for this program option
  | "OUTSIDE_TIME_WINDOW" // Today is scheduled, but outside the time slot (e.g. +-1 hour)
  | "EXPIRES_SOON"        // Sub expires in <= expiryWarningDays
  | "PARTIAL_PAYMENT"     // Outstanding balance exists
  | "MAKEUP_QUOTA_USED"   // All allowed makeup sessions used

export interface EnrollmentScanState {
  enrollmentId: string
  kind: "PROGRAM" | "WORKSHOP" | "EVENT"
  title: string            // e.g. "Skating - Beginner"
  categoryName?: string
  sessions: {
    used: number
    total: number
    remaining: number
    makeupUsed: number
    makeupAllowed: number
  }
  money: {
    total: number
    paid: number
    due: number
    allowedByPayment: number
  }
  period: {
    startDate: string
    endDate: string
    daysLeft: number
  }
  schedule: {
    todaySlots: { start: string; end: string }[]
    weekly: { dayOfWeek: number; start: string; end: string }[]
    isScheduledToday: boolean
    isWithinWindow: boolean
    nextSession?: { dayOfWeek: number; start: string; end: string }
  }
  blockers: Blocker[]
  warnings: Warning[]
  allowedActions: ("CHECK_IN" | "CHECK_IN_MAKEUP" | "CHECK_IN_OFF_SCHEDULE" | "RENEW" | "PAY")[]
  recommended: boolean
}
