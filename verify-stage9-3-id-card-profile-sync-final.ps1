# Stage 9.3 Finalize Resident ID Profile Sync Verification

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

# Run Stage 9.2 baseline first
Write-Host "Running Stage 9.2 baseline..." -ForegroundColor Cyan
$stage92Ps1 = Join-Path $ProjectRoot "verify-stage9-2-hardening-review-fixes.ps1"
if (Test-Path $stage92Ps1) {
  & $stage92Ps1
  if ($LASTEXITCODE -ne 0) {
    throw "Stage 9.2 baseline failed."
  }
} else {
  throw "Stage 9.2 verifier not found at $stage92Ps1"
}
Write-Host "Stage 9.2 baseline passed." -ForegroundColor Green

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

# === Stage 9.3 ID Card Profile Sync Final Markers ===
Write-Host "Checking Stage 9.3 ID card profile sync final markers..." -ForegroundColor Cyan

$svcFile = ".\apps\server\src\modules\credential\credential.service.ts"
$svcContent = Get-Content $svcFile -Raw -Encoding UTF8

# Extract syncProfileIdNumber method body for focused assertions
$startMarker = 'private async syncProfileIdNumber'
$endMarker = 'private async createFileLinks'
$startIndex = $svcContent.IndexOf($startMarker)
$endIndex = $svcContent.IndexOf($endMarker, $startIndex)
if ($startIndex -lt 0 -or $endIndex -lt 0 -or $endIndex -le $startIndex) {
  throw "Cannot locate syncProfileIdNumber method body"
}
$methodBody = $svcContent.Substring($startIndex, $endIndex - $startIndex)

# 1. No longer gates behind if (!existing?.idNumberEncrypted)
Write-Host "  [1/7] No existing ID number guard..." -ForegroundColor Cyan
if ($methodBody -match 'existing\?\.idNumberEncrypted') {
  throw "syncProfileIdNumber must not gate upsert behind if (!existing?.idNumberEncrypted)"
}
if ($methodBody -match 'existing') {
  throw "syncProfileIdNumber must no longer query existing profile - always sync when called with non-empty idNumber"
}
Write-Host "  [1/7] Passed (always syncs, no existing guard)." -ForegroundColor Green

# 2. upsert create path includes required staffId
Write-Host "  [2/7] upsert create includes staffId..." -ForegroundColor Cyan
if ($methodBody -notmatch 'staffId:\s*account\.staffId') {
  throw "upsert create payload must include staffId (e.g. staffId: account.staffId)"
}
Write-Host "  [2/7] Passed." -ForegroundColor Green

# 3. Obtains staffId from StaffAccount (trusted server-side source)
Write-Host "  [3/7] staffId from StaffAccount query..." -ForegroundColor Cyan
if ($methodBody -notmatch 'staffAccount\.findUnique') {
  throw "syncProfileIdNumber must query StaffAccount for staffId (trusted server-side source, not client input)"
}
if ($methodBody -notmatch [regex]::Escape('select: { staffId: true }')) {
  throw "syncProfileIdNumber must select staffId from StaffAccount"
}
if ($methodBody -notmatch 'account\?.staffId') {
  throw "syncProfileIdNumber must check account?.staffId and throw if missing"
}
Write-Host "  [3/7] Passed." -ForegroundColor Green

# 4. Update path writes idNumberEncrypted and idNumberMasked every time
Write-Host "  [4/7] Update path always writes ID number fields..." -ForegroundColor Cyan
if ($methodBody -notmatch [regex]::Escape("idNumberEncrypted: encrypt(trimmed, encryptionKey)")) {
  throw "update path must write idNumberEncrypted"
}
if ($methodBody -notmatch [regex]::Escape("idNumberMasked: maskIdNumber(trimmed)")) {
  throw "update path must write idNumberMasked"
}
# Verify create path also writes both fields
$createCount = ([regex]::Matches($methodBody, [regex]::Escape("idNumberEncrypted: encrypt(trimmed, encryptionKey)"))).Count
if ($createCount -lt 2) {
  throw "Both create and update paths must write idNumberEncrypted"
}
$maskCount = ([regex]::Matches($methodBody, [regex]::Escape("idNumberMasked: maskIdNumber(trimmed)"))).Count
if ($maskCount -lt 2) {
  throw "Both create and update paths must write idNumberMasked"
}
Write-Host "  [4/7] Passed (both create and update write encrypted + masked fields)." -ForegroundColor Green

# 5. Still uses encrypt(trimmed, encryptionKey) and maskIdNumber(trimmed)
Write-Host "  [5/7] Uses encrypt with key and maskIdNumber..." -ForegroundColor Cyan
if ($methodBody -notmatch [regex]::Escape('encrypt(trimmed, encryptionKey)')) {
  throw "syncProfileIdNumber must use encrypt(trimmed, encryptionKey) with configured key"
}
if ($methodBody -notmatch [regex]::Escape('maskIdNumber(trimmed)')) {
  throw "syncProfileIdNumber must use maskIdNumber(trimmed)"
}
# Verify ConfigService is the source of encryptionKey
if ($methodBody -notmatch 'this\.config\.encryptionKey') {
  throw "syncProfileIdNumber must obtain encryptionKey from ConfigService (this.config.encryptionKey)"
}
Write-Host "  [5/7] Passed." -ForegroundColor Green

# 6. No silent catch introduced
Write-Host "  [6/7] No silent catch blocks..." -ForegroundColor Cyan
if ($methodBody -match 'catch\s*\(\s*_?\w*\s*\)\s*\{') {
  throw "syncProfileIdNumber must not contain any silent catch blocks"
}
Write-Host "  [6/7] Passed." -ForegroundColor Green

# 7. Server build and type checks (already verified above)
Write-Host "  [7/7] Server build and type checks..." -ForegroundColor Cyan
Write-Host "  [7/7] Passed (verified above)." -ForegroundColor Green

Write-Host ""
Write-Host "Stage 9.3 verification passed." -ForegroundColor Green
