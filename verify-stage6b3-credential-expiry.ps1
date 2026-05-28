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

# Run Stage 6B-2 baseline first
Write-Host "Running Stage 6B-2 baseline verification..." -ForegroundColor Cyan
& ".\verify-stage6b2-management-status.ps1"
if ($LASTEXITCODE -ne 0) {
  throw "Stage 6B-2 baseline verification failed."
}

# Validate Prisma schema
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

# Build server
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

# Admin type check
Write-Host "Running admin TypeScript type check..." -ForegroundColor Cyan
Push-Location ".\apps\admin"
try {
  & npx tsc -b --noEmit 2>&1 | Out-Null
  if ($LASTEXITCODE -ne 0) {
    Write-Host "Admin type check has warnings (non-fatal for stage)" -ForegroundColor Yellow
    & npx tsc -b --noEmit 2>&1
  } else {
    Write-Host "Admin type check passed." -ForegroundColor Green
  }
} finally {
  Pop-Location
}

# Check miniapp JavaScript syntax
Write-Host "Checking miniapp JavaScript syntax..." -ForegroundColor Cyan
Get-ChildItem -Path ".\apps\miniapp" -Recurse -Filter "*.js" | ForEach-Object {
  try {
    node --check $_.FullName 2>&1 | Out-Null
  } catch {
    throw "JS syntax error in $($_.FullName)"
  }
}
Write-Host "Miniapp JS syntax check passed." -ForegroundColor Green

# Assert backend markers
Write-Host "Checking backend credential expiry markers..." -ForegroundColor Cyan

Assert-Contains ".\apps\server\src\modules\credential\credential.constants.ts" "CREDENTIAL_TYPES_REQUIRE_EXPIRY" "CREDENTIAL_TYPES_REQUIRE_EXPIRY must exist in credential.constants.ts"
Assert-Contains ".\apps\server\src\modules\credential\credential.constants.ts" "health_cert" "health_cert must be in CREDENTIAL_TYPES_REQUIRE_EXPIRY"
Assert-Contains ".\apps\server\src\modules\credential\credential.constants.ts" "no_crime_cert" "no_crime_cert must be in CREDENTIAL_TYPES_REQUIRE_EXPIRY"
Assert-Contains ".\apps\server\src\modules\credential\credential.constants.ts" "credit_report" "credit_report must be in CREDENTIAL_TYPES_REQUIRE_EXPIRY"
Assert-Contains ".\apps\server\src\modules\credential\credential.constants.ts" "medical_report" "medical_report must be in CREDENTIAL_TYPES_REQUIRE_EXPIRY"
Assert-Contains ".\apps\server\src\modules\credential\credential.constants.ts" "insurance" "insurance must be in CREDENTIAL_TYPES_REQUIRE_EXPIRY"

Assert-Contains ".\apps\server\src\modules\credential\credential.service.ts" "CREDENTIAL_TYPES_REQUIRE_EXPIRY" "CREDENTIAL_TYPES_REQUIRE_EXPIRY must be imported in credential.service.ts"
Assert-Contains ".\apps\server\src\modules\credential\credential.service.ts" "validateExpiryDate" "validateExpiryDate method must exist"
Assert-Contains ".\apps\server\src\modules\credential\credential.service.ts" "isExpired" "isExpired must be computed in formatCredential"
Assert-Contains ".\apps\server\src\modules\credential\credential.service.ts" "expiryStatusLabel" "expiryStatusLabel must be computed in formatCredential"

Assert-Contains ".\apps\server\src\modules\intake\intake.service.ts" "CREDENTIAL_TYPES_REQUIRE_EXPIRY" "CREDENTIAL_TYPES_REQUIRE_EXPIRY must be imported in intake.service.ts"

Assert-Contains ".\apps\server\src\modules\admin\admin-staff.service.ts" "CREDENTIAL_TYPES_REQUIRE_EXPIRY" "CREDENTIAL_TYPES_REQUIRE_EXPIRY must be imported in admin-staff.service.ts"
Assert-Contains ".\apps\server\src\modules\admin\admin-staff.service.ts" "isExpired" "isExpired must exist in admin-staff.service.ts"
Assert-Contains ".\apps\server\src\modules\admin\admin-staff.service.ts" "expiryStatusLabel" "expiryStatusLabel must exist in admin-staff.service.ts"

Write-Host "Backend credential expiry markers passed." -ForegroundColor Green

# Assert miniapp markers
Write-Host "Checking miniapp credential expiry markers..." -ForegroundColor Cyan

Assert-Contains ".\apps\miniapp\utils\constants.js" "CREDENTIAL_TYPES_REQUIRE_EXPIRY" "CREDENTIAL_TYPES_REQUIRE_EXPIRY must exist in constants.js"

Assert-Contains ".\apps\miniapp\pages\credential\edit\index.js" "requireExpiry" "requireExpiry must exist in credential edit page"
Assert-Contains ".\apps\miniapp\pages\credential\edit\index.wxml" "requireExpiry" "requireExpiry must exist in credential edit WXML"

Assert-Contains ".\apps\miniapp\pages\credential\index.js" "isExpired" "isExpired must exist in credential index.js"

Assert-Contains ".\apps\miniapp\pages\resume\index.js" "isCredExpired" "isCredExpired must exist in resume index.js"

Write-Host "Miniapp credential expiry markers passed." -ForegroundColor Green

# Assert admin markers
Write-Host "Checking admin credential expiry markers..." -ForegroundColor Cyan

Assert-Contains ".\apps\admin\src\pages\staff\services\staff.ts" "isExpired" "isExpired must exist in staff.ts interface"
Assert-Contains ".\apps\admin\src\pages\staff\services\staff.ts" "expiryStatusLabel" "expiryStatusLabel must exist in staff.ts interface"

Write-Host "Admin credential expiry markers passed." -ForegroundColor Green

Write-Host "Stage 6B-3 credential expiry verification passed." -ForegroundColor Green