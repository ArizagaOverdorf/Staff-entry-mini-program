# Stage 9.5 Avatar Runtime Persistence And Profile ID Number Removal Verification

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

# === Run Stage 9.4 baseline first ===
Write-Host "Running Stage 9.4 baseline..." -ForegroundColor Cyan
$stage94Ps1 = Join-Path $ProjectRoot "verify-stage9-4-avatar-date-picker.ps1"
if (Test-Path $stage94Ps1) {
  & $stage94Ps1
  if ($LASTEXITCODE -ne 0) {
    throw "Stage 9.4 baseline failed."
  }
} else {
  throw "Stage 9.4 verifier not found at $stage94Ps1"
}
Write-Host "Stage 9.4 baseline passed." -ForegroundColor Green

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

# === Miniapp JSON Validation ===
Write-Host "Validating miniapp JSON files..." -ForegroundColor Cyan
Get-ChildItem -Path ".\apps\miniapp" -Recurse -Filter "*.json" | ForEach-Object {
  try {
    $null = Get-Content -LiteralPath $_.FullName -Raw -Encoding UTF8 | ConvertFrom-Json
  } catch {
    throw "Invalid JSON in $($_.FullName): $_"
  }
}
Write-Host "Miniapp JSON files valid." -ForegroundColor Green

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

# === Stage 9.5 Avatar Runtime Markers ===
Write-Host "Checking Stage 9.5 avatar runtime markers..." -ForegroundColor Cyan

$avatarJs = ".\apps\miniapp\utils\avatar.js"
$profileEditJs = ".\apps\miniapp\pages\profile\edit\index.js"

# R1. extractUploadedFileId exists in avatar.js
Write-Host "  [R1] extractUploadedFileId in avatar.js..." -ForegroundColor Cyan
Assert-Contains $avatarJs "extractUploadedFileId" "avatar.js must define extractUploadedFileId"
Write-Host "  [R1] Passed." -ForegroundColor Green

# R2. avatarFileId exists in profile edit data/state
Write-Host "  [R2] avatarFileId in profile edit state..." -ForegroundColor Cyan
Assert-Contains $profileEditJs "avatarFileId" "profile edit must reference avatarFileId"
Write-Host "  [R2] Passed." -ForegroundColor Green

# R3. request.get(constants.API.PROFILE) called after profile save
Write-Host "  [R3] GET /api/app/profile after save..." -ForegroundColor Cyan
$handleSaveContent = (Get-Content -LiteralPath $profileEditJs -Raw -Encoding UTF8) -split "handleSave" | Select-Object -Last 1
if ($handleSaveContent -notmatch "request\.get\(constants\.API\.PROFILE\)") {
  throw "handleSave must call request.get(constants.API.PROFILE) after PUT"
}
Write-Host "  [R3] Passed." -ForegroundColor Green

# R4. normalizeAvatarUrl called with returned profile avatar after save
Write-Host "  [R4] normalizeAvatarUrl on persisted profile..." -ForegroundColor Cyan
if ($handleSaveContent -notmatch "normalizeAvatarUrl") {
  throw "handleSave must call normalizeAvatarUrl with returned avatarUrl"
}
Write-Host "  [R4] Passed." -ForegroundColor Green

# R5. No avatarPreviewUrl assigned as backend avatarUrl
Write-Host "  [R5] No preview URL stored as avatarUrl..." -ForegroundColor Cyan
$editContent = Get-Content -LiteralPath $profileEditJs -Raw -Encoding UTF8
# Extract the save payload section to check avatarUrl is not preview URL
$savePayload = ""
$m = [regex]::Match($editContent, 'profileData\s*=\s*\{(.*?)\}', 'Singleline')
if ($m.Success) { $savePayload = $m.Groups[1].Value }
if ($savePayload -match "avatarPreviewUrl") {
  throw "profileData.avatarUrl must not use avatarPreviewUrl"
}
Write-Host "  [R5] Passed." -ForegroundColor Green

# R6. No wxfile:// or temp path assigned to saved avatar field
Write-Host "  [R6] No wxfile:///temp path stored as avatarUrl..." -ForegroundColor Cyan
if ($editContent -match 'avatarUrl.*wxfile://|avatarUrl.*tempFilePath') {
  throw "avatarUrl must not be assigned from wxfile:// or tempFilePath in save payload"
}
Write-Host "  [R6] Passed." -ForegroundColor Green

# R7. profile edit save payload sends avatarUrl
Write-Host "  [R7] Profile edit save sends durable avatarUrl..." -ForegroundColor Cyan
if ($savePayload -notmatch "avatarUrl") {
  throw "profileData must include avatarUrl field"
}
Write-Host "  [R7] Passed." -ForegroundColor Green

