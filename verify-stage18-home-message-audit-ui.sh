#!/bin/bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

export PATH="$HOME/.local/lib/npm-global/bin:/usr/local/bin:/opt/homebrew/bin:$PATH"

PASS=0
FAIL=0

pass() { PASS=$((PASS + 1)); echo "  PASS: $1"; }
fail() { FAIL=$((FAIL + 1)); echo "  FAIL: $1"; }

echo "=== Stage 18 Verification: Home Message Audit UI ==="

echo "--- Miniapp Syntax ---"
find apps/miniapp -name "*.js" -exec node --check {} \; && pass "Miniapp JS syntax valid" || fail "Miniapp JS syntax invalid"
find apps/miniapp -name "*.json" -exec sh -c 'for f; do node -e "JSON.parse(require(\"fs\").readFileSync(\"$f\",\"utf8\"))" || exit 1; done' _ {} + && pass "Miniapp JSON valid" || fail "Miniapp JSON invalid"

echo "--- Home Level And Credit Card ---"
HOME_WXML="apps/miniapp/pages/home/index.wxml"
HOME_WXSS="apps/miniapp/pages/home/index.wxss"
grep -q "status-card-metrics" "$HOME_WXML" && pass "Home metrics card exists" || fail "Home metrics card missing"
grep -q "等级" "$HOME_WXML" && grep -q "信用分" "$HOME_WXML" && pass "Home metrics include level and credit labels" || fail "Home metrics labels missing"
grep -q "status-metric-row" "$HOME_WXML" && pass "Home metrics use row layout" || fail "Home metrics row layout missing"
grep -q "status-metric-separator" "$HOME_WXML" && pass "Home metrics use explicit separator" || fail "Home metrics separator missing"
grep -q "status-card-metrics" "$HOME_WXSS" && grep -q "status-metric-row" "$HOME_WXSS" && pass "Home metrics styles exist" || fail "Home metrics styles missing"
if grep -q "等级称号" "$HOME_WXML"; then
  fail "Old level title remains"
else
  pass "Old level title removed"
fi
if grep -q "信用分：开发中" "$HOME_WXML"; then
  fail "Old credit hint layout remains"
else
  pass "Old credit hint layout removed"
fi

echo "--- Message Center Support Entry ---"
MESSAGE_WXML="apps/miniapp/pages/message/index.wxml"
MESSAGE_WXSS="apps/miniapp/pages/message/index.wxss"
if grep -q "联系客服 / 发送咨询\\|发送咨询\\|support-entry" "$MESSAGE_WXML"; then
  fail "Message center still renders contact support entry"
else
  pass "Message center contact support entry removed"
fi
if grep -q "support-entry" "$MESSAGE_WXSS"; then
  fail "Message center support entry styles remain"
else
  pass "Message center support entry styles removed"
fi

echo "--- Audit Status Banner ---"
AUDIT_WXML="apps/miniapp/pages/audit/status.wxml"
AUDIT_WXSS="apps/miniapp/pages/audit/status.wxss"
if grep -q "&#10003" "$AUDIT_WXML"; then
  fail "Approved banner checkmark entity remains"
else
  pass "Approved banner checkmark entity removed"
fi
grep -q "intakeStatus !== 'approved'" "$AUDIT_WXML" && pass "Approved status renders without banner icon" || fail "Approved status icon condition missing"
grep -q "font-size: 24px" "$AUDIT_WXSS" && pass "Approved/status title font enlarged" || fail "Status title font not enlarged"
grep -q "line-height: 32px" "$AUDIT_WXSS" && pass "Status title line-height enlarged" || fail "Status title line-height missing"

echo "--- Diff Hygiene ---"
git diff --check && pass "git diff --check passed" || fail "git diff --check failed"

echo ""
echo "=== Stage 18 Verification Complete ==="
echo "  Passed: $PASS"
echo "  Failed: $FAIL"

if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
