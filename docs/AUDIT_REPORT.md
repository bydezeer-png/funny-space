# Soly's Space — Full-System Engineering Audit

**Date:** 2026-07-31
**Scope:** `funny-space/` — entire application (src, prisma, tests, config, build artifacts, root scripts)
**Method:** Complete manual read of all 113 source files (~18,500 LOC), plus static verification against the compiled `.next` build, `tsc --noEmit`, `eslint`, and `jest`.
**Not verified at runtime:** the application was never started and no request was issued against the live database (`DATABASE_URL` points at a real instance). Everything marked **CONFIRMED** is backed by file contents or build artifacts quoted below; everything else is marked **INFERRED** with the evidence that would settle it.

---

## 1. Executive Summary

The product is a girls-only activity-space management system: public marketing site + booking, a client portal, and a staff dashboard covering CRM, subscriptions, attendance/QR check-in, POS with shifts and inventory, accounting, reporting, audit logs, and user/permission administration.

**Functionally, most of it works.** The attendance rules engine (`src/lib/attendance/rules.ts`) is well-factored and genuinely tested. The two-phase scan flow (`resolve` → `confirm`) is correctly designed, transactional, and guarded by a unique constraint. The Cairo-timezone helpers are correct. `docs/TECHNICAL_PLAN.md` shows a prior debt register, and phases 0–3 of it were largely delivered.

**The problem is the security and integrity layer, which is not there.** Concretely:

- A **server action that reads every client record — including bcrypt password hashes and QR check-in tokens — performs no authorization check, and its action ID ships in a publicly-served JavaScript chunk.** (Finding C1, confirmed from the build manifest.)
- The **admin login gate secret is baked into the public homepage HTML.** (C2, confirmed by grepping the prerendered output.)
- **Every client's portal password defaults to their own phone number**, and the client login provider has no lockout or rate limiting. (C3)
- **POS sell prices come from the browser** and are never checked against the database. (C5)
- A **debug endpoint dumping full inventory cost data and all sales orders is live and unauthenticated.** (C4)

Alongside this sit a set of correctness defects that quietly corrupt money and attendance data: cash-drawer reconciliation trusts a stale client-supplied number, cancelled bookings never reverse their revenue entry, off-schedule check-ins consume no sessions, and deleting a client or a user throws a foreign-key error rather than working.

There are **no error boundaries anywhere in the app** (no `error.tsx`, `global-error.tsx`, `not-found.tsx`, or `loading.tsx`), and `next.config.ts` sets `typescript.ignoreBuildErrors: true`, so type errors ship. There is exactly one such error today.

**Verdict: not safe to run against real customer data in its current state.** The five Critical findings are each a few hours of work; fixing them changes the risk profile substantially.

---

## 2. Architecture Overview

| Layer | Technology | Notes |
|---|---|---|
| Framework | Next.js **16.2.9** App Router, React 19.2.4 | Server Actions are the primary write path |
| Database | PostgreSQL via Prisma **7.8** + `@prisma/adapter-pg` | `Pool({ max: 2 })`, deliberate for serverless |
| Auth | NextAuth v5 beta, JWT strategy, two credential providers (staff / client) | `PrismaAdapter` configured but non-functional — see M10 |
| Authorization | `src/lib/permissions.ts` + `verifyPermission()` in `src/actions/users.ts` | Applied inconsistently — see C6 |
| UI | Tailwind v4, lucide-react, sonner, recharts, next-themes | Dashboard RTL, marketing site LTR |
| Deploy | Vercel, daily cron `0 0 * * *` (`vercel.json`) | UTC midnight ≠ Cairo midnight — see H12 |
| Tests | Jest (unit + integration), Playwright (e2e) | 31 tests, 6 files — all passing |

### Request / data flow

```
Public site (/)              → server actions (getPrograms, getSystemSettings, …) → Prisma
  └─ ClientPortal.tsx        → POST /api/book                                     → Prisma
Client portal (/client-portal) → auth() guard → Prisma
Staff dashboard (/dashboard) → middleware (cookie presence only)
                             → layout.tsx (real user lookup + isActive)
                             → per-page checkUserPermission()
                             → server actions → verifyPermission() → Prisma
Scanner                      → POST /api/scan/resolve  (read, HMAC nonce issued)
                             → POST /api/scan/confirm  (write, in $transaction)
Cron                         → GET  /api/cron/daily-check (Bearer CRON_SECRET)
```

### Domain model

```
ProgramCategory ──< Program ──< ProgramOption ──< ProgramSchedule
                                      │
Client ──< Enrollment >───────────────┘  (or Workshop / Event)
   │          └──< Attendance (dayKey, type, scheduleId)
   └──< POSOrder ──< POSOrderItem >── InventoryItem
POSShift ──< POSOrder, ShiftExpense
Transaction (append-only ledger)   Expense   AuditLog   SystemSettings   Testimonial
User (role + permissions[])
```

**Architectural observations**

- The rules engine is a genuine pure-function core consumed by the scanner API, the reception action, and the CRM. This is the strongest part of the codebase.
- There is **no Data Access Layer**. Prisma is called directly from pages, actions, and API routes. The Next.js 16 docs bundled in this repo (`node_modules/next/dist/docs/01-app/02-guides/data-security.md`) explicitly recommend a DAL returning minimal DTOs; the current code returns whole Prisma rows, which is the root cause of C1, C6, and H2.
- Authorization is enforced in three different, inconsistent ways: `verifyPermission()` (throws), `checkUserPermission()` (returns boolean, used in pages), and ad-hoc inline checks (`analytics.ts`, `reports/layout.tsx`, `settings/users/page.tsx`). Read-path actions are frequently unguarded entirely.
- `Transaction` is an append-only ledger, but reversals are written as opposite-type rows rather than linked reversals, so gross revenue and gross expenses are both inflated by every refund (M16).

---

## 3. Feature Inventory

