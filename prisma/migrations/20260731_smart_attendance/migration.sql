-- CreateEnum
CREATE TYPE "AttendanceType" AS ENUM ('REGULAR', 'MAKEUP', 'OFF_SCHEDULE', 'IMPORTED');

-- AlterTable (Client - Make qrToken nullable first)
ALTER TABLE "Client" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "qrIssuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "qrToken" TEXT;

-- Populate qrToken with Client ID
UPDATE "Client" SET "qrToken" = "id";

-- Set qrToken as NOT NULL
ALTER TABLE "Client" ALTER COLUMN "qrToken" SET NOT NULL;

-- AlterTable (ProgramOption)
ALTER TABLE "ProgramOption" ADD COLUMN     "durationDays" INTEGER NOT NULL DEFAULT 30,
ADD COLUMN     "graceDays" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "makeupAllowance" INTEGER NOT NULL DEFAULT 1;

-- AlterTable (Enrollment)
ALTER TABLE "Enrollment" ADD COLUMN     "carriedSessions" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "endDate" TIMESTAMP(3),
ADD COLUMN     "frozenDays" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "renewedFromId" TEXT,
ADD COLUMN     "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable (Attendance - Make dayKey nullable first)
ALTER TABLE "Attendance" ADD COLUMN     "approvedByUserId" TEXT,
ADD COLUMN     "dayKey" TEXT,
ADD COLUMN     "note" TEXT,
ADD COLUMN     "recordedByUserId" TEXT,
ADD COLUMN     "scheduleId" TEXT,
ADD COLUMN     "type" "AttendanceType" NOT NULL DEFAULT 'REGULAR';

-- Populate dayKey from date in Cairo timezone (fallback to UTC date if AT TIME ZONE fails)
UPDATE "Attendance" SET "dayKey" = TO_CHAR("date" AT TIME ZONE 'Africa/Cairo', 'YYYY-MM-DD');
UPDATE "Attendance" SET "dayKey" = TO_CHAR("date", 'YYYY-MM-DD') WHERE "dayKey" IS NULL;

-- Set dayKey as NOT NULL
ALTER TABLE "Attendance" ALTER COLUMN "dayKey" SET NOT NULL;

-- AlterTable (SystemSettings)
ALTER TABLE "SystemSettings" ADD COLUMN     "allowOffScheduleCheckIn" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "defaultDurationDays" INTEGER NOT NULL DEFAULT 30,
ADD COLUMN     "expireOnSessionsDone" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "expiryWarningDays" INTEGER NOT NULL DEFAULT 3,
ADD COLUMN     "scanAlwaysAskProgram" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX "Client_qrToken_key" ON "Client"("qrToken");

-- CreateIndex
CREATE INDEX "Client_qrToken_idx" ON "Client"("qrToken");

-- CreateIndex
CREATE INDEX "Enrollment_status_endDate_idx" ON "Enrollment"("status", "endDate");

-- CreateIndex
CREATE INDEX "Enrollment_programId_optionId_idx" ON "Enrollment"("programId", "optionId");

-- CreateIndex
CREATE INDEX "Enrollment_clientId_status_idx" ON "Enrollment"("clientId", "status");

-- CreateIndex
CREATE INDEX "Attendance_dayKey_idx" ON "Attendance"("dayKey");

-- CreateIndex
CREATE INDEX "Attendance_scheduleId_idx" ON "Attendance"("scheduleId");

-- Deduplicate Attendance table: delete duplicate rows keeping the oldest (smallest id)
DELETE FROM "Attendance" a USING "Attendance" b
WHERE a.id > b.id
  AND a."enrollmentId" = b."enrollmentId"
  AND a."dayKey" = b."dayKey"
  AND a."type" = b."type";

-- CreateIndex
CREATE UNIQUE INDEX "Attendance_enrollmentId_dayKey_type_key" ON "Attendance"("enrollmentId", "dayKey", "type");

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_renewedFromId_fkey" FOREIGN KEY ("renewedFromId") REFERENCES "Enrollment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "ProgramSchedule"("id") ON DELETE SET NULL ON UPDATE CASCADE;
