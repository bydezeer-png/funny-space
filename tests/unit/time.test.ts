import { cairoDayKey, cairoDayOfWeek, cairoMinutes, addDays } from "@/lib/time"

describe("Cairo Time Utilities", () => {
  describe("cairoDayKey", () => {
    it("should format date correctly as YYYY-MM-DD", () => {
      // 2026-07-31 12:00:00 UTC (14:00:00 Cairo time)
      const d = new Date(Date.UTC(2026, 6, 31, 12, 0, 0))
      expect(cairoDayKey(d)).toBe("2026-07-31")
    })

    it("should handle day boundary where Cairo is ahead of UTC", () => {
      // 2026-07-31 22:30:00 UTC (2026-08-01 00:30:00 Cairo time)
      // Since Cairo is UTC+2 or UTC+3 (Egypt DST is active in July/August, UTC+3)
      const d = new Date(Date.UTC(2026, 6, 31, 22, 30, 0))
      expect(cairoDayKey(d)).toBe("2026-08-01")
    })
  })

  describe("cairoDayOfWeek", () => {
    it("should return the correct day index", () => {
      // 2026-07-31 is a Friday.
      // Sun=0, Mon=1, Tue=2, Wed=3, Thu=4, Fri=5, Sat=6
      const d = new Date(Date.UTC(2026, 6, 31, 12, 0, 0))
      expect(cairoDayOfWeek(d)).toBe(5)
    })

    it("should handle day index change at midnight Cairo time", () => {
      // 2026-07-31 22:30:00 UTC is Saturday, 2026-08-01 01:30:00 Cairo time.
      const d = new Date(Date.UTC(2026, 6, 31, 22, 30, 0))
      expect(cairoDayOfWeek(d)).toBe(6) // Saturday
    })
  })

  describe("cairoMinutes", () => {
    it("should return minutes since midnight in Cairo time", () => {
      // 2026-07-31 12:00:00 UTC is 15:00:00 in Cairo (with DST UTC+3)
      // 15 * 60 = 900 minutes
      const d = new Date(Date.UTC(2026, 6, 31, 12, 0, 0))
      expect(cairoMinutes(d)).toBe(900)
    })

    it("should return correct minutes for early morning Cairo time", () => {
      // 2026-07-31 22:00:00 UTC is 2026-08-01 01:00:00 Cairo time (with DST)
      // 1 * 60 = 60 minutes
      const d = new Date(Date.UTC(2026, 6, 31, 22, 0, 0))
      expect(cairoMinutes(d)).toBe(60)
    })
  })

  describe("addDays", () => {
    it("should add days correctly", () => {
      const d = new Date(Date.UTC(2026, 6, 31, 12, 0, 0))
      const result = addDays(d, 5)
      expect(result.getUTCDate()).toBe(5)
      expect(result.getUTCMonth()).toBe(7) // August
    })

    it("should subtract days correctly with negative offset", () => {
      const d = new Date(Date.UTC(2026, 6, 31, 12, 0, 0))
      const result = addDays(d, -1)
      expect(result.getUTCDate()).toBe(30)
      expect(result.getUTCMonth()).toBe(6) // July
    })
  })
})