| Feature | Entry point | Status | Notes |
|---|---|---|---|
| Public marketing site | `src/app/page.tsx` | **Complete** | Leaks `adminLoginSecret` (C2) |
| Public booking | `ClientPortal.tsx` → `/api/book` | **Broken (security)** | `enablePublicBookings` bypassable, no rate limit, default password = phone (C3, H11) |
| Staff login | `src/app/login/page.tsx` | **Partial** | Secret-URL gate; secret leaked (C2) and echoed into query strings (M27); lockout counter never resets (M26) |
| Client login | `src/app/client-login/page.tsx` | **Broken (security)** | No lockout, no rate limit, guessable default password (C3) |
| Client portal | `src/app/client-portal/page.tsx` | **Partial** | Uses current option price not booked price; shows EXPIRED as "cancelled"; no QR card for the member (M12) |
| Dashboard home | `src/app/dashboard/page.tsx` | **Partial** | Calendar marks a member present in every class that day (H17); null-`endDate` enrollments never appear |
| Reception / bookings | `dashboard/reception` | **Partial** | Loads every enrollment ever (H16); no expired/completed tab; confirms at current price not booked price (M9) |
| Classes & subscriptions | `dashboard/classes` | **Partial** | Same unbounded load; operator-editable prices trusted by server (M9) |
| CRM client list | `dashboard/clients` | **Partial** | Hard cap of 100, client-side-only search — client #101 is unfindable (M20) |
| CRM client profile | `dashboard/clients/[id]` | **Complete** | KPIs, timeline, QR card all working; print CSS targets non-existent IDs (L8) |
| Programs management | `dashboard/programs` | **Partial** | `durationDays`/`makeupAllowance`/`graceDays` not editable (L6); edits wipe schedule history (H9) |
| Workshops & events | `dashboard/events` | **Partial** | Datetime round-trip shifts times by the UTC offset on every edit (M21); deletes orphan enrollments (H8) |
| QR scanner check-in | `dashboard/scanner` + `/api/scan/*` | **Complete** | Best-implemented flow. Minor: AudioContext leak (M2), promised Enter key absent (L7) |
| POS sell | `dashboard/pos` | **Broken (integrity)** | Client-supplied prices, unbounded/negative discount, oversell race (C5, H3) |
| POS inventory | `dashboard/pos/inventory` | **Partial** | No delete; NaN on empty numeric fields; case-sensitive search |
| POS restock | `dashboard/pos/buy` | **Complete** | Weighted-average cost correctly implemented and transactional |
| POS shifts | `dashboard/pos/shift` | **Broken (integrity)** | `expectedCash` supplied by the browser (H1); `openedBy` hardcoded `"Cashier"` (M7) |
| POS reports | `dashboard/pos/reports/*` | **Partial** | Loads all orders ever; "purchases" tab actually lists all expenses |
| Accounting ledger | `dashboard/accounting` | **Complete** | Expense creation is transactional |
| Reports centre | `dashboard/reports/*` | **Partial** | Date filters drift by the Cairo offset (H12); revenue attributed to booking date not payment date |
| Employee analytics | `settings/users/analytics` | **Complete** | N+1 (2 queries per user) |
| User management | `settings/users` | **Partial** | Ships password hashes to the browser (H2); delete fails on any user with audit logs (H7) |
| Audit log viewer | `settings/users/logs` | **Complete** | Capped at 100, no pagination or filters |
| System settings | `dashboard/settings` | **Partial** | Five rules-engine settings have no UI (L5) |
| Testimonials | `dashboard/testimonials` | **Complete** | Gated by the wrong permission (`EDIT_CLIENT`) (M22) |
| Global search (⌘K) | `components/GlobalSearch.tsx` | **Partial** | Returns client PII to any logged-in staff regardless of permission (M25) |
| Daily cron | `/api/cron/daily-check` | **Partial** | UTC/Cairo mismatch (H12); ignores `frozenDays`/`graceDays`; auth bypass if `CRON_SECRET` unset (M6) |
| Legacy scan shim | `/api/scan` | **Deprecated but live** | Duplicates confirm logic with weaker guarantees; no audit log (L18) |
| Debug endpoint | `/api/test` | **Must be deleted** | Public, unauthenticated, dumps cost prices and all orders (C4) |
| Capacity limits | schema `capacity` fields | **Dead** | Displayed everywhere, enforced nowhere (H10) |
| Client blocking | schema `Client.isActive` | **Dead** | Zero references in `src/` |
| Subscription renewal | schema `renewedFromId` | **Dead** | Field and relation exist; no code writes them |
| Freeze / grace | schema `frozenDays` | **Stub** | Read by the rules engine; nothing ever sets it |

---

## 4. Critical Findings

### C1 — Unauthenticated dump of all client records, password hashes, and QR tokens

**Location:** `src/actions/client.ts:254` (`searchClientsAction`), plus `getClients:44`, `getClientById:57`
**Root cause:** No authorization check in the action, and the whole Prisma row is returned rather than a DTO.

```ts
export async function searchClientsAction(query: string) {
  if (!query || query.trim().length < 2) return []
  return await prisma.client.findMany({ where: { OR: [...] }, take: 20, ... })
}
```

The returned rows include `password` (bcrypt hash) and `qrToken` — the token the scanner accepts as proof of identity.

**CONFIRMED exposure path.** `searchClientsAction` is imported by `ClassesManager.tsx`, a client component, so its action ID is emitted into a client chunk. From the compiled build in this repo:

```
searchClientsAction -> ACTION ID 4032dbc75e8344fcbcfd6b27828bf1eab0ceba380f
   public URL: /_next/static/chunks/1vm8stlyjrssv.js
```

`/_next/static/*` is served without authentication (`middleware.ts` matches only `/dashboard/:path*` and `/client-portal/:path*` — verified in `.next/server/middleware-manifest.json`). Next.js's own guidance, in the copy of the docs bundled with this project, is unambiguous:

> "you should still treat Server Actions as reachable via direct POST requests and verify authentication and authorization inside each one" — `node_modules/next/dist/docs/01-app/02-guides/data-security.md:286`

**Impact:** Anyone on the internet can fetch that chunk, extract the ID, and POST it to obtain every client's name, phone, email, notes, birth date, **password hash** (offline-crackable, and the plaintext is usually just the phone number — see C3), and **`qrToken`**, which grants attendance check-in as that member.
**Risk:** Critical. **Reproducibility:** Deterministic. **Confidence:** High (build-artifact evidence; not executed against the live server).
**Fix:** Add `await verifyPermission(PERMISSIONS.EDIT_CLIENT)` to `searchClientsAction`, and `select` only `{ id, name, phone }`. Never return `password` or `qrToken` from any action.
**Side effects:** None — `ClassesManager` only uses `id`, `name`, `phone`.
**Complexity:** ~15 minutes.

---

### C2 — Admin login secret published in the homepage HTML

**Location:** `src/app/page.tsx:464` → `<ClientPortal settings={settings} />`; `src/actions/settings.ts:9`
**Root cause:** The entire `SystemSettings` row — including `adminLoginSecret` — is passed as a prop to a client component, so it is serialized into the RSC payload and the prerendered HTML.

**CONFIRMED** from the build output:

```
$ grep -o 'adminLoginSecret[^,]*' .next/server/app/index.html
adminLoginSecret\":\"soly-admin\"
```

`maxFailedAttempts` and `lockoutDurationMinutes` leak the same way.

**Impact:** The `/login?secret=…` gate — the only thing standing between the internet and the staff login form — is discoverable with View Source on the public homepage. The gate provides no security at all.
**Risk:** Critical. **Reproducibility:** Deterministic. **Confidence:** High (confirmed in the compiled artifact).
**Fix:** Pass an explicit whitelist of presentational fields to `ClientPortal` (`spaceName`, `whatsappNumber`, `paymentMethods`, `enablePublicBookings`, …). Rotate the secret afterwards. Better: drop the secret gate entirely and rely on authentication.
**Complexity:** ~30 minutes.

---

### C3 — Every client account's password is their own phone number

**Locations:** `src/actions/client.ts:26`, `src/actions/enrollments.ts:252`, `src/app/api/book/route.ts:19`, `fix_clients.js:24`, `update_pass.js:14`

```ts
// Set default password to phone number
const hashedPassword = await bcrypt.hash(phone, 10)
```

