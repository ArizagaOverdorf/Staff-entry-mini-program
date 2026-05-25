-- AlterTable
ALTER TABLE "staff_credential" ADD COLUMN     "credential_group_id" UUID,
ADD COLUMN     "skill_level" VARCHAR(64);

-- CreateIndex
CREATE INDEX "staff_credential_credential_group_id_idx" ON "staff_credential"("credential_group_id");
