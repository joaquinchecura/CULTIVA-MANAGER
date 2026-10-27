/*
  Warnings:

  - A unique constraint covering the columns `[organizationId,date]` on the table `cash_registers` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[organizationId,date]` on the table `holidays` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[organizationId,dni]` on the table `members` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[organizationId,email]` on the table `members` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
ALTER TYPE "BookingStatus" ADD VALUE 'WAITLIST';

-- DropIndex
DROP INDEX "cash_registers_date_key";

-- DropIndex
DROP INDEX "holidays_date_key";

-- DropIndex
DROP INDEX "members_dni_key";

-- DropIndex
DROP INDEX "members_email_key";

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "membershipId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "cash_registers_organizationId_date_key" ON "cash_registers"("organizationId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "holidays_organizationId_date_key" ON "holidays"("organizationId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "members_organizationId_dni_key" ON "members"("organizationId", "dni");

-- CreateIndex
CREATE UNIQUE INDEX "members_organizationId_email_key" ON "members"("organizationId", "email");

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "memberships"("id") ON DELETE SET NULL ON UPDATE CASCADE;
