-- CreateEnum
CREATE TYPE "OrganizationStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'CANCELLED');

-- AlterTable
ALTER TABLE "organizations" ADD COLUMN     "status" "OrganizationStatus" NOT NULL DEFAULT 'ACTIVE';
