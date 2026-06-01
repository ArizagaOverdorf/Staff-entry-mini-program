#!/bin/bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

export PATH="$HOME/.local/lib/npm-global/bin:/usr/local/bin:/opt/homebrew/bin:$PATH"

PASS=0
FAIL=0

pass() { PASS=$((PASS + 1)); echo "  PASS: $1"; }
fail() { FAIL=$((FAIL + 1)); echo "  FAIL: $1"; }

echo "=== Stage 12 Verification: Login, Autosave, Required Images ==="

echo "--- Build Checks ---"
pnpm --filter @staff-entry/server build >/tmp/stage12-server-build.log 2>&1 && pass "Server build passed" || { cat /tmp/stage12-server-build.log; fail "Server build failed"; }
pnpm --filter @staff-entry/admin build >/tmp/stage12-admin-build.log 2>&1 && pass "Admin build passed" || { cat /tmp/stage12-admin-build.log; fail "Admin build failed"; }
find apps/miniapp -name "*.json" -exec sh -c 'for f; do node -e "JSON.parse(require(\"fs\").readFileSync(\"$f\",\"utf8\"))" || exit 1; done' _ {} + && pass "Miniapp JSON valid" || fail "Miniapp JSON invalid"
find apps/miniapp -name "*.js" -exec node --check {} \; && pass "Miniapp JS valid" || fail "Miniapp JS invalid"

AUTH_WXML="apps/miniapp/pages/auth/index.wxml"
AUTH_JS="apps/miniapp/pages/auth/index.js"
PROFILE_WXML="apps/miniapp/pages/profile/edit/index.wxml"
PROFILE_JS="apps/miniapp/pages/profile/edit/index.js"
CRED_EDIT_JS="apps/miniapp/pages/credential/edit/index.js"
CRED_SERVICE="apps/server/src/modules/credential/credential.service.ts"
INTAKE_SERVICE="apps/server/src/modules/intake/intake.service.ts"
ADMIN_SERVICE="apps/server/src/modules/admin/admin-staff.service.ts"

echo "--- Login Page ---"
! grep -q "微信一键登录" "$AUTH_WXML" && pass "No visible WeChat one-tap login" || fail "Still shows WeChat one-tap login"
grep -q "请输入手机号" "$AUTH_WXML" && pass "Phone input on login page" || fail "Phone input missing"
grep -q "请输入验证码" "$AUTH_WXML" && pass "SMS code input on login page" || fail "SMS code input missing"
grep -q "登录即表示您同意" "$AUTH_WXML" && pass "Agreement copy present" || fail "Agreement copy missing"
grep -q "bindtap=\"handlePhoneLogin\"" "$AUTH_WXML" && pass "Login button uses phone login" || fail "Login button not bound to phone login"
grep -q "PHONE_BIND" "$AUTH_JS" && grep -q "PRIVACY_CONFIRM" "$AUTH_JS" && pass "Phone login binds phone and confirms privacy" || fail "Phone login flow incomplete"
! grep -q "handleWechatLogin" "$AUTH_JS" && pass "Old handleWechatLogin removed" || fail "Old handleWechatLogin remains"

echo "--- Profile Autosave ---"
! grep -q "保存资料" "$PROFILE_WXML" && pass "Profile bottom save button removed" || fail "Profile still shows save button"
grep -q "提交审核" "$PROFILE_WXML" && pass "Profile submit button remains" || fail "Profile submit button missing"
grep -q "autoSaveStatus" "$PROFILE_WXML" && pass "Autosave status visible" || fail "Autosave status missing"
grep -q "bindblur=\"onProfileFieldBlur\"" "$PROFILE_WXML" && pass "Text fields autosave on blur" || fail "Text field blur autosave missing"
grep -q "scheduleAutoSave" "$PROFILE_JS" && grep -q "saveProfileSilently" "$PROFILE_JS" && pass "Profile autosave functions present" || fail "Profile autosave functions missing"
! grep -q "handleSave()" "$PROFILE_JS" && pass "Manual profile save handler removed" || fail "Manual profile save handler remains"

echo "--- Required Credential Images ---"
for type in health_cert no_crime_cert credit_report medical_report; do
  grep -q "$type" "$CRED_EDIT_JS" && pass "Miniapp requires image marker for $type" || fail "Miniapp missing required image marker for $type"
  grep -q "$type" "$CRED_SERVICE" && pass "Server requires image marker for $type" || fail "Server missing required image marker for $type"
done
grep -q "validateRequiredCredentialImage" "$CRED_SERVICE" && pass "Server validates required credential images on save" || fail "Server required image save validation missing"
grep -q "需要上传证件图片" "$INTAKE_SERVICE" && pass "Intake submit/preview checks required images" || fail "Intake image checks missing"
grep -q "sideFiles.length === 0" "$ADMIN_SERVICE" && pass "Admin approval checks required images" || fail "Admin required image check missing"

echo ""
echo "=== Stage 12 Verification Complete ==="
echo "  Passed: $PASS"
echo "  Failed: $FAIL"

if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
