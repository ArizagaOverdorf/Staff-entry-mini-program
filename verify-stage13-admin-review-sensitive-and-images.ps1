$ErrorActionPreference = 'Stop'

$ROOT = Split-Path -Parent $MyInvocation.MyCommand.Path
Push-Location $ROOT

$PASS = 0
$FAIL = 0

function pass($msg) { $global:PASS++; Write-Host "  PASS: $msg" }
function fail($msg) { $global:FAIL++; Write-Host "  FAIL: $msg" }

Write-Host "=== Stage 13 Verification: Admin Review Sensitive Data And Credential Images ==="

Write-Host "--- Build Checks ---"
$result = pnpm --filter @staff-entry/server build 2>&1
if ($LASTEXITCODE -eq 0) { pass "Server build passed" } else { $result | ForEach-Object { Write-Host $_ }; fail "Server build failed" }

$result = pnpm --filter @staff-entry/admin build 2>&1
if ($LASTEXITCODE -eq 0) { pass "Admin build passed" } else { $result | ForEach-Object { Write-Host $_ }; fail "Admin build failed" }

Write-Host "--- Prisma Schema Validation ---"
$result = pnpm --filter @staff-entry/server exec prisma validate --schema prisma/schema.prisma 2>&1
if ($LASTEXITCODE -eq 0) { pass "Prisma schema validates" } else { $result | ForEach-Object { Write-Host $_ }; fail "Prisma schema validation failed" }

$SEED_FILE = "apps/server/prisma/seed-admin.js"
$ADMIN_SERVICE = "apps/server/src/modules/admin/admin-staff.service.ts"
$ADMIN_CONTROLLER = "apps/server/src/modules/admin/admin-staff.controller.ts"
$PROFILE_CARD = "apps/admin/src/pages/staff/components/StaffProfileCard.tsx"
$CRED_LIST = "apps/admin/src/pages/staff/components/CredentialReviewList.tsx"
$AUTH_IMAGE = "apps/admin/src/pages/staff/components/AuthImage.tsx"
$STAFF_SERVICE = "apps/admin/src/pages/staff/services/staff.ts"

Write-Host "--- Sensitive Data Permission Seed ---"
if (Select-String -Path $SEED_FILE -Pattern "staff.sensitive.view" -Quiet) { pass "staff.sensitive.view permission in seed" } else { fail "staff.sensitive.view permission missing from seed" }
if (Select-String -Path $SEED_FILE -Pattern "super_admin: PERMISSIONS.map" -Quiet) { pass "super_admin keeps all permissions" } else { fail "super_admin all-permission seed missing" }
if (Select-String -Path $SEED_FILE -Pattern "admin: .*staff\.sensitive\.view" -Quiet) { fail "ordinary admin role should not receive staff.sensitive.view by default" } else { pass "ordinary admin role does not receive staff.sensitive.view by default" }

Write-Host "--- Sensitive Data Access Control (Server) ---"
if (Select-String -Path $ADMIN_SERVICE -Pattern "isSuper" -Quiet) { pass "detail() checks isSuper" } else { fail "detail() missing isSuper check" }
if (Select-String -Path $ADMIN_SERVICE -Pattern "staff.sensitive.view" -Quiet) { pass "detail() checks staff.sensitive.view permission" } else { fail "detail() missing staff.sensitive.view check" }
if (Select-String -Path $ADMIN_SERVICE -Pattern "decrypt" -Quiet) { pass "detail() decrypts sensitive data" } else { fail "detail() missing decrypt logic" }
if (Select-String -Path $ADMIN_SERVICE -Pattern "staff_sensitive_view" -Quiet) { pass "detail() writes operation log for sensitive view" } else { fail "detail() missing operation log for sensitive view" }
if (Select-String -Path $ADMIN_SERVICE -Pattern "canViewSensitive" -Quiet) { pass "detail() returns canViewSensitive flag" } else { fail "detail() missing canViewSensitive flag" }
if (Select-String -Path $ADMIN_CONTROLLER -Pattern "CurrentAdmin" -Quiet) { pass "controller passes admin context to detail()" } else { fail "controller missing admin context" }

Write-Host "--- StaffProfileCard Sensitive Display ---"
if (Select-String -Path $PROFILE_CARD -Pattern "canViewSensitive" -Quiet) { pass "StaffProfileCard checks canViewSensitive" } else { fail "StaffProfileCard missing canViewSensitive check" }

Write-Host "--- Credential Title Dedup ---"
if (Select-String -Path $CRED_LIST -Pattern "credentialName !== typeLabel" -Quiet) { pass "Credential title prevents duplicate label-name" } else { fail "Credential title missing dedup logic" }

Write-Host "--- Credential Images Inline Display ---"
if (Select-String -Path $CRED_LIST -Pattern "Image.PreviewGroup" -Quiet) { pass "CredentialReviewList uses Image.PreviewGroup" } else { fail "CredentialReviewList missing Image.PreviewGroup" }
if (Select-String -Path $CRED_LIST -Pattern "AuthImage" -Quiet) { pass "CredentialReviewList uses AuthImage component" } else { fail "CredentialReviewList missing AuthImage" }
if (Select-String -Path $AUTH_IMAGE -Pattern "URL.revokeObjectURL" -Quiet) { pass "AuthImage revokes blob URLs" } else { fail "AuthImage missing blob URL cleanup" }
if (-not (Select-String -Path $CRED_LIST -Pattern "window\.open" -Quiet)) { pass "CredentialReviewList no longer uses window.open" } else { fail "CredentialReviewList still uses window.open" }

Write-Host "--- Admin Credentials Endpoint Current-Only ---"
if (Select-String -Path $ADMIN_SERVICE -Pattern "isCurrent: true" -Quiet) { pass "credentials() filters by isCurrent: true" } else { fail "credentials() missing isCurrent filter" }
if (Select-String -Path $ADMIN_SERVICE -Pattern "fileSideLabels" -Quiet) { pass "credentials() uses fileSideLabels" } else { fail "credentials() missing fileSideLabels" }

Write-Host "--- Intake Approval ---"
if (Select-String -Path $ADMIN_SERVICE -Pattern "loadCredentialFiles" -Quiet) { pass "approveIntake validates file presence per credential" } else { fail "approveIntake missing file validation" }

Write-Host "--- StaffRecord Interface ---"
if (Select-String -Path $STAFF_SERVICE -Pattern "canViewSensitive" -Quiet) { pass "StaffRecord has canViewSensitive" } else { fail "StaffRecord missing canViewSensitive" }
if (Select-String -Path $STAFF_SERVICE -Pattern "fileSide" -Quiet) { pass "CredentialFileRecord has fileSide" } else { fail "CredentialFileRecord missing fileSide" }

Write-Host ""
Write-Host "=== Stage 13 Verification Complete ==="
Write-Host "  Passed: $PASS"
Write-Host "  Failed: $FAIL"

Pop-Location

if ($FAIL -gt 0) { exit 1 }
