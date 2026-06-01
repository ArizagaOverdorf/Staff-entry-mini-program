#!/bin/bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

export PATH="$HOME/.local/lib/npm-global/bin:/usr/local/bin:/opt/homebrew/bin:$PATH"

PASS=0
FAIL=0

pass() { PASS=$((PASS + 1)); echo "  PASS: $1"; }
fail() { FAIL=$((FAIL + 1)); echo "  FAIL: $1"; }

echo "=== Stage 14 Verification: Admin Age, Role Management, Message Read State ==="

echo "--- Build And Syntax Checks ---"
pnpm --filter @staff-entry/server build >/tmp/stage14-server-build.log 2>&1 && pass "Server build passed" || { cat /tmp/stage14-server-build.log; fail "Server build failed"; }
pnpm --filter @staff-entry/admin build >/tmp/stage14-admin-build.log 2>&1 && pass "Admin build passed" || { cat /tmp/stage14-admin-build.log; fail "Admin build failed"; }
find apps/miniapp -name "*.js" -exec node --check {} \; && pass "Miniapp JS syntax valid" || fail "Miniapp JS syntax invalid"

echo "--- Admin Age From ID Card/Birthday ---"
ADMIN_STAFF_SERVICE="apps/server/src/modules/admin/admin-staff.service.ts"
STAFF_PROFILE_CARD="apps/admin/src/pages/staff/components/StaffProfileCard.tsx"
grep -q "parseIdCardBirthday" "$ADMIN_STAFF_SERVICE" && pass "Admin staff service can derive birthday from ID card" || fail "Admin staff service missing parseIdCardBirthday"
grep -q "age:" "$ADMIN_STAFF_SERVICE" && pass "Admin detail returns age" || fail "Admin detail missing age response field"
grep -q "birthday" "$ADMIN_STAFF_SERVICE" && pass "Admin age logic uses birthday source" || fail "Admin age logic missing birthday source"
grep -q "staff.age" "$STAFF_PROFILE_CARD" && pass "StaffProfileCard renders age field" || fail "StaffProfileCard missing age render"

echo "--- Skill Certificate Images Inline Preview ---"
STAFF_DETAIL="apps/admin/src/pages/staff/detail.tsx"
AUTH_IMAGE="apps/admin/src/pages/staff/components/AuthImage.tsx"
grep -q "Image.PreviewGroup" "$STAFF_DETAIL" && pass "Skill entries use Ant Design Image preview" || fail "Skill entries missing Image preview"
grep -q "URL.revokeObjectURL" "$AUTH_IMAGE" && pass "AuthImage revokes blob URLs" || fail "AuthImage blob URL cleanup missing"
if grep -q "window.open" "$STAFF_DETAIL"; then
  fail "Staff detail still uses window.open"
else
  pass "Staff detail no longer uses window.open"
fi

echo "--- Role Management Rename And Create ---"
SIDE_MENU="apps/admin/src/layouts/components/SideMenu.tsx"
ROLE_PAGE="apps/admin/src/pages/role/index.tsx"
ROLE_SERVICE_FRONT="apps/admin/src/pages/role/services/role.ts"
ROLE_CONTROLLER="apps/server/src/modules/admin/admin-role.controller.ts"
ROLE_SERVICE_BACK="apps/server/src/modules/admin/admin-role.service.ts"
grep -q "角色管理" "$SIDE_MENU" && pass "Sidebar label is 角色管理" || fail "Sidebar label not updated"
! grep -q "角色权限" "$SIDE_MENU" && pass "Sidebar no longer says 角色权限" || fail "Sidebar still says 角色权限"
grep -q "角色管理" "$ROLE_PAGE" && pass "Role page title is 角色管理" || fail "Role page title missing 角色管理"
grep -q "新增角色" "$ROLE_PAGE" && pass "Role page has create role UI" || fail "Role page missing 新增角色 UI"
grep -q "isSuper" "$ROLE_PAGE" && pass "Create role UI checks isSuper" || fail "Create role UI missing isSuper check"
grep -q "createRole" "$ROLE_SERVICE_FRONT" && pass "Frontend role service has createRole" || fail "Frontend createRole service missing"
grep -q "@Post('roles')" "$ROLE_CONTROLLER" && pass "Backend has POST /roles route" || fail "Backend create role route missing"
grep -q "CurrentAdmin" "$ROLE_CONTROLLER" && pass "Backend create role receives current admin" || fail "Backend create role missing current admin"
grep -q "isSuper" "$ROLE_CONTROLLER" && pass "Backend create role checks super admin" || fail "Backend create role missing super admin check"
grep -q "adminRole.create" "$ROLE_SERVICE_BACK" && pass "Backend creates admin role" || fail "Backend adminRole.create missing"

echo "--- Message Center All Read State ---"
HOME_JS="apps/miniapp/pages/home/index.js"
MESSAGE_JS="apps/miniapp/pages/message/index.js"
MESSAGE_SERVICE="apps/server/src/modules/message/message.service.ts"
grep -q "MESSAGE_UNREAD_COUNT" "$HOME_JS" && pass "Home unread badge uses unread-count API" || fail "Home unread badge not using unread-count API"
if grep -q "MESSAGES, { unreadOnly" "$HOME_JS"; then
  fail "Home still queries messages with unreadOnly"
else
  pass "Home no longer queries messages with unreadOnly"
fi
grep -q "markAllRead" "$MESSAGE_JS" && grep -q "loadUnreadCount" "$MESSAGE_JS" && pass "Message page refreshes unread count after all-read" || fail "Message page all-read refresh missing"
grep -q "supportSummary" "$MESSAGE_JS" && pass "Message page keeps support summary in unread handling" || fail "Message page support unread handling missing"
grep -q "senderType" "$MESSAGE_SERVICE" && grep -q "support_reply" "$MESSAGE_SERVICE" && pass "Server unread/all-read logic accounts for support/admin-system messages" || fail "Server message unread logic may miss support replies"

echo "--- Diff Hygiene ---"
git diff --check && pass "git diff --check passed" || fail "git diff --check failed"

echo ""
echo "=== Stage 14 Verification Complete ==="
echo "  Passed: $PASS"
echo "  Failed: $FAIL"

if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
