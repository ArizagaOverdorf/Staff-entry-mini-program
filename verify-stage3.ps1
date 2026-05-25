$ErrorActionPreference = "Stop"

$ProjectRoot = $PSScriptRoot

Set-Location -LiteralPath $ProjectRoot

Write-Host "Validating Prisma schema..." -ForegroundColor Cyan
& ".\apps\server\node_modules\.bin\prisma.CMD" validate --schema "apps\server\prisma\schema.prisma"

Write-Host "Checking Prisma migration status..." -ForegroundColor Cyan
& ".\apps\server\node_modules\.bin\prisma.CMD" migrate status --schema "apps\server\prisma\schema.prisma"

Write-Host "Building server..." -ForegroundColor Cyan
Push-Location -LiteralPath ".\apps\server"
try {
  & ".\node_modules\.bin\nest.CMD" build
} finally {
  Pop-Location
}

Write-Host "Checking admin TypeScript..." -ForegroundColor Cyan
Push-Location -LiteralPath ".\apps\admin"
try {
  & ".\node_modules\.bin\tsc.CMD" -b
} finally {
  Pop-Location
}

Write-Host "Validating JSON files..." -ForegroundColor Cyan
$jsonFiles = & rg --files -g "*.json" -g "!node_modules" -g "!.git" -g "!dist"
foreach ($file in $jsonFiles) {
  Get-Content -LiteralPath $file -Raw -Encoding UTF8 | ConvertFrom-Json | Out-Null
}

Write-Host "Checking for empty source files..." -ForegroundColor Cyan
$emptyFiles = Get-ChildItem -Recurse -File |
  Where-Object {
    $_.FullName -notlike "*\node_modules\*" -and
    $_.FullName -notlike "*\.git\*" -and
    $_.FullName -notlike "*\.pnpm-store\*" -and
    $_.FullName -notlike "*\dist\*" -and
    $_.Length -eq 0
  }

if ($emptyFiles) {
  $emptyFiles | ForEach-Object { Write-Host $_.FullName -ForegroundColor Red }
  throw "Empty source files found."
}

Write-Host "Checking Stage 3 route markers..." -ForegroundColor Cyan
$requiredMarkers = @(
  "review/approve",
  "review/reject",
  "request-more-info",
  "credentials/:credentialId/review",
  "unread-count",
  "file_preview",
  "intake_approve",
  "intake_reject",
  "intake_request_more_info",
  "credential_approve",
  "credential_reject",
  "MessageController",
  "ReviewActions",
  "AuditHistory",
  "CredentialReviewList"
)

foreach ($marker in $requiredMarkers) {
  $matches = & rg -n -F $marker "apps\server\src" "apps\admin\src" "apps\miniapp" 2>$null
  if (-not $matches) {
    throw "Missing expected Stage 3 marker: $marker"
  }
}

Write-Host "Stage 3 verification passed." -ForegroundColor Green
