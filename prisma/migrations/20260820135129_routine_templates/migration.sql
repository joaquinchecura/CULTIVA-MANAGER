-- AlterTable: memberId now nullable + add isTemplate
ALTER TABLE "routines" ALTER COLUMN "memberId" DROP NOT NULL;
ALTER TABLE "routines" ADD COLUMN IF NOT EXISTS "isTemplate" BOOLEAN NOT NULL DEFAULT false;