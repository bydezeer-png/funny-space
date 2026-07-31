"use client"

import React, { useState } from "react"
import { 
  CalendarDays, 
  Clock, 
  CheckCircle, 
  XCircle, 
  ChevronDown, 
  ChevronUp, 
  Sparkles, 
  ExternalLink
} from "lucide-react"
import Link from "next/link"

interface Attendee {
  id: string
  name: string
  phone: string
  attended: boolean
  attendanceType: string | null
  attendanceId: string | null
}

interface ClassItem {
  scheduleId: string
  timeStart: string
  timeEnd: string
  programName: string
  optionName: string
  categoryName: string
  totalCount: number
  checkedInCount: number
  attendees: Attendee[]
}

interface CalendarDayData {
  dayName: string
  dateLabel: string
  dayKey: string
  classes: ClassItem[]
}

interface DashboardCalendarProps {
  initialDays: CalendarDayData[]
}

export default function DashboardCalendar({ initialDays }: DashboardCalendarProps) {
  const [activeDayIdx, setActiveDayIdx] = useState(0)
  const [expandedClassId, setExpandedClassId] = useState<string | null>(null)

  const activeDay = initialDays[activeDayIdx]
  const classes = activeDay?.classes || []

  const toggleExpandClass = (id: string) => {
    if (expandedClassId === id) {
      setExpandedClassId(null)
    } else {
      setExpandedClassId(id)
    }
  }

  return (
    <div className="bg-card rounded-[2.5rem] border border-border p-6 md:p-8 shadow-sm space-y-6 text-right">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border pb-5">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-pink-50 text-primary rounded-xl">
            <CalendarDays size={20} />
          </div>
          <div>
            <h3 className="text-lg font-black text-foreground">جدول كلاسات اليوم والغد</h3>
            <p className="text-xs text-foreground/50 font-bold mt-0.5">متابعة مواعيد الكلاسات ونسب حضور الفتيات المشتركات.</p>
          </div>
        </div>

        {/* Day Selector Buttons */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {initialDays.map((day, idx) => (
            <button
              key={day.dayKey}
              onClick={() => {
                setActiveDayIdx(idx)
                setExpandedClassId(null)
              }}
              className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                activeDayIdx === idx
                  ? "bg-primary text-white shadow-xs"
                  : "bg-secondary text-foreground/60 border border-border/80 hover:bg-secondary/80"
              }`}
            >
              <span>{day.dayName}</span>
              <span className="text-[9px] font-bold block opacity-75 mt-0.5">{day.dateLabel}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Classes List */}
      {classes.length === 0 ? (
        <div className="py-12 text-center text-foreground/40 font-semibold flex flex-col items-center justify-center">
          <CalendarDays size={36} className="mb-2 opacity-50 text-foreground/30" />
          <span>لا توجد كلاسات مجدولة في هذا اليوم 🌸</span>
        </div>
      ) : (
        <div className="space-y-4">
          {classes.map((cls) => {
            const isExpanded = expandedClassId === cls.scheduleId
            const percent = cls.totalCount > 0 ? Math.round((cls.checkedInCount / cls.totalCount) * 100) : 0

            return (
              <div 
                key={cls.scheduleId}
                className={`border rounded-3xl transition-all overflow-hidden bg-background ${
                  isExpanded ? 'border-primary/45 ring-2 ring-primary/5' : 'border-border/60 hover:border-primary/20'
                }`}
              >
                {/* Main Class Card Row */}
                <div 
                  onClick={() => toggleExpandClass(cls.scheduleId)}
                  className="p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 cursor-pointer select-none hover:bg-secondary/10 transition-colors"
                >
                  
                  {/* Left: Progress Indicator & Expand Chevron */}
                  <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end shrink-0 order-2 md:order-1">
                    {/* Progress Bar & Badges */}
                    <div className="text-left shrink-0 space-y-1">
                      <div className="flex items-center gap-2 text-[10px] font-black text-foreground/55">
                        <span className="bg-pink-50 text-primary border border-pink-100 px-2 py-0.5 rounded-md">
                          {cls.checkedInCount} حضروا
                        </span>
                        <span className="text-foreground/30">/</span>
                        <span className="bg-slate-50 text-foreground/60 border border-border px-2 py-0.5 rounded-md">
                          {cls.totalCount} مشترك
                        </span>
                      </div>
                      
                      {cls.totalCount > 0 && (
                        <div className="w-24 bg-secondary rounded-full h-1.5 overflow-hidden border border-border/20">
                          <div 
                            className="bg-green-500 h-full rounded-full transition-all" 
                            style={{ width: `${percent}%` }}
                          ></div>
                        </div>
                      )}
                    </div>

                    <div className="p-1.5 rounded-lg bg-secondary text-foreground/45">
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                  </div>

                  {/* Right: Class Details */}
                  <div className="flex items-start gap-3 w-full md:w-auto order-1 md:order-2">
                    <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <Clock size={18} />
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center justify-start gap-1.5">
                        <h4 className="font-black text-base text-foreground leading-none">{cls.programName}</h4>
                        <span className="bg-secondary text-foreground/60 px-2 py-0.5 rounded-md text-[9px] font-black">
                          {cls.optionName}
                        </span>
                        <span className="bg-pink-100/50 text-primary px-2 py-0.5 rounded-md text-[9px] font-black">
                          {cls.categoryName}
                        </span>
                      </div>

                      <p className="text-xs text-foreground/50 font-semibold flex items-center justify-start gap-1">
                        <span>{cls.timeStart} - {cls.timeEnd}</span>
                        <Clock size={12} className="text-foreground/30" />
                      </p>
                    </div>
                  </div>

                </div>

                {/* Expanded Section: Attendee Checklist */}
                {isExpanded && (
                  <div className="border-t border-border/60 bg-slate-50/40 p-5 animate-in slide-in-from-top-3 duration-250">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[10px] font-black text-foreground/45 uppercase tracking-wider">
                        قائمة الفتيات المسجلات في هذا الكلاس اليوم ({cls.totalCount})
                      </span>
                      <Sparkles size={14} className="text-primary" />
                    </div>

                    {cls.attendees.length === 0 ? (
                      <p className="text-center text-xs text-foreground/40 font-bold py-4">
                        لا توجد فتيات مسجلات نشطات في هذا الكلاس حالياً.
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {cls.attendees.map((att) => (
                          <div 
                            key={att.id}
                            className="bg-card border border-border/60 p-3 rounded-2xl flex items-center justify-between gap-3 hover:border-primary/20 transition-all"
                          >
                            {/* Left: Attendance Status Badge */}
                            <div className="flex items-center gap-2">
                              {att.attended ? (
                                <span className={`text-[9px] font-black px-2 py-0.5 rounded-md border flex items-center gap-1 ${
                                  att.attendanceType === "MAKEUP" 
                                    ? "bg-amber-50 text-amber-600 border-amber-100" 
                                    : att.attendanceType === "OFF_SCHEDULE"
                                      ? "bg-purple-50 text-purple-600 border-purple-100"
                                      : "bg-green-50 text-green-600 border-green-100"
                                }`}>
                                  <CheckCircle size={10} />
                                  <span>{att.attendanceType === "MAKEUP" ? "حضور تعويضي" : att.attendanceType === "OFF_SCHEDULE" ? "حضور استثنائي" : "حضر"}</span>
                                </span>
                              ) : (
                                <span className="text-[9px] font-black px-2 py-0.5 rounded-md border bg-red-50 text-red-500 border-red-100 flex items-center gap-1">
                                  <XCircle size={10} />
                                  <span>غائبة</span>
                                </span>
                              )}

                              <Link 
                                href={`/dashboard/clients/${att.id}`}
                                className="p-1 rounded-lg bg-secondary text-foreground/45 hover:text-primary transition-colors cursor-pointer"
                                title="عرض الملف الشخصي"
                              >
                                <ExternalLink size={12} />
                              </Link>
                            </div>

                            {/* Right: Client Details */}
                            <div className="text-right">
                              <h5 className="font-black text-xs text-foreground leading-snug">{att.name}</h5>
                              <p className="text-[9px] text-foreground/45 font-bold mt-0.5" dir="ltr">
                                {att.phone}
                              </p>
                            </div>

                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

              </div>
            )
          })}
        </div>
      )}

    </div>
  )
}
