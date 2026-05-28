$ErrorActionPreference = "Stop"

$ProjectRoot = $PSScriptRoot

Set-Location -LiteralPath $ProjectRoot

Write-Host "Running Stage 4.1 baseline verification..." -ForegroundColor Cyan
& ".\verify-stage4-1.ps1"
if ($LASTEXITCODE -ne 0) {
  throw "Stage 4.1 baseline verification failed."
}

Write-Host "Checking Stage 4.2 education/student-card markers..." -ForegroundColor Cyan
$requiredMarkers = @(
  "student_card",
  "学历/毕业证",
  "学生证",
  "educationCredentials"
)

foreach ($marker in $requiredMarkers) {
  $matches = Get-ChildItem "apps\server\src","apps\server\prisma","apps\admin\src","apps\miniapp" -Recurse -File -ErrorAction SilentlyContinue | Select-String -Pattern $marker -SimpleMatch | Select-Object -First 1
  if (-not $matches) {
    throw "Missing expected Stage 4.2 marker: $marker"
  }
}

Write-Host "Checking education/student-card remain optional..." -ForegroundColor Cyan
$credentialConstants = Get-Content -LiteralPath ".\apps\server\src\modules\credential\credential.constants.ts" -Raw -Encoding UTF8
$mandatoryBlockMatch = [regex]::Match($credentialConstants, "MANDATORY_CREDENTIAL_TYPES\s*=\s*\[(?<body>[\s\S]*?)\]")
if (-not $mandatoryBlockMatch.Success) {
  throw "Cannot locate MANDATORY_CREDENTIAL_TYPES."
}
$mandatoryBody = $mandatoryBlockMatch.Groups["body"].Value
if ($mandatoryBody -match "education|student_card") {
  throw "education/student_card must not be mandatory in MVP."
}

Write-Host "Checking demo seed Stage 4.2 consistency..." -ForegroundColor Cyan
Push-Location -LiteralPath ".\apps\server"
try {
  & node "prisma\verify-stage4-2-demo.js"
} finally {
  Pop-Location
}

Write-Host "Stage 4.2 verification passed." -ForegroundColor Green
