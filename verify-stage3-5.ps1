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
    $_.FullName -notlike "*\.codex-run\*" -and
    $_.FullName -notlike "*\.pnpm-store\*" -and
    $_.FullName -notlike "*\dist\*" -and
    $_.Length -eq 0
  }

if ($emptyFiles) {
  $emptyFiles | ForEach-Object { Write-Host $_.FullName -ForegroundColor Red }
  throw "Empty source files found."
}

Write-Host "Checking Stage 3.5 credential rule markers..." -ForegroundColor Cyan
$requiredMarkers = @(
  "credit_report",
  "medical_report",
  "no_crime_cert",
  "StaffCredentialSkill",
  "staffSkillIds",
  "linkedSkills",
  "SKILL_CREDENTIAL_REQUIRED_CATEGORY_IDS",
  "skillCredentialRequirements"
)

foreach ($marker in $requiredMarkers) {
  $matches = & rg -n -F $marker "apps\server\src" "apps\server\prisma" "apps\admin\src" "apps\miniapp" 2>$null
  if (-not $matches) {
    throw "Missing expected Stage 3.5 marker: $marker"
  }
}

Write-Host "Stage 3.5 verification passed." -ForegroundColor Green
