-- AlterTable
ALTER TABLE "activities" ADD COLUMN     "organizationId" TEXT;

-- AlterTable
ALTER TABLE "attendances" ADD COLUMN     "organizationId" TEXT;

-- AlterTable
ALTER TABLE "body_compositions" ADD COLUMN     "organizationId" TEXT;

-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "organizationId" TEXT;

-- AlterTable
ALTER TABLE "cash_movements" ADD COLUMN     "organizationId" TEXT;

-- AlterTable
ALTER TABLE "cash_registers" ADD COLUMN     "organizationId" TEXT;

-- AlterTable
ALTER TABLE "exercises" ADD COLUMN     "organizationId" TEXT;

-- AlterTable
ALTER TABLE "gym_config" ADD COLUMN     "organizationId" TEXT;

-- AlterTable
ALTER TABLE "holidays" ADD COLUMN     "organizationId" TEXT;

-- AlterTable
ALTER TABLE "members" ADD COLUMN     "organizationId" TEXT;

-- AlterTable
ALTER TABLE "memberships" ADD COLUMN     "organizationId" TEXT;

-- AlterTable
ALTER TABLE "news" ADD COLUMN     "organizationId" TEXT;

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "organizationId" TEXT;

-- AlterTable
ALTER TABLE "plans" ADD COLUMN     "organizationId" TEXT;

-- AlterTable
ALTER TABLE "progress_logs" ADD COLUMN     "organizationId" TEXT;

-- AlterTable
ALTER TABLE "routine_days" ADD COLUMN     "organizationId" TEXT;

-- AlterTable
ALTER TABLE "routine_exercises" ADD COLUMN     "organizationId" TEXT;

-- AlterTable
ALTER TABLE "routines" ADD COLUMN     "organizationId" TEXT;

-- AlterTable
ALTER TABLE "schedules" ADD COLUMN     "organizationId" TEXT;

-- AlterTable
ALTER TABLE "session_logs" ADD COLUMN     "organizationId" TEXT;

-- CreateTable
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "activities_organizationId_idx" ON "activities"("organizationId");

-- CreateIndex
CREATE INDEX "attendances_organizationId_idx" ON "attendances"("organizationId");

-- CreateIndex
CREATE INDEX "body_compositions_organizationId_idx" ON "body_compositions"("organizationId");

-- CreateIndex
CREATE INDEX "bookings_organizationId_idx" ON "bookings"("organizationId");

-- CreateIndex
CREATE INDEX "cash_movements_organizationId_idx" ON "cash_movements"("organizationId");

-- CreateIndex
CREATE INDEX "cash_registers_organizationId_idx" ON "cash_registers"("organizationId");

-- CreateIndex
CREATE INDEX "exercises_organizationId_idx" ON "exercises"("organizationId");

-- CreateIndex
CREATE INDEX "gym_config_organizationId_idx" ON "gym_config"("organizationId");

-- CreateIndex
CREATE INDEX "holidays_organizationId_idx" ON "holidays"("organizationId");

-- CreateIndex
CREATE INDEX "members_organizationId_idx" ON "members"("organizationId");

-- CreateIndex
CREATE INDEX "memberships_organizationId_idx" ON "memberships"("organizationId");

-- CreateIndex
CREATE INDEX "news_organizationId_idx" ON "news"("organizationId");

-- CreateIndex
CREATE INDEX "payments_organizationId_idx" ON "payments"("organizationId");

-- CreateIndex
CREATE INDEX "plans_organizationId_idx" ON "plans"("organizationId");

-- CreateIndex
CREATE INDEX "progress_logs_organizationId_idx" ON "progress_logs"("organizationId");

-- CreateIndex
CREATE INDEX "routine_days_organizationId_idx" ON "routine_days"("organizationId");

-- CreateIndex
CREATE INDEX "routine_exercises_organizationId_idx" ON "routine_exercises"("organizationId");

-- CreateIndex
CREATE INDEX "routines_organizationId_idx" ON "routines"("organizationId");

-- CreateIndex
CREATE INDEX "schedules_organizationId_idx" ON "schedules"("organizationId");

-- CreateIndex
CREATE INDEX "session_logs_organizationId_idx" ON "session_logs"("organizationId");

-- AddForeignKey
ALTER TABLE "gym_config" ADD CONSTRAINT "gym_config_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "members" ADD CONSTRAINT "members_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plans" ADD CONSTRAINT "plans_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cash_registers" ADD CONSTRAINT "cash_registers_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cash_movements" ADD CONSTRAINT "cash_movements_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exercises" ADD CONSTRAINT "exercises_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "routines" ADD CONSTRAINT "routines_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "routine_days" ADD CONSTRAINT "routine_days_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "routine_exercises" ADD CONSTRAINT "routine_exercises_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_logs" ADD CONSTRAINT "session_logs_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "progress_logs" ADD CONSTRAINT "progress_logs_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "news" ADD CONSTRAINT "news_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "holidays" ADD CONSTRAINT "holidays_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "body_compositions" ADD CONSTRAINT "body_compositions_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
