-- CreateTable
CREATE TABLE "staff_credential_skill" (
    "id" UUID NOT NULL,
    "staff_credential_id" UUID NOT NULL,
    "staff_skill_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "staff_credential_skill_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "staff_credential_skill_staff_credential_id_idx" ON "staff_credential_skill"("staff_credential_id");

-- CreateIndex
CREATE INDEX "staff_credential_skill_staff_skill_id_idx" ON "staff_credential_skill"("staff_skill_id");

-- CreateIndex
CREATE UNIQUE INDEX "staff_credential_skill_staff_credential_id_staff_skill_id_key" ON "staff_credential_skill"("staff_credential_id", "staff_skill_id");

-- AddForeignKey
ALTER TABLE "staff_credential_skill" ADD CONSTRAINT "staff_credential_skill_staff_credential_id_fkey" FOREIGN KEY ("staff_credential_id") REFERENCES "staff_credential"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_credential_skill" ADD CONSTRAINT "staff_credential_skill_staff_skill_id_fkey" FOREIGN KEY ("staff_skill_id") REFERENCES "staff_skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;
