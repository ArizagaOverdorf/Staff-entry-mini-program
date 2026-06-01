#!/usr/bin/env pwsh
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

$Pass = 0
$Fail = 0
function Pass($msg) { $script:Pass++; Write-Host "  PASS: $msg" -ForegroundColor Green }
function Fail($msg) { $script:Fail++; Write-Host "  FAIL: $msg" -ForegroundColor Red }
function Has($path, $pattern) { (Get-Content $path -Raw) -match $pattern }

Write-Host "=== Stage 12 Verification: Login, Autosave, Required Images ===" -ForegroundColor Cyan

try { pnpm --filter @staff-entry/server build | Out-Null; Pass "Server build passed" } catch { Fail "Server build failed" }
try { pnpm --filter @staff-entry/admin build | Out-Null; Pass "Admin build passed" } catch { Fail "Admin build failed" }

$jsonOk = $true
Get-ChildItem apps/miniapp -Recurse -Filter *.json | ForEach-Object {
  try { $null = Get-Content $_.FullName -Raw | ConvertFrom-Json } catch { $jsonOk = $false }
}
if ($jsonOk) { Pass "Miniapp JSON valid" } else { Fail "Miniapp JSON invalid" }

$AuthWxml = "apps/miniapp/pages/auth/index.wxml"
$AuthJs = "apps/miniapp/pages/auth/index.js"
$ProfileWxml = "apps/miniapp/pages/profile/edit/index.wxml"
$ProfileJs = "apps/miniapp/pages/profile/edit/index.js"
$CredEditJs = "apps/miniapp/pages/credential/edit/index.js"
$CredService = "apps/server/src/modules/credential/credential.service.ts"
$IntakeService = "apps/server/src/modules/intake/intake.service.ts"
$AdminService = "apps/server/src/modules/admin/admin-staff.service.ts"

if (-not (Has $AuthWxml "微信一键登录")) { Pass "No visible WeChat one-tap login" } else { Fail "Still shows WeChat one-tap login" }
if (Has $AuthWxml "请输入手机号") { Pass "Phone input on login page" } else { Fail "Phone input missing" }
if (Has $AuthWxml "请输入验证码") { Pass "SMS code input on login page" } else { Fail "SMS code input missing" }
if ((Has $AuthWxml "登录即表示您同意") -and (Has $AuthWxml "bindtap=`"handlePhoneLogin`"")) { Pass "Phone login agreement and button present" } else { Fail "Phone login UI incomplete" }
if ((Has $AuthJs "PHONE_BIND") -and (Has $AuthJs "PRIVACY_CONFIRM") -and (-not (Has $AuthJs "handleWechatLogin"))) { Pass "Phone login flow implemented" } else { Fail "Phone login flow incomplete" }

if (-not (Has $ProfileWxml "保存资料")) { Pass "Profile bottom save button removed" } else { Fail "Profile still shows save button" }
if ((Has $ProfileWxml "提交审核") -and (Has $ProfileWxml "autoSaveStatus") -and (Has $ProfileWxml "bindblur=`"onProfileFieldBlur`"")) { Pass "Profile submit-only autosave UI present" } else { Fail "Profile autosave UI incomplete" }
if ((Has $ProfileJs "scheduleAutoSave") -and (Has $ProfileJs "saveProfileSilently") -and (-not (Has $ProfileJs "handleSave\(\)"))) { Pass "Profile autosave functions present" } else { Fail "Profile autosave functions incomplete" }

foreach ($type in @("health_cert", "no_crime_cert", "credit_report", "medical_report")) {
  if ((Has $CredEditJs $type) -and (Has $CredService $type)) { Pass "Required image marker for $type" } else { Fail "Missing required image marker for $type" }
}
if (Has $CredService "validateRequiredCredentialImage") { Pass "Server validates required credential images on save" } else { Fail "Server save image validation missing" }
if (Has $IntakeService "需要上传证件图片") { Pass "Intake checks required images" } else { Fail "Intake image checks missing" }
if (Has $AdminService "sideFiles.length === 0") { Pass "Admin checks required images" } else { Fail "Admin image check missing" }

Write-Host ""
Write-Host "=== Stage 12 Verification Complete ===" -ForegroundColor Cyan
Write-Host "  Passed: $Pass" -ForegroundColor Green
Write-Host "  Failed: $Fail" -ForegroundColor $(if ($Fail -gt 0) { "Red" } else { "Green" })

if ($Fail -gt 0) { exit 1 }
