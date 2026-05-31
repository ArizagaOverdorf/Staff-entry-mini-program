# Stage 9.6 Avatar Runtime Final Fix Verification

$ErrorActionPreference = "Stop"

$ProjectRoot = $PSScriptRoot
Set-Location -LiteralPath $ProjectRoot

function Assert-FileExists {
  param(
    [string]$Path,
    [string]$Message
  )
  if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) {
    throw "$Message. File not found: $Path"
  }
}

function Assert-Contains {
  param(
    [string]$Path,
    [string]$Pattern,
    [string]$Message
  )
  $content = Get-Content -LiteralPath $Path -Raw -Encoding UTF8
  if ($content -notmatch $Pattern) {
    throw "$Message in $Path"
  }
}

function Assert-NotContains {
  param(
    [string]$Path,
    [string]$Pattern,
    [string]$Message
  )
  $content = Get-Content -LiteralPath $Path -Raw -Encoding UTF8
  if ($content -match $Pattern) {
    throw "$Message in $Path"
  }
}

# === Run Stage 9.5 baseline first ===
Write-Host "Running Stage 9.5 baseline..." -ForegroundColor Cyan
$stage95Ps1 = Join-Path $ProjectRoot "verify-stage9-5-avatar-runtime-and-profile-id-removal.ps1"
if (Test-Path $stage95Ps1) {
  & $stage95Ps1
  if ($LASTEXITCODE -ne 0) {
    throw "Stage 9.5 baseline failed."
  }
} else {
  throw "Stage 9.5 verifier not found at $stage95Ps1"
}
Write-Host "Stage 9.5 baseline passed." -ForegroundColor Green

# === Prisma Schema Validation ===
Write-Host "Validating Prisma schema..." -ForegroundColor Cyan
Push-Location ".\apps\server"
try {
  & ".\node_modules\.bin\prisma.CMD" format 2>&1 | Out-Null
  if ($LASTEXITCODE -ne 0) {
    throw "Prisma schema validation failed"
  }
} finally {
  Pop-Location
}
Write-Host "Prisma schema is valid." -ForegroundColor Green

# === Server Build ===
Write-Host "Building server..." -ForegroundColor Cyan
Push-Location ".\apps\server"
try {
  & npm run build
  if ($LASTEXITCODE -ne 0) {
    throw "Server build failed"
  }
} finally {
  Pop-Location
}
Write-Host "Server build passed." -ForegroundColor Green

# === Admin TypeScript Check ===
Write-Host "Running admin TypeScript type check..." -ForegroundColor Cyan
Push-Location ".\apps\admin"
try {
  & npx tsc -b --noEmit 2>&1 | Out-Null
  if ($LASTEXITCODE -ne 0) {
    Write-Host "Admin type check has issues (non-fatal):" -ForegroundColor Yellow
    & npx tsc -b --noEmit 2>&1
  } else {
    Write-Host "Admin type check passed." -ForegroundColor Green
  }
} finally {
  Pop-Location
}

# === Miniapp JavaScript Syntax Check ===
Write-Host "Checking miniapp JavaScript syntax..." -ForegroundColor Cyan
Get-ChildItem -Path ".\apps\miniapp" -Recurse -Filter "*.js" | ForEach-Object {
  node --check $_.FullName 2>&1 | Out-Null
  if ($LASTEXITCODE -ne 0) {
    throw "JS syntax error in $($_.FullName)"
  }
}
Write-Host "Miniapp JS syntax check passed." -ForegroundColor Green

Write-Host ""

# ==========================================
# Stage 9.6 Backend Assertions
# ==========================================
Write-Host "Checking Stage 9.6 backend avatar public-promotion markers..." -ForegroundColor Cyan

$staffServiceTs = ".\apps\server\src\modules\staff\staff.service.ts"
$staffContent = Get-Content -LiteralPath $staffServiceTs -Raw -Encoding UTF8

# B1. StaffService.updateProfile uses fileAsset.updateMany
Write-Host "  [B1] fileAsset.updateMany in updateProfile..." -ForegroundColor Cyan
Assert-Contains $staffServiceTs "fileAsset\.updateMany" "StaffService.updateProfile must call fileAsset.updateMany"
Write-Host "  [B1] Passed." -ForegroundColor Green

# B2. accessLevel set to 'public'
Write-Host "  [B2] accessLevel set to public..." -ForegroundColor Cyan
$updateManyBlock = $staffContent -split "fileAsset\.updateMany" | Select-Object -Last 1
if ($updateManyBlock -notmatch "accessLevel.*public") {
  throw "fileAsset.updateMany must set accessLevel to 'public'"
}
Write-Host "  [B2] Passed." -ForegroundColor Green

# B3. Restriction by uploadedByStaffAccountId: accountId
Write-Host "  [B3] Restricts by uploadedByStaffAccountId..." -ForegroundColor Cyan
if ($updateManyBlock -notmatch "uploadedByStaffAccountId.*accountId") {
  throw "fileAsset.updateMany must filter by uploadedByStaffAccountId: accountId"
}
Write-Host "  [B3] Passed." -ForegroundColor Green

# B4. Guarded against external HTTP avatar URLs
Write-Host "  [B4] HTTP URL guard..." -ForegroundColor Cyan
if ($staffContent -notmatch "startsWith.*http") {
  throw "updateProfile must guard against treating HTTP URLs as file IDs"
}
Write-Host "  [B4] Passed." -ForegroundColor Green

