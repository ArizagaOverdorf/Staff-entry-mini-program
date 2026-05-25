-- AlterTable
ALTER TABLE "dict_item" ADD COLUMN     "parent_id" UUID;

-- CreateIndex
CREATE INDEX "dict_item_parent_id_idx" ON "dict_item"("parent_id");

-- AddForeignKey
ALTER TABLE "dict_item" ADD CONSTRAINT "dict_item_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "dict_item"("id") ON DELETE SET NULL ON UPDATE CASCADE;
