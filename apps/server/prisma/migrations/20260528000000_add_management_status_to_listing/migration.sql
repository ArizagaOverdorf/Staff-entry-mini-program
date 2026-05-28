ALTER TABLE "staff_listing_status"
  ADD COLUMN "management_status" VARCHAR(32) NOT NULL DEFAULT 'normal',
  ADD COLUMN "management_reason" VARCHAR(500),
  ADD COLUMN "management_updated_at" TIMESTAMPTZ,
  ADD COLUMN "management_updated_by" VARCHAR(64);

CREATE INDEX "staff_listing_status_management_status_idx" ON "staff_listing_status"("management_status");
