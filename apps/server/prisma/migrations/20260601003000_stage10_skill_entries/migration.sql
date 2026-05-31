-- CreateTable
CREATE TABLE "staff_independent_skill" (
    "id" UUID NOT NULL,
    "staff_account_id" UUID NOT NULL,
    "skill_key" VARCHAR(32) NOT NULL,
    "is_selected" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "staff_independent_skill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_skill_entry" (
    "id" UUID NOT NULL,
    "staff_account_id" UUID NOT NULL,
    "entry_index" SMALLINT NOT NULL,
    "skill_name" VARCHAR(128),
    "skill_level" VARCHAR(64),
    "work_duration_months" INTEGER,
    "related_service_skills" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "staff_skill_entry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_skill_entry_file" (
    "id" UUID NOT NULL,
    "staff_skill_entry_id" UUID NOT NULL,
    "file_asset_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "staff_skill_entry_file_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "staff_independent_skill_staff_account_id_skill_key_key" ON "staff_independent_skill"("staff_account_id", "skill_key");

-- CreateIndex
CREATE UNIQUE INDEX "staff_skill_entry_staff_account_id_entry_index_key" ON "staff_skill_entry"("staff_account_id", "entry_index");

-- CreateIndex
CREATE INDEX "staff_skill_entry_file_staff_skill_entry_id_idx" ON "staff_skill_entry_file"("staff_skill_entry_id");

-- AddForeignKey
ALTER TABLE "staff_independent_skill" ADD CONSTRAINT "staff_independent_skill_staff_account_id_fkey" FOREIGN KEY ("staff_account_id") REFERENCES "staff_account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_skill_entry" ADD CONSTRAINT "staff_skill_entry_staff_account_id_fkey" FOREIGN KEY ("staff_account_id") REFERENCES "staff_account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_skill_entry_file" ADD CONSTRAINT "staff_skill_entry_file_staff_skill_entry_id_fkey" FOREIGN KEY ("staff_skill_entry_id") REFERENCES "staff_skill_entry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_skill_entry_file" ADD CONSTRAINT "staff_skill_entry_file_file_asset_id_fkey" FOREIGN KEY ("file_asset_id") REFERENCES "file_asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;