Compounding factors:
- The client credential provider (`src/auth.ts:75-106`) has **no lockout and no failed-attempt tracking** — unlike the staff provider.
- Phone numbers are Egyptian mobiles matching `^01[0125][0-9]{8}$` — an 8-digit search space per prefix.
- There is no forced password change, and the portal offers no way to change a password at all.
- Combined with C1, an attacker who obtains the client list has both the username and the password for every account.

**Impact:** Full takeover of any client portal account by anyone who knows or guesses a phone number. Exposes booking history, financial balances, and attendance records.
**Risk:** Critical. **Reproducibility:** Deterministic. **Confidence:** High.
**Fix:** Generate a random one-time password at creation and deliver it out-of-band (the WhatsApp integration already exists); force a change on first login; add attempt throttling to the client provider, mirroring the staff one.
**Complexity:** ~1 day including a migration to reset existing passwords.

---

### C4 — Public unauthenticated business-data endpoint

**Location:** `src/app/api/test/route.ts`

```ts
export async function GET() {
  const items = await prisma.inventoryItem.findMany();
  const orders = await prisma.pOSOrder.findMany({ include: { items: true } });
  return NextResponse.json({ items: …cost, price…, orders: …total, cost… });
}
```

No auth. **CONFIRMED present in the production route manifest** (`.next/routes-manifest.json` lists `/api/test`), and `middleware.ts` does not match `/api/*`.

**Impact:** Competitors or anyone else can read the full product catalogue with **cost prices** (margin disclosure) and every sales order with revenue and cost.
**Risk:** Critical (business confidentiality). **Reproducibility:** `curl https://<host>/api/test`. **Confidence:** High.
**Fix:** Delete the file.
**Complexity:** 1 minute.

---

### C5 — POS sale prices are supplied by the browser

**Location:** `src/actions/pos.ts:121-155`

```ts
processedItems.push({
  id: item.id,
  quantity: item.quantity,
  sellPrice: item.price,        // ← from the client payload
  costPrice: inventoryItem.costPrice
})
const subtotal = items.reduce((sum, i) => sum + (i.price * i.quantity), 0)
const totalAmount = Math.max(0, subtotal - discount)
```

The action fetches `inventoryItem` (to check stock and read cost) but **never reads `inventoryItem.price`**. Whatever price the client posts becomes the recorded sale price, the ledger revenue, and the shift's expected cash.

Three separate exploits from the same root:
1. **Price tampering** — post `price: 0` and the sale records as free while stock decrements and the drawer expectation stays flat.
2. **Unbounded discount** — `discount` has no cap and no permission gate; a cashier can zero out any sale. `createPOSOrder`'s ID is in a public chunk (build manifest), though it *is* behind `verifyPermission(SELL_POS)`.
3. **Negative discount** — `parseFloat("-50")` passes both the client (`SellPOS.tsx:370`, no `min` attribute) and the server; `Math.max(0, subtotal - (-50))` **increases** the total, overcharging the customer while the receipt shows a "discount".

**Impact:** Direct revenue theft, unreconcilable drawer, false financial reports. Combined with H1 (client-supplied `expectedCash`), a cashier can steal cash and close a clean shift.
**Risk:** Critical. **Reproducibility:** Deterministic. **Confidence:** High.
**Fix:** In `createPOSOrder`, derive `sellPrice` from `inventoryItem.price`; clamp `discount` to `[0, subtotal]`; require a permission (or manager approval) above a threshold; record the discount in the audit log.
**Complexity:** ~1 hour.

---

### C6 — Read-path server actions with no authorization

**Locations:** `src/actions/client.ts` (`getClients`, `getClientById`, `searchClientsAction`), `src/actions/enrollments.ts:14` (`getEnrollments`), `src/actions/pos.ts` (`getInventoryItems`, `getClientsForPOS`, `getPOSReports`, `getCurrentShift`)

None of these call `verifyPermission` or `auth()`. Page-level guards do not protect them — the Next.js docs bundled here state this directly at `data-security.md:333`: *"A page-level authentication check does not extend to the Server Actions defined within it."*

`getClientById` is the worst offender: it spreads the full client row (`return { ...client, kpis, scanStates, timeline, qrSvgDataUrl }`), so it returns the password hash, the `qrToken`, **and a rendered QR image data-URL** of that token.

`getPrograms`, `getEvents`, `getWorkshops`, `getTestimonials`, `getProgramCategories`, and `getSystemSettings` are also unguarded but are legitimately public (the marketing site uses them) — except `getSystemSettings`, which returns `adminLoginSecret` (see C2).

**Impact:** Full client PII, inventory with margins, complete sales history, and live drawer contents readable by anyone who can discover an action ID. Of these, only `searchClientsAction` has a **confirmed** public ID today; the others are currently server-component-only and are dead-code-eliminated from client bundles — but that protection evaporates the moment any of them is imported into a client component.
**Risk:** Critical. **Confidence:** High for `searchClientsAction`; High for the code defect, Medium for present-day reachability of the others.
**Fix:** Introduce `src/lib/dal.ts` with `requireUser()` / `requirePermission()` and route every read through it, returning DTOs. Mark it `import 'server-only'`.
**Complexity:** ~2 days for full coverage; ~2 hours to bolt guards onto the eight listed functions.

---

## 5. High-Severity Findings

### H1 — Cash reconciliation trusts a stale client-supplied figure
`ShiftManager.tsx:54` → `closeShift(shift.id, actualCash, shift.expectedCash, notes)`. `shift.expectedCash` was computed when the page loaded and lives in React state. `pos.ts:433` accepts it verbatim and stores it. Any sale made after the shift page was opened is silently excluded from the expected total, and a cashier can post any number they like. The recorded variance — the entire point of shift close — is meaningless.
**Fix:** `closeShift` should take only `(shiftId, actualCash, notes)` and recompute `expectedCash` server-side via the same aggregation `getCurrentShift` already uses.

### H2 — Employee password hashes shipped to the browser
`src/app/dashboard/settings/users/page.tsx:36` runs `prisma.user.findMany({ orderBy })` with no `select` and passes the result into `<UsersManager initialUsers={users} />`, a client component. Every admin's bcrypt hash is serialized into the RSC payload. `createUser`/`updateUser` return full rows into client state too.
**Fix:** `select` explicit fields.

### H3 — Oversell race and negative stock in POS
`pos.ts:137-152` validates stock **outside** the `$transaction` that starts at line 168, and the decrement (line 194) is an unconditional `{ decrement: n }` with no `WHERE quantity >= n`. Two concurrent sales of the last unit both pass validation and both commit; quantity goes negative.
**Fix:** Move validation inside the transaction and use a conditional `updateMany({ where: { id, quantity: { gte: n } } })`, asserting `count === 1`.

### H4 — No error boundaries, loading states, or 404 page
`find src/app -name "error.tsx" -o -name "loading.tsx" -o -name "not-found.tsx" -o -name "global-error.tsx"` returns **nothing**. Every `verifyPermission` throw, every Prisma error, every `JSON.parse` failure in `SellPOS.tsx:39` surfaces as Next.js's unstyled error screen — in production, an opaque "Application error: a client-side exception has occurred". Staff get no actionable message and no recovery path.
**Fix:** Add `src/app/error.tsx`, `src/app/global-error.tsx`, `src/app/not-found.tsx`, and `loading.tsx` for the slower dashboard segments.