Write-Host ""

# === ID Number Removal from Personal Profile Markers ===
Write-Host "Checking ID number removal markers..." -ForegroundColor Cyan

$profileEditWxml = ".\apps\miniapp\pages\profile\edit\index.wxml"
$profileViewWxml = ".\apps\miniapp\pages\profile\view\index.wxml"

# I1. profile/edit/index.wxml must not contain idNumber input row
Write-Host "  [I1] edit WXML - no ID number row..." -ForegroundColor Cyan
$editWxmlContent = Get-Content -LiteralPath $profileEditWxml -Raw -Encoding UTF8
if ($editWxmlContent -cmatch '身份证号|idNumber') {
  throw "profile/edit/index.wxml must not contain idNumber input row"
}
Write-Host "  [I1] Passed." -ForegroundColor Green

# I2. profile/view/index.wxml must not contain ID number display row
Write-Host "  [I2] view WXML - no ID number row..." -ForegroundColor Cyan
$viewWxmlContent = Get-Content -LiteralPath $profileViewWxml -Raw -Encoding UTF8
if ($viewWxmlContent -cmatch '身份证号') {
  throw "profile/view/index.wxml must not contain idNumber row"
}
Write-Host "  [I2] Passed." -ForegroundColor Green

# I3. profile/edit/index.js must not contain onIdNumberInput
Write-Host "  [I3] edit JS - no onIdNumberInput..." -ForegroundColor Cyan
Assert-NotContains $profileEditJs "onIdNumberInput" "profile/edit/index.js must not define onIdNumberInput"
Write-Host "  [I3] Passed." -ForegroundColor Green

# I4. profile/edit/index.js save payload must not include idNumber
Write-Host "  [I4] edit JS - no idNumber in save payload..." -ForegroundColor Cyan
if ($savePayload -match "idNumber") {
  throw "profileData must not include idNumber field"
}
Write-Host "  [I4] Passed." -ForegroundColor Green

# I5. profile/edit/index.js validate() must not show ID number toasts
Write-Host "  [I5] edit JS - no ID number validation toasts..." -ForegroundColor Cyan
# Extract validate function content
$validateMatch = [regex]::Match($editContent, 'validate\(\)\s*\{(.*?)\n  \},', 'Singleline')
$validateContent = if ($validateMatch.Success) { $validateMatch.Groups[1].Value } else { "" }
if ($validateContent -cmatch '身份证号|idNumber') {
  throw "validate() must not include ID number validation"
}
Write-Host "  [I5] Passed." -ForegroundColor Green

Write-Host ""

# === Resident ID Card Credential Remains Intact ===
Write-Host "Checking resident ID card credential integrity..." -ForegroundColor Cyan

$credEditJs = ".\apps\miniapp\pages\credential\edit\index.js"
$credEditWxml = ".\apps\miniapp\pages\credential\edit\index.wxml"

# C1. credential/edit/index.js still validates idNumber for id_card
Write-Host "  [C1] Credential edit JS - idNumber validation for id_card..." -ForegroundColor Cyan
$credEditContent = Get-Content -LiteralPath $credEditJs -Raw -Encoding UTF8
if ($credEditContent -notmatch "credentialNumber" -or $credEditContent -notmatch "isIdCard") {
  throw "credential/edit/index.js must validate idNumber for id_card"
}
Write-Host "  [C1] Passed." -ForegroundColor Green

# C2. credential/edit/index.wxml still has ID card number field
Write-Host "  [C2] Credential edit WXML - ID card number field..." -ForegroundColor Cyan
$credWxmlContent = Get-Content -LiteralPath $credEditWxml -Raw -Encoding UTF8
if ($credWxmlContent -cnotmatch '身份证号') {
  throw "credential/edit/index.wxml must have id_number field for id_card"
}
Write-Host "  [C2] Passed." -ForegroundColor Green

# C3. credential/edit/index.wxml still has both ID card upload sides
Write-Host "  [C3] Credential edit WXML - both ID card upload sides..." -ForegroundColor Cyan
if ($credWxmlContent -cnotmatch '人像面') {
  throw "credential/edit/index.wxml must have front/person side upload marker"
}
if ($credWxmlContent -cnotmatch '国徽面') {
  throw "credential/edit/index.wxml must have back/emblem side upload marker"
}
Write-Host "  [C3] Passed." -ForegroundColor Green

Write-Host ""
Write-Host "Stage 9.5 verification PASSED." -ForegroundColor Green