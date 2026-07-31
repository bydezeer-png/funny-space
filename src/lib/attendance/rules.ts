import { cairoDayKey, cairoDayOfWeek, cairoMinutes } from "../time"
import { EnrollmentScanState, Blocker, Warning } from "./types"

export function sessionsUsed(e: any): number {
  const regularCount = e.attendances.filter(
    (a: any) =>
      a.type === "REGULAR" ||
      (!a.type && !a.isMakeup && a.status !== "IMPORTED")
  ).length
  return regularCount + (e.carriedSessions || 0)
}

export function allowedByPayment(
  total: number,
  paid: number,
  sessions: number
): number {
  if (sessions <= 0) return 0
  if (total <= 0) return sessions // Free or gift subscription
  const perSession = total / sessions
  // Use a small epsilon to avoid floating point precision issues (e.g. 799.99999 / 100)
  return Math.min(sessions, Math.floor((paid + 1e-6) / perSession))
}

export function getEffectiveEndDate(e: any): Date | null {
  if (!e.endDate) return null
  const d = new Date(e.endDate)
  const extension = (e.frozenDays || 0) + (e.option?.graceDays || 0)
  d.setDate(d.getDate() + extension)
  return d
}

function parseTime(t: string): number {
  const [h, m] = t.split(":").map(Number)
  return h * 60 + m
}

