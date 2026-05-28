ALTER TABLE "staff_profile"
ADD COLUMN "identity_verified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "identity_verify_provider" VARCHAR(32),
ADD COLUMN "identity_verified_at" TIMESTAMP(3);