### H5 — TypeScript errors are ignored at build time
`next.config.ts:4-7` sets `ignoreBuildErrors: true`. Running the checker finds a real error:
```
$ npx tsc --noEmit
src/actions/client.ts(121,63): error TS2339: Property 'getTime' does not exist on type 'never'.
```
That specific one is a narrowing artefact in the `lastVisitDate` loop and is harmless at runtime — but the flag guarantees the *next* one won't be caught either. Combined with 66 `: any` annotations across dashboard components, the type system is currently providing close to zero protection.
**Fix:** Remove the flag, fix the error (annotate `lastVisitDate` explicitly), and add `tsc --noEmit` to CI.

### H6 — `deleteClient` cannot succeed for any client with POS history
`client.ts:236` calls `prisma.pOSOrder.deleteMany({ where: { clientId } })`, but `POSOrderItem.orderId` has `ON DELETE RESTRICT` (verified in `prisma/migrations/0_init/migration.sql:358`). Deleting an order that has items raises a foreign-key violation. The sequence is also not wrapped in a transaction, so attendances and enrollments are already gone by the time it fails. And deleting POS orders destroys sales history while leaving the corresponding `Transaction` rows behind, permanently desynchronising the ledger.
**Fix:** Soft-delete (`Client.isActive`, which already exists and is unused — see L3), or a transaction that unlinks `POSOrder.clientId` instead of deleting orders.

### H7 — `deleteUser` cannot succeed for any user who has done anything
`AuditLog.userId` is `ON DELETE RESTRICT` (`0_init/migration.sql:319`). Since the system audits nearly every write, any real employee has audit rows and cannot be deleted. The UI offers the button anyway and surfaces a raw Prisma error.
**Fix:** Use `toggleUserStatus` for offboarding; if hard delete is required, `SetNull` the audit relation and make `userId` optional.

### H8 — Deleting a program/workshop/event orphans paid enrollments
`Enrollment.programId`, `optionId`, `workshopId`, `eventId` are all `ON DELETE SET NULL`. `deleteProgram`, `deleteWorkshop`, and `deleteEvent` have no guards, so deleting a service silently converts every historical enrollment into an unidentifiable row: the rules engine falls through to `kind = "PROGRAM"` with title `"برنامج - فئة"`, and reports lose the revenue attribution. Note the inconsistency — `updateProgram:137-143` *does* guard option deletion against existing enrollments, so the intent exists but isn't applied to the delete paths.
**Fix:** Mirror that guard in all three delete actions, or add an `isArchived` flag.

### H9 — Editing a program erases attendance→schedule links
`programs.ts:161-164` uses `schedules: { deleteMany: {}, create: opt.schedules }` on every save. `Attendance.scheduleId` is `ON DELETE SET NULL`, so **every** historical attendance record loses its link to the class it was recorded against — even if the admin only renamed the program. The loop is also not transactional: a mid-loop throw leaves options half-deleted.
**Fix:** Diff schedules by id and update in place; wrap the whole `updateProgram` body in `$transaction`.

### H10 — Capacity is displayed but never enforced
`ProgramOption.capacity`, `Workshop.capacity`, and `Event.capacity` appear in 51 places across the UI ("Spots left: 3/15", fill-percentage bars) and in **zero** places in any booking path — not `/api/book`, not `enrollClient`, not `createEnrollment`. Every "sold out" class accepts unlimited bookings.
**Fix:** Count confirmed enrollments inside the booking transaction and reject over capacity.

### H11 — Public booking endpoint is unprotected
`/api/book` has no authentication (correct), but also: no rate limiting, no CAPTCHA, no duplicate-booking check, and — despite `SystemSettings.enablePublicBookings` existing — **no server-side check of that setting**. `ClientPortal.tsx:34` only hides the UI. Anyone can POST directly and create unlimited clients and enrollments while bookings are supposedly closed. `birthDate` is passed straight to Prisma unvalidated, and `error.message` is returned to the caller on failure (M24).
**Fix:** Check `enablePublicBookings` server-side, add IP/phone rate limiting, validate the payload, return generic errors.

### H12 — Timezone inconsistency between attendance and everything else
Attendance correctly uses Cairo (`cairoDayKey`). Everything financial and operational uses the server's local time, which on Vercel is UTC:
- `api/cron/daily-check/route.ts:12` — `today.setHours(0,0,0,0)`
- `dashboard/page.tsx:33` — same, for "today's revenue"
- `reports/*/page.tsx` — `new Date(params.from)` parses `YYYY-MM-DD` as **UTC** midnight, then `to.setHours(23,59,59,999)` applies **local** hours
- `vercel.json` schedules the cron at `0 0 * * *` = 02:00/03:00 Cairo

Consequences: "today's revenue" omits the first two–three Cairo hours of the day; date-filtered reports are shifted by the same offset at both ends; subscriptions expire two–three hours into the following Cairo day. This is debt item **D2** from `TECHNICAL_PLAN.md`, still open.
**Fix:** Add `startOfCairoDay()` / `endOfCairoDay()` to `src/lib/time.ts` and use them everywhere a day boundary is computed.

### H13 — Off-schedule check-ins consume no sessions
`rules.ts:4-11`:
```ts
const regularCount = e.attendances.filter(a =>
  a.type === "REGULAR" || (!a.type && !a.isMakeup && a.status !== "IMPORTED")
).length
```
`OFF_SCHEDULE` matches neither branch. `MAKEUP` is deliberately excluded and separately quota-limited, but `OFF_SCHEDULE` has **no quota** (`allowOffScheduleCheckIn` is a simple boolean) and **no cost**. A member can attend indefinitely via the "exceptional attendance" button (`ScannerClient.tsx:553`) without ever decrementing her remaining sessions or triggering `SESSIONS_EXHAUSTED`.
**Fix:** Decide the policy explicitly. Most likely: count `OFF_SCHEDULE` as a regular session, or give it its own allowance mirroring `makeupAllowance`.

### H14 — Cancelling a booking never reverses its revenue
`confirmEnrollment` (`enrollments.ts:81`) writes a `REVENUE` transaction. `cancelEnrollment` (`:97`) only flips the status — no reversing entry, no refund record. Revenue totals, net profit, and employee performance figures stay permanently inflated by every cancellation. (The audit action is also mislabelled `DELETE_ENROLLMENT` for what is a cancel.)
**Fix:** Write a reversing entry (ideally a linked `reversalOf` reference rather than an opposite-signed row) and require a refund amount.

### H15 — Financial writes are not atomic
`confirmEnrollment`, `addPayment`, and `enrollClient` each perform an enrollment write followed by a separate `prisma.transaction.create()` with **no** `$transaction` wrapper. A failure between the two leaves the booking marked paid with no ledger entry, or vice versa. `createPOSOrder`, `returnPOSOrder`, `restockInventory`, `addShiftExpense`, and `createExpense` do this correctly — so the pattern is understood, just not applied consistently.
**Fix:** Wrap all three in `prisma.$transaction`.