export function evaluateEnrollment(
  e: any,
  now: Date,
  settings: any
): EnrollmentScanState {
  const todayKey = cairoDayKey(now)
  const todayDayOfWeek = cairoDayOfWeek(now)
  const nowMin = cairoMinutes(now)

  const defaultDuration = settings?.defaultDurationDays ?? 30
  const allowOffSchedule = settings?.allowOffScheduleCheckIn ?? true
  const warningDaysLimit = settings?.expiryWarningDays ?? 3

  const blockers: Blocker[] = []
  const warnings: Warning[] = []
  const allowedActions: EnrollmentScanState["allowedActions"] = []

  let kind: EnrollmentScanState["kind"] = "PROGRAM"
  let title = "اشتراك"
  let categoryName = ""

  let usedSessions = 0
  let totalSessions = 0
  let makeupUsed = 0
  let makeupAllowed = 0

  let totalAmount = e.totalAmount || 0
  let amountPaid = e.amountPaid || 0
  let due = Math.max(0, totalAmount - amountPaid)
  let allowedSessionsByPayment = 0

  let startDateStr = ""
  let endDateStr = ""
  let daysLeft = 999

  // Determine enrollment kind and fields
  if (e.workshop) {
    kind = "WORKSHOP"
    title = e.workshop.name
    totalSessions = 1
    usedSessions = e.attendances.length
    startDateStr = e.workshop.startDate ? cairoDayKey(new Date(e.workshop.startDate)) : ""
    endDateStr = e.workshop.endDate ? cairoDayKey(new Date(e.workshop.endDate)) : ""
  } else if (e.event) {
    kind = "EVENT"
    title = e.event.name
    totalSessions = 1
    usedSessions = e.attendances.length
    startDateStr = e.event.date ? cairoDayKey(new Date(e.event.date)) : ""
    endDateStr = e.event.date ? cairoDayKey(new Date(e.event.date)) : ""
  } else {
    kind = "PROGRAM"
    title = `${e.program?.name || "برنامج"} - ${e.option?.name || "فئة"}`
    categoryName = e.program?.category?.name || ""
    totalSessions = e.option?.sessionsPerMonth || 8
    usedSessions = sessionsUsed(e)
    makeupAllowed = e.option?.makeupAllowance ?? 1
    makeupUsed = e.attendances.filter((a: any) => a.type === "MAKEUP" || a.isMakeup).length

    allowedSessionsByPayment = allowedByPayment(totalAmount, amountPaid, totalSessions)
    startDateStr = e.startDate ? cairoDayKey(new Date(e.startDate)) : cairoDayKey(new Date(e.createdAt))
    
    const effEnd = getEffectiveEndDate(e)
    endDateStr = effEnd ? cairoDayKey(effEnd) : ""
  }

  // Calculate days left
  if (endDateStr) {
    const end = e.workshop ? new Date(e.workshop.endDate) : e.event ? new Date(e.event.date) : getEffectiveEndDate(e)
    if (end) {
      const diffTime = end.getTime() - now.getTime()
      daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    }
  }

  // 1. Check Cancelled Blocker
  if (e.status === "CANCELLED") {
    blockers.push("CANCELLED")
  }

  // 2. Check Pending Blocker
  if (e.status === "PENDING") {
    blockers.push("NOT_CONFIRMED")
  }

  // 3. Check Expired Blocker
  if (endDateStr && todayKey > endDateStr) {
    blockers.push("EXPIRED")
  }

  // 4. Check Sessions Exhausted Blocker
  if (usedSessions >= totalSessions && e.status === "CONFIRMED") {
    blockers.push("SESSIONS_EXHAUSTED")
  }

  // 5. Check Payment Limit Blocker
  if (kind === "PROGRAM" && e.status === "CONFIRMED") {
    if (usedSessions >= allowedSessionsByPayment && usedSessions < totalSessions) {
      blockers.push("PAYMENT_LIMIT")
    }
  }

  // 6. Check Already Checked In Blocker
  const checkedInToday = e.attendances.some((a: any) => {
    const dKey = a.dayKey || (a.date ? cairoDayKey(new Date(a.date)) : "")
    const isImported = a.type === "IMPORTED" || a.status === "IMPORTED"
    return dKey === todayKey && !isImported
  })
  if (checkedInToday && e.status === "CONFIRMED") {
    blockers.push("ALREADY_CHECKED_IN")
  }

  // Warnings
  if (e.status === "CONFIRMED") {
    // Partial payment warning
    if (due > 0) {
      warnings.push("PARTIAL_PAYMENT")
    }

    // Expiry warning
    if (blockers.indexOf("EXPIRED") === -1 && daysLeft >= 0 && daysLeft <= warningDaysLimit) {
      warnings.push("EXPIRES_SOON")
    }

    // Makeup quota warning
    if (kind === "PROGRAM" && makeupUsed >= makeupAllowed) {
      warnings.push("MAKEUP_QUOTA_USED")
    }
  }

  // Schedule evaluation (for programs)
  let isScheduledToday = false
  let isWithinWindow = false
  let todaySlots: { start: string; end: string }[] = []
  let weeklySchedules: { dayOfWeek: number; start: string; end: string }[] = []
  let nextSession: any = undefined

  if (kind === "PROGRAM" && e.option?.schedules) {
    weeklySchedules = e.option.schedules.map((s: any) => ({
      dayOfWeek: s.dayOfWeek,
      start: s.startTime,
      end: s.endTime,
    }))

    const schedulesToday = e.option.schedules.filter(
      (s: any) => s.dayOfWeek === todayDayOfWeek
    )
    isScheduledToday = schedulesToday.length > 0

    if (isScheduledToday) {
      todaySlots = schedulesToday.map((s: any) => ({
        start: s.startTime,
        end: s.endTime,
      }))

      isWithinWindow = schedulesToday.some((s: any) => {
        const startMin = parseTime(s.startTime)
        const endMin = parseTime(s.endTime)
        return nowMin >= startMin - 60 && nowMin <= endMin + 60
      })
    }

    // Warnings for schedules
    const hasSchedules = e.option.schedules && e.option.schedules.length > 0
    if (hasSchedules) {
      if (!isScheduledToday) {
        warnings.push("OFF_SCHEDULE_DAY")
      } else if (!isWithinWindow) {
        warnings.push("OUTSIDE_TIME_WINDOW")
      }
    }

    // Calculate next session
    const sortedWeekly = [...(e.option.schedules || [])].sort((a: any, b: any) => a.dayOfWeek - b.dayOfWeek)
    const next = sortedWeekly.find((s: any) => s.dayOfWeek > todayDayOfWeek) || sortedWeekly[0]
    if (next) {
      nextSession = {
        dayOfWeek: next.dayOfWeek,
        start: next.startTime,
        end: next.endTime,
      }
    }
  }

  // Allowed actions based on blockers
  const hasSevereBlocker = blockers.some((b) => b !== "ALREADY_CHECKED_IN")

  if (!hasSevereBlocker) {
    if (blockers.indexOf("ALREADY_CHECKED_IN") === -1) {
      if (kind === "PROGRAM") {
        const hasSchedules = e.option?.schedules && e.option.schedules.length > 0
        if (!hasSchedules || isScheduledToday) {
          allowedActions.push("CHECK_IN")
        } else {
          if (makeupUsed < makeupAllowed) {
            allowedActions.push("CHECK_IN_MAKEUP")
          }
          if (allowOffSchedule) {
            allowedActions.push("CHECK_IN_OFF_SCHEDULE")
          }
        }
      } else {
        // Workshops and events can check in any day
        allowedActions.push("CHECK_IN")
      }
    } else {
      // Already checked in today, but we can allow makeup or off-schedule if quota is available
      if (kind === "PROGRAM") {
        if (makeupUsed < makeupAllowed) {
          allowedActions.push("CHECK_IN_MAKEUP")
        }
        if (allowOffSchedule) {
          allowedActions.push("CHECK_IN_OFF_SCHEDULE")
        }
      }
    }
  }

  // Payment actions
  if (due > 0) {
    allowedActions.push("PAY")
  }

  // Renewal action
  if (
    blockers.indexOf("EXPIRED") !== -1 ||
    blockers.indexOf("SESSIONS_EXHAUSTED") !== -1 ||
    (kind === "PROGRAM" && usedSessions >= totalSessions)
  ) {
    allowedActions.push("RENEW")
  }

  // Recommendation logic
  const isRecommended =
    e.status === "CONFIRMED" &&
    blockers.length === 0 &&
    (kind !== "PROGRAM" || (isScheduledToday && isWithinWindow))

  return {
    enrollmentId: e.id,
    kind,
    title,
    categoryName,
    sessions: {
      used: usedSessions,
      total: totalSessions,
      remaining: Math.max(0, totalSessions - usedSessions),
      makeupUsed,
      makeupAllowed,
    },
    money: {
      total: totalAmount,
      paid: amountPaid,
      due,
      allowedByPayment: allowedSessionsByPayment,
    },
    period: {
      startDate: startDateStr,
      endDate: endDateStr,
      daysLeft,
    },
    schedule: {
      todaySlots,
      weekly: weeklySchedules,
      isScheduledToday,
      isWithinWindow,
      nextSession,
    },
    blockers,
    warnings,
    allowedActions,
    recommended: isRecommended,
  }
}

export function pickRecommended(
  states: EnrollmentScanState[]
): EnrollmentScanState | null {
  // 1. Pick the first recommended state
  const recommended = states.find((s) => s.recommended)
  if (recommended) return recommended

  // 2. Pick the first one with no blockers
  const noBlockers = states.find((s) => s.blockers.length === 0)
  if (noBlockers) return noBlockers

  // 3. Fallback to the first state
  return states[0] || null
}
