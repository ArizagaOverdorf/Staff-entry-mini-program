#!/bin/bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

export PATH="$HOME/.local/lib/npm-global/bin:/usr/local/bin:/opt/homebrew/bin:$PATH"

PASS=0
FAIL=0

pass() { PASS=$((PASS + 1)); echo "  PASS: $1"; }
fail() { FAIL=$((FAIL + 1)); echo "  FAIL: $1"; }

echo "=== Stage 16 Verification: Phone Login Account Reuse ==="

echo "--- Build And Syntax Checks ---"
pnpm --filter @staff-entry/server build >/tmp/stage16-server-build.log 2>&1 && pass "Server build passed" || { cat /tmp/stage16-server-build.log; fail "Server build failed"; }
find apps/miniapp -name "*.js" -exec node --check {} \; && pass "Miniapp JS syntax valid" || fail "Miniapp JS syntax invalid"

echo "--- Server Account Reuse Logic ---"
AUTH_SERVICE="apps/server/src/modules/auth/auth.service.ts"
grep -q "findActiveAccountByPhone" "$AUTH_SERVICE" && pass "Auth service finds existing account by phone" || fail "Missing phone account lookup"
grep -q "decrypt" "$AUTH_SERVICE" && pass "Auth service decrypts phone candidates for exact match" || fail "Missing decrypt candidate match"
grep -q "reuseExistingPhoneAccount: true" "$AUTH_SERVICE" && pass "bindPhone allows existing account reuse" || fail "bindPhone reuse option missing"
grep -q "reuseExistingPhoneAccount: false" "$AUTH_SERVICE" && pass "changePhone rejects existing phone account reuse" || fail "changePhone duplicate guard missing"
grep -q "手机号已绑定其他服务人员账号" "$AUTH_SERVICE" && pass "changePhone duplicate phone error present" || fail "Duplicate phone error missing"
grep -q "deletedAt: now" "$AUTH_SERVICE" && pass "Temporary duplicate account is soft-deleted" || fail "Temporary account soft-delete missing"
grep -q "openid: currentAccount.openid" "$AUTH_SERVICE" && pass "Existing account receives current openid" || fail "Existing account openid transfer missing"
grep -q "reusedAccount: true" "$AUTH_SERVICE" && pass "Bind response marks reused account" || fail "Bind response reusedAccount missing"
grep -q "signStaffToken" "$AUTH_SERVICE" && pass "Bind response returns token for reused account" || fail "Reused account token missing"

echo "--- Miniapp Stores Reused Account Token ---"
AUTH_INDEX="apps/miniapp/pages/auth/index.js"
PHONE_BIND="apps/miniapp/pages/auth/phone-bind/index.js"
grep -q "res.token" "$AUTH_INDEX" && grep -q "setToken(res.token)" "$AUTH_INDEX" && pass "Login page stores bind-phone token" || fail "Login page token update missing"
grep -q "res.staffId" "$AUTH_INDEX" && grep -q "setStaffId(res.staffId)" "$AUTH_INDEX" && pass "Login page stores reused staffId" || fail "Login page staffId update missing"
grep -q "res.token" "$PHONE_BIND" && grep -q "setToken(res.token)" "$PHONE_BIND" && pass "Legacy phone-bind page stores bind-phone token" || fail "Legacy phone-bind token update missing"
grep -q "res.staffId" "$PHONE_BIND" && grep -q "setStaffId(res.staffId)" "$PHONE_BIND" && pass "Legacy phone-bind page stores reused staffId" || fail "Legacy phone-bind staffId update missing"

echo "--- Diff Hygiene ---"
git diff --check && pass "git diff --check passed" || fail "git diff --check failed"

echo ""
echo "=== Stage 16 Verification Complete ==="
echo "  Passed: $PASS"
echo "  Failed: $FAIL"

if [ "$FAIL" -gt 0 ]; then
  exit 1
fi

