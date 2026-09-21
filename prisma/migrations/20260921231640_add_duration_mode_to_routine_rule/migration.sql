-- CreateEnum
CREATE TYPE "DurationMode" AS ENUM ('PER_EXERCISE', 'TOTAL_BLOCK');

-- AlterTable
ALTER TABLE "routine_rules" ADD COLUMN     "durationMode" "DurationMode" NOT NULL DEFAULT 'PER_EXERCISE';
