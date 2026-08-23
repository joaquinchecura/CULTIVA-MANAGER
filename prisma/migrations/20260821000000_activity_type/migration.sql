CREATE TYPE "ActivityType" AS ENUM ('GROUP', 'PERSONAL');

ALTER TABLE "activities" ADD COLUMN "type" "ActivityType" NOT NULL DEFAULT 'GROUP';

UPDATE "activities" SET "type" = 'PERSONAL' WHERE "maxCapacity" = 1;