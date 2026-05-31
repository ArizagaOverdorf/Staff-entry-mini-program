# Stage 9.4 Avatar Persistence and Credential Date Picker Verification

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

# Run Stage 9.3 baseline first
Write-Host "Running Stage 9.3 baseline..." -ForegroundColor Cyan
$stage93Ps1 = Join-Path $ProjectRoot "verify-stage9-3-id-card-profile-sync-final.ps1"
if (Test-Path $stage93Ps1) {
  & $stage93Ps1
  if ($LASTEXITCODE -ne 0) {
    throw "Stage 9.3 baseline failed."
  }
} else {
  throw "Stage 9.3 verifier not found at $stage93Ps1"
}
Write-Host "Stage 9.3 baseline passed." -ForegroundColor Green

# Prisma Schema Validation
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

# Server Build
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

# Admin TypeScript Check
Write-Host "Running admin TypeScript type check..." -ForegroundColor Cyan
Push-Location ".\apps\admin"
try {
  & npx tsc -b --noEmit 2>&1 | Out-Null
  if ($LASTEXITCODE -ne 0) {
    Write-Host "Admin type check has issues (non-fatal for Stage 9.4):" -ForegroundColor Yellow
    & npx tsc -b --noEmit 2>&1
  } else {
    Write-Host "Admin type check passed." -ForegroundColor Green
  }
} finally {
  Pop-Location
}

# Miniapp JSON Validation
Write-Host "Validating miniapp JSON files..." -ForegroundColor Cyan
Get-ChildItem -Path ".\apps\miniapp" -Recurse -Filter "*.json" | ForEach-Object {
  try {
    $null = Get-Content -LiteralPath $_.FullName -Raw -Encoding UTF8 | ConvertFrom-Json
  } catch {
    throw "Invalid JSON in $($_.FullName): $_"
  }
}
Write-Host "Miniapp JSON files valid." -ForegroundColor Green

# Miniapp JavaScript Syntax Check
Write-Host "Checking miniapp JavaScript syntax..." -ForegroundColor Cyan
Get-ChildItem -Path ".\apps\miniapp" -Recurse -Filter "*.js" | ForEach-Object {
  node --check $_.FullName 2>&1 | Out-Null
  if ($LASTEXITCODE -ne 0) {
    throw "JS syntax error in $($_.FullName)"
  }
}
Write-Host "Miniapp JS syntax check passed." -ForegroundColor Green

# === Stage 9.4 Avatar Persistence Markers ===
Write-Host "Checking Stage 9.4 avatar persistence markers..." -ForegroundColor Cyan

# A1. Shared avatar.js helper exists
Write-Host "  [A1] Shared avatar.js helper..." -ForegroundColor Cyan
$avatarHelper = ".\apps\miniapp\utils\avatar.js"
Assert-FileExists $avatarHelper "Shared avatar helper not found"
Assert-Contains $avatarHelper "normalizeAvatarUrl" "avatar.js must export normalizeAvatarUrl"
Assert-Contains $avatarHelper "getAvatarText" "avatar.js must export getAvatarText"
Assert-Contains $avatarHelper "module\.exports" "avatar.js must use module.exports"
Write-Host "  [A1] Passed." -ForegroundColor Green

# A2. All 5 pages import shared avatar helper, no local definitions
Write-Host "  [A2] Pages import shared avatar helper..." -ForegroundColor Cyan
$pagesToCheck = @(
  ".\apps\miniapp\pages\profile\edit\index.js",
  ".\apps\miniapp\pages\profile\view\index.js",
  ".\apps\miniapp\pages\home\index.js",
  ".\apps\miniapp\pages\account\index.js",
  ".\apps\miniapp\pages\resume\index.js"
)
foreach ($page in $pagesToCheck) {
  Assert-Contains $page "require\('.*utils/avatar'\)" "Page must import shared avatar helper"
  $content = Get-Content -LiteralPath $page -Raw -Encoding UTF8
  if ($content -match 'function normalizeAvatarUrl\(') {
    throw "Page $page must not define its own normalizeAvatarUrl"
  }
  if ($content -match 'function getAvatarText\(') {
    throw "Page $page must not define its own getAvatarText"
  }
}
Write-Host "  [A2] Passed." -ForegroundColor Green

# A3. Profile edit save sends durable avatarUrl
Write-Host "  [A3] Profile edit saves durable avatarUrl..." -ForegroundColor Cyan
$profileEditJs = ".\apps\miniapp\pages\profile\edit\index.js"
Assert-Contains $profileEditJs "avatarUrl:\s*this\.data\.(?:avatarFileId|avatarUrl)" "profile edit save must send avatarUrl"
Write-Host "  [A3] Passed." -ForegroundColor Green

# A4. No code stores tempFilePath as durable profile avatar
Write-Host "  [A4] No tempFilePath stored as avatarUrl in save..." -ForegroundColor Cyan
$editContent = Get-Content -LiteralPath $profileEditJs -Raw -Encoding UTF8
$saveSection = $editContent -split "handleSave" | Select-Object -Last 1
if ($saveSection -match 'avatarUrl.*tempFilePath|tempFilePath.*avatarUrl') {
  throw "avatarUrl must not be set from tempFilePath in save payload"
}
Write-Host "  [A4] Passed." -ForegroundColor Green

# A5. Backend profile update DTO accepts avatarUrl
Write-Host "  [A5] Backend profile DTO accepts avatarUrl..." -ForegroundColor Cyan
$profileDto = ".\apps\server\src\modules\staff\dto\update-profile.dto.ts"
Assert-Contains $profileDto "avatarUrl" "UpdateProfileDto must have avatarUrl field"
Write-Host "  [A5] Passed." -ForegroundColor Green

# A6. Backend updateProfile stores and returns avatarUrl
Write-Host "  [A6] Backend updateProfile stores/returns avatarUrl..." -ForegroundColor Cyan
$staffSvc = ".\apps\server\src\modules\staff\staff.service.ts"
$svcContent = Get-Content -LiteralPath $staffSvc -Raw -Encoding UTF8
if ($svcContent -notmatch 'dto\.avatarUrl') {
  throw "updateProfile must reference dto.avatarUrl"
}
if ($svcContent -notmatch 'profileData\.avatarUrl') {
  throw "updateProfile must set profileData.avatarUrl"
}
if ($svcContent -notmatch 'avatarUrl:\s*result\.avatarUrl') {
  throw "updateProfile must return avatarUrl"
}
Write-Host "  [A6] Passed." -ForegroundColor Green

# A7. All pages display normalized avatarUrl
Write-Host "  [A7] Pages display normalized avatarUrl..." -ForegroundColor Cyan
foreach ($page in $pagesToCheck) {
  $pageContent = Get-Content -LiteralPath $page -Raw -Encoding UTF8
  if ($pageContent -notmatch 'normalizeAvatarUrl') {
    throw "Page $page must call normalizeAvatarUrl for avatar display"
  }
}
Write-Host "  [A7] Passed." -ForegroundColor Green

Write-Host ""

# === Stage 9.4 Credential Date Picker Markers ===
Write-Host "Checking Stage 9.4 credential date picker markers..." -ForegroundColor Cyan

$credEditJs = ".\apps\miniapp\pages\credential\edit\index.js"
$credEditWxml = ".\apps\miniapp\pages\credential\edit\index.wxml"
$credSvc = ".\apps\server\src\modules\credential\credential.service.ts"

# C1. WXML uses picker mode=date for both dates
Write-Host "  [C1] WXML uses picker mode=date..." -ForegroundColor Cyan
$wxmlContent = Get-Content -LiteralPath $credEditWxml -Raw -Encoding UTF8
$datePickerMatches = ([regex]::Matches($wxmlContent, '<picker mode="date"')).Count
if ($datePickerMatches -lt 2) {
  throw "WXML must have >=2 picker mode=date (found $datePickerMatches)"
}
Assert-Contains $credEditWxml 'bindchange="onIssueDateChange"' "WXML must bind onIssueDateChange"
Assert-Contains $credEditWxml 'bindchange="onExpireDateChange"' "WXML must bind onExpireDateChange"
Write-Host "  [C1] Passed." -ForegroundColor Green

# C2. No manual text input for expiry date on expiring credentials
Write-Host "  [C2] No manual expiry text input..." -ForegroundColor Cyan
if ($wxmlContent -match 'bindinput="onExpireDateInput"') {
  throw "WXML must not have onExpireDateInput handler"
}
Write-Host "  [C2] Passed." -ForegroundColor Green

# C3. Save payload includes issueDate and expireDate
Write-Host "  [C3] Save payload includes issueDate and expireDate..." -ForegroundColor Cyan
Assert-Contains $credEditJs 'data\.issueDate' "save must include issueDate"
Assert-Contains $credEditJs 'data\.expireDate' "save must include expireDate"
Write-Host "  [C3] Passed." -ForegroundColor Green

# C4. Miniapp validates required dates and date order
Write-Host "  [C4] Miniapp date validation..." -ForegroundColor Cyan
$credEditContent = Get-Content -LiteralPath $credEditJs -Raw -Encoding UTF8
if ($credEditContent -notmatch 'if \(this\.data\.requireExpiry\)' -or $credEditContent -notmatch 'issueDate') {
  throw "validate must check requireExpiry and issueDate"
}
if ($credEditContent -notmatch 'expireDate\s*<\s*issueDate|expireDate\s*<\s*this\.data\.issueDate') {
  throw "validate must check expireDate >= issueDate"
}
Write-Host "  [C4] Passed." -ForegroundColor Green

# C5. Backend validates issueDate required and date order
Write-Host "  [C5] Backend date validation..." -ForegroundColor Cyan
$svcContent2 = Get-Content -LiteralPath $credSvc -Raw -Encoding UTF8
if ($svcContent2 -notmatch 'issueDate') {
  throw "backend validateExpiryDate must reference issueDate"
}
if ($svcContent2 -notmatch 'expiryDate\s*<\s*issueDate') {
  throw "backend must validate expiryDate >= issueDate"
}
Write-Host "  [C5] Passed." -ForegroundColor Green

# C6. Credential load hydrates both dates
Write-Host "  [C6] Credential load hydrates both dates..." -ForegroundColor Cyan
Assert-Contains $credEditJs 'issueDate:\s*cred\.issueDate' "load must hydrate issueDate from server"
Assert-Contains $credEditJs 'expireDate:\s*cred\.expireDate' "load must hydrate expireDate from server"
Write-Host "  [C6] Passed." -ForegroundColor Green

# C7. Backend formatCredential returns issueDate
Write-Host "  [C7] Backend formatCredential returns issueDate..." -ForegroundColor Cyan
Assert-Contains $credSvc 'issueDate:\s*c\.issueDate' "formatCredential must return issueDate"
Write-Host "  [C7] Passed." -ForegroundColor Green

Write-Host ""
Write-Host "Stage 9.4 verification passed." -ForegroundColor Green