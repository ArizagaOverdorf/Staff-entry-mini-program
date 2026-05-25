-- CreateTable
CREATE TABLE "admin_user" (
    "id" UUID NOT NULL,
    "username" VARCHAR(64) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "real_name" VARCHAR(64),
    "phone" VARCHAR(32),
    "email" VARCHAR(128),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_super" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "admin_user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_role" (
    "id" UUID NOT NULL,
    "name" VARCHAR(64) NOT NULL,
    "code" VARCHAR(64) NOT NULL,
    "description" VARCHAR(255),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_permission" (
    "id" UUID NOT NULL,
    "name" VARCHAR(64) NOT NULL,
    "code" VARCHAR(128) NOT NULL,
    "description" VARCHAR(255),
    "parent_id" UUID,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_user_role" (
    "id" UUID NOT NULL,
    "admin_user_id" UUID NOT NULL,
    "admin_role_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_user_role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_role_permission" (
    "id" UUID NOT NULL,
    "admin_role_id" UUID NOT NULL,
    "admin_permission_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_role_permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_account" (
    "id" UUID NOT NULL,
    "staff_id" VARCHAR(32) NOT NULL,
    "openid" VARCHAR(64),
    "unionid" VARCHAR(64),
    "phone_encrypted" VARCHAR(255),
    "phone_masked" VARCHAR(20),
    "wechat_nickname" VARCHAR(128),
    "wechat_avatar" VARCHAR(512),
    "privacy_agreed" BOOLEAN NOT NULL DEFAULT false,
    "privacy_agreed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "staff_account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_profile" (
    "id" UUID NOT NULL,
    "staff_account_id" UUID NOT NULL,
    "staff_id" VARCHAR(32) NOT NULL,
    "real_name_encrypted" VARCHAR(255),
    "real_name_masked" VARCHAR(32),
    "id_number_encrypted" VARCHAR(255),
    "id_number_masked" VARCHAR(32),
    "gender" SMALLINT,
    "birthday" DATE,
    "avatar_url" VARCHAR(512),
    "address" VARCHAR(255),
    "emergency_contact_name" VARCHAR(64),
    "emergency_contact_phone" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "staff_profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_skill" (
    "id" UUID NOT NULL,
    "staff_account_id" UUID NOT NULL,
    "category_id" VARCHAR(64) NOT NULL,
    "category_name" VARCHAR(128) NOT NULL,
    "skill_level" SMALLINT,
    "description" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "staff_skill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_service_area" (
    "id" UUID NOT NULL,
    "staff_account_id" UUID NOT NULL,
    "province" VARCHAR(32) NOT NULL,
    "city" VARCHAR(32) NOT NULL,
    "district" VARCHAR(32),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "staff_service_area_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_credential" (
    "id" UUID NOT NULL,
    "staff_account_id" UUID NOT NULL,
    "credential_type" VARCHAR(32) NOT NULL,
    "credential_name" VARCHAR(128) NOT NULL,
    "credential_number" VARCHAR(128),
    "issuing_authority" VARCHAR(128),
    "issue_date" DATE,
    "expiry_date" DATE,
    "credential_status" VARCHAR(32) NOT NULL DEFAULT 'pending',
    "credential_badge" VARCHAR(32),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "staff_credential_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_credential_file" (
    "id" UUID NOT NULL,
    "staff_credential_id" UUID NOT NULL,
    "file_asset_id" UUID NOT NULL,
    "file_type" VARCHAR(32) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "staff_credential_file_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_intake_status" (
    "id" UUID NOT NULL,
    "staff_account_id" UUID NOT NULL,
    "intake_status" VARCHAR(32) NOT NULL DEFAULT 'draft',
    "submitted_at" TIMESTAMP(3),
    "reviewed_at" TIMESTAMP(3),
    "review_remark" VARCHAR(500),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "staff_intake_status_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_record" (
    "id" UUID NOT NULL,
    "staff_account_id" UUID NOT NULL,
    "admin_user_id" UUID NOT NULL,
    "action" VARCHAR(32) NOT NULL,
    "remark" VARCHAR(500),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_record_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_listing_status" (
    "id" UUID NOT NULL,
    "staff_account_id" UUID NOT NULL,
    "listing_status" VARCHAR(32) NOT NULL DEFAULT 'offline',
    "is_available" BOOLEAN NOT NULL DEFAULT false,
    "pause_reason" VARCHAR(255),
    "paused_at" TIMESTAMP(3),
    "resumed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "staff_listing_status_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_listing_status_log" (
    "id" UUID NOT NULL,
    "listing_status_id" UUID,
    "staff_account_id" UUID NOT NULL,
    "operator_id" UUID NOT NULL,
    "old_status" VARCHAR(32),
    "new_status" VARCHAR(32) NOT NULL,
    "old_is_available" BOOLEAN,
    "new_is_available" BOOLEAN NOT NULL,
    "reason" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "staff_listing_status_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_service_record" (
    "id" UUID NOT NULL,
    "staff_account_id" UUID NOT NULL,
    "service_date" DATE,
    "external_order_no" VARCHAR(64),
    "service_project" VARCHAR(128),
    "service_duration_minutes" INTEGER,
    "customer_name" VARCHAR(64),
    "service_description" VARCHAR(500),
    "rating" SMALLINT,
    "is_disputed" BOOLEAN NOT NULL DEFAULT false,
    "dispute_result" VARCHAR(32),
    "dispute_remark" VARCHAR(500),
    "record_source" VARCHAR(32) NOT NULL DEFAULT 'manual',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "staff_service_record_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_service_record_log" (
    "id" UUID NOT NULL,
    "staff_service_record_id" UUID NOT NULL,
    "staff_account_id" UUID NOT NULL,
    "operator_id" UUID NOT NULL,
    "field_name" VARCHAR(64) NOT NULL,
    "old_value" VARCHAR(500),
    "new_value" VARCHAR(500),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "staff_service_record_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message" (
    "id" UUID NOT NULL,
    "staff_account_id" UUID NOT NULL,
    "title" VARCHAR(128) NOT NULL,
    "content" TEXT,
    "message_type" VARCHAR(32) NOT NULL DEFAULT 'system',
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "operation_log" (
    "id" UUID NOT NULL,
    "operator_id" UUID NOT NULL,
    "operator_type" VARCHAR(32) NOT NULL DEFAULT 'admin',
    "target_type" VARCHAR(64) NOT NULL,
    "target_id" VARCHAR(64) NOT NULL,
    "action" VARCHAR(64) NOT NULL,
    "detail" TEXT,
    "ip_address" VARCHAR(64),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "operation_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "external_event_log" (
    "id" UUID NOT NULL,
    "event_type" VARCHAR(64) NOT NULL,
    "event_source" VARCHAR(64) NOT NULL,
    "payload" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "external_event_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "file_asset" (
    "id" UUID NOT NULL,
    "original_name" VARCHAR(255) NOT NULL,
    "stored_name" VARCHAR(255) NOT NULL,
    "mime_type" VARCHAR(128) NOT NULL,
    "size" BIGINT NOT NULL,
    "storage_provider" VARCHAR(32) NOT NULL DEFAULT 'local',
    "storage_path" VARCHAR(512) NOT NULL,
    "access_level" VARCHAR(32) NOT NULL DEFAULT 'private',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "file_asset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dict_item" (
    "id" UUID NOT NULL,
    "dict_group" VARCHAR(64) NOT NULL,
    "dict_key" VARCHAR(64) NOT NULL,
    "dict_value" VARCHAR(128) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "remark" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dict_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_config" (
    "id" UUID NOT NULL,
    "config_key" VARCHAR(128) NOT NULL,
    "config_value" TEXT NOT NULL,
    "config_type" VARCHAR(32) NOT NULL DEFAULT 'string',
    "description" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_config_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "admin_user_username_key" ON "admin_user"("username");

-- CreateIndex
CREATE UNIQUE INDEX "admin_role_code_key" ON "admin_role"("code");

-- CreateIndex
CREATE UNIQUE INDEX "admin_permission_code_key" ON "admin_permission"("code");

-- CreateIndex
CREATE UNIQUE INDEX "admin_user_role_admin_user_id_admin_role_id_key" ON "admin_user_role"("admin_user_id", "admin_role_id");

-- CreateIndex
CREATE UNIQUE INDEX "admin_role_permission_admin_role_id_admin_permission_id_key" ON "admin_role_permission"("admin_role_id", "admin_permission_id");

-- CreateIndex
CREATE UNIQUE INDEX "staff_account_staff_id_key" ON "staff_account"("staff_id");

-- CreateIndex
CREATE UNIQUE INDEX "staff_account_openid_key" ON "staff_account"("openid");

-- CreateIndex
CREATE INDEX "staff_account_openid_idx" ON "staff_account"("openid");

-- CreateIndex
CREATE INDEX "staff_account_phone_masked_idx" ON "staff_account"("phone_masked");

-- CreateIndex
CREATE UNIQUE INDEX "staff_profile_staff_account_id_key" ON "staff_profile"("staff_account_id");

-- CreateIndex
CREATE INDEX "staff_profile_staff_id_idx" ON "staff_profile"("staff_id");

-- CreateIndex
CREATE INDEX "staff_skill_staff_account_id_idx" ON "staff_skill"("staff_account_id");

-- CreateIndex
CREATE INDEX "staff_service_area_staff_account_id_idx" ON "staff_service_area"("staff_account_id");

-- CreateIndex
CREATE INDEX "staff_credential_staff_account_id_idx" ON "staff_credential"("staff_account_id");

-- CreateIndex
CREATE INDEX "staff_credential_credential_status_idx" ON "staff_credential"("credential_status");

-- CreateIndex
CREATE INDEX "staff_credential_expiry_date_idx" ON "staff_credential"("expiry_date");

-- CreateIndex
CREATE INDEX "staff_credential_file_staff_credential_id_idx" ON "staff_credential_file"("staff_credential_id");

-- CreateIndex
CREATE UNIQUE INDEX "staff_intake_status_staff_account_id_key" ON "staff_intake_status"("staff_account_id");

-- CreateIndex
CREATE INDEX "staff_intake_status_intake_status_idx" ON "staff_intake_status"("intake_status");

-- CreateIndex
CREATE INDEX "audit_record_staff_account_id_idx" ON "audit_record"("staff_account_id");

-- CreateIndex
CREATE INDEX "audit_record_admin_user_id_idx" ON "audit_record"("admin_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "staff_listing_status_staff_account_id_key" ON "staff_listing_status"("staff_account_id");

-- CreateIndex
CREATE INDEX "staff_listing_status_listing_status_idx" ON "staff_listing_status"("listing_status");

-- CreateIndex
CREATE INDEX "staff_listing_status_is_available_idx" ON "staff_listing_status"("is_available");

-- CreateIndex
CREATE INDEX "staff_listing_status_log_listing_status_id_idx" ON "staff_listing_status_log"("listing_status_id");

-- CreateIndex
CREATE INDEX "staff_listing_status_log_staff_account_id_idx" ON "staff_listing_status_log"("staff_account_id");

-- CreateIndex
CREATE INDEX "staff_service_record_staff_account_id_idx" ON "staff_service_record"("staff_account_id");

-- CreateIndex
CREATE INDEX "staff_service_record_service_date_idx" ON "staff_service_record"("service_date");

-- CreateIndex
CREATE INDEX "staff_service_record_external_order_no_idx" ON "staff_service_record"("external_order_no");

-- CreateIndex
CREATE INDEX "staff_service_record_is_disputed_idx" ON "staff_service_record"("is_disputed");

-- CreateIndex
CREATE INDEX "staff_service_record_log_staff_service_record_id_idx" ON "staff_service_record_log"("staff_service_record_id");

-- CreateIndex
CREATE INDEX "message_staff_account_id_is_read_idx" ON "message"("staff_account_id", "is_read");

-- CreateIndex
CREATE INDEX "operation_log_operator_id_idx" ON "operation_log"("operator_id");

-- CreateIndex
CREATE INDEX "operation_log_target_type_target_id_idx" ON "operation_log"("target_type", "target_id");

-- CreateIndex
CREATE INDEX "operation_log_created_at_idx" ON "operation_log"("created_at");

-- CreateIndex
CREATE INDEX "external_event_log_event_type_idx" ON "external_event_log"("event_type");

-- CreateIndex
CREATE INDEX "external_event_log_created_at_idx" ON "external_event_log"("created_at");

-- CreateIndex
CREATE INDEX "dict_item_dict_group_idx" ON "dict_item"("dict_group");

-- CreateIndex
CREATE UNIQUE INDEX "dict_item_dict_group_dict_key_key" ON "dict_item"("dict_group", "dict_key");

-- CreateIndex
CREATE UNIQUE INDEX "app_config_config_key_key" ON "app_config"("config_key");

-- AddForeignKey
ALTER TABLE "admin_permission" ADD CONSTRAINT "admin_permission_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "admin_permission"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_user_role" ADD CONSTRAINT "admin_user_role_admin_user_id_fkey" FOREIGN KEY ("admin_user_id") REFERENCES "admin_user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_user_role" ADD CONSTRAINT "admin_user_role_admin_role_id_fkey" FOREIGN KEY ("admin_role_id") REFERENCES "admin_role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_role_permission" ADD CONSTRAINT "admin_role_permission_admin_role_id_fkey" FOREIGN KEY ("admin_role_id") REFERENCES "admin_role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_role_permission" ADD CONSTRAINT "admin_role_permission_admin_permission_id_fkey" FOREIGN KEY ("admin_permission_id") REFERENCES "admin_permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_profile" ADD CONSTRAINT "staff_profile_staff_account_id_fkey" FOREIGN KEY ("staff_account_id") REFERENCES "staff_account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_skill" ADD CONSTRAINT "staff_skill_staff_account_id_fkey" FOREIGN KEY ("staff_account_id") REFERENCES "staff_account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_service_area" ADD CONSTRAINT "staff_service_area_staff_account_id_fkey" FOREIGN KEY ("staff_account_id") REFERENCES "staff_account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_credential" ADD CONSTRAINT "staff_credential_staff_account_id_fkey" FOREIGN KEY ("staff_account_id") REFERENCES "staff_account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_credential_file" ADD CONSTRAINT "staff_credential_file_staff_credential_id_fkey" FOREIGN KEY ("staff_credential_id") REFERENCES "staff_credential"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_credential_file" ADD CONSTRAINT "staff_credential_file_file_asset_id_fkey" FOREIGN KEY ("file_asset_id") REFERENCES "file_asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_intake_status" ADD CONSTRAINT "staff_intake_status_staff_account_id_fkey" FOREIGN KEY ("staff_account_id") REFERENCES "staff_account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_record" ADD CONSTRAINT "audit_record_staff_account_id_fkey" FOREIGN KEY ("staff_account_id") REFERENCES "staff_account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_record" ADD CONSTRAINT "audit_record_admin_user_id_fkey" FOREIGN KEY ("admin_user_id") REFERENCES "admin_user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_listing_status" ADD CONSTRAINT "staff_listing_status_staff_account_id_fkey" FOREIGN KEY ("staff_account_id") REFERENCES "staff_account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_listing_status_log" ADD CONSTRAINT "staff_listing_status_log_listing_status_id_fkey" FOREIGN KEY ("listing_status_id") REFERENCES "staff_listing_status"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_listing_status_log" ADD CONSTRAINT "staff_listing_status_log_staff_account_id_fkey" FOREIGN KEY ("staff_account_id") REFERENCES "staff_account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_listing_status_log" ADD CONSTRAINT "staff_listing_status_log_operator_id_fkey" FOREIGN KEY ("operator_id") REFERENCES "admin_user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_service_record" ADD CONSTRAINT "staff_service_record_staff_account_id_fkey" FOREIGN KEY ("staff_account_id") REFERENCES "staff_account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_service_record_log" ADD CONSTRAINT "staff_service_record_log_staff_service_record_id_fkey" FOREIGN KEY ("staff_service_record_id") REFERENCES "staff_service_record"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_service_record_log" ADD CONSTRAINT "staff_service_record_log_staff_account_id_fkey" FOREIGN KEY ("staff_account_id") REFERENCES "staff_account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_service_record_log" ADD CONSTRAINT "staff_service_record_log_operator_id_fkey" FOREIGN KEY ("operator_id") REFERENCES "admin_user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message" ADD CONSTRAINT "message_staff_account_id_fkey" FOREIGN KEY ("staff_account_id") REFERENCES "staff_account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "operation_log" ADD CONSTRAINT "operation_log_operator_id_fkey" FOREIGN KEY ("operator_id") REFERENCES "admin_user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
