$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

$pass = 0
$fail = 0

function Pass($message) {
  $script:pass += 1
  Write-Host "  PASS: $message"
}

function Fail($message) {
  $script:fail += 1
  Write-Host "  FAIL: $message"
}

function Contains($path, $pattern) {
  return Select-String -Path $path -Pattern $pattern -Quiet
}

Write-Host "=== Stage 18 Verification: Home Message Audit UI ==="

Write-Host "--- Miniapp Syntax ---"
try {
  Get-ChildItem apps/miniapp -Filter *.js -Recurse | ForEach-Object { node --check $_.FullName | Out-Null }
  Pass "Miniapp JS syntax valid"
} catch {
  Fail "Miniapp JS syntax invalid"
}

try {
  Get-ChildItem apps/miniapp -Filter *.json -Recurse | ForEach-Object {
    $raw = Get-Content $_.FullName -Raw
    $null = $raw | ConvertFrom-Json
  }
  Pass "Miniapp JSON valid"
} catch {
  Fail "Miniapp JSON invalid"
}

Write-Host "--- Home Level And Credit Card ---"
$homeWxml = "apps/miniapp/pages/home/index.wxml"
$homeWxss = "apps/miniapp/pages/home/index.wxss"
if (Contains $homeWxml "status-card-metrics") { Pass "Home metrics card exists" } else { Fail "Home metrics card missing" }
if ((Contains $homeWxml "等级") -and (Contains $homeWxml "信用分")) { Pass "Home metrics include level and credit labels" } else { Fail "Home metrics labels missing" }
if (Contains $homeWxml "status-metric-row") { Pass "Home metrics use row layout" } else { Fail "Home metrics row layout missing" }
if (Contains $homeWxml "status-metric-separator") { Pass "Home metrics use explicit separator" } else { Fail "Home metrics separator missing" }
if ((Contains $homeWxss "status-card-metrics") -and (Contains $homeWxss "status-metric-row")) { Pass "Home metrics styles exist" } else { Fail "Home metrics styles missing" }
if (Contains $homeWxml "等级称号") { Fail "Old level title remains" } else { Pass "Old level title removed" }
if (Contains $homeWxml "信用分：开发中") { Fail "Old credit hint layout remains" } else { Pass "Old credit hint layout removed" }

Write-Host "--- Message Center Support Entry ---"
$messageWxml = "apps/miniapp/pages/message/index.wxml"
$messageWxss = "apps/miniapp/pages/message/index.wxss"
if ((Contains $messageWxml "联系客服 / 发送咨询") -or (Contains $messageWxml "发送咨询") -or (Contains $messageWxml "support-entry")) { Fail "Message center still renders contact support entry" } else { Pass "Message center contact support entry removed" }
if (Contains $messageWxss "support-entry") { Fail "Message center support entry styles remain" } else { Pass "Message center support entry styles removed" }

Write-Host "--- Audit Status Banner ---"
$auditWxml = "apps/miniapp/pages/audit/status.wxml"
$auditWxss = "apps/miniapp/pages/audit/status.wxss"
if (Contains $auditWxml "&#10003") { Fail "Approved banner checkmark entity remains" } else { Pass "Approved banner checkmark entity removed" }
if (Contains $auditWxml "intakeStatus !== 'approved'") { Pass "Approved status renders without banner icon" } else { Fail "Approved status icon condition missing" }
if (Contains $auditWxss "font-size: 24px") { Pass "Approved/status title font enlarged" } else { Fail "Status title font not enlarged" }
if (Contains $auditWxss "line-height: 32px") { Pass "Status title line-height enlarged" } else { Fail "Status title line-height missing" }

Write-Host "--- Diff Hygiene ---"
try {
  git diff --check | Out-Null
  Pass "git diff --check passed"
} catch {
  Fail "git diff --check failed"
}

Write-Host ""
Write-Host "=== Stage 18 Verification Complete ==="
Write-Host "  Passed: $pass"
Write-Host "  Failed: $fail"

if ($fail -gt 0) {
  exit 1
}
