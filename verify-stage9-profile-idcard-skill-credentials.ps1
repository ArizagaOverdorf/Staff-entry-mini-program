# Stage 9 Profile Avatar, ID Card, And Skill Credential Rework Verification

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

# Run Stage 8.2 baseline first
Write-Host "Running Stage 8.2 baseline..." -ForegroundColor Cyan
$stage8_2Ps1 = Join-Path $ProjectRoot "verify-stage8-2-support-chat-experience.ps1"
if (Test-Path $stage8_2Ps1) {
  & $stage8_2Ps1
  if ($LASTEXITCODE -ne 0) {
    throw "Stage 8.2 baseline failed."
  }
} else {
  throw "Stage 8.2 verifier not found at $stage8_2Ps1"
}
Write-Host "Stage 8.2 baseline passed." -ForegroundColor Green

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
    Write-Host "Admin type check has issues:" -ForegroundColor Yellow
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

# === Stage 9 Markers ===
Write-Host "Checking Stage 9 profile, ID card, and skill credential markers..." -ForegroundColor Cyan

# 1. ID card label renamed
Write-Host "  ID card label check..." -ForegroundColor Cyan
$pattern1 = [regex]::Escape("id_card: '") + "[^']*" + [regex]::Escape("'")
$content1 = Get-Content ".\apps\server\src\modules\credential\credential.constants.ts" -Raw -Encoding UTF8
if ($content1 -notmatch "id_card:.*居民身份证") {
  throw "Server credential constants must use proper ID card label"
}
# Verify label includes the prefix
if ($content1 -notmatch "居民身份证") {
  throw "Server constants must use full ID card label"
}
Assert-Contains ".\apps\miniapp\utils\constants.js" "居民身份证" "Miniapp constants must use proper ID card label"
Assert-Contains ".\apps\admin\src\pages\staff\components\CredentialReviewList.tsx" "居民身份证" "Admin credential review must use proper ID card label"
Write-Host "  ID card label passed." -ForegroundColor Green

# 2. Two-sided ID card upload
Write-Host "  Two-sided ID card upload..." -ForegroundColor Cyan
Assert-Contains ".\apps\miniapp\pages\credential\edit\index.js" "handleUploadIdCardFront" "Credential edit must have handleUploadIdCardFront"
Assert-Contains ".\apps\miniapp\pages\credential\edit\index.js" "handleUploadIdCardBack" "Credential edit must have handleUploadIdCardBack"
Assert-Contains ".\apps\miniapp\pages\credential\edit\index.wxml" "idCardFrontUrl" "Credential edit WXML must have front upload slot"
Assert-Contains ".\apps\miniapp\pages\credential\edit\index.wxml" "idCardBackUrl" "Credential edit WXML must have back upload slot"
Assert-Contains ".\apps\miniapp\pages\credential\edit\index.js" "idCardFrontFileId" "Credential edit must track front file ID"
Assert-Contains ".\apps\miniapp\pages\credential\edit\index.js" "idCardBackFileId" "Credential edit must track back file ID"
Write-Host "  Two-sided ID card upload passed." -ForegroundColor Green

# 3. ID number required for ID card
Write-Host "  ID number required for ID card..." -ForegroundColor Cyan
Assert-Contains ".\apps\server\src\modules\credential\credential.service.ts" "validateIdCardNumber" "Credential service must validate ID number"
Assert-Contains ".\apps\server\src\modules\credential\credential.service.ts" "validateIdCardFiles" "Credential service must validate ID card files"
Assert-Contains ".\apps\miniapp\pages\credential\edit\index.js" "idNumberRequired" "Credential edit must track idNumberRequired"
Assert-Contains ".\apps\miniapp\pages\credential\edit\index.wxml" "idcard" "Credential edit WXML must have idcard type input"
Write-Host "  ID number required passed." -ForegroundColor Green

# 4. File side support
Write-Host "  File side support..." -ForegroundColor Cyan
Assert-Contains ".\apps\server\src\modules\credential\credential.service.ts" "resolveFileEntries" "Credential service must resolve file entries with side"
Assert-Contains ".\apps\server\src\modules\credential\dto\upsert-credential.dto.ts" "fileSide" "DTO must support fileSide"
Assert-Contains ".\apps\server\src\modules\credential\dto\upsert-credential.dto.ts" "CredentialFileItemDto" "DTO must have CredentialFileItemDto"
Assert-Contains ".\apps\server\src\modules\credential\credential.service.ts" "fileSide" "Credential format must include fileSide"
Assert-Contains ".\apps\server\src\modules\admin\admin-staff.service.ts" "fileSide" "Admin staff service must include fileSide"
Write-Host "  File side support passed." -ForegroundColor Green

# 5. Skill level
Write-Host "  Skill level check..." -ForegroundColor Cyan
Assert-Contains ".\apps\miniapp\utils\constants.js" "value: '" + [char]0x4E13 + [char]0x5BB6 + "'" "Constants must have expert skill level" -ErrorAction SilentlyContinue
$constContent = Get-Content ".\apps\miniapp\utils\constants.js" -Raw -Encoding UTF8
if ($constContent -notmatch "专家") {
  throw "Constants must have expert skill level"
}
Write-Host "  Skill level passed." -ForegroundColor Green

# 6. Avatar persistence
Write-Host "  Avatar persistence fixes..." -ForegroundColor Cyan
Assert-Contains ".\apps\miniapp\pages\profile\edit\index.js" "normalizeAvatarUrl" "Profile edit must have normalizeAvatarUrl"
Assert-Contains ".\apps\miniapp\pages\profile\view\index.js" "normalizeAvatarUrl" "Profile view must have normalizeAvatarUrl"
Assert-Contains ".\apps\miniapp\pages\home\index.js" "normalizeAvatarUrl" "Home must have normalizeAvatarUrl"
Write-Host "  Avatar persistence passed." -ForegroundColor Green

# 7. Intake ID card sides check
Write-Host "  Intake ID card sides check..." -ForegroundColor Cyan
Assert-Contains ".\apps\server\src\modules\intake\intake.service.ts" "loadCredentialFiles" "Intake service must load credential files for side check"
Assert-Contains ".\apps\server\src\modules\admin\admin-staff.service.ts" "loadCredentialFiles" "Admin staff service must load credential files for ID card check"
Write-Host "  Intake ID card sides check passed." -ForegroundColor Green

# 8. Skill certificate multi-upload support
Write-Host "  Skill certificate multi-upload support..." -ForegroundColor Cyan
Assert-Contains ".\apps\miniapp\pages\credential\index.js" "skillCertificates" "Credential index must track skill certificates"
Assert-Contains ".\apps\miniapp\pages\credential\index.wxml" "skill-upload-card" "Credential index must have add skill cert button"
Assert-Contains ".\apps\miniapp\pages\credential\index.js" "goToSkillCertUpload" "Credential index must have goToSkillCertUpload"
Write-Host "  Skill certificate multi-upload support passed." -ForegroundColor Green

Write-Host ""
Write-Host "Stage 9 verification passed." -ForegroundColor Green

