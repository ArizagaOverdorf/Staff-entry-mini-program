$ErrorActionPreference = "Stop"

$ProjectRoot = $PSScriptRoot

Set-Location -LiteralPath $ProjectRoot

Write-Host "Running Stage 4 baseline verification..." -ForegroundColor Cyan
& ".\verify-stage4.ps1"
if ($LASTEXITCODE -ne 0) {
  throw "Stage 4 baseline verification failed."
}

Write-Host "Checking Stage 4.1 source markers..." -ForegroundColor Cyan
$requiredMarkers = @(
  "student_card",
  "skillLevel",
  "credentialGroupId",
  "credential_group_id"
)

foreach ($marker in $requiredMarkers) {
  $matches = Get-ChildItem "apps\server\src","apps\server\prisma","apps\admin\src","apps\miniapp" -Recurse -File -ErrorAction SilentlyContinue | Select-String -Pattern $marker -SimpleMatch | Select-Object -First 1
  if (-not $matches) {
    throw "Missing expected Stage 4.1 marker: $marker"
  }
}

Write-Host "Checking admin staff detail keeps active tab controlled..." -ForegroundColor Cyan
$detailPath = ".\apps\admin\src\pages\staff\detail.tsx"
$detailSource = Get-Content -LiteralPath $detailPath -Raw -Encoding UTF8
if ($detailSource -notmatch "activeKey=") {
  throw "Staff detail Tabs must use controlled activeKey."
}
if ($detailSource -match "defaultActiveKey=") {
  throw "Staff detail should not rely on defaultActiveKey after Stage 4.1."
}

Write-Host "Checking demo seed Stage 4.1 consistency..." -ForegroundColor Cyan
Push-Location -LiteralPath ".\apps\server"
try {
  & node "prisma\verify-stage4-1-demo.js"
} finally {
  Pop-Location
}

Write-Host "Stage 4.1 verification passed." -ForegroundColor Green

