# Soly's Space (Funny Space) - The Master Brain Document 🧠

**CRITICAL PROTOCOL FOR ALL AI AGENTS:**
1. **READ THIS FIRST**: Whenever you are invoked in this workspace, you MUST read this document to deeply understand the business logic, database relationships, and system architecture.
2. **EXHAUSTIVE DETAILS**: For a complete list of every single screen, API action, and DB Model currently in the system, refer to `.agents/SYSTEM_ARCHITECTURE_AND_FEATURES.md`.
3. **UPDATE AUTOMATICALLY**: Whenever you implement a new feature, change the database, or alter the logic, you **MUST** update BOTH this file and `SYSTEM_ARCHITECTURE_AND_FEATURES.md` automatically to reflect your changes before completing the task. This ensures the documents are always the single source of truth.

---

## 1. System Vision & Business Logic (رؤية النظام والمنطق الإداري)
Soly's Space is a comprehensive management system for a boutique studio/space. The system handles:
- **CRM (Customer Relationship Management)**: Managing clients (العميلات), their contact info, and history.
- **Service Bookings**: Managing long-term "Programs", short-term "Workshops", and one-off "Events".
- **POS & Inventory (الكاشير والمخزون)**: Selling snacks, drinks, and merch. Tracking inventory levels and daily cash shifts.
- **Financial Accounting (الحسابات)**: A centralized ledger tracking all Revenues (مبيعات، اشتراكات) and Expenses (مصروفات ورديات، مصروفات عامة).
- **Team Management**: Role-based access control for employees (Admins, Receptionists, Instructors, Accountants).

---

## 2. Database Architecture & Relationships (هندسة قاعدة البيانات)

### A. Users & Permissions (الموظفين والصلاحيات)
- **Model**: `User`
- **Logic**: Users log in via email/password. They have a base `Role` (ADMIN, RECEPTION, INSTRUCTOR, ACCOUNTANT) and a granular `permissions` array (e.g., `CAN_DELETE_CLIENT`). 
- **Rule**: NEVER use hardcoded strings for permissions. Always import `PERMISSIONS` from `src/lib/permissions.ts`.

### B. Clients & CRM (العميلات)
- **Model**: `Client`
- **Logic**: Every client requires a unique phone number. Passwords are automatically hashed upon creation (usually defaults to their phone number).
- **Relations**: A client can have many `Enrollment`s (bookings) and `POSOrder`s (purchases).

### C. Services & Enrollments (الخدمات والاشتراكات)
- **Models**: `Program`, `Workshop`, `Event`
- **Logic**: These are the physical/educational services offered.
- **Enrollment Flow**: 
  1. A client enrolls in a service. An `Enrollment` record is created with status `PENDING`.
  2. Upon payment, status becomes `CONFIRMED`.
  3. **Integration**: Confirming an enrollment automatically generates a `Transaction` of type `REVENUE` in the accounting system.
- **Attendance Flow**: Clients attend sessions. An `Attendance` record is created linked to the `Enrollment`. It tracks date, status (ATTENDED, ABSENT), and if it's a `isMakeup` (حصة تعويضية).

### D. POS, Inventory, and Shifts (الكاشير والمبيعات)
- **Models**: `InventoryItem`, `POSOrder`, `POSOrderItem`, `POSShift`, `ShiftExpense`
- **Shift Logic**: 
  - A Receptionist opens a `POSShift`. The `expectedCash` column stores the **Starting Cash (العهدة الافتتاحية)**.
  - As sales (`POSOrder`) happen, if they are `CASH`, they logically add to the drawer. If they are expenses (`ShiftExpense`), they logically deduct from the drawer.
  - **Integration (CRITICAL)**: The current cash in drawer is calculated **dynamically** in `getCurrentShift()` using `_sum` aggregation of cash orders minus expenses. We DO NOT mutate `expectedCash` in the DB to avoid desynchronization.
  - When closing, the employee inputs `actualCash` to track deficits/surpluses.
- **Inventory Logic**: 
  - Creating a `POSOrder` automatically `decrements` the `quantity` of the `InventoryItem`.
  - Returning an order (`isReturned: true`) automatically `increments` the inventory back.
  - **Smart Alerts**: The UI pulsates red if an item's quantity is `<= 5`.

### E. Accounting & Global Ledger (الحسابات العامة)
- **Model**: `Transaction`
- **Integration Flow**: This is the central heart of the system's financials. 
  - POS Order -> Creates `REVENUE` Transaction.
  - Returned POS Order -> Creates `EXPENSE` Transaction.
  - Paid Enrollment -> Creates `REVENUE` Transaction.
  - General Expense (كهرباء، إيجار) -> Creates `EXPENSE` Transaction.
- **Reporting**: The Analytics page reads strictly from `Transaction` to calculate Net Profit (صافي الربح).

### F. Security & Audit Trail (سجلات الرقابة)
- **Model**: `AuditLog`
- **Logic**: EVERY single action that changes data (Create, Update, Delete) MUST log an entry via `logAction()` in `src/lib/audit.ts`.
- **Integration**: The `details` column is of type `Jsonb`. We pass raw objects to it to store exactly what changed (e.g., `{ orderId: '...', totalAmount: 50 }`).

---

## 3. Technical & Coding Standards (المعايير البرمجية)

1. **Next.js Server Actions**: All backend logic must live in `src/actions/`. Never use `useEffect` for data fetching if it can be done via Server Components.
2. **State Synchronization**: Because we use Server Actions, you MUST call `revalidatePath('/path')` at the end of every mutation to ensure the UI instantly updates without needing a refresh.
3. **Rate Limiting & Safety**: For heavy DB tables (`Client`, `AuditLog`), always use `take: 100` in `findMany` to prevent the server from crashing as the business scales.
4. **Global Search**: The system has a Command Palette (`GlobalSearch.tsx` in `dashboard/layout.tsx`). It listens for `e.code === "KeyK"` (to support Arabic keyboards) with `Ctrl/Cmd`. It allows users to quickly jump anywhere.
5. **Database Connections**: 
   - `DATABASE_URL` (Port 6543): Used for running the app (PgBouncer connection pooling).
   - `DIRECT_URL` (Port 5432): Required for `npx prisma db push` (DDL migrations). You must swap URLs in `.env` manually to push schema changes.
6. **No Arabic Variables**: Code (variables, functions, schema) MUST be in English. Only UI (`<p>مرحباً</p>`) can be in Arabic.
7. **TypeScript strictness**: The build must pass `npx tsc --noEmit`. Fix any typing errors immediately.
8. **UI Popups & Alerts**: DO NOT use native browser `window.alert`, `window.confirm`, or `window.prompt`. Always use `toast` from `sonner` for alerts, and `useConfirm` / `usePrompt` from `@/components/ConfirmProvider` for dialogs.

---
**[END OF DOCUMENT]**  
*Agent Reminder: Did you add a new feature today? If yes, UPDATE THIS DOCUMENT before you say "Done"!*
