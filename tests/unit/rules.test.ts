import { evaluateEnrollment, sessionsUsed, allowedByPayment } from "@/lib/attendance/rules"

describe("Attendance Rules Engine", () => {
  describe("sessionsUsed", () => {
    it("should count every real check-in and add carriedSessions", () => {
      const e = {
        carriedSessions: 2,
        attendances: [
          { type: "REGULAR", isMakeup: false },
          { type: "MAKEUP", isMakeup: true },
          { type: "IMPORTED", isMakeup: false } // should be ignored (deleted in backfill but test fallback)
        ]
      }
      // 1 regular + 1 makeup + 2 carried = 4 (IMPORTED never consumes)
      expect(sessionsUsed(e)).toBe(4)
    })

    it("should count OFF_SCHEDULE check-ins (they are real attendances)", () => {
      const e = {
        carriedSessions: 0,
        attendances: [
          { type: "OFF_SCHEDULE", isMakeup: false },
          { type: "OFF_SCHEDULE", isMakeup: false }
        ]
      }
      expect(sessionsUsed(e)).toBe(2)
    })

    it("should ignore rows flagged as IMPORTED via status", () => {
      const e = {
        carriedSessions: 0,
        attendances: [
          { type: "REGULAR", isMakeup: false, status: "IMPORTED" },
          { type: "REGULAR", isMakeup: false, status: "ATTENDED" }
        ]
      }
      expect(sessionsUsed(e)).toBe(1)
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

    describe("single session plan (حصة واحدة)", () => {
      const singleSessionOption = {
        ...mockProgramOption,
        price: 200,
        sessionsPerMonth: 1,
        schedules: [
          { id: "sch_sun", dayOfWeek: 0, startTime: "19:00", endTime: "20:30" },
          { id: "sch_thu", dayOfWeek: 4, startTime: "19:00", endTime: "20:30" }
        ]
      }

      function singleSessionEnrollment(attendances: any[]) {
        return {
          id: "enr_single",
          status: "CONFIRMED",
          totalAmount: 200,
          amountPaid: 200,
          createdAt: new Date(Date.UTC(2026, 7, 2)),
          startDate: new Date(Date.UTC(2026, 7, 2)),
          endDate: new Date(Date.UTC(2026, 8, 1)),
          carriedSessions: 0,
          frozenDays: 0,
          option: singleSessionOption,
          attendances
        }
      }

      // 2026-08-11 is a Tuesday: not one of the scheduled days (Sun/Thu).
      const offScheduleDay = new Date(Date.UTC(2026, 7, 11, 12, 0, 0))

      it("should consume the session on an OFF_SCHEDULE check-in", () => {
        const state = evaluateEnrollment(
          singleSessionEnrollment([
            { type: "OFF_SCHEDULE", isMakeup: false, dayKey: "2026-08-10", status: "ATTENDED" }
          ]),
          offScheduleDay,
          mockSettings
        )

        expect(state.sessions.used).toBe(1)
        expect(state.sessions.remaining).toBe(0)
        expect(state.blockers).toContain("SESSIONS_EXHAUSTED")
        expect(state.allowedActions).not.toContain("CHECK_IN_OFF_SCHEDULE")
        expect(state.allowedActions).not.toContain("CHECK_IN_MAKEUP")
      })

      it("should consume the session on a MAKEUP check-in", () => {
        const state = evaluateEnrollment(
          singleSessionEnrollment([
            { type: "MAKEUP", isMakeup: true, dayKey: "2026-08-10", status: "MAKEUP" }
          ]),
          offScheduleDay,
          mockSettings
        )

        expect(state.sessions.remaining).toBe(0)
        expect(state.blockers).toContain("SESSIONS_EXHAUSTED")
      })

      it("should refuse a second check-in on the same day", () => {
        const state = evaluateEnrollment(
          singleSessionEnrollment([
            { type: "MAKEUP", isMakeup: true, dayKey: "2026-08-11", status: "MAKEUP" }
          ]),
          offScheduleDay,
          mockSettings
        )

        expect(state.blockers).toContain("ALREADY_CHECKED_IN")
        expect(state.allowedActions).not.toContain("CHECK_IN_OFF_SCHEDULE")
      })

      it("should still offer the off-schedule entry while the session is unused", () => {
        const state = evaluateEnrollment(
          singleSessionEnrollment([]),
          offScheduleDay,
          mockSettings
        )

        expect(state.sessions.remaining).toBe(1)
        expect(state.blockers).toEqual([])
        expect(state.allowedActions).toContain("CHECK_IN_OFF_SCHEDULE")
      })
    })

    it("should allow a second same-day entry only when preventDoubleCheckIn is off", () => {
      const now = new Date(Date.UTC(2026, 6, 30, 12, 0, 0)) // Thursday, off-schedule
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
        attendances: [
          { type: "REGULAR", isMakeup: false, dayKey: "2026-07-30", status: "ATTENDED" }
        ]
      }

      const blocked = evaluateEnrollment(enrollment, now, mockSettings)
      expect(blocked.blockers).toContain("ALREADY_CHECKED_IN")
      expect(blocked.allowedActions).not.toContain("CHECK_IN_OFF_SCHEDULE")

      const relaxed = evaluateEnrollment(enrollment, now, {
        ...mockSettings,
        preventDoubleCheckIn: false
      })
      expect(relaxed.allowedActions).toContain("CHECK_IN_OFF_SCHEDULE")
    })
  })
})
