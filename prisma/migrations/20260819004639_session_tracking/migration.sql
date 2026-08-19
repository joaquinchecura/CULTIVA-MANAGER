/*
  Warnings:

  - You are about to drop the column `rm` on the `progress_logs` table. All the data in the column will be lost.
  - You are about to alter the column `weightUsed` on the `progress_logs` table. The data in that column could be lost. The data in that column will be cast from `Decimal(5,2)` to `DoublePrecision`.
  - Added the required column `dayOfWeek` to the `routine_days` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sessionNumber` to the `routine_days` table without a default value. This is not possible if the table is not empty.
  - Added the required column `weekNumber` to the `routine_days` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "progress_logs" DROP CONSTRAINT "progress_logs_exerciseId_fkey";

-- DropForeignKey
ALTER TABLE "progress_logs" DROP CONSTRAINT "progress_logs_memberId_fkey";

-- DropForeignKey
ALTER TABLE "progress_logs" DROP CONSTRAINT "progress_logs_routineId_fkey";

-- DropForeignKey
ALTER TABLE "routines" DROP CONSTRAINT "routines_memberId_fkey";

-- AlterTable
ALTER TABLE "progress_logs" DROP COLUMN "rm",
ADD COLUMN     "sessionLogId" TEXT,
ALTER COLUMN "weightUsed" SET DATA TYPE DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "routine_days" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "dayOfWeek" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "sessionNumber" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "weekNumber" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "routine_exercises" ADD COLUMN     "targetWeight" DOUBLE PRECISION,
ALTER COLUMN "sets" DROP DEFAULT,
ALTER COLUMN "reps" DROP DEFAULT,
ALTER COLUMN "rest" DROP DEFAULT;

-- AlterTable
ALTER TABLE "routines" ADD COLUMN     "totalWeeks" INTEGER;

-- CreateTable
CREATE TABLE "session_logs" (
    "id" TEXT NOT NULL,
    "routineId" TEXT NOT NULL,
    "routineDayId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "notes" TEXT,

    CONSTRAINT "session_logs_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "routines" ADD CONSTRAINT "routines_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_logs" ADD CONSTRAINT "session_logs_routineId_fkey" FOREIGN KEY ("routineId") REFERENCES "routines"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_logs" ADD CONSTRAINT "session_logs_routineDayId_fkey" FOREIGN KEY ("routineDayId") REFERENCES "routine_days"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_logs" ADD CONSTRAINT "session_logs_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "progress_logs" ADD CONSTRAINT "progress_logs_routineId_fkey" FOREIGN KEY ("routineId") REFERENCES "routines"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "progress_logs" ADD CONSTRAINT "progress_logs_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "exercises"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "progress_logs" ADD CONSTRAINT "progress_logs_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "progress_logs" ADD CONSTRAINT "progress_logs_sessionLogId_fkey" FOREIGN KEY ("sessionLogId") REFERENCES "session_logs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