### H16 — Unbounded queries on the highest-traffic screens
`getEnrollments()` (`enrollments.ts:14`) has no `where`, no `take`, and includes `client`, `program`, `option`, `workshop`, `event`, and **all** `attendances`. Reception loads it in full and filters client-side. `classes/page.tsx:36` does the same for PENDING+CONFIRMED. `getPOSReports()` loads every order ever with nested items and relations. `getGlobalAnalytics` loads every unfiltered transaction to render ten rows.

At the current scale this is invisible. At 5,000 enrollments the reception page payload is measured in megabytes and the page will stop rendering. This is debt item **D7** from the technical plan, still open.
**Fix:** Server-side filtering, pagination, and `select` instead of `include`.

### H17 — Dashboard calendar marks members present in classes they didn't attend
`dashboard/page.tsx:132`:
```ts
const att = e.attendances.find(a => a.scheduleId === schedule.id || a.dayKey === dayKeyStr)
```
`attendances` is already filtered by `where: { dayKey: dayKeyStr }` at line 120, so the second clause is **always true**. Any member who checked in anywhere that day shows as present in every class on her option's schedule. The `checkedInCount` per class is therefore wrong whenever a member has multiple sessions in a day.
**Fix:** Drop the `|| a.dayKey === dayKeyStr` fallback.

Related, same function: `enrollments` are filtered by `endDate: { gte: date }`, so any enrollment with a null `endDate` — which is every enrollment created through `createEnrollment` + `confirmEnrollment`, since neither sets one — **never appears on the calendar at all**.

