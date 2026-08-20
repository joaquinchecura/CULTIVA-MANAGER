-- DropForeignKey
ALTER TABLE "routines" DROP CONSTRAINT "routines_memberId_fkey";

-- AlterTable
ALTER TABLE "routine_days" ALTER COLUMN "dayOfWeek" DROP DEFAULT,
ALTER COLUMN "sessionNumber" DROP DEFAULT,
ALTER COLUMN "weekNumber" DROP DEFAULT;

-- AlterTable
ALTER TABLE "routines" ADD COLUMN     "isTemplate" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "memberId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "routines" ADD CONSTRAINT "routines_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "members"("id") ON DELETE SET NULL ON UPDATE CASCADE;
