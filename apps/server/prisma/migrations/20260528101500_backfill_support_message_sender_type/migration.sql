UPDATE "message"
SET "sender_type" = 'admin',
    "admin_read_at" = COALESCE("admin_read_at", "created_at")
WHERE "message_type" = 'support_reply'
  AND "sender_type" = 'staff';

UPDATE "message"
SET "sender_type" = 'system'
WHERE "message_type" NOT IN ('support_request', 'support_reply')
  AND "sender_type" = 'staff';
