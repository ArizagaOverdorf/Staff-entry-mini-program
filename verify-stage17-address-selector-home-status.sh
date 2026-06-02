#!/bin/bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

export PATH="$HOME/.local/lib/npm-global/bin:/usr/local/bin:/opt/homebrew/bin:$PATH"

PASS=0
FAIL=0

pass() { PASS=$((PASS + 1)); echo "  PASS: $1"; }
fail() { FAIL=$((FAIL + 1)); echo "  FAIL: $1"; }

echo "=== Stage 17 Verification: Address Selector And Home Status Cards ==="

echo "--- Miniapp Syntax ---"
find apps/miniapp -name "*.js" -exec node --check {} \; && pass "Miniapp JS syntax valid" || fail "Miniapp JS syntax invalid"
find apps/miniapp -name "*.json" -exec sh -c 'for f; do node -e "JSON.parse(require(\"fs\").readFileSync(\"$f\",\"utf8\"))" || exit 1; done' _ {} + && pass "Miniapp JSON valid" || fail "Miniapp JSON invalid"

echo "--- Profile Address Selector ---"
PROFILE_JS="apps/miniapp/pages/profile/edit/index.js"
PROFILE_WXML="apps/miniapp/pages/profile/edit/index.wxml"
PROFILE_WXSS="apps/miniapp/pages/profile/edit/index.wxss"
grep -q "ADDRESS_REGION_OPTIONS" "$PROFILE_JS" && pass "Address region option list exists" || fail "Address region option list missing"
grep -q "国内" "$PROFILE_JS" && grep -q "国外" "$PROFILE_JS" && grep -q "港澳" "$PROFILE_JS" && pass "Address list includes 国内/国外/港澳" || fail "Address list missing 国内/国外/港澳"
grep -q "台湾省" "$PROFILE_JS" && pass "Address list includes 台湾省" || fail "Address list missing 台湾省"
grep -q "addressSelectorVisible" "$PROFILE_JS" && pass "Address selector state exists" || fail "Address selector state missing"
grep -q "onAddressRegionSelect" "$PROFILE_JS" && grep -q "onAddressCitySelect" "$PROFILE_JS" && pass "Address selector handlers exist" || fail "Address selector handlers missing"
grep -q "scheduleAutoSave" "$PROFILE_JS" && pass "Address selection can trigger autosave" || fail "Address autosave marker missing"
grep -q "address-panel" "$PROFILE_WXML" && grep -q "address-columns" "$PROFILE_WXML" && pass "Address selector panel renders two columns" || fail "Address selector panel/two columns missing"
grep -q "address-picker-value" "$PROFILE_WXML" && pass "Address input replaced by picker value" || fail "Address picker value missing"
if grep -q "bindinput=\"onAddressInput\"" "$PROFILE_WXML"; then
  fail "Old free-text address input remains"
else
  pass "Old free-text address input removed"
fi
grep -q "address-region-column" "$PROFILE_WXSS" && grep -q "address-city-column" "$PROFILE_WXSS" && pass "Address selector columns styled" || fail "Address selector column styles missing"

echo "--- Home Status Cards ---"
HOME_WXML="apps/miniapp/pages/home/index.wxml"
HOME_WXSS="apps/miniapp/pages/home/index.wxss"
grep -q "入驻状态" "$HOME_WXML" && grep -q "上线状态" "$HOME_WXML" && pass "Home keeps two status cards" || fail "Home status cards missing"
grep -q "查看进度" "$HOME_WXML" && grep -q "onlineNextAction" "$HOME_WXML" && pass "Home keeps status card actions" || fail "Home status card actions missing"
if grep -q "mgmt-status-bar\\|managementStatusLabel" "$HOME_WXML"; then
  fail "Home still renders management status bar"
else
  pass "Home management status bar removed"
fi
grep -q "font-size: 20px" "$HOME_WXSS" && pass "Home status value font enlarged" || fail "Home status value font not enlarged"
grep -q "font-size: 14px" "$HOME_WXSS" && pass "Home status label font enlarged" || fail "Home status label font not enlarged"
grep -q "font-size: 13px" "$HOME_WXSS" && pass "Home status action font enlarged" || fail "Home status action font not enlarged"
grep -q "online-status-card {{onlineStatusClass}}" "$HOME_WXML" && pass "Online status card has dynamic status class" || fail "Online status card dynamic class missing"
grep -q "online-status-card.warning" "$HOME_WXSS" && pass "Offline/resting online card has orange background" || fail "Orange resting status background missing"
if grep -q "mgmt-status-bar\\|mgmt-status-text" "$HOME_WXSS"; then
  fail "Home management status styles remain"
else
  pass "Home management status styles removed"
fi

echo "--- Diff Hygiene ---"
git diff --check && pass "git diff --check passed" || fail "git diff --check failed"

echo ""
echo "=== Stage 17 Verification Complete ==="
echo "  Passed: $PASS"
echo "  Failed: $FAIL"

if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
