ALTER TABLE "message"
  ADD COLUMN "admin_user_id" UUID,
  ADD COLUMN "sender_type" VARCHAR(32) NOT NULL DEFAULT 'staff',
  ADD COLUMN "admin_read_at" TIMESTAMPTZ;

ALTER TABLE "message"
  ADD CONSTRAINT "message_admin_user_id_fkey"
  FOREIGN KEY ("admin_user_id") REFERENCES "admin_user"("id")
  ON DELETE SET NULL;

CREATE INDEX "message_staff_account_id_sender_type_admin_read_at_idx"
  ON "message"("staff_account_id", "sender_type", "admin_read_at");
