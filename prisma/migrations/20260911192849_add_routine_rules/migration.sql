-- AlterEnum
ALTER TYPE "ExerciseType" ADD VALUE 'REHABILITATION';

-- DropForeignKey
ALTER TABLE "routines" DROP CONSTRAINT "routines_memberId_fkey";

-- AlterTable
ALTER TABLE "attendances" ADD COLUMN     "deviceBrand" TEXT,
ADD COLUMN     "deviceModel" TEXT,
ADD COLUMN     "deviceOS" TEXT,
ADD COLUMN     "userAgent" TEXT;

-- AlterTable
ALTER TABLE "routine_days" ALTER COLUMN "dayOfWeek" DROP DEFAULT,
ALTER COLUMN "sessionNumber" DROP DEFAULT,
ALTER COLUMN "weekNumber" DROP DEFAULT;

-- CreateTable
CREATE TABLE "routine_rules" (
    "id" TEXT NOT NULL,
    "goal" "RoutineGoal" NOT NULL,
    "exerciseType" "ExerciseType" NOT NULL,
    "sets" INTEGER NOT NULL,
    "repsMin" INTEGER,
    "repsMax" INTEGER,
    "durationSec" INTEGER,
    "restSeconds" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "routine_rules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "routine_rules_goal_exerciseType_key" ON "routine_rules"("goal", "exerciseType");

-- AddForeignKey
ALTER TABLE "routines" ADD CONSTRAINT "routines_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "members"("id") ON DELETE SET NULL ON UPDATE CASCADE;
