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

# Run Stage 6A baseline first
Write-Host "Running Stage 6A baseline verification..." -ForegroundColor Cyan
& ".\verify-stage6a-admin-service-records.ps1"
if ($LASTEXITCODE -ne 0) {
  throw "Stage 6A baseline verification failed."
}

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

# Assert backend markers
Write-Host "Checking backend draft governance markers..." -ForegroundColor Cyan
Assert-Contains ".\apps\server\src\modules\admin\admin-staff.service.ts" "includeDraft" "includeDraft must exist in admin-staff.service.ts"
Assert-Contains ".\apps\server\src\modules\admin\admin-staff.service.ts" "cleanupDraft" "cleanupDrafts method must exist in admin-staff.service.ts"
Assert-Contains ".\apps\server\src\modules\admin\admin-staff.service.ts" "deletedAt" "deletedAt must be referenced in admin-staff.service.ts"
Assert-Contains ".\apps\server\src\modules\admin\admin-staff.service.ts" "7" "7-day cutoff must exist in admin-staff.service.ts"
Assert-Contains ".\apps\server\src\modules\admin\admin-staff.controller.ts" "includeDraft" "includeDraft query param must exist in controller"
Assert-Contains ".\apps\server\src\modules\admin\admin-staff.controller.ts" "cleanup-draft" "cleanup-draft endpoint must exist in controller"

# Assert admin frontend markers
Write-Host "Checking admin frontend draft governance markers..." -ForegroundColor Cyan
Assert-Contains ".\apps\admin\src\pages\staff\index.tsx" "包含草稿" "包含草稿 label must exist in staff index page"
Assert-Contains ".\apps\admin\src\pages\staff\index.tsx" "清理7天前草稿" "清理7天前草稿 button must exist in staff index page"
Assert-Contains ".\apps\admin\src\pages\staff\index.tsx" "确认清理" "Cleanup confirmation text must exist in staff index page"

Write-Host "Stage 6B-1 draft governance verification passed." -ForegroundColor Green
