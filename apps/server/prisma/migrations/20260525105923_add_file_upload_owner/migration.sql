-- AlterTable
ALTER TABLE "file_asset" ADD COLUMN     "uploaded_by_staff_account_id" UUID;

-- CreateIndex
CREATE INDEX "file_asset_uploaded_by_staff_account_id_idx" ON "file_asset"("uploaded_by_staff_account_id");

-- AddForeignKey
ALTER TABLE "file_asset" ADD CONSTRAINT "file_asset_uploaded_by_staff_account_id_fkey" FOREIGN KEY ("uploaded_by_staff_account_id") REFERENCES "staff_account"("id") ON DELETE SET NULL ON UPDATE CASCADE;
