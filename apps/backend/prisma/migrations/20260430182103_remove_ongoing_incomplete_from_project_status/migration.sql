-- AlterEnum
-- This migration removes INCOMPLETE and ONGOING from ProjectStatus enum.
-- First drop the unique index that constrains by status
DROP INDEX IF EXISTS "project_osc_active_unique";

-- Drop the status index
DROP INDEX IF EXISTS "Project_status_idx";

-- Drop the default and rename the type
ALTER TABLE "Project" ALTER COLUMN "status" DROP DEFAULT;
ALTER TYPE "ProjectStatus" RENAME TO "ProjectStatus_old";

-- Create new enum without INCOMPLETE and ONGOING
CREATE TYPE "ProjectStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'ABANDONED');

-- Convert the column
ALTER TABLE "Project" ALTER COLUMN "status" TYPE "ProjectStatus" USING ("status"::text::"ProjectStatus");

-- Restore the default
ALTER TABLE "Project" ALTER COLUMN "status" SET DEFAULT 'IN_PROGRESS';

-- Drop the old enum
DROP TYPE "ProjectStatus_old";

-- Recreate the indexes
CREATE INDEX "Project_status_idx" ON "Project"("status");
CREATE UNIQUE INDEX "project_osc_active_unique" ON "Project" ("oscId") WHERE "status" NOT IN ('COMPLETED', 'ABANDONED');
