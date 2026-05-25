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

Write-Host "Stage 1 verification passed." -ForegroundColor Green
