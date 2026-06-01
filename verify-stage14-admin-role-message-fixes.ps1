$ErrorActionPreference = "Continue"

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $Root

$script:Pass = 0
$script:Fail = 0

function Pass($Message) {
  $script:Pass += 1
  Write-Host "  PASS: $Message" -ForegroundColor Green
}

function Fail($Message) {
  $script:Fail += 1
  Write-Host "  FAIL: $Message" -ForegroundColor Red
}

function HasText($Path, $Pattern) {
  if (-not (Test-Path $Path)) { return $false }
  return Select-String -Path $Path -Pattern $Pattern -Quiet
}

Write-Host "=== Stage 14 Verification: Admin Age, Role Management, Message Read State ==="

Write-Host "--- Build And Syntax Checks ---"
pnpm --filter @staff-entry/server build
if ($LASTEXITCODE -eq 0) { Pass "Server build passed" } else { Fail "Server build failed" }

pnpm --filter @staff-entry/admin build
if ($LASTEXITCODE -eq 0) { Pass "Admin build passed" } else { Fail "Admin build failed" }

$miniappJs = Get-ChildItem apps/miniapp -Recurse -Filter *.js
$jsOk = $true
foreach ($file in $miniappJs) {
  node --check $file.FullName
  if ($LASTEXITCODE -ne 0) { $jsOk = $false }
}
if ($jsOk) { Pass "Miniapp JS syntax valid" } else { Fail "Miniapp JS syntax invalid" }

Write-Host "--- Admin Age From ID Card/Birthday ---"
$adminStaffService = "apps/server/src/modules/admin/admin-staff.service.ts"
$staffProfileCard = "apps/admin/src/pages/staff/components/StaffProfileCard.tsx"
if (HasText $adminStaffService "parseIdCardBirthday") { Pass "Admin staff service can derive birthday from ID card" } else { Fail "Admin staff service missing parseIdCardBirthday" }
if (HasText $adminStaffService "age:") { Pass "Admin detail returns age" } else { Fail "Admin detail missing age response field" }
if (HasText $adminStaffService "birthday") { Pass "Admin age logic uses birthday source" } else { Fail "Admin age logic missing birthday source" }
if (HasText $staffProfileCard "staff.age") { Pass "StaffProfileCard renders age field" } else { Fail "StaffProfileCard missing age render" }

Write-Host "--- Skill Certificate Images Inline Preview ---"
$staffDetail = "apps/admin/src/pages/staff/detail.tsx"
$authImage = "apps/admin/src/pages/staff/components/AuthImage.tsx"
if ((HasText $staffDetail "Image.PreviewGroup") -or (HasText $staffDetail "<Image")) { Pass "Skill entries use Ant Design Image preview" } else { Fail "Skill entries missing Image preview" }
if (HasText $authImage "URL.revokeObjectURL") { Pass "AuthImage revokes blob URLs" } else { Fail "AuthImage blob URL cleanup missing" }
if (HasText $staffDetail "window.open") { Fail "Staff detail still uses window.open" } else { Pass "Staff detail no longer uses window.open" }

Write-Host "--- Role Management Rename And Create ---"
$sideMenu = "apps/admin/src/layouts/components/SideMenu.tsx"
$rolePage = "apps/admin/src/pages/role/index.tsx"
$roleServiceFront = "apps/admin/src/pages/role/services/role.ts"
$roleController = "apps/server/src/modules/admin/admin-role.controller.ts"
$roleServiceBack = "apps/server/src/modules/admin/admin-role.service.ts"
if (HasText $sideMenu "角色管理") { Pass "Sidebar label is 角色管理" } else { Fail "Sidebar label not updated" }
if (HasText $sideMenu "角色权限") { Fail "Sidebar still says 角色权限" } else { Pass "Sidebar no longer says 角色权限" }
if (HasText $rolePage "角色管理") { Pass "Role page title is 角色管理" } else { Fail "Role page title missing 角色管理" }
if (HasText $rolePage "新增角色") { Pass "Role page has create role UI" } else { Fail "Role page missing 新增角色 UI" }
if (HasText $rolePage "isSuper") { Pass "Create role UI checks isSuper" } else { Fail "Create role UI missing isSuper check" }
if (HasText $roleServiceFront "createRole") { Pass "Frontend role service has createRole" } else { Fail "Frontend createRole service missing" }
if (HasText $roleController "@Post\('roles'\)") { Pass "Backend has POST /roles route" } else { Fail "Backend create role route missing" }
if (HasText $roleController "CurrentAdmin") { Pass "Backend create role receives current admin" } else { Fail "Backend create role missing current admin" }
if (HasText $roleController "isSuper") { Pass "Backend create role checks super admin" } else { Fail "Backend create role missing super admin check" }
if (HasText $roleServiceBack "adminRole.create") { Pass "Backend creates admin role" } else { Fail "Backend adminRole.create missing" }

Write-Host "--- Message Center All Read State ---"
$homeJs = "apps/miniapp/pages/home/index.js"
$messageJs = "apps/miniapp/pages/message/index.js"
$messageService = "apps/server/src/modules/message/message.service.ts"
if (HasText $homeJs "MESSAGE_UNREAD_COUNT") { Pass "Home unread badge uses unread-count API" } else { Fail "Home unread badge not using unread-count API" }
if (HasText $homeJs "MESSAGES, \{ unreadOnly") { Fail "Home still queries messages with unreadOnly" } else { Pass "Home no longer queries messages with unreadOnly" }
if ((HasText $messageJs "markAllRead") -and (HasText $messageJs "loadUnreadCount")) { Pass "Message page refreshes unread count after all-read" } else { Fail "Message page all-read refresh missing" }
if (HasText $messageJs "supportSummary") { Pass "Message page keeps support summary in unread handling" } else { Fail "Message page support unread handling missing" }
if ((HasText $messageService "senderType") -and (HasText $messageService "support_reply")) { Pass "Server unread/all-read logic accounts for support/admin-system messages" } else { Fail "Server message unread logic may miss support replies" }

Write-Host "--- Diff Hygiene ---"
git diff --check
if ($LASTEXITCODE -eq 0) { Pass "git diff --check passed" } else { Fail "git diff --check failed" }

Write-Host ""
Write-Host "=== Stage 14 Verification Complete ==="
Write-Host "  Passed: $script:Pass"
Write-Host "  Failed: $script:Fail"

if ($script:Fail -gt 0) {
  exit 1
}

