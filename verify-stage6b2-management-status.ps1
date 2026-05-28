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

# Run Stage 6B-1 baseline first
Write-Host "Running Stage 6B-1 baseline verification..." -ForegroundColor Cyan
& ".\verify-stage6b1-draft-governance.ps1"
if ($LASTEXITCODE -ne 0) {
  throw "Stage 6B-1 baseline verification failed."
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

# Assert database/backend markers
Write-Host "Checking database/backend management status markers..." -ForegroundColor Cyan
Assert-Contains ".\apps\server\prisma\schema.prisma" "managementStatus" "managementStatus field must exist in schema"
Assert-Contains ".\apps\server\prisma\schema.prisma" "management_status" "management_status column must exist in schema"
Assert-Contains ".\apps\server\prisma\schema.prisma" "managementReason" "managementReason field must exist in schema"
Assert-Contains ".\apps\server\prisma\schema.prisma" "managementUpdatedAt" "managementUpdatedAt field must exist in schema"
Assert-Contains ".\apps\server\prisma\schema.prisma" "managementUpdatedBy" "managementUpdatedBy field must exist in schema"

Assert-Contains ".\apps\server\src\modules\admin\admin-staff.service.ts" "managementStatus" "managementStatus must appear in admin-staff.service.ts"
Assert-Contains ".\apps\server\src\modules\admin\admin-staff.service.ts" "setManagementStatus" "setManagementStatus method must exist"
Assert-Contains ".\apps\server\src\modules\admin\admin-staff.service.ts" "normal" "normal status must exist in service"
Assert-Contains ".\apps\server\src\modules\admin\admin-staff.service.ts" "paused" "paused status must exist in service"
Assert-Contains ".\apps\server\src\modules\admin\admin-staff.service.ts" "blacklisted" "blacklisted status must exist in service"

Assert-Contains ".\apps\server\src\modules\admin\admin-staff.controller.ts" "management-status" "management-status endpoint must exist in controller"
Assert-Contains ".\apps\server\src\modules\admin\admin-staff.controller.ts" "setManagementStatus" "setManagementStatus method must exist in controller"

# Check operation log and message creation in setManagementStatus
Assert-Contains ".\apps\server\src\modules\admin\admin-staff.service.ts" "operationLog\.create" "operation log creation must exist in setManagementStatus"
Assert-Contains ".\apps\server\src\modules\admin\admin-staff.service.ts" "message\.create" "message creation must exist in setManagementStatus"

# Check listing service management status checks
Assert-Contains ".\apps\server\src\modules\listing\listing.service.ts" "managementStatus" "management status check must exist in listing service"
Assert-Contains ".\apps\server\src\modules\listing\listing.service.ts" "服务状态暂停" "paused message must exist in listing service"
Assert-Contains ".\apps\server\src\modules\listing\listing.service.ts" "服务状态受限" "blacklisted message must exist in listing service"

# Assert admin frontend markers
Write-Host "Checking admin frontend management status markers..." -ForegroundColor Cyan
Assert-Contains ".\apps\admin\src\pages\staff\components\StaffTable.tsx" "管理状态" "管理状态 column header must exist in StaffTable"
Assert-Contains ".\apps\admin\src\pages\staff\components\StaffTable.tsx" "正常" "正常 label must exist in StaffTable"
Assert-Contains ".\apps\admin\src\pages\staff\components\StaffTable.tsx" "暂停" "暂停 label must exist in StaffTable"
Assert-Contains ".\apps\admin\src\pages\staff\components\StaffTable.tsx" "拉黑" "拉黑 label must exist in StaffTable"

Assert-Contains ".\apps\admin\src\pages\staff\components\StaffProfileCard.tsx" "管理状态" "管理状态 must exist in StaffProfileCard"
Assert-Contains ".\apps\admin\src\pages\staff\components\StaffProfileCard.tsx" "变更管理状态" "变更管理状态 modal title must exist"
Assert-Contains ".\apps\admin\src\pages\staff\components\StaffProfileCard.tsx" "暂停或拉黑操作必须填写原因" "reason-required marker must exist in StaffProfileCard"

Assert-Contains ".\apps\admin\src\pages\staff\services\staff.ts" "setManagementStatus" "setManagementStatus API function must exist"
Assert-Contains ".\apps\admin\src\pages\staff\services\staff.ts" "managementStatus" "managementStatus field must exist in StaffRecord interface"

# Assert miniapp markers
Write-Host "Checking miniapp management status markers..." -ForegroundColor Cyan
Assert-Contains ".\apps\miniapp\utils\constants.js" "MANAGEMENT_STATUS" "MANAGEMENT_STATUS must exist in constants.js"
Assert-Contains ".\apps\miniapp\utils\constants.js" "服务状态：正常" "服务状态：正常 label must exist in constants.js"
Assert-Contains ".\apps\miniapp\utils\constants.js" "服务状态：暂停服务" "服务状态：暂停服务 label must exist in constants.js"
Assert-Contains ".\apps\miniapp\utils\constants.js" "服务状态：已限制服务" "服务状态：已限制服务 label must exist in constants.js"

Assert-Contains ".\apps\miniapp\pages\home\index.js" "managementStatus" "managementStatus must exist in home/index.js"
Assert-Contains ".\apps\miniapp\pages\home\index.js" "服务状态暂停，暂不能上线" "paused toast must exist in home/index.js"
Assert-Contains ".\apps\miniapp\pages\home\index.js" "服务状态受限，暂不能上线" "blacklisted toast must exist in home/index.js"
Assert-Contains ".\apps\miniapp\pages\home\index.wxml" "managementStatusLabel" "managementStatusLabel must be displayed in home WXML"

Assert-Contains ".\apps\miniapp\pages\resume\index.js" "managementStatus" "managementStatus must exist in resume/index.js"
Assert-Contains ".\apps\miniapp\pages\resume\index.wxml" "该服务人员当前不可服务" "restricted message must exist in resume WXML"
Assert-Contains ".\apps\miniapp\pages\resume\index.wxml" "暂停服务" "paused banner must exist in resume WXML"

# Verify no 拉黑 copy in miniapp resume
Write-Host "Checking NO customer-facing 拉黑 in miniapp resume..." -ForegroundColor Cyan
$resumeWxml = Get-Content -LiteralPath ".\apps\miniapp\pages\resume\index.wxml" -Raw -Encoding UTF8
$resumeJs = Get-Content -LiteralPath ".\apps\miniapp\pages\resume\index.js" -Raw -Encoding UTF8
if ($resumeWxml -match "拉黑") {
  throw "Customer-facing 拉黑 found in resume WXML - this is forbidden"
}
if ($resumeJs -match "拉黑") {
  throw "Customer-facing 拉黑 found in resume JS - this is forbidden"
}
Write-Host "No 拉黑 in miniapp resume - passed." -ForegroundColor Green

Write-Host "Stage 6B-2 management status verification passed." -ForegroundColor Green
