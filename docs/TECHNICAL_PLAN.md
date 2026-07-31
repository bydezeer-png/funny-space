# Soly's Space — الخطة التقنية (Attendance Engine v2 · CRM 360 · Subscription Lifecycle · Performance)

> **الحالة:** مسودة للتنفيذ · **التاريخ:** 2026-07-31
> **النطاق:** 5 مطالب أساسية من العميل + إصلاح الديون التقنية التي تمنع تنفيذها بشكل سليم.
> **المرجع:** كل الملاحظات أدناه مبنية على قراءة فعلية للكود الحالي (المسارات والأسطر مذكورة).

---

## 0. ملخص تنفيذي

المطلوب من العميل خمس نقاط، لكن ثلاثة منها **لا يمكن تنفيذها بشكل صحيح على الداتا موديل الحالي** لأن الجداول ناقصة معلومات جوهرية:

| # | طلب العميل | هل ممكن على الوضع الحالي؟ | السبب الجذري |
|---|---|---|---|
| 1 | عند المسح: لو العميلة مشتركة في أكتر من برنامج → اسأل عن البرنامج | ❌ | `/api/scan` يختار أول اشتراك صالح تلقائياً في حلقة `for` ويسجّل مباشرة ([route.ts:68-89](../src/app/api/scan/route.ts#L68)) — لا يوجد endpoint للاستعلام دون كتابة |
| 2 | لو اليوم مش من أيام السيشنز → اسأل: تعويضية أم لا؟ | ❌ | لا توجد أي علاقة بين `Attendance` و `ProgramSchedule`، والـ scan لا يقرأ الجدول الزمني إطلاقاً. `isMakeup` مثبّتة `false` ([route.ts:66](../src/app/api/scan/route.ts#L66)) |
| 3 | في الـ CRM: كل عميلة → البرامج + حضر كام + باقي كام | ⚠️ جزئياً | صفحة العميلة تعرض قائمة اشتراكات وقائمة حضور منفصلتين بدون أي حساب ([ClientProfileManager.tsx:175-240](../src/app/dashboard/clients/[id]/ClientProfileManager.tsx#L175)) |
| 4 | تاريخ الاشتراك + مدة انتهاء (30 يوم حتى لو باقي حصص) | ❌ | `Enrollment` لا يحتوي `startDate` ولا `endDate` ([schema.prisma:128-157](../prisma/schema.prisma#L128)). الانتهاء يُحسب فقط في الكرون الليلي من `createdAt` ولا يُطبَّق وقت المسح |
| 5 | الصفحة الرئيسية تقيلة | ✅ قابل للإصلاح | 13 ميجا صور PNG في `public/`، الهيرو وحده **2.0 MB** بوسم `<img>` خام، والصفحة **dynamic** بالكامل بسبب `auth()` |

**بالإضافة:** اكتشفنا أن **الـ QR غير موجود أصلاً في المنتج** — يوجد ماسح (`/dashboard/scanner`) لكن لا يوجد أي كود يولّد QR للعميلة (بحث شامل في `src/` لم يجد ولا مكتبة ولا endpoint). ما يظهر في بورتال العميلة مجرد رسم زخرفي ([ClientPortal.tsx:605](../src/app/ClientPortal.tsx#L605)). الماسح حالياً يقبل **رقم الهاتف أو الـ `client.id` الخام** — وهذه ثغرة أمنية (أي شخص يعرف رقم هاتف يقدر يسجّل حضور).

**الخلاصة:** الخطة 7 مراحل، ~34 يوم عمل، مقسّمة بحيث كل مرحلة قابلة للنشر والتراجع بشكل مستقل.

---

## 1. تشريح النظام الحالي

### 1.1 الستاك
| الطبقة | التقنية | ملاحظات |
|---|---|---|
| Framework | Next.js **16.2.9** (App Router) + React 19.2 | Server Actions هي الطريقة الأساسية للكتابة |
| DB | PostgreSQL + Prisma **7.8** مع `@prisma/adapter-pg` | `Pool({ max: 2 })` ([prisma.ts:19](../src/lib/prisma.ts#L19)) |
| Auth | NextAuth v5 beta (JWT strategy) + دخول مزدوج (موظف / عميلة) | `middleware.ts` يفحص وجود الكوكي فقط، لا يتحقق من الدور |
| UI | Tailwind v4، lucide-react، sonner، recharts | كل صفحات الداشبورد RTL |
| Deploy | Vercel + cron يومي `0 0 * * *` ([vercel.json](../vercel.json)) | |
| Tests | Jest + Testing Library + Playwright | 5 ملفات اختبار فقط |

### 1.2 مخطط الدومين الحالي

```
ProgramCategory ──< Program ──< ProgramOption ──< ProgramSchedule (dayOfWeek, startTime, endTime)
                                      │
Client ──< Enrollment >──────────────┘   (أو Workshop / Event)
              │
              └──< Attendance (date, status:String, isMakeup:Boolean)
```

**الخبر الجيد:** `ProgramSchedule` موجود ومعبّأ فعلاً (الـ seed يضع أيام وأوقات — [seed_programs.js:38](../seed_programs.js#L38)) وقابل للتحرير من واجهة البرامج ([ProgramsManager.tsx:601](../src/app/dashboard/programs/ProgramsManager.tsx#L601)). يعني **البنية اللازمة للتحقق من "هل اليوم من أيام الحصص؟" موجودة، لكن لا أحد يقرأها.**

### 1.3 جرد المشاكل التقنية المكتشفة (Debt Register)

| # | المشكلة | الملف | الخطورة |
|---|---|---|---|
| D1 | **لا توجد Prisma Migrations إطلاقاً** — مجلد `prisma/` فيه `schema.prisma` فقط. يعني الـ DB تُحدَّث بـ `db push` (تدمير محتمل للبيانات) | `prisma/` | 🔴 حرجة |
| D2 | حسابات "اليوم" تستخدم `setHours(0,0,0,0)` بتوقيت السيرفر (Vercel = UTC) بينما العمل بتوقيت القاهرة (UTC+2/+3) → حضور الساعة 12:30 ص القاهرة يُسجَّل في يوم سابق، ومنع الدخول المكرر يفشل | [route.ts:102](../src/app/api/scan/route.ts#L102)، [enrollments.ts:120](../src/actions/enrollments.ts#L120)، [daily-check/route.ts:12](../src/app/api/cron/daily-check/route.ts#L12) | 🔴 حرجة |
| D3 | **قسمة على صفر** في بوابة الدفع: `sessionPrice = totalAmount / sessionsPerMonth` ثم `floor(amountPaid / sessionPrice)` — لو `totalAmount = 0` (اشتراك مجاني/هدية) النتيجة `Infinity` أو `NaN` | [route.ts:73-74](../src/app/api/scan/route.ts#L73)، [enrollments.ts:143](../src/actions/enrollments.ts#L143) | 🔴 حرجة |
| D4 | منع الدخول المكرر = قراءة ثم كتابة بدون transaction ولا unique constraint → مسحتان متتاليتان تسجّلان حضورين | [route.ts:100-125](../src/app/api/scan/route.ts#L100) | 🟠 عالية |
| D5 | **اختراع سجلات حضور وهمية**: عند تسجيل "عميلة قديمة" يُنشأ صفوف `Attendance` بتواريخ ملفّقة (`Date.now() - i days`) وستاتس `IMPORTED` لتقليل العدّاد | [enrollments.ts:287-311](../src/actions/enrollments.ts#L287) | 🟠 عالية (تفسد التقارير والتاريخ) |
| D6 | عدم اتساق في العدّ: الـ scan يعدّ `IMPORTED` ضمن الحضور الأساسي، بينما `updateRemainingSessions` و `ClassesManager` يستثنيانها | route.ts:70 مقابل [enrollments.ts:361](../src/actions/enrollments.ts#L361) | 🟠 عالية |
| D7 | `getEnrollments()` تجلب **كل** الاشتراكات مع كل العلاقات بدون pagination وتُمرَّر كلها لصفحة الاستقبال | [enrollments.ts:12-24](../src/actions/enrollments.ts#L12) | 🟠 عالية (تنهار عند 5000+ اشتراك) |
| D8 | `window.location.reload()` بعد كل عملية (تأكيد، حضور، إلغاء، دفع) — إعادة تحميل كاملة بدل `router.refresh()` | ReceptionManager، ClassesManager (8 مواضع) | 🟡 متوسطة |
| D9 | `include: { … : true }` في كل مكان بدل `select` → over-fetching | كل ملفات `src/actions/` | 🟡 متوسطة |
| D10 | كود "self-healing" غريب في عميل Prisma يحذف الـ global client عند غياب موديل | [prisma.ts:8-10](../src/lib/prisma.ts#L8) | 🟡 متوسطة |
| D11 | ملفات سكربتات مبعثرة في الجذر (`test.js`, `fix_clients.js`, `update_pass.js`, …) تتصل بقاعدة الإنتاج | الجذر | 🟡 متوسطة |
| D12 | `middleware.ts` يفحص **وجود** الكوكي فقط — لا يتحقق من صلاحية التوكن ولا الدور؛ الحماية الحقيقية داخل كل صفحة | [middleware.ts:6-12](../src/middleware.ts#L6) | 🟡 متوسطة |

> هذه الديون ليست "تحسينات لاحقاً" — النقاط D1..D4 تمسّ مباشرة كل ما سنبنيه في المراحل 1-4، لذلك هي **المرحلة صفر**.

---

## 2. القرارات المعمارية (ADRs)

### ADR-1 — فصل المسح إلى خطوتين: `resolve` ثم `confirm`
**البديل المرفوض:** إبقاء endpoint واحد يكتب مباشرة ويرجّع "اختر" عند التعدد.
**القرار:** endpointان. `POST /api/scan/resolve` **قراءة فقط** يرجّع كل الاشتراكات مع حالتها المحسوبة، و`POST /api/scan/confirm` يكتب.
**لماذا:** الاختيار والتعويض والاستثناء كلها تحتاج تفاعل بشري بين القراءة والكتابة. دمجهما يعني حالات نصف-مكتوبة. كما أن `resolve` يصبح قابلاً لإعادة الاستخدام في شاشة الاستقبال والـ CRM.

### ADR-2 — محرك قواعد نقي (Pure Rules Engine)
كل منطق "هل مسموح لها بالدخول؟" ينتقل إلى `src/lib/attendance/rules.ts` كدوال **خالصة بلا I/O**، تأخذ (الاشتراك، اللحظة الحالية، الإعدادات) وترجّع حالة. المسح والاستقبال والـ CRM والكرون والتقارير كلهم يستهلكون نفس الدالة.
**لماذا:** حالياً نفس المنطق مكرر بثلاث نسخ **مختلفة النتائج** في `api/scan`، `recordAttendance`، و`cron/daily-check`. مصدر حقيقة واحد = قابلية اختبار 100% بدون DB.

### ADR-3 — `qrToken` منفصل عن `client.id`
QR يحمل توكن معتم قابل للإبطال والتدوير، لا الـ `cuid` الأساسي ولا رقم الهاتف.
**لماذا:** (أ) رقم الهاتف قابل للتخمين، (ب) تسريب `id` يفتح مسارات أخرى، (ج) عند فقدان الهاتف نُدوّر التوكن دون لمس السجل.

### ADR-4 — توليد QR محلياً لا عبر خدمة خارجية
مكتبة `qrcode` (Node) تولّد SVG/DataURL على السيرفر.
**لماذا:** استخدام `api.qrserver.com` أو Google Charts يعني إرسال معرّفات عميلاتنا لطرف ثالث — غير مقبول لنادٍ نسائي مغلق، وأيضاً يكسر الطباعة دون إنترنت.

### ADR-5 — الانتهاء يُخزَّن كتاريخ (`endDate`) لا يُحسب عند القراءة
عمود مادي على `Enrollment` + فهرس، يُملأ عند الإنشاء ويُعدَّل عند التجميد/التمديد.
**لماذا:** الحساب اللحظي من `createdAt + settings.membershipDurationDays` (السلوك الحالي) يعني أن **تغيير الإعداد العام يعيد إحياء اشتراكات منتهية بأثر رجعي** — كارثة محاسبية. التخزين يجعل العقد ثابتاً لحظة البيع.

### ADR-6 — التوقيت: القاهرة هي مرجع "اليوم"
`src/lib/time.ts` يوفّر `cairoDayKey()`, `cairoDayOfWeek()`, `cairoMinutes()`. **يُمنع** استخدام `setHours(0,0,0,0)` في أي كود جديد (يُضاف lint rule).

### ADR-7 — الصفحة الرئيسية ثابتة (ISR) لا ديناميكية
إزالة `auth()` من `page.tsx` ونقل حالة الدخول إلى جزيرة عميل صغيرة، مع `revalidate` + `unstable_cache` موسوم.
**لماذا:** حالياً كل زيارة = فك تشفير JWT + 6 استعلامات DB. مع ISR تصبح صفر استعلام لمعظم الزيارات.

---

## 3. المرحلة 0 — الأساسات والسلامة (3 أيام) 🔴 إلزامية قبل أي شيء

الهدف: ألا نلمس قاعدة بيانات فيها فلوس حقيقية بدون شبكة أمان.

### 0.1 إدخال نظام الهجرات (Migrations)
```bash
# 1) نسخة احتياطية كاملة أولاً
pg_dump "$DATABASE_URL" -Fc -f backup_$(date +%F).dump

# 2) توليد هجرة أساس مطابقة للحالة الحالية
mkdir -p prisma/migrations/0_init
npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma \
  --script > prisma/migrations/0_init/migration.sql

# 3) تعليمها كمطبّقة دون تنفيذ
npx prisma migrate resolve --applied 0_init
```
بعدها **يُمنع نهائياً** `prisma db push` على الإنتاج؛ كل تغيير يمرّ بـ `migrate dev` → مراجعة SQL → `migrate deploy`.

### 0.2 بيئة Staging
قاعدة بيانات منفصلة (Neon branch أو Supabase branch) + مشروع Vercel preview، مع سكربت `scripts/anonymize.ts` ينسخ الإنتاج مع تعتيم الأسماء والهواتف.

### 0.3 طبقة الوقت
```ts
// src/lib/time.ts
export const TZ = "Africa/Cairo"

/** "2026-07-31" حسب توقيت القاهرة */
export function cairoDayKey(d: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit",
  }).format(d)
}

/** 0=الأحد … 6=السبت، حسب توقيت القاهرة */
export function cairoDayOfWeek(d: Date = new Date()): number {
  const short = new Intl.DateTimeFormat("en-US", { timeZone: TZ, weekday: "short" }).format(d)
  return ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].indexOf(short)
}

/** دقائق منذ منتصف ليل القاهرة — للمقارنة مع "17:00" */
export function cairoMinutes(d: Date = new Date()): number {
  const [h, m] = new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ, hour: "2-digit", minute: "2-digit", hour12: false,
  }).format(d).split(":").map(Number)
  return h * 60 + m
}

export function addDays(d: Date, days: number): Date { … }
```
يرافقها اختبارات وحدة تشمل حدود التوقيت الصيفي المصري.

### 0.4 تنظيف وتصليب
- نقل كل سكربتات الجذر إلى `scripts/` مع حارس `if (process.env.NODE_ENV === "production") throw`.
- حذف كود self-healing في [prisma.ts:8](../src/lib/prisma.ts#L8) (سببه انعدام الهجرات — يزول بحلّها).
- رفع `Pool.max` إلى 5 مع `pgbouncer` أو `Prisma Accelerate` حسب المزوّد.
- تفعيل `strict` كامل في TS ومنع `any` في الملفات الجديدة (`eslint` override على `src/lib/attendance/**`).

**معيار القبول:** `migrate deploy` يعمل على staging من صفر؛ اختبارات `time.test.ts` خضراء؛ `npm run build` بلا تحذيرات.

---

## 4. المرحلة 1 — الداتا موديل الجديد (4 أيام)

### 4.1 التعديلات على الـ Schema

```prisma
enum AttendanceType {
  REGULAR      // حضور في يوم من أيام البرنامج
  MAKEUP       // حصة تعويضية
  OFF_SCHEDULE // حضور استثنائي بموافقة الاستقبال في يوم غير مجدول
  IMPORTED     // ترحيل بيانات قديمة (للتاريخ فقط، لا تُحتسب)
}

model Client {
  // … الحقول الحالية
  qrToken     String    @unique @default(cuid())  // (1)
  qrIssuedAt  DateTime  @default(now())
  isActive    Boolean   @default(true)

  @@index([qrToken])
}

model ProgramOption {
  // … الحقول الحالية
  durationDays     Int  @default(30)   // (2) مدة صلاحية الاشتراك لهذا الخيار
  makeupAllowance  Int  @default(1)    // (3) عدد الحصص التعويضية المسموحة
  graceDays        Int  @default(0)    // فترة سماح بعد الانتهاء
}

model Enrollment {
  // … الحقول الحالية
  startDate       DateTime  @default(now())   // (4) تاريخ بداية الاشتراك — قابل للتعديل
  endDate         DateTime?                   // (5) = startDate + durationDays (+grace)
  carriedSessions Int       @default(0)       // (6) حصص مستهلكة قبل دخول النظام (بديل D5)
  frozenDays      Int       @default(0)       // (7) أيام تجميد تُضاف على endDate
  renewedFromId   String?                     // (8) سلسلة التجديدات
  renewedFrom     Enrollment?  @relation("Renewal", fields: [renewedFromId], references: [id])
  renewals        Enrollment[] @relation("Renewal")

  @@index([status, endDate])
  @@index([programId, optionId])
  @@index([clientId, status])
}

model Attendance {
  // … الحقول الحالية
  dayKey      String          // (9) "YYYY-MM-DD" بتوقيت القاهرة
  type        AttendanceType  @default(REGULAR)  // (10) يحل محل status+isMakeup
  scheduleId  String?         // (11) الحصة المجدولة المرتبطة
  schedule    ProgramSchedule? @relation(fields: [scheduleId], references: [id])
  recordedByUserId String?    // (12) من سجّل
  approvedByUserId String?    // (13) من اعتمد الاستثناء
  note        String?

  @@unique([enrollmentId, dayKey, type])   // (14) يقتل D4 من جذوره
  @@index([dayKey])
  @@index([scheduleId])
}

model SystemSettings {
  // … الحقول الحالية
  defaultDurationDays      Int     @default(30)
  scanAlwaysAskProgram     Boolean @default(false) // اسأل حتى لو اشتراك واحد
  allowOffScheduleCheckIn  Boolean @default(true)  // اسمح بالاستثناء بموافقة
  expiryWarningDays        Int     @default(3)
  expireOnSessionsDone     Boolean @default(true)  // ينتهي بانتهاء الحصص أيضاً
}
```

**لماذا `dayKey` نص وليس `date`؟** لأن الفريدة (unique) يجب أن تُحسب بتوقيت القاهرة لا UTC، وPostgres سيقارن `timestamp` بـ UTC. النص المحسوب في التطبيق يجعل القيد دقيقاً وقابلاً للفهرسة بلا دوال.

### 4.2 سكربتات الترحيل (Backfill) — بالترتيب

```ts
// scripts/migrate/01-qr-tokens.ts  → مولّد لكل عميلة موجودة (batched 500)
// scripts/migrate/02-enrollment-dates.ts
//   startDate = createdAt
//   endDate   = createdAt + (option.durationDays ?? settings.membershipDurationDays ?? 30)
//   للورش:    endDate = workshop.endDate ؛ للفعاليات: endDate = event.date
// scripts/migrate/03-attendance-daykey.ts  → dayKey = cairoDayKey(date)
// scripts/migrate/04-attendance-type.ts
//   isMakeup=true            → MAKEUP
//   status="IMPORTED"        → IMPORTED
//   غير ذلك                  → REGULAR
// scripts/migrate/05-carried-sessions.ts
//   carriedSessions = COUNT(attendances WHERE type=IMPORTED)  ثم حذف تلك الصفوف
// scripts/migrate/06-dedupe-attendance.ts  ← يجب أن يسبق إضافة القيد الفريد
//   يُبقي أقدم صف لكل (enrollmentId, dayKey, type) ويؤرشف الباقي في جدول مؤقت
```
كل سكربت: **idempotent**، يعمل على دفعات، يطبع تقرير قبل/بعد، وله `--dry-run`.

**ترتيب النشر الإلزامي:** (1) هجرة تضيف الأعمدة *قابلة للإفراغ* → (2) نشر كود يكتب القديم والجديد معاً (dual-write) → (3) تشغيل الـ backfill → (4) هجرة تضيف `NOT NULL` والقيد الفريد → (5) نشر كود يقرأ الجديد فقط → (6) هجرة تحذف `isMakeup`/`status` القديمة.

**معيار القبول:** صفر صفوف `Attendance` بلا `dayKey`؛ صفر `Enrollment` بلا `endDate`؛ مجموع `carriedSessions` = عدد صفوف IMPORTED قبل الحذف؛ استعادة النسخة الاحتياطية مُجرَّبة فعلياً على staging.

---

## 5. المرحلة 2 — محرك الحضور v2 والمسح الذكي (7 أيام) ⭐ قلب المشروع

### 5.1 محرك القواعد

```ts
// src/lib/attendance/types.ts
export type Blocker =
  | "NOT_CONFIRMED"       // لم يُؤكَّد الدفع بعد
  | "EXPIRED"             // انتهت مدة الاشتراك
  | "SESSIONS_EXHAUSTED"  // استُهلكت كل الحصص
  | "PAYMENT_LIMIT"       // الحصص المدفوعة انتهت (دفع جزئي)
  | "ALREADY_CHECKED_IN"  // سُجِّل حضور اليوم لهذا الاشتراك
  | "CANCELLED"

export type Warning =
  | "OFF_SCHEDULE_DAY"    // اليوم ليس من أيام البرنامج  ← طلب العميل #2
  | "OUTSIDE_TIME_WINDOW" // اليوم صحيح لكن خارج التوقيت (±ساعة)
  | "EXPIRES_SOON"        // يتبقى ≤ expiryWarningDays
  | "PARTIAL_PAYMENT"     // عليها متبقٍ مالي
  | "MAKEUP_QUOTA_USED"   // استنفدت الحصص التعويضية

export interface EnrollmentScanState {
  enrollmentId: string
  kind: "PROGRAM" | "WORKSHOP" | "EVENT"
  title: string            // "سكيتنج – مبتدئ (8 حصص)"
  categoryName?: string
  sessions: { used: number; total: number; remaining: number; makeupUsed: number; makeupAllowed: number }
  money:    { total: number; paid: number; due: number; allowedByPayment: number }
  period:   { startDate: string; endDate: string; daysLeft: number }
  schedule: {
    todaySlots: { start: string; end: string }[]  // حصص اليوم لهذا الخيار
    weekly:     { dayOfWeek: number; start: string; end: string }[]
    isScheduledToday: boolean
    isWithinWindow: boolean
    nextSession?: { dayOfWeek: number; start: string }
  }
  blockers: Blocker[]
  warnings: Warning[]
  allowedActions: ("CHECK_IN" | "CHECK_IN_MAKEUP" | "CHECK_IN_OFF_SCHEDULE" | "RENEW" | "PAY")[]
  recommended: boolean
}
```

```ts
// src/lib/attendance/rules.ts  (دوال خالصة، بلا prisma)
export function evaluateEnrollment(e: EnrollmentInput, now: Date, s: Settings): EnrollmentScanState
export function pickRecommended(states: EnrollmentScanState[]): EnrollmentScanState | null
export function computeEndDate(start: Date, durationDays: number, graceDays: number, frozen: number): Date
export function sessionsUsed(e: EnrollmentInput): number   // REGULAR + carriedSessions (لا MAKEUP ولا IMPORTED)
export function allowedByPayment(total: number, paid: number, sessions: number): number // آمن ضد القسمة على صفر
```

**إصلاح D3 صراحةً:**
```ts
export function allowedByPayment(total: number, paid: number, sessions: number): number {
  if (sessions <= 0) return 0
  if (total <= 0) return sessions          // اشتراك مجاني/هدية ⇒ كل الحصص متاحة
  const perSession = total / sessions
  return Math.min(sessions, Math.floor((paid + 1e-6) / perSession))
}
```

### 5.2 مصفوفة القرار

| الحالة | النتيجة في الواجهة | ما يُكتب |
|---|---|---|
| اشتراك واحد صالح، اليوم مجدول، داخل التوقيت | ✅ تسجيل فوري + صوت نجاح | `REGULAR` |
| **أكثر من اشتراك صالح** | 🔵 شاشة اختيار البرنامج (بطاقات + اختصار 1..9) | حسب الاختيار |
| اشتراك واحد لكن **اليوم غير مجدول** | 🟠 حوار: «اليوم ليس من أيام حصص *سكيتنج مبتدئ* (الحصص: الأحد والأربعاء 4-7م). هل هذه حصة تعويضية؟» → [حصة تعويضية] · [حضور استثنائي] · [إلغاء] | `MAKEUP` أو `OFF_SCHEDULE` + `note` + `approvedByUserId` + AuditLog |
| اليوم مجدول لكن الوقت مبكر/متأخر > 60 د | 🟡 تحذير غير مانع + زر تأكيد | `REGULAR` مع `note` |
| منتهي بالتاريخ (حتى لو باقي حصص) | 🔴 منع + «انتهى الاشتراك بتاريخ 12 يوليو. الحصص المتبقية: 3» + زر [تجديد] | لا شيء |
| استُهلكت الحصص | 🔴 منع + زر [تجديد] | لا شيء |
| دفع جزئي وتجاوزت المسموح | 🔴 منع + «مسموح 4 حصص من 8 — المتبقي 400 ج.م» + زر [سداد] | لا شيء |
| سُجِّل حضور اليوم | 🟠 «تم تسجيلها اليوم الساعة 5:12م» + خيار [تسجيل تعويضية] لو مسموح | حسب الاختيار |
| استنفدت التعويضيات | خيار التعويضية معطّل مع سبب | — |
| لا اشتراكات مؤكدة | 🔴 «لا يوجد اشتراك فعّال» + زر [إنشاء اشتراك] | لا شيء |

### 5.3 عقود الـ API

```http
POST /api/scan/resolve
{ "code": "<qrToken | phone | legacyClientId>" }
→ 200
{
  "client": { "id", "name", "phone", "photoInitial" },
  "states": EnrollmentScanState[],
  "recommendedId": "enr_123" | null,
  "requiresChoice": true,            // states الصالحة > 1  أو  scanAlwaysAskProgram
  "scanNonce": "n_9f3a…"             // صالح 90 ثانية
}
→ 404 { code: "CLIENT_NOT_FOUND" }
```

```http
POST /api/scan/confirm
{
  "scanNonce": "n_9f3a…",
  "enrollmentId": "enr_123",
  "action": "CHECK_IN" | "CHECK_IN_MAKEUP" | "CHECK_IN_OFF_SCHEDULE",
  "note": "تعويض حصة الأحد",
  "override": false
}
→ 200 { "attendanceId", "state": EnrollmentScanState /* بعد التحديث */ }
→ 409 { code: "ALREADY_CHECKED_IN" }   // من القيد الفريد
→ 422 { code: "BLOCKED", blockers: [...] }
```

**تفاصيل التنفيذ:**
- `scanNonce` مخزّن في كاش قصير العمر (أو موقّع HMAC بلا تخزين) يربط الـ confirm بالـ resolve، ويمنع إعادة الإرسال المزدوج من مسدس الباركود.
- الكتابة داخل `prisma.$transaction` مع إعادة التحقق من القواعد قبل الإدراج (الواجهة لا يُوثق بها أبداً).
- التقاط `P2002` من القيد الفريد وتحويله إلى `409` بدل خطأ 500.
- كل `OFF_SCHEDULE` أو `override` يولّد `AuditLog` باسم الموظفة والسبب.
- Rate limit: 30 مسح/دقيقة لكل مستخدم.

### 5.4 توليد الـ QR (الجزء المفقود من المنتج)

- إضافة `qrcode` كاعتماد، و `src/lib/qr.ts` → `renderQrSvg(token)` (SVG، بلا شبكة).
- **بورتال العميلة:** بطاقة عضوية بالـ QR + الاسم + الحصص المتبقية، مع `?print=1` للطباعة.
- **الـ CRM:** زر «طباعة كارت العضوية» في صفحة العميلة (A6، شعار + QR).
- **دفعة:** `/dashboard/clients/print-cards` لطباعة كل الكروت للعميلات الجدد.
- `POST /api/clients/:id/rotate-qr` (بصلاحية `EDIT_CLIENT`) لإبطال كارت مفقود.
- الماسح يقبل الثلاثة: `qrToken` (المفضل) → phone (يدوي) → `client.id` (توافق خلفي، مع علم `deprecated` في اللوج لرصد متى نستغني عنه).

### 5.5 واجهة الماسح الجديدة

إعادة كتابة [ScannerClient.tsx](../src/app/dashboard/scanner/ScannerClient.tsx) كآلة حالات:
`IDLE → RESOLVING → CHOOSING | ASKING_MAKEUP | BLOCKED → CONFIRMING → RESULT → IDLE`

- **الكيبورد أولاً** (الاستقبال تستخدم مسدس باركود): `1..9` اختيار، `Enter` تأكيد، `M` تعويضية، `Esc` إلغاء، `F2` إدخال يدوي. لا حاجة للماوس إطلاقاً.
- التركيز التلقائي الحالي (`setInterval` كل 1.2 ث) يُستبدل بمعالج على مستوى المستند حتى لا يسرق التركيز من الحوارات.
- عرض النتيجة: اسم العميلة كبير + البرنامج + **«حضرت 5 من 8 — باقي 3»** + شريط تقدم + تاريخ الانتهاء.
- مؤقت انتهاء تلقائي 12 ثانية يعود لوضع الاستعداد.
- عمل بلا إنترنت: طابور محلي (IndexedDB) للمسحات وقت انقطاع الشبكة مع مزامنة لاحقة — *اختياري، مرحلة 6*.

**معيار القبول (طلب العميل #1 و #2):**
1. عميلة في برنامجين مؤكدين → المسح يعرض بطاقتين ولا يكتب شيئاً حتى الاختيار. ✅
2. مسح في يوم غير مجدول → يظهر الحوار مع أيام البرنامج الفعلية، والاختيار يُخزَّن كـ `MAKEUP` أو `OFF_SCHEDULE` مع اسم الموظفة. ✅
3. مسح مرتين خلال ثانية → حضور واحد فقط في الـ DB (اختبار تزامن). ✅
4. اشتراك منتهٍ بالتاريخ وباقي حصص → **يُمنع**. ✅

---

## 6. المرحلة 3 — CRM: ملف العميلة 360° (4 أيام)

**طلب العميل #3.** المطلوب: عند فتح أي عميلة أرى برامجها + حضرت كام + باقي كام.

### 6.1 الطبقة الخلفية
```ts
// src/actions/client.ts
export async function getClientOverview(clientId: string): Promise<ClientOverview>
```
استعلام واحد بـ `select` محدد (لا `include: true`)، يمرّ على `evaluateEnrollment` نفسها المستخدمة في المسح ⇒ **الأرقام في الـ CRM والماسح لا يمكن أن تختلف**.

```ts
interface ClientOverview {
  client: { id, name, phone, email, notes, birthDate, createdAt, qrToken }
  kpis: {
    activeSubscriptions: number
    totalSessionsAttended: number
    attendanceRate: number        // حضور فعلي ÷ حصص مستحقة حتى اليوم
    lifetimeValue: number         // اشتراكات + مشتريات الكافيه
    outstandingBalance: number    // إجمالي المتبقي المالي
    lastVisit: string | null
    riskFlag: "OK" | "AT_RISK" | "CHURNED"   // غياب > 14 يوم
  }
  subscriptions: EnrollmentScanState[]        // نفس النوع تماماً
  timeline: TimelineItem[]                    // حضور + مدفوعات + مشتريات، مدمجة زمنياً
  purchases: { date, total, items }[]
}
```

### 6.2 الواجهة
- **رأس الصفحة:** الأفاتار + KPIs في شريط (نشِط / إجمالي الحضور / متبقٍ مالي / آخر زيارة) + زر طباعة الكارت.
- **بطاقة لكل اشتراك:**
  ```
  ┌──────────────────────────────────────────────┐
  │ سكيتنج — مبتدئ (8 حصص)          [نشِط ●]     │
  │ ◕ 5 من 8            حضرت 5 · باقي 3         │
  │ ▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░  62%                     │
  │ من 1 يوليو إلى 31 يوليو · باقي 5 أيام        │
  │ الأيام: الأحد والأربعاء 4:00–7:00 م          │
  │ مدفوع 800 من 800 ✓ · تعويضية: 1/1           │
  │ [تسجيل حضور] [تجديد] [سداد] [تعديل التاريخ]  │
  └──────────────────────────────────────────────┘
  ```
- **تبويبات:** الاشتراكات · الحضور (خط زمني مع أيقونة لكل نوع: أساسي/تعويضي/استثنائي) · المدفوعات · مشتريات الكافيه · الملاحظات.
- **شارات تحذيرية:** «ينتهي خلال 3 أيام» / «عليها 400 ج.م» / «لم تحضر منذ 18 يوم».
- استبدال `window.location.reload()` بـ `router.refresh()` + `useOptimistic`.

**معيار القبول:** فتح أي عميلة يظهر لكل برنامج: العدد المحضور، المتبقي، النسبة، تاريخ الانتهاء، والحالة المالية — بأرقام مطابقة تماماً لما يعرضه الماسح.

---

## 7. المرحلة 4 — دورة حياة الاشتراك (5 أيام)

**طلب العميل #4:** تاريخ بداية عند الإضافة + انتهاء بالمدة حتى لو باقي حصص.

### 7.1 نموذج الإضافة (صفحة الاشتراكات)
تعديل [ClassesManager.tsx](../src/app/dashboard/classes/ClassesManager.tsx) — إضافة قسم «مدة الاشتراك»:
- **تاريخ البداية** (افتراضي: اليوم، قابل للتعديل — يخدم حالة «العميلة بدأت من الأسبوع الماضي»).
- **المدة بالأيام** (تُملأ من `option.durationDays`، قابلة للتجاوز مع صلاحية).
- **تاريخ الانتهاء** يُحسب فورياً ويُعرض كنص حي: *«ينتهي في 30 أغسطس 2026»*.
- استبدال خانة «عميلة قديمة → حصص متبقية» بـ **«حصص مستهلكة سابقاً»** تُكتب في `carriedSessions` بدل توليد صفوف حضور مزيّفة (إصلاح D5).
- تحذير مضمّن لو تاريخ البداية أقدم من 60 يوم أو في المستقبل.

`enrollClient()` تتوسّع لتقبل `{ startDate, durationDays, carriedSessions }` وتحسب `endDate` عبر `computeEndDate()`.

### 7.2 الانتهاء يُطبَّق في كل المسارات
| المسار | السلوك بعد التعديل |
|---|---|
| `/api/scan/confirm` | يرفض `EXPIRED` **لحظياً** (لا ينتظر الكرون) |
| `recordAttendance` (server action) | نفس القاعدة عبر نفس المحرك |
| صفحة الاستقبال | تبويب ثالث «منتهية/قريبة الانتهاء» + شارة على البطاقات |
| الـ CRM | شارة + زر تجديد |
| البورتال | «اشتراكك انتهى — كلّمي الاستقبال للتجديد» |
| الكرون | تحديث الحالة إلى `EXPIRED` / `COMPLETED` |

### 7.3 تجديد الكرون
إعادة كتابة [daily-check/route.ts](../src/app/api/cron/daily-check/route.ts):
- بدل الحلقة على كل الاشتراكات مع تحديث فردي (N استعلامات) → `updateMany` مجمّعة:
  ```ts
  // منتهية بالتاريخ
  await prisma.enrollment.updateMany({
    where: { status: "CONFIRMED", endDate: { lt: startOfCairoToday } },
    data: { status: "EXPIRED" },
  })
  ```
  ومعالجة "استُهلكت الحصص → COMPLETED" باستعلام تجميعي على `Attendance` بدل التحميل في الذاكرة.
- **جدولة:** `0 22 * * *` UTC مع منطق واعٍ للقاهرة (منتصف ليل مصر بالتوقيت الصيفي)، أو الأفضل: تشغيل كل ساعة والاكتفاء بمقارنة `endDate < now` — لا حساسية للتوقيت الصيفي أصلاً. **التوصية: كل ساعة.**
- إضافة قائمة «تنتهي خلال N أيام» تُعرض في الداشبورد مع روابط واتساب جاهزة.
- Idempotent + تسجيل مدة التنفيذ في `AuditLog`.

### 7.4 التجديد والتجميد
- `renewEnrollment(id, { startDate, durationDays, carryRemaining })` → اشتراك جديد مربوط بـ `renewedFromId`، مع خيار ترحيل الحصص المتبقية (`carriedSessions` سالبة/رصيد) حسب سياسة الإدارة.
- `freezeEnrollment(id, days, reason)` → يزيد `frozenDays` ويؤجّل `endDate` (بصلاحية + AuditLog).

**معيار القبول (#4):** اشتراك مدته 30 يوم بدأ 1 يوليو وباقي فيه 3 حصص → في 31 يوليو **يُمنع الدخول** وتظهر رسالة انتهاء واضحة مع زر تجديد؛ ونموذج الإضافة يسمح بضبط تاريخ البداية ويعرض تاريخ الانتهاء المحسوب.

---

## 8. المرحلة 5 — أداء الصفحة الرئيسية (4 أيام)

**طلب العميل #5.** حقائق مقاسة من الكود لا تخمينات:

| المشكلة المقاسة | الرقم |
|---|---|
| مجلد `public/` كاملاً | **13 MB** |
| صورة الهيرو `IMG_5119.PNG` (تُحمَّل دائماً، فوق الطية) | **2.0 MB** |
| صور غير مستخدمة/مكررة (`IMG_55119.PNG`, `5855858.PNG`, `belly_dance` + `bellydance`) | **~6 MB** |
| كل الصور تُقدَّم بوسم `<img>` خام | لا AVIF/WebP، لا `srcset`، لا أبعاد ⇒ CLS |
| استعلامات DB لكل زيارة للرئيسية | **6 + فك JWT** ([page.tsx:39-47](../src/app/page.tsx#L39)) |
| مكوّنات عميل على الرئيسية | `ExploreCarousel` 571 سطر + `ClientPortal` 854 سطر |
| عائلات خطوط Google | **3** (Cairo عربي+لاتيني، Playfair، Outfit) |
| صور خارجية (unsplash) | طلب لدومين ثالث في مسار الرندر |

### 8.1 خطة التنفيذ

**8.1.0 القياس أولاً** — Lighthouse (موبايل، 4G مقيّد) + `next build --analyze`، وتسجيل الأرقام الأساسية في `docs/perf-baseline.md`. لا نصلح ما لا نقيسه.

**8.1.1 الصور (أكبر مكسب — متوقع 70-80% من التحسّن)**
```bash
# تحويل مرة واحدة + حذف الأصول غير المستخدمة
npx @squoosh/cli --avif auto --resize '{"width":1920}' public/*.PNG
```
- الهيرو: 2.0 MB → **~120 KB** AVIF (1920px) مع بديل WebP.
- التحويل إلى `next/image` مع `priority` و `sizes` و `placeholder="blur"` للهيرو، و`loading="lazy"` لما دون الطية.
- حذف `IMG_55119.PNG` و`5855858.PNG` و`bellydance.png` بعد التأكد من عدم الاستخدام.
- استضافة صورة unsplash محلياً (أو حذف القسم).

**8.1.2 `next.config.ts`**
```ts
const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [360, 640, 828, 1080, 1280, 1920],
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },
  experimental: { optimizePackageImports: ["lucide-react", "recharts"] },
  compress: true,
  poweredByHeader: false,
}
```

**8.1.3 من Dynamic إلى ISR**
- حذف `auth()` من [page.tsx:46](../src/app/page.tsx#L46)؛ رابط «Members/Dashboard» ينتقل إلى `<AuthLink />` (جزيرة عميل صغيرة تقرأ `/api/auth/session`) أو يُترك رابطاً ثابتاً لصفحة الدخول التي توجّه بنفسها.
- `export const revalidate = 300` على الصفحة الرئيسية.
- تغليف الاستعلامات:
  ```ts
  export const getPublicCatalog = unstable_cache(
    async () => { /* استعلام واحد مضبوط بـ select */ },
    ["public-catalog"],
    { revalidate: 300, tags: ["catalog"] },
  )
  ```
  مع `revalidateTag("catalog")` داخل `createProgram/updateProgram/deleteProgram/settings/events/workshops`.
- **الأثر:** الزيارة النموذجية تصبح **صفر استعلام DB** وHTML مُقدَّم من الحافة (edge cache).

**8.1.4 تقليل الجافاسكربت**
- `ClientPortal` (854 سطر، تحت الطية) → `next/dynamic` بلا SSR، يُحمَّل عند التمرير/النقر على «Book».
- `ExploreCarousel`: يبقى الماركب على السيرفر (Server Component) مع CSS `scroll-snap`، وجزيرة عميل صغيرة (~40 سطر) للأسهم فقط.
- الأيقونات: استيراد مفرد + `optimizePackageImports`.

**8.1.5 الخطوط**
- إسقاط عائلة واحدة (Outfit أو Playfair) — دمج الأدوار.
- Cairo يُحمَّل **فقط** في تخطيط الداشبورد/RTL؛ الصفحة الرئيسية إنجليزية LTR ولا تحتاج الـ subset العربي.
- `display: "swap"`، أوزان محددة (`400,700,900`) بدل الـ variable الكامل، `preload` للخط الرئيسي فقط.

**8.1.6 تكلفة الرسم على الموبايل**
مراجعة طبقات `blur-3xl` + `backdrop-blur-md` المتراكبة (الهيدر، الهيرو، شريط المزايا، الحوارات) — على أجهزة أندرويد المتوسطة تكلّف إطارات محسوسة. الإبقاء على الهيدر فقط واستبدال الباقي بتدرّجات ثابتة.

**8.1.7 أداء الداشبورد (تابع)**
- pagination + بحث على `getEnrollments()` (D7): صفحة الاستقبال تحمّل حالياً كل الاشتراكات بكل علاقاتها.
- استبدال 8 مواضع `window.location.reload()` بـ `router.refresh()` (D8).
- `select` بدل `include: true` في مسارات القراءة الساخنة (D9).

### 8.2 ميزانية الأداء (تُفرض في CI)

| المقياس | الهدف (موبايل 4G) |
|---|---|
| LCP | < 2.0 ث |
| CLS | < 0.05 |
| INP | < 200 مللي ثانية |
| JS أول تحميل | < 150 KB gzip |
| وزن الهيرو | < 150 KB |
| استعلامات DB للزيارة المخبّأة | 0 |

يُضاف `lighthouse-ci` كخطوة في الـ pipeline يفشل البناء عند تجاوز الميزانية.

---

## 9. المرحلة 6 — الاختبارات والتصليب والإطلاق (5 أيام)

### 9.1 هرم الاختبارات
- **وحدة (الأهم):** `rules.test.ts` يغطي مصفوفة القرار في §5.2 كاملة (≈40 حالة)، `time.test.ts` (حدود منتصف الليل والتوقيت الصيفي)، `allowedByPayment` (صفر، جزئي، زائد، كسور).
- **تكامل:** `scan-resolve.test.ts`, `scan-confirm.test.ts` على DB اختبارية (Testcontainers أو Neon branch) — تشمل اختبار تزامن: 10 طلبات متوازية ⇒ صف حضور واحد.
- **E2E (Playwright):** رحلة الاستقبال الكاملة: إنشاء عميلة → اشتراكان → مسح → اختيار → مسح في يوم غير مجدول → تعويضية → انتهاء المدة → منع → تجديد.
- **انحدار البيانات:** سكربت يقارن مجاميع الحضور والحصص المتبقية قبل/بعد الترحيل ويفشل عند أي فرق.

### 9.2 المراقبة
- Sentry (أو `console` مهيكل + Vercel logs) على مسارات المسح، مع عدّادات: عمليات مسح/يوم، معدل التعدد، معدل الاستثناءات، `409` المكررة.
- لوحة «صحة الحضور» في الداشبورد: حضور اليوم، استثناءات اليوم، اشتراكات تنتهي هذا الأسبوع.

### 9.3 الإطلاق
- أعلام مزايا في `SystemSettings` تسمح بالعودة للسلوك القديم بلا نشر: `scanAlwaysAskProgram`, `allowOffScheduleCheckIn`.
- إطلاق مرحلي: staging ببيانات مُعتَّمة → يوم موازٍ (الماسحان القديم والجديد جنباً إلى جنب على مسارين) → التحويل الكامل.
- تدريب الاستقبال: صفحة واحدة بالعربي + بطاقة اختصارات لوحة المفاتيح تُلصق على المكتب.

---

## 10. الجدول الزمني والتقديرات

| المرحلة | المحتوى | أيام عمل | تعتمد على |
|---|---|---|---|
| **0** | هجرات، staging، طبقة الوقت، تنظيف | 3 | — |
| **1** | الداتا موديل + سكربتات الترحيل | 4 | 0 |
| **2** | محرك القواعد + resolve/confirm + QR + واجهة الماسح | 7 | 1 |
| **3** | CRM 360 | 4 | 2 (يعيد استخدام المحرك) |
| **4** | دورة حياة الاشتراك (التواريخ، الانتهاء، الكرون، التجديد) | 5 | 1 |
| **5** | الأداء (الرئيسية + الداشبورد) | 4 | — *(يمكن أن تتوازى)* |
| **6** | اختبارات، مراقبة، إطلاق | 5 | 2،3،4 |
| **مخزون طوارئ** | 15% | 5 | — |
| **الإجمالي** | | **~34 يوم عمل** | |

**المسار الحرج:** 0 → 1 → 2 → (3 ‖ 4) → 6. المرحلة 5 مستقلة تماماً ويمكن لمطوّر ثانٍ تنفيذها بالتوازي ⇒ زمن التسليم الفعلي بمطوّرَين ≈ **5 أسابيع**.

**ترتيب التسليم للعميل (قيمة مبكرة):**
1. أسبوع 1: الأساسات + الموديل (غير مرئي لكنه إلزامي) + **الأداء ظاهر فوراً** لو توازت المرحلة 5.
2. أسبوع 2-3: الماسح الجديد + الـ QR (الطلب #1 و #2).
3. أسبوع 4: CRM 360 (#3) + دورة الاشتراك (#4).
4. أسبوع 5: تصليب وإطلاق.

---

## 11. المخاطر وخطط التراجع

| الخطر | الاحتمال | الأثر | التخفيف |
|---|---|---|---|
| ترحيل بيانات الحضور يفسد أرصدة الحصص | متوسط | 🔴 عالٍ | `--dry-run` + تقرير مقارنة + نسخة احتياطية + تجربة الاستعادة على staging قبل الإنتاج |
| القيد الفريد يفشل بسبب تكرارات قائمة | **مرتفع** | متوسط | سكربت `06-dedupe` يسبق الهجرة ويؤرشف المحذوف في جدول منفصل |
| الاستقبال تتباطأ بسبب خطوة الاختيار الإضافية | متوسط | متوسط | المسار السريع يبقى فورياً لاشتراك واحد + اختصارات لوحة مفاتيح + عَلَم `scanAlwaysAskProgram=false` افتراضياً |
| تغيير `isMakeup/status` يكسر تقارير قائمة | متوسط | متوسط | الحقول القديمة تُستبقى للقراءة (dual-write) دورة نشر كاملة قبل الحذف |
| DST مصر يفسد حدود اليوم | منخفض | متوسط | كل الحسابات عبر `Intl` بـ `Africa/Cairo` + اختبارات على تواريخ التحويل |
| تخبئة ISR تعرض برامج قديمة | منخفض | منخفض | `revalidateTag("catalog")` في كل mutation + `revalidate: 300` كشبكة أمان |
| ضياع كارت QR / مشاركته بين عميلات | متوسط | منخفض | تدوير التوكن + عرض اسم وصورة العميلة على شاشة المسح قبل التأكيد |

**قاعدة التراجع:** كل مرحلة = فرع + هجرة قابلة للعكس (`down.sql` مكتوب يدوياً) + عَلَم ميزة. الرجوع = إيقاف العَلَم أولاً، والهجرة العكسية فقط عند الضرورة القصوى.

---

## 12. معايير القبول النهائية (تسليم للعميل)

- [ ] **#1** عميلة في أكثر من برنامج ⇒ المسح يعرض خيارات ولا يسجّل حتى الاختيار، مع عرض المتبقي والتاريخ لكل خيار.
- [ ] **#2** المسح في يوم غير مجدول ⇒ حوار يوضّح أيام البرنامج ويسأل: تعويضية / استثنائية / إلغاء، ويُسجَّل النوع مع اسم الموظفة في سجل التدقيق.
- [ ] **#3** ملف العميلة في الـ CRM يعرض لكل برنامج: حضرت كام، باقي كام، النسبة، الحالة المالية، تاريخ الانتهاء، والحصص التعويضية.
- [ ] **#4أ** نموذج إضافة اشتراك فيه تاريخ بداية قابل للتعديل ويعرض تاريخ الانتهاء المحسوب.
- [ ] **#4ب** الاشتراك ينتهي بانتهاء المدة حتى مع بقاء حصص، ويُمنع الدخول فوراً مع رسالة واضحة وزر تجديد.
- [ ] **#5** الرئيسية: LCP < 2 ث على موبايل 4G، الهيرو < 150 KB، صفر استعلامات DB للزيارة المخبّأة — بتقرير Lighthouse قبل/بعد.
- [ ] **إضافي** كارت QR حقيقي قابل للطباعة لكل عميلة + إبطال الكارت المفقود.
- [ ] كل الاختبارات خضراء + ميزانية الأداء مفروضة في CI.

---

## ملحق أ — ملفات ستُلمس

**جديدة:** `src/lib/time.ts` · `src/lib/qr.ts` · `src/lib/attendance/{types,rules,queries}.ts` · `src/app/api/scan/resolve/route.ts` · `src/app/api/scan/confirm/route.ts` · `src/app/dashboard/scanner/{ScanStateMachine,EnrollmentChoiceCard,MakeupDialog}.tsx` · `src/app/dashboard/clients/[id]/{SubscriptionCard,ClientTimeline}.tsx` · `scripts/migrate/*.ts` · `prisma/migrations/**`

**مُعدَّلة جوهرياً:** `prisma/schema.prisma` · `src/app/api/scan/route.ts` (يصبح shim ثم يُحذف) · `src/actions/enrollments.ts` · `src/actions/client.ts` · `src/app/dashboard/classes/ClassesManager.tsx` · `src/app/dashboard/clients/[id]/ClientProfileManager.tsx` · `src/app/dashboard/reception/ReceptionManager.tsx` · `src/app/api/cron/daily-check/route.ts` · `src/app/page.tsx` · `src/app/layout.tsx` · `next.config.ts` · `vercel.json`

## ملحق ب — الاعتمادات الجديدة
| الحزمة | الغرض | الوزن |
|---|---|---|
| `qrcode` | توليد QR على السيرفر | صفر على العميل (SVG فقط) |
| `date-fns-tz` *(اختياري)* | بديل عن `Intl` اليدوي | ~8 KB على السيرفر |
| `@lhci/cli` (dev) | فرض ميزانية الأداء | dev فقط |
| `@testcontainers/postgresql` (dev) | اختبارات تكامل حقيقية | dev فقط |