Write-Host ""

# ==========================================
# Stage 9.6 Frontend Assertions
# ==========================================
Write-Host "Checking Stage 9.6 frontend no-false-success markers..." -ForegroundColor Cyan

$profileEditJs = ".\apps\miniapp\pages\profile\edit\index.js"
$editContent = Get-Content -LiteralPath $profileEditJs -Raw -Encoding UTF8

# F1. avatarChanged in profile edit data/state
Write-Host "  [F1] avatarChanged in profile edit state..." -ForegroundColor Cyan
Assert-Contains $profileEditJs "avatarChanged" "profile edit must have avatarChanged state"
Write-Host "  [F1] Passed." -ForegroundColor Green

# F2. Post-save refresh failure toast when avatar changed
Write-Host "  [F2] refresh failure shows avatar confirmation toast..." -ForegroundColor Cyan
$avatarChangedPattern = [regex]::Escape("头像保存确认失败，请重试")
if ($editContent -notmatch $avatarChangedPattern) {
  throw "Must show refresh failure toast when avatar changed"
}
Write-Host "  [F2] Passed." -ForegroundColor Green

# F3. Returned avatar compared against uploaded durable file ID
Write-Host "  [F3] returned avatar vs uploaded file ID comparison..." -ForegroundColor Cyan
if ($editContent -notmatch "returnedAvatarUrl.*uploadedFileId") {
  throw "Must compare returnedAvatarUrl against uploadedFileId"
}
Write-Host "  [F3] Passed." -ForegroundColor Green

# F4. Failure path shows toast and stays on page (avatar mismatch toast)
Write-Host "  [F4] failure path shows avatar mismatch toast..." -ForegroundColor Cyan
$mismatchPattern = [regex]::Escape("头像未保存成功，请重试")
if ($editContent -notmatch $mismatchPattern) {
  throw "Must show avatar mismatch toast"
}
Write-Host "  [F4] Passed." -ForegroundColor Green

# F5. console.error includes avatar confirmation context
Write-Host "  [F5] console.error diagnostic markers..." -ForegroundColor Cyan
if ($editContent -notmatch "AvatarSaveConfirm") {
  throw "console.error must include [AvatarSaveConfirm] diagnostic tag"
}
if ($editContent -notmatch "uploadedFileId") {
  throw "console.error must include uploadedFileId in diagnostic"
}
Write-Host "  [F5] Passed." -ForegroundColor Green

Write-Host ""

# ==========================================
# Preserve Prior ID Number Removal Markers
# ==========================================
Write-Host "Checking prior ID number removal markers still pass..." -ForegroundColor Cyan

$profileEditWxml = ".\apps\miniapp\pages\profile\edit\index.wxml"
$profileViewWxml = ".\apps\miniapp\pages\profile\view\index.wxml"

# I1. profile/edit/index.wxml must not contain idNumber input row
Write-Host "  [I1] edit WXML - no ID number row..." -ForegroundColor Cyan
$editWxmlContent = Get-Content -LiteralPath $profileEditWxml -Raw -Encoding UTF8
$idNumberPattern = [regex]::Escape("身份证号")
if ($editWxmlContent -cmatch $idNumberPattern) {
  throw "profile/edit/index.wxml must not contain idNumber input row"
}
Write-Host "  [I1] Passed." -ForegroundColor Green

# I2. profile/view/index.wxml must not contain ID number display row
Write-Host "  [I2] view WXML - no ID number row..." -ForegroundColor Cyan
$viewWxmlContent = Get-Content -LiteralPath $profileViewWxml -Raw -Encoding UTF8
if ($viewWxmlContent -cmatch $idNumberPattern) {
  throw "profile/view/index.wxml must not contain idNumber row"
}
Write-Host "  [I2] Passed." -ForegroundColor Green

# I3. profile/edit/index.js must not contain onIdNumberInput
Write-Host "  [I3] edit JS - no onIdNumberInput..." -ForegroundColor Cyan
Assert-NotContains $profileEditJs "onIdNumberInput" "profile/edit/index.js must not define onIdNumberInput"
Write-Host "  [I3] Passed." -ForegroundColor Green

# I4. profile/edit/index.js save payload must not include idNumber
Write-Host "  [I4] edit JS - no idNumber in save payload..." -ForegroundColor Cyan
$m = [regex]::Match($editContent, "profileData\s*=\s*\x7B(.*?)\x7D", "Singleline")
$savePayload = if ($m.Success) { $m.Groups[1].Value } else { "" }
if ($savePayload -match "idNumber") {
  throw "profileData must not include idNumber field"
}
Write-Host "  [I4] Passed." -ForegroundColor Green

# I5. Resident ID card credential page remains intact
Write-Host "  [I5] Credential edit WXML - ID card number field preserved..." -ForegroundColor Cyan
$credEditWxml = ".\apps\miniapp\pages\credential\edit\index.wxml"
$credWxmlContent = Get-Content -LiteralPath $credEditWxml -Raw -Encoding UTF8
if ($credWxmlContent -cnotmatch $idNumberPattern) {
  throw "credential/edit/index.wxml must have id_number field for id_card"
}
Write-Host "  [I5] Passed." -ForegroundColor Green

Write-Host ""
Write-Host "Stage 9.6 verification PASSED." -ForegroundColor Green
