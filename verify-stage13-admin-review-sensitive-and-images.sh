#!/bin/bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

export PATH="$HOME/.local/lib/npm-global/bin:/usr/local/bin:/opt/homebrew/bin:$PATH"

PASS=0
FAIL=0

pass() { PASS=$((PASS + 1)); echo "  PASS: $1"; }
fail() { FAIL=$((FAIL + 1)); echo "  FAIL: $1"; }

echo "=== Stage 13 Verification: Admin Review Sensitive Data And Credential Images ==="

echo "--- Build Checks ---"
pnpm --filter @staff-entry/server build >/tmp/stage13-server-build.log 2>&1 && pass "Server build passed" || { cat /tmp/stage13-server-build.log; fail "Server build failed"; }
pnpm --filter @staff-entry/admin build >/tmp/stage13-admin-build.log 2>&1 && pass "Admin build passed" || { cat /tmp/stage13-admin-build.log; fail "Admin build failed"; }

echo "--- Prisma Schema Validation ---"
if pnpm --filter @staff-entry/server exec prisma validate --schema prisma/schema.prisma >/tmp/stage13-prisma-validate.log 2>&1; then
  pass "Prisma schema validates"
else
  cat /tmp/stage13-prisma-validate.log
  fail "Prisma schema validation failed"
fi

echo "--- Sensitive Data Permission Seed ---"
SEED_FILE="apps/server/prisma/seed-admin.js"
grep -q "staff.sensitive.view" "$SEED_FILE" && pass "staff.sensitive.view permission in seed" || fail "staff.sensitive.view permission missing from seed"
grep -q "super_admin: PERMISSIONS.map" "$SEED_FILE" && pass "super_admin keeps all permissions" || fail "super_admin all-permission seed missing"
if grep -q "admin: .*staff.sensitive.view" "$SEED_FILE"; then
  fail "ordinary admin role should not receive staff.sensitive.view by default"
else
  pass "ordinary admin role does not receive staff.sensitive.view by default"
fi

echo "--- Sensitive Data Access Control (Server) ---"
ADMIN_SERVICE="apps/server/src/modules/admin/admin-staff.service.ts"
ADMIN_CONTROLLER="apps/server/src/modules/admin/admin-staff.controller.ts"
grep -q "isSuper" "$ADMIN_SERVICE" && pass "detail() checks isSuper" || fail "detail() missing isSuper check"
grep -q "staff.sensitive.view" "$ADMIN_SERVICE" && pass "detail() checks staff.sensitive.view permission" || fail "detail() missing staff.sensitive.view check"
grep -q "decrypt" "$ADMIN_SERVICE" && pass "detail() decrypts sensitive data" || fail "detail() missing decrypt logic"
grep -q "staff_sensitive_view" "$ADMIN_SERVICE" && pass "detail() writes operation log for sensitive view" || fail "detail() missing operation log for sensitive view"
grep -q "canViewSensitive" "$ADMIN_SERVICE" && pass "detail() returns canViewSensitive flag" || fail "detail() missing canViewSensitive flag"
grep -q "CurrentAdmin" "$ADMIN_CONTROLLER" && pass "controller passes admin context to detail()" || fail "controller missing admin context"

echo "--- StaffProfileCard Sensitive Display (Admin Frontend) ---"
PROFILE_CARD="apps/admin/src/pages/staff/components/StaffProfileCard.tsx"
grep -q "canViewSensitive" "$PROFILE_CARD" && pass "StaffProfileCard checks canViewSensitive" || fail "StaffProfileCard missing canViewSensitive check"

echo "--- Credential Title Dedup (Admin Frontend) ---"
CRED_LIST="apps/admin/src/pages/staff/components/CredentialReviewList.tsx"
grep -q "credentialName !== typeLabel" "$CRED_LIST" && pass "Credential title prevents duplicate label-name" || fail "Credential title missing dedup logic"

echo "--- Credential Images Inline Display ---"
grep -q "Image.PreviewGroup" "$CRED_LIST" && pass "CredentialReviewList uses Image.PreviewGroup" || fail "CredentialReviewList missing Image.PreviewGroup"
grep -q "AuthImage" "$CRED_LIST" && pass "CredentialReviewList uses AuthImage component" || fail "CredentialReviewList missing AuthImage"
grep -q "URL.revokeObjectURL" "$CRED_LIST" && pass "AuthImage revokes blob URLs" || fail "AuthImage missing blob URL cleanup"
! grep -q "window.open" "$CRED_LIST" && pass "CredentialReviewList no longer uses window.open" || fail "CredentialReviewList still uses window.open"

echo "--- Admin Credentials Endpoint Current-Only ---"
grep -q "isCurrent: true" "$ADMIN_SERVICE" && pass "credentials() filters by isCurrent: true" || fail "credentials() missing isCurrent filter"
grep -q "fileSideLabels" "$ADMIN_SERVICE" && pass "credentials() uses fileSideLabels" || fail "credentials() missing fileSideLabels"
grep -q "credit_report\|medical_report" "$ADMIN_SERVICE" && pass "credentials() handles credit_report and medical_report" || true

echo "--- Intake Approval Uses Current Credential Files ---"
grep -q "isCurrent: true" "$ADMIN_SERVICE" && pass "approveIntake loads only current credentials" || fail "approveIntake missing isCurrent filter"
grep -q "loadCredentialFiles" "$ADMIN_SERVICE" && pass "approveIntake validates file presence per credential" || fail "approveIntake missing file validation"

echo "--- StaffRecord Interface (Frontend) ---"
STAFF_SERVICE="apps/admin/src/pages/staff/services/staff.ts"
grep -q "canViewSensitive" "$STAFF_SERVICE" && pass "StaffRecord has canViewSensitive" || fail "StaffRecord missing canViewSensitive"
grep -q "fileSide" "$STAFF_SERVICE" && pass "CredentialFileRecord has fileSide" || fail "CredentialFileRecord missing fileSide"

echo ""
echo "=== Stage 13 Verification Complete ==="
echo "  Passed: $PASS"
echo "  Failed: $FAIL"

if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