### H18 — Deactivated staff retain access on read paths
`verifyPermission` correctly checks `isActive`, and `dashboard/layout.tsx:30` does too. But `analytics.ts:7` (`checkReportPermission`) does not, and neither do `reports/layout.tsx:16`, `settings/users/page.tsx:22`, or `settings/users/logs/page.tsx:22`. Because the session is a JWT with no `isActive` claim and no re-validation callback, a deactivated employee keeps a valid token until it expires and can continue reading financial reports and audit logs.
**Fix:** Centralise the check (see C6's DAL), and add a `jwt` callback that re-reads `isActive` periodically.

---

## 6. Medium-Severity Findings

| # | Finding | Location |
|---|---|---|
| M1 | `revalidatePath('/dashboard/users')` — that route doesn't exist; it's `/dashboard/settings/users`. Six occurrences across `users.ts`, `enrollments.ts`, `pos.ts`. The UI never refreshes from these calls. | `users.ts:77,106,129,147` |
| M2 | `playSuccessSound`/`playErrorSound` construct a **new `AudioContext` on every scan and never close it**. Browsers cap concurrent contexts (~50); after ~50 check-ins the scanner goes silent, swallowed by the `try/catch`. On a device left open all day this is a guaranteed regression. | `lib/audio.ts:4,36` |
| M3 | CSV export has no formula-injection guard. A client named `=cmd\|'/c calc'!A1` in `notes` executes on open in Excel. `URL.createObjectURL` is never revoked. | `ExportButton.tsx:253,259` |
| M4 | Scan nonce is bound only to `clientId` and is valid for 90s with no single-use enforcement — it can be replayed against a different enrollment of the same client. | `scan/confirm/route.ts:11` |
| M5 | Hardcoded HMAC fallback: `process.env.AUTH_SECRET \|\| "funny-space-super-secret-key-123"`. If the env var is missing, nonces are forgeable by anyone reading the source. | `scan/resolve:8`, `scan/confirm:9` |
| M6 | If `CRON_SECRET` is unset in production, the comparison becomes `authHeader !== "Bearer undefined"` — sending literally `Bearer undefined` passes. The var is absent from `.env`. | `cron/daily-check/route.ts:7` |
| M7 | `openShift("Cashier", …)` — hardcoded, with a comment admitting it: *"In a real app, openedBy would come from auth session."* No accountability for who opened a drawer. | `ShiftManager.tsx:37` |
| M8 | `addShiftExpense` writes no audit log — cash leaving the drawer is the single most fraud-sensitive operation. `/api/scan` (legacy) also skips it. Both violate the project's own rule in `.agents/SYSTEM_ARCHITECTURE_AND_FEATURES.md` §5.3. | `pos.ts:338` |
| M9 | `confirmEnrollment(id, method, totalAmount, amountPaid)` takes both amounts from the client and never validates against `option.price`; `amountPaid` may exceed `totalAmount`. `ReceptionManager.tsx:257` passes the *current* price, ignoring `e.totalAmount` recorded at booking — so a price change retroactively alters what a member owes. | `enrollments.ts:56` |
| M10 | `PrismaAdapter(prisma)` is configured, but the schema has **no `Account`, `Session`, or `VerificationToken` models**. It's inert under `strategy: "jwt"` with credentials only, but it will throw the moment an OAuth provider or database sessions are added. `@auth/prisma-adapter` is a shipped dependency for nothing. | `auth.ts:8` |
| M11 | Three different definitions of "sessions used" coexist: `attendances.length` (reception, portal), `regular + carried` (rules engine), `regular only` (`updateRemainingSessions`). The same member shows three different progress figures on three screens. | multiple |
| M12 | Client portal computes price from `e.option?.price` (current) rather than `e.totalAmount` (booked), and its status badge renders `EXPIRED`/`COMPLETED` as **"ملغى"** (cancelled). Progress bar divides by `sessionsPerMonth` without a zero guard → `Infinity` → renders 100%. | `client-portal/page.tsx:66,232,267` |
| M13 | Middleware checks cookie *presence* only, then redirects to `/login${search}` — carrying the **dashboard's** query string, not the secret. An expired session therefore bounces to `/login`, fails the secret gate, and lands on `/` with no route back into the app. | `middleware.ts:18` + `login/page.tsx:28` |
| M14 | `JSON.parse(localStorage.getItem('funny_space_held_orders'))` is unguarded inside a `useEffect`. Corrupt data throws during render, and with no error boundary (H4) the POS screen white-screens permanently until localStorage is cleared manually. | `SellPOS.tsx:39` |
| M15 | Held orders snapshot item prices and stock at hold time; resuming an order hours later sells at stale prices. | `SellPOS.tsx:163` |
| M16 | Returns are booked as an `EXPENSE` equal to the sale. Net profit is right; **gross revenue and gross expenses are both inflated** by every refund, so the accounting page's headline figures are wrong. | `pos.ts:245` |
| M17 | Root layout is `<html lang="en" dir="ltr">` for a product whose entire dashboard is Arabic RTL. `dir="rtl"` is applied on an inner `<div>`, which does not fix screen-reader language announcement. | `app/layout.tsx:34` |
| M18 | `public/` is **13 MB**. `IMG_55119.PNG` (3.2 MB), `5855858.PNG` (1.8 MB), `bellydance.png` (0.98 MB) and five default SVGs are **referenced nowhere in `src/`** — ~6 MB of dead weight. The 2.0 MB hero (`IMG_5119.PNG`) loads above the fold through a raw `<img>`. **Zero uses of `next/image`** across 15 `<img>` tags; `sharp` is a dependency with no consumer. Phase 5 of the technical plan was never executed. | `public/`, `page.tsx` |
| M19 | `window.location.reload()` appears 13 times across four managers instead of `router.refresh()` — full document reload, lost scroll position, re-download of every asset, and it defeats the `revalidatePath` calls the actions already make. Debt item **D8**, still open. | Reception/Classes/Programs/Events managers |
| M20 | CRM list is capped at `getClients(100)` and searched entirely client-side. Client #101 by creation date is unreachable through the UI. No pagination exists anywhere in the app. | `clients/page.tsx:20`, `ClientList.tsx:11` |
| M21 | `new Date(w.startDate).toISOString().slice(0,16)` populates a `datetime-local` input with a **UTC** string, which the browser then interprets as local time. Every open-and-save of a workshop or event shifts its time by the Cairo offset. | `EventsManager.tsx:59,60,76` |
| M22 | Permission semantics are mismatched: testimonials are gated by `EDIT_CLIENT`, and all of system settings by `MANAGE_USERS` (with a comment acknowledging it: *"Using MANAGE_USERS as the de-facto admin permission for now"*). `INSTRUCTOR` and `ACCOUNTANT` roles carry no implicit permissions — only `ADMIN` means anything. | `testimonials.ts:28`, `settings.ts:72` |
| M23 | `next.config.ts` sets no security headers — no CSP, HSTS, `X-Frame-Options`, `Referrer-Policy`, or `X-Content-Type-Options`. | `next.config.ts` |
| M24 | Raw `error.message` returned to clients on 500s, leaking internal detail (Prisma errors include table and column names). | `scan/confirm:215`, `api/book:86`, `cron:146` |
| M25 | `globalSearch` returns client names and phone numbers to **any** authenticated staff member, including roles with no client permission at all. It correctly gates the users section behind `ADMIN` but not the clients section. | `search.ts:23` |
| M26 | After a lockout expires, `failedAttempts` is never reset — it only resets on a *successful* login. A single subsequent wrong password immediately re-locks the account for another full period. | `auth.ts:38-70` |
| M27 | Every failed login redirects to `/login?secret=${loginSecret}&error=…`, writing the admin gate secret into browser history, `Referer` headers, and server access logs. | `login/page.tsx:52,65,67` |

---

## 7. Low-Severity Findings & Code Hygiene

- **L1** — 72 ESLint warnings, 0 errors: ~40 unused imports/variables, 15 `no-img-element`.
- **L2** — `defaultDuration` computed and never used (`rules.ts:47`).
- **L3** — Dead schema fields: `Client.isActive` (0 references — a "blocked" client can still check in), `Client.qrIssuedAt` (0), `Enrollment.renewedFromId`/`renewals` (0 — renewal is unimplemented), `Attendance.approvedByUserId` (0). The `Expense` model largely duplicates `Transaction`.
- **L4** — Dead settings: `expireOnSessionsDone` (0 references), `preventDoubleCheckIn` (has a UI toggle, enforced nowhere — the real protection is the DB unique constraint).
- **L5** — Settings with no UI despite driving the rules engine: `scanAlwaysAskProgram`, `allowOffScheduleCheckIn`, `expiryWarningDays`, `defaultDurationDays`.
- **L6** — `ProgramOptionData` omits `durationDays`, `makeupAllowance`, `graceDays`, so they can only be changed via SQL.
- **L7** — The scanner result screen says *"press Enter to return immediately"*; `handleKeyDown` handles Escape, digits, `m`, and `o` — never Enter. Pressing `m`/`o` also bypasses the disabled-button guard on an exhausted makeup quota.
- **L8** — Client-card print CSS hides `#dashboard-sidebar` and `#dashboard-header`; neither ID exists in `dashboard/layout.tsx`, so printing a member card prints the whole chrome.
- **L9** — `if (!o.name || !o.price || !o.sessionsPerMonth || !o.capacity)` rejects a legitimately free program (price 0).
- **L10** — WhatsApp links hardcode `wa.me/20` (Egypt).
- **L11** — Ten ad-hoc scripts committed at the repo root (`test.js`, `test_users.js`, `test_users2.js`, `test_prisma.js`, `script.js`, `seed.js`, `seed_programs.js`, `fix_clients.js`, `fix_programs_english.js`, `update_pass.js`), all connecting to the production database. `script.js` uses ESM `import` in a `.js` file without `"type": "module"` — it cannot run. Seeds set the admin password to `123456` and disagree on the admin email (`admin@funnyspace.com` vs `admin@soly.com`). `scratch/seed_admin.js` writes `permissions: ["ALL"]`, a value `checkUserPermission` does not understand. Debt item **D11**, still open.
- **L12** — `verifyPermission` is `export`ed from a `"use server"` module, so it is registered as a callable server action (confirmed in the manifest) that returns a full `User` row including the password hash. Its ID is not currently in a public chunk, but it should not be exported at all.
- **L13** — All money is `Float`. `0.1 + 0.2` problems will surface in aggregates; use `Decimal`.
- **L14** — `deleteProgramCategory` surfaces a raw Prisma FK error when the category has programs.
- **L15** — Copy mixes Arabic and English with no i18n layer; the public site is English, the dashboard Arabic, and `ClientPortal.tsx` hardcodes English strings inside an Arabic product.
- **L16** — `ConfirmProvider` has no `role="dialog"`, no `aria-modal`, no focus trap, no Escape handler, and no backdrop dismiss. Its promise never settles if the component unmounts while open.
- **L17** — `README.md` is the unmodified `create-next-app` template — no setup, env, migration, or deployment instructions.
- **L18** — `/api/scan` (legacy shim) is still routable, duplicates the confirm logic with weaker guarantees, and writes no audit log.
- **L19** — `getAccountingSummary` returns an `expenses` array the page never destructures; all-time totals are displayed next to a 50-row list, implying they're the same period.
- **L20** — N+1 queries: `getPOSAnalytics` bestSellers (2 queries × 5 items), `users/analytics` (2 queries per user).

---

## 8. Findings by Category

### Security summary
| Class | Status |
|---|---|
| SQL injection | **Not present** — Prisma parameterises everything; no raw SQL in `src/` |
| XSS | **Low risk** — one `dangerouslySetInnerHTML` (`SellPOS.tsx:230`) with a static string; React escapes elsewhere |
| CSRF | **Handled** — Next.js Origin/Host checking on Server Actions |
| SSRF / RCE / path traversal | **Not present** — no user-controlled fetch, exec, or filesystem access |
| Open redirect | **Minor** — `auth.ts:129` allows any `localhost`/`127.0.0.1` origin |
| Broken authorization | **Critical** — C1, C6, M25, H18 |
| Sensitive data exposure | **Critical** — C1, C2, C4, H2 |
| Weak authentication | **Critical** — C3, M26 |
| Hardcoded secrets | **Medium** — M5, M6, plus `"soly-admin"` and `"123456"` defaults |
| Rate limiting | **Absent everywhere** — login, client login, booking, scan |
| File upload | **N/A** — no upload functionality |
| Security headers / CORS | **Absent** — M23 |
| CSV injection | **Present** — M3 |
| Dependency risk | `next-auth@5.0.0-beta.31` in production is the notable one. `npm audit` was not run — recommended before release. |

### Performance summary
| Area | Assessment |
|---|---|
| Images | **Worst offender.** 13 MB in `public/`, ~6 MB unreferenced, 2 MB hero above the fold, 0 uses of `next/image`, `sharp` installed and unused. |
| Database queries | Good use of `Promise.all` and `aggregate`; undermined by unbounded `findMany` on the busiest pages (H16) and `include`-everywhere over-fetching (debt **D9**). |
| Caching | Homepage `revalidate = 3600` is sensible, but program/event mutations don't `revalidatePath("/")`, so the public site can be stale for an hour after a change. |
| Client bundles | `ClassesManager` 1,089 lines, `ClientProfileManager` 757, `ExploreCarousel` 571, `ClientPortal` 854 — all client components, no `dynamic()` splitting. Recharts loads eagerly on two pages. |
| Re-renders / memoisation | Minimal `useMemo`/`useCallback`; acceptable at current data volumes. |
| Navigation | 13 `window.location.reload()` calls — the single biggest perceived-speed problem in daily staff use. |
| Fonts | Three Google font families via `next/font` (self-hosted, so acceptable). |

### Accessibility summary
- `<html lang="en" dir="ltr">` on an Arabic RTL product (M17) — the most impactful single issue.
- No `role="dialog"` / `aria-modal` / focus trap on any of the four modal implementations (ConfirmProvider, GlobalSearch, and the inline modals in ClassesManager/EventsManager).
- Scanner steals focus every 1,200 ms (`ScannerClient.tsx:64`) — a keyboard trap for anyone using the page non-visually.
- Scan results are visual + audio only; no `aria-live` region.
- Sidebar uses the checkbox-`<label>` hack for mobile toggling — not keyboard- or screen-reader-operable as a disclosure.
- Colour-only status encoding in several places (variance red/green, stock indicators).
- No skip-link; no visible focus styles beyond the browser default in most components.

### UX summary
**Genuine strengths:** the visual design is coherent and polished; the two-phase scanner flow with keyboard shortcuts is a well-judged design for a reception desk; POS held-orders, quick discounts, and the barcode-focus indicator show real operational thinking; the CRM profile with KPIs, risk flags, and a QR card is well conceived.

**Weaknesses:** full page reloads after every action; no empty/loading/error states (H4); expired subscriptions vanish from reception entirely (no tab shows them); an expired session leaves staff stranded on the marketing homepage (M13); the CRM list silently hides everyone past the 100th client (M20); "press Enter" doesn't work (L7); no way for a member to see her own QR code in the portal, which is the whole point of the QR system.

---

## 9. Dead Code, Duplication, and Debt

**Dead code**
- `/api/test/route.ts` — delete (C4).
- `/api/scan/route.ts` — legacy shim, superseded by `resolve`/`confirm`.
- `fallbackTestimonials` (`page.tsx:50`) — 25 lines, unused.
- ~6 MB of unreferenced images; five default `create-next-app` SVGs.
- Ten root-level scripts (L11).
- `@auth/prisma-adapter` + `sharp` — installed, effectively unused.
- Dead schema fields and settings (L3, L4).

**Duplicated logic**
- Attendance check-in is implemented three times: `/api/scan`, `/api/scan/confirm`, `recordAttendance`. Only `confirm` is transactional and audited.
- The "which service is this enrollment for?" branch (`if program / workshop / event`) is copy-pasted in eight places.
- The `session → prisma.user.findUnique → checkUserPermission` preamble is repeated in 14 page files.
- The revenue-transaction description builder appears three times in `enrollments.ts`.
- Session-counting logic is forked three ways (M11).

**Technical-plan debt register — current state**

| Debt | Description | Status |
|---|---|---|
| D1 | No Prisma migrations | ✅ **Resolved** — `0_init` + `20260731_smart_attendance` |
| D2 | Server-local vs Cairo time | ❌ **Open** — H12 |
| D3 | Division by zero in payment gate | ✅ **Resolved** — `allowedByPayment` guards, with tests |
| D4 | Double check-in race | ✅ **Resolved** — `@@unique([enrollmentId, dayKey, type])` + `$transaction` |
| D5 | Fabricated `IMPORTED` attendance rows | ✅ **Resolved** — replaced by `carriedSessions` |
| D6 | Inconsistent session counting | ⚠️ **Partial** — engine consistent, UI still forks (M11) |
| D7 | `getEnrollments()` unbounded | ❌ **Open** — H16 |
| D8 | `window.location.reload()` | ❌ **Open** — M19 |
| D9 | `include` over-fetching | ❌ **Open** |
| D10 | Prisma "self-healing" client hack | ✅ **Resolved** |
| D11 | Scattered root scripts | ❌ **Open** — L11 |
| D12 | Middleware checks cookie only | ⚠️ **Partial** — layout compensates, but M13 remains |

**Technical-plan acceptance criteria**

| # | Criterion | Status |
|---|---|---|
| 1 | Multi-program scan asks which program | ✅ Delivered |
| 2 | Off-schedule day prompts makeup/exceptional, audited | ✅ Delivered |
| 3 | CRM shows attended/remaining/financial/expiry per program | ✅ Delivered |
| 4a | Editable start date with computed end date | ✅ Delivered |
| 4b | Expiry blocks entry immediately with a renew button | ⚠️ Blocks correctly; **`RENEW` is surfaced but `renewEnrollment` was never written** |
| 5 | Homepage LCP < 2 s, hero < 150 KB | ❌ Not started — hero is still 2.0 MB |
| — | Printable QR card + card revocation | ⚠️ Card delivered; **revocation not implemented** (`qrIssuedAt` unused) |
| — | All tests green + perf budget in CI | ⚠️ Tests green (31); **no CI configuration exists** |

---

## 10. Testing Assessment

```
$ npx jest --ci
Test Suites: 6 passed, 6 total
Tests:       31 passed, 31 total
```

**Covered:** `rules.ts` (well — schedule windows, payment gating, blockers), `time.ts`, `permissions.ts`, `ThemeToggle`, `addShiftExpense` (2 cases), enrollment actions.

**Not covered at all:**
- `createPOSOrder`, `returnPOSOrder` — the price/stock/discount logic where C5 and H3 live
- `closeShift` arithmetic — where H1 lives
- All three scan endpoints and the nonce HMAC
- The cron job
- Every authentication and authorization path — **no test asserts that an unauthenticated caller is rejected**, which is precisely how C1/C6 survived
- Every client component (POS cart, scanner state machine, forms)

**E2E:** two Playwright tests (landing page renders; `/dashboard` redirects). The redirect test only passes because it hardcodes `?secret=soly-admin` — it will break the moment the secret is rotated, and it encodes the leak as expected behaviour.

**No CI configuration exists** (`.github/`, `.gitlab-ci.yml` — absent), so nothing runs these automatically.

**Highest-value tests to add first:** an authorization matrix asserting every exported server action rejects an unauthenticated caller; POS pricing derived from the DB; shift-close arithmetic; the cron's Cairo day boundary.

---

## 11. Prioritised Action Plan

### P0 — Before this touches real customer data (~1–2 days)
1. **Delete `src/app/api/test/route.ts`.** (C4, 1 min)
2. **Add `verifyPermission` + `select` DTOs** to `searchClientsAction`, `getClients`, `getClientById`, `getEnrollments`, `getInventoryItems`, `getClientsForPOS`, `getPOSReports`, `getCurrentShift`. Never return `password` or `qrToken`. (C1, C6)
3. **Stop leaking `adminLoginSecret`** — pass an explicit field whitelist to `ClientPortal`; rotate the secret. (C2)
4. **Derive POS prices server-side**; clamp discount to `[0, subtotal]`. (C5)
5. **Recompute `expectedCash` inside `closeShift`.** (H1)
6. **`select` explicit fields** in `settings/users/page.tsx`. (H2)
7. **Replace phone-as-password** with random one-time credentials + forced change; add throttling to the client provider. (C3)
8. **Add `error.tsx` / `global-error.tsx` / `not-found.tsx`.** (H4)

### P1 — Correctness and integrity (~1 week)
9. Move the stock check inside the transaction with a conditional decrement. (H3)
10. Remove `ignoreBuildErrors`; fix `client.ts:121`; add `tsc --noEmit` to CI. (H5)
11. Fix `deleteClient` and `deleteUser`; prefer soft-delete. (H6, H7)
12. Guard program/workshop/event deletion against existing enrollments. (H8)
13. Diff schedules instead of delete-and-recreate; make `updateProgram` transactional. (H9)
14. Wrap `confirmEnrollment`, `addPayment`, `enrollClient` in `$transaction`; add a reversing entry to `cancelEnrollment`. (H14, H15)
15. Add `startOfCairoDay`/`endOfCairoDay` and apply to cron, dashboard, and report filters. (H12)
16. Decide and implement the `OFF_SCHEDULE` session policy. (H13)
17. Fix the calendar attendance match and the null-`endDate` exclusion. (H17)
18. Enforce capacity in all booking paths. (H10)
19. Gate `/api/book` on `enablePublicBookings`; add rate limiting. (H11)
20. Set `CRON_SECRET`; fail closed when it's missing. (M6)
21. Remove the hardcoded HMAC fallbacks. (M5)

### P2 — Scale, correctness-in-depth, hygiene (~2 weeks)
22. Paginate and server-side-filter reception, classes, clients, POS reports, audit logs. (H16, M20)
23. Replace `window.location.reload()` with `router.refresh()`. (M19)
24. Fix `revalidatePath` targets. (M1)
25. Fix the AudioContext leak. (M2)
26. Add CSV formula-injection escaping. (M3)
27. Unify session-count semantics across UI and engine. (M11)
28. Fix the datetime-local round-trip. (M21)
29. Fix client-portal price basis and status labels. (M12)
30. Fix the login dead-end after session expiry. (M13)
31. Add security headers to `next.config.ts`. (M23)
32. Set `lang="ar" dir="rtl"` correctly; add dialog semantics and focus traps. (M17, L16)
33. Move root scripts into `scripts/`, gitignore them, remove weak default credentials. (L11)
34. Delete ~6 MB of unused images; migrate to `next/image`; compress the hero. (M18)
35. Write the authorization test matrix; add CI. (§10)

### P3 — Complete the plan
36. Implement `renewEnrollment` and `freezeEnrollment` (the schema is already there).
37. Implement QR revocation using `qrIssuedAt`.
38. Surface the five hidden rules-engine settings in the settings UI.
39. Introduce a proper DAL with `import 'server-only'` and DTOs.
40. Migrate money columns from `Float` to `Decimal`.
41. Add an i18n layer.

---

## 12. Engineering Scores

| Dimension | Score | Rationale |
|---|---:|---|
| Architecture | **5.0** | Clean rules-engine core and a sensible action/page split, but no DAL, no consistent authz boundary, three parallel permission mechanisms, no transaction discipline. |
| Code Quality | **4.0** | Readable and consistently styled, but 66 `: any` in dashboard code, `ignoreBuildErrors`, heavy duplication, reload-driven state management. |
| Security | **2.0** | Five confirmed critical issues including an unauthenticated dump of password hashes and check-in tokens, and a secret published in public HTML. No rate limiting anywhere. |
| Performance | **4.0** | Good instincts (parallel queries, aggregates, pool tuning) undone by 13 MB of images, zero `next/image`, unbounded queries, and 13 full page reloads. |
| Reliability | **3.0** | No error boundaries at all; non-atomic financial writes; two delete paths that always fail; oversell race; timezone drift on every day boundary. |
| Maintainability | **4.0** | Good file organisation and an excellent planning doc, but pervasive `any`, duplicated logic, dead code, and a template README. |
| Scalability | **3.0** | Nothing is paginated. Reception and classes load the full enrollment table with relations. Fine at 100 clients, broken at 5,000. |
| Accessibility | **3.0** | Wrong `lang`/`dir`, no dialog semantics, focus stealing, no live regions, colour-only status. |
| UX | **6.0** | Genuinely well-designed visually with a thoughtful scanner flow; hurt by reload churn, missing states, and several dead-end paths. |
| **Overall System Health** | **3.5** | A capable, largely feature-complete product with a solid domain core, sitting on an authorization and data-integrity layer that is not production-ready. The critical set is small and well-bounded — roughly two days of focused work moves this to ~6. |

---

## 13. What Could Not Be Verified

| Item | Why | What would settle it |
|---|---|---|
| Live exploitability of C1 | No request was issued against the running app or its database | `POST /` with header `Next-Action: 4032dbc75e8344fcbcfd6b27828bf1eab0ceba380f` and body `["ab"]` against a **staging** instance |
| Whether the inspected `.next` build matches production | The local build may be stale relative to the deploy | Compare `BUILD_ID` with the deployed asset paths |
| Playwright e2e results | Requires a dev server and a live database | `npm run test:e2e` against a seeded staging DB |
| Actual Lighthouse/LCP numbers | Static file sizes only; no runtime measurement | Lighthouse mobile, throttled 4G, per plan §8.1.0 |
| Dependency CVEs | `npm audit` was not run | `npm audit --production` |
| Migration integrity against the live DB | Cannot inspect the deployed schema | `npx prisma migrate status` |
| Real concurrency behaviour (H3 oversell) | Requires load against a real Postgres instance | Two concurrent `createPOSOrder` calls for the last unit on staging |
| Whether `CRON_SECRET` is set in Vercel | `.env` is local-only and gitignored | Check the Vercel project's environment variables |
| Production `NODE_ENV`/`AUTH_SECRET` presence | Same | Same |

---

*Prepared from a complete read of `funny-space/` at commit `0916467`. Every finding cites a file and line; every claim marked CONFIRMED is backed by a quoted file, build artifact, or command output reproduced above.*
