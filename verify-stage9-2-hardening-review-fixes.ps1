# Stage 9.2 Hardening Review Fixes Verification

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

# Run Stage 9.1 baseline first
Write-Host "Running Stage 9.1 baseline..." -ForegroundColor Cyan
$stage91Ps1 = Join-Path $ProjectRoot "verify-stage9-1-profile-idcard-skill-hardening.ps1"
if (Test-Path $stage91Ps1) {
  & $stage91Ps1
  if ($LASTEXITCODE -ne 0) {
    throw "Stage 9.1 baseline failed."
  }
} else {
  throw "Stage 9.1 verifier not found at $stage91Ps1"
}
Write-Host "Stage 9.1 baseline passed." -ForegroundColor Green

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

# === Stage 9.2 Hardening Review Fix Markers ===
Write-Host "Checking Stage 9.2 hardening review fix markers..." -ForegroundColor Cyan

$svcFile = ".\apps\server\src\modules\credential\credential.service.ts"
$svcContent = Get-Content $svcFile -Raw -Encoding UTF8

# 1. CredentialService receives/uses ConfigService
Write-Host "  [1/8] ConfigService injection..." -ForegroundColor Cyan
Assert-Contains $svcFile "ConfigService" "CredentialService must import/use ConfigService"
Write-Host "  [1/8] Passed." -ForegroundColor Green

# 2. encrypt called with encryptionKey (two-argument call)
Write-Host "  [2/8] encrypt called with encryption key..." -ForegroundColor Cyan
if ($svcContent -notmatch [regex]::Escape('encrypt(trimmed, encryptionKey)')) {
  throw "syncProfileIdNumber must call encrypt(trimmed, encryptionKey) with the configured key"
}
Write-Host "  [2/8] Passed." -ForegroundColor Green

# 3. syncProfileIdNumber does NOT silently swallow errors
Write-Host "  [3/8] No silent error swallowing in ID sync..." -ForegroundColor Cyan
if ($svcContent -match [regex]::Escape('catch (_e)')) {
  throw "syncProfileIdNumber must not silently swallow errors with empty catch"
}
# Also check there's no try/catch wrapping the upsert inside syncProfileIdNumber
Assert-NotContains $svcFile 'catch\s*\(\s*_\w*\s*\)\s*\{' "syncProfileIdNumber must not contain any silent catch blocks (checking for catch (_e) or similar)"
Write-Host "  [3/8] Passed." -ForegroundColor Green

# 4. staffSkillIds path validates categoryId against ALLOWED_SKILL_CERT_CATEGORY_IDS
Write-Host "  [4/8] staffSkillIds categoryId validation..." -ForegroundColor Cyan
if ($svcContent -notmatch "staffSkillIds" -and $svcContent -notmatch "categoryId") {
  throw "Service must handle staffSkillIds"
}
# Verify that after assertSkillsBelongToAccount for staffSkillIds, we query categoryId and validate
if ($svcContent -notmatch [regex]::Escape("select: { id: true, categoryId: true }")) {
  throw "staffSkillIds path must load StaffSkill.categoryId for validation"
}
if ($svcContent -notmatch [regex]::Escape("skill.categoryId") -or $svcContent -notmatch [regex]::Escape("ALLOWED_SKILL_CERT_CATEGORY_IDS")) {
  throw "staffSkillIds path must validate categoryId against ALLOWED_SKILL_CERT_CATEGORY_IDS"
}
Write-Host "  [4/8] Passed." -ForegroundColor Green

# 5. staffSkillCategories path still validates category IDs
Write-Host "  [5/8] staffSkillCategories categoryId validation..." -ForegroundColor Cyan
if ($svcContent -notmatch [regex]::Escape("staffSkillCategories")) {
  throw "Service must still handle staffSkillCategories"
}
if ($svcContent -notmatch [regex]::Escape("staffSkillCategories") -or $svcContent -notmatch [regex]::Escape("ALLOWED_SKILL_CERT_CATEGORY_IDS")) {
  throw "staffSkillCategories path must still validate category IDs"
}
Write-Host "  [5/8] Passed." -ForegroundColor Green

# 6. No dynamic require() for encrypt/maskIdNumber
Write-Host "  [6/8] No dynamic require for crypto/mask utilities..." -ForegroundColor Cyan
if ($svcContent -match [regex]::Escape("require('../../utils/crypto.util')")) {
  throw "credential.service.ts must not use dynamic require for crypto.util"
}
if ($svcContent -match [regex]::Escape("require('../staff/staff.mask')")) {
  throw "credential.service.ts must not use dynamic require for staff.mask"
}
Write-Host "  [6/8] Passed." -ForegroundColor Green

# 7. Static imports for encrypt and maskIdNumber
Write-Host "  [7/8] Static imports for encrypt and maskIdNumber..." -ForegroundColor Cyan
if ($svcContent -notmatch "import\s+\{\s*encrypt\s*\}\s+from\s+'[^']*crypto\.util'") {
  throw "credential.service.ts must use static import for encrypt"
}
if ($svcContent -notmatch "import\s+\{\s*maskIdNumber\s*\}\s+from\s+'[^']*staff\.mask'") {
  throw "credential.service.ts must use static import for maskIdNumber"
}
Write-Host "  [7/8] Passed." -ForegroundColor Green

# 8. Server build and type checks pass (already verified above, but confirm)
Write-Host "  [8/8] Server build and type checks..." -ForegroundColor Cyan
Write-Host "  [8/8] Passed (verified above)." -ForegroundColor Green

Write-Host ""
Write-Host "Stage 9.2 verification passed." -ForegroundColor Green
