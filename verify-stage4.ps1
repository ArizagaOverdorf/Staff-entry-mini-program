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
$jsonFiles = Get-ChildItem -Recurse -File -Filter "*.json" |
  Where-Object {
    $_.FullName -notlike "*\node_modules\*" -and
    $_.FullName -notlike "*\.git\*" -and
    $_.FullName -notlike "*\dist\*"
  }
foreach ($file in $jsonFiles) {
  try {
    Get-Content -LiteralPath $file.FullName -Raw -Encoding UTF8 | ConvertFrom-Json | Out-Null
  } catch {
    Write-Host "Invalid JSON: $($file.FullName)" -ForegroundColor Red
    throw
  }
}

Write-Host "Checking for empty source files..." -ForegroundColor Cyan
$emptyFiles = Get-ChildItem -Recurse -File |
  Where-Object {
    $_.FullName -notlike "*\node_modules\*" -and
    $_.FullName -notlike "*\.git\*" -and
    $_.FullName -notlike "*\.codex-run\*" -and
    $_.FullName -notlike "*\.pnpm-store\*" -and
    $_.FullName -notlike "*\dist\*" -and
    $_.Length -eq 0
  }

if ($emptyFiles) {
  $emptyFiles | ForEach-Object { Write-Host $_.FullName -ForegroundColor Red }
  throw "Empty source files found."
}

Write-Host "Checking Stage 4 integration markers..." -ForegroundColor Cyan
$requiredMarkers = @(
  "DEMO1001",
  "DEMO1002",
  "DEMO1003",
  "linkedSkills",
  "skillCredentialRequirements",
  "credit_report",
  "medical_report"
)

foreach ($marker in $requiredMarkers) {
  $found = $false
  $searchPaths = @("apps\server\src", "apps\server\prisma", "apps\admin\src", "apps\miniapp")
  foreach ($sp in $searchPaths) {
    if (-not (Test-Path $sp)) { continue }
    $files = Get-ChildItem -Path $sp -Recurse -File -ErrorAction SilentlyContinue |
      Where-Object { $_.FullName -notlike "*\node_modules\*" }
    foreach ($f in $files) {
      if ((Select-String -LiteralPath $f.FullName -Pattern $marker -SimpleMatch -ErrorAction SilentlyContinue)) {
        $found = $true
        break
      }
    }
    if ($found) { break }
  }
  if (-not $found) {
    throw "Missing expected Stage 4 marker: $marker"
  }
}

Write-Host "Verifying demo seed can run..." -ForegroundColor Cyan
Push-Location -LiteralPath ".\apps\server"
try {
  & node "prisma\seed-demo-staff.js"
} finally {
  Pop-Location
}

Write-Host "Checking demo staff data consistency..." -ForegroundColor Cyan
Push-Location -LiteralPath ".\apps\server"
try {
  & node "prisma\verify-demo-staff.js"
} finally {
  Pop-Location
}

Write-Host "Stage 4 verification passed." -ForegroundColor Green
