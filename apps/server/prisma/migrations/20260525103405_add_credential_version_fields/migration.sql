-- AlterTable
ALTER TABLE "staff_credential" ADD COLUMN     "is_current" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "remark" VARCHAR(500),
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;
