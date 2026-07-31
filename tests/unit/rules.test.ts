import { evaluateEnrollment, sessionsUsed, allowedByPayment } from "@/lib/attendance/rules"

describe("Attendance Rules Engine", () => {
  describe("sessionsUsed", () => {
    it("should count regular attendances and add carriedSessions", () => {
      const e = {
        carriedSessions: 2,
        attendances: [
          { type: "REGULAR", isMakeup: false },
          { type: "MAKEUP", isMakeup: true },
          { type: "IMPORTED", isMakeup: false } // should be ignored (deleted in backfill but test fallback)
        ]
      }
      expect(sessionsUsed(e)).toBe(3) // 1 regular + 2 carried = 3
    })
  })

  describe("allowedByPayment", () => {
    it("should prevent division by zero and handle free subscriptions", () => {
      expect(allowedByPayment(0, 0, 8)).toBe(8) // free program allows all sessions
      expect(allowedByPayment(1000, 500, 8)).toBe(4) // half paid allows half sessions
      expect(allowedByPayment(1000, 0, 8)).toBe(0) // unpaid allows 0
      expect(allowedByPayment(1000, 999.99, 8)).toBe(7) // check floor logic
      expect(allowedByPayment(1000, 1000, 8)).toBe(8) // fully paid
      expect(allowedByPayment(1000, 1500, 8)).toBe(8) // overpaid allows max sessions
    })
  })

  describe("evaluateEnrollment", () => {
    const mockSettings = {
      defaultDurationDays: 30,
      allowOffScheduleCheckIn: true,
      expiryWarningDays: 3,
      expireOnSessionsDone: true
    }

    const mockProgramOption = {
      price: 800,
      sessionsPerMonth: 8,
      durationDays: 30,
      makeupAllowance: 1,
      graceDays: 0,
      schedules: [
        { dayOfWeek: 5, startTime: "17:00", endTime: "19:00" } // Friday 5:00 PM to 7:00 PM
      ]
    }

    const mockClient = { name: "Test Client" }

    it("should allow CHECK_IN and recommend it on a scheduled day inside the window", () => {
      // 2026-07-31 is a Friday.
      // Friday 18:00 (6:00 PM Cairo) is inside the 17:00-19:00 Cairo window.
      const now = new Date(Date.UTC(2026, 6, 31, 15, 0, 0)) // 15:00 UTC = 18:00 Cairo (with Egypt DST UTC+3)
      
      const enrollment = {
        id: "enr_1",
        status: "CONFIRMED",
        totalAmount: 800,
        amountPaid: 800,
        createdAt: new Date(Date.UTC(2026, 6, 25)),
        startDate: new Date(Date.UTC(2026, 6, 25)),
        endDate: new Date(Date.UTC(2026, 7, 25)), // ends Aug 25
        carriedSessions: 0,
        frozenDays: 0,
        option: mockProgramOption,
        attendances: []
      }

      const state = evaluateEnrollment(enrollment, now, mockSettings)
      expect(state.blockers).toEqual([])
      expect(state.warnings).toEqual([])
      expect(state.allowedActions).toContain("CHECK_IN")
      expect(state.recommended).toBe(true)
    })

    it("should raise OFF_SCHEDULE_DAY on non-scheduled days and allow makeup/off-schedule", () => {
      // 2026-07-30 is a Thursday.
      const now = new Date(Date.UTC(2026, 6, 30, 12, 0, 0))

      const enrollment = {
        id: "enr_1",
        status: "CONFIRMED",
        totalAmount: 800,
        amountPaid: 800,
        createdAt: new Date(Date.UTC(2026, 6, 25)),
        startDate: new Date(Date.UTC(2026, 6, 25)),
        endDate: new Date(Date.UTC(2026, 7, 25)),
        carriedSessions: 0,
        frozenDays: 0,
        option: mockProgramOption,
        attendances: []
      }

      const state = evaluateEnrollment(enrollment, now, mockSettings)
      expect(state.blockers).toEqual([])
      expect(state.warnings).toContain("OFF_SCHEDULE_DAY")
      expect(state.allowedActions).toContain("CHECK_IN_MAKEUP")
      expect(state.allowedActions).toContain("CHECK_IN_OFF_SCHEDULE")
      expect(state.recommended).toBe(false)
    })

    it("should raise EXPIRED blocker when subscription period has passed", () => {
      const now = new Date(Date.UTC(2026, 6, 31, 12, 0, 0))

      const enrollment = {
        id: "enr_1",
        status: "CONFIRMED",
        totalAmount: 800,
        amountPaid: 800,
        createdAt: new Date(Date.UTC(2026, 5, 1)),
        startDate: new Date(Date.UTC(2026, 5, 1)),
        endDate: new Date(Date.UTC(2026, 6, 1)), // ended July 1st
        carriedSessions: 0,
        frozenDays: 0,
        option: mockProgramOption,
        attendances: []
      }

      const state = evaluateEnrollment(enrollment, now, mockSettings)
      expect(state.blockers).toContain("EXPIRED")
      expect(state.allowedActions).toContain("RENEW")
    })

    it("should raise SESSIONS_EXHAUSTED blocker when all sessions are used", () => {
      const now = new Date(Date.UTC(2026, 6, 31, 15, 0, 0))

      const enrollment = {
        id: "enr_1",
        status: "CONFIRMED",
        totalAmount: 800,
        amountPaid: 800,
        createdAt: new Date(Date.UTC(2026, 6, 25)),
        startDate: new Date(Date.UTC(2026, 6, 25)),
        endDate: new Date(Date.UTC(2026, 7, 25)),
        carriedSessions: 0,
        frozenDays: 0,
        option: mockProgramOption,
        attendances: Array.from({ length: 8 }, () => ({ type: "REGULAR", isMakeup: false }))
      }

      const state = evaluateEnrollment(enrollment, now, mockSettings)
      expect(state.blockers).toContain("SESSIONS_EXHAUSTED")
      expect(state.allowedActions).toContain("RENEW")
    })

    it("should raise PAYMENT_LIMIT blocker on partial payment", () => {
      const now = new Date(Date.UTC(2026, 6, 31, 15, 0, 0))

      const enrollment = {
        id: "enr_1",
        status: "CONFIRMED",
        totalAmount: 800,
        amountPaid: 400, // half paid = 4 sessions allowed
        createdAt: new Date(Date.UTC(2026, 6, 25)),
        startDate: new Date(Date.UTC(2026, 6, 25)),
        endDate: new Date(Date.UTC(2026, 7, 25)),
        carriedSessions: 0,
        frozenDays: 0,
        option: mockProgramOption,
        attendances: Array.from({ length: 4 }, () => ({ type: "REGULAR", isMakeup: false }))
      }

      const state = evaluateEnrollment(enrollment, now, mockSettings)
      expect(state.blockers).toContain("PAYMENT_LIMIT")
      expect(state.allowedActions).toContain("PAY")
    })
  })
})
