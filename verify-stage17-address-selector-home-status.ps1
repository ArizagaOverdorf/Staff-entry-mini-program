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

Write-Host "=== Stage 17 Verification: Address Selector And Home Status Cards ==="

Write-Host "--- Miniapp Syntax ---"
$miniappJs = Get-ChildItem apps/miniapp -Recurse -Filter *.js
$jsOk = $true
foreach ($file in $miniappJs) {
  node --check $file.FullName
  if ($LASTEXITCODE -ne 0) { $jsOk = $false }
}
if ($jsOk) { Pass "Miniapp JS syntax valid" } else { Fail "Miniapp JS syntax invalid" }

Write-Host "--- Profile Address Selector ---"
$profileJs = "apps/miniapp/pages/profile/edit/index.js"
$profileWxml = "apps/miniapp/pages/profile/edit/index.wxml"
$profileWxss = "apps/miniapp/pages/profile/edit/index.wxss"
if (HasText $profileJs "ADDRESS_REGION_OPTIONS") { Pass "Address region option list exists" } else { Fail "Address region option list missing" }
if ((HasText $profileJs "国内") -and (HasText $profileJs "国外") -and (HasText $profileJs "港澳")) { Pass "Address list includes 国内/国外/港澳" } else { Fail "Address list missing 国内/国外/港澳" }
if (HasText $profileJs "台湾省") { Pass "Address list includes 台湾省" } else { Fail "Address list missing 台湾省" }
if (HasText $profileJs "addressSelectorVisible") { Pass "Address selector state exists" } else { Fail "Address selector state missing" }
if ((HasText $profileJs "onAddressRegionSelect") -and (HasText $profileJs "onAddressCitySelect")) { Pass "Address selector handlers exist" } else { Fail "Address selector handlers missing" }
if (HasText $profileJs "scheduleAutoSave") { Pass "Address selection can trigger autosave" } else { Fail "Address autosave marker missing" }
if ((HasText $profileWxml "address-panel") -and (HasText $profileWxml "address-columns")) { Pass "Address selector panel renders two columns" } else { Fail "Address selector panel/two columns missing" }
if (HasText $profileWxml "address-picker-value") { Pass "Address input replaced by picker value" } else { Fail "Address picker value missing" }
if (HasText $profileWxml "bindinput=`"onAddressInput`"") { Fail "Old free-text address input remains" } else { Pass "Old free-text address input removed" }
if ((HasText $profileWxss "address-region-column") -and (HasText $profileWxss "address-city-column")) { Pass "Address selector columns styled" } else { Fail "Address selector column styles missing" }

Write-Host "--- Home Status Cards ---"
$homeWxml = "apps/miniapp/pages/home/index.wxml"
$homeWxss = "apps/miniapp/pages/home/index.wxss"
if ((HasText $homeWxml "入驻状态") -and (HasText $homeWxml "上线状态")) { Pass "Home keeps two status cards" } else { Fail "Home status cards missing" }
if ((HasText $homeWxml "查看进度") -and (HasText $homeWxml "onlineNextAction")) { Pass "Home keeps status card actions" } else { Fail "Home status card actions missing" }
if ((HasText $homeWxml "mgmt-status-bar") -or (HasText $homeWxml "managementStatusLabel")) { Fail "Home still renders management status bar" } else { Pass "Home management status bar removed" }
if (HasText $homeWxss "font-size: 20px") { Pass "Home status value font enlarged" } else { Fail "Home status value font not enlarged" }
if (HasText $homeWxss "font-size: 14px") { Pass "Home status label font enlarged" } else { Fail "Home status label font not enlarged" }
if (HasText $homeWxss "font-size: 13px") { Pass "Home status action font enlarged" } else { Fail "Home status action font not enlarged" }
if (HasText $homeWxml "online-status-card {{onlineStatusClass}}") { Pass "Online status card has dynamic status class" } else { Fail "Online status card dynamic class missing" }
if (HasText $homeWxss "online-status-card.warning") { Pass "Offline/resting online card has orange background" } else { Fail "Orange resting status background missing" }
if ((HasText $homeWxss "mgmt-status-bar") -or (HasText $homeWxss "mgmt-status-text")) { Fail "Home management status styles remain" } else { Pass "Home management status styles removed" }

Write-Host "--- Diff Hygiene ---"
git diff --check
if ($LASTEXITCODE -eq 0) { Pass "git diff --check passed" } else { Fail "git diff --check failed" }

Write-Host ""
Write-Host "=== Stage 17 Verification Complete ==="
Write-Host "  Passed: $script:Pass"
Write-Host "  Failed: $script:Fail"

if ($script:Fail -gt 0) {
  exit 1
}
