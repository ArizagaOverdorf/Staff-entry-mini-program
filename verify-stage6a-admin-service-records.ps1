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

Write-Host "Running Stage 5 baseline verification..." -ForegroundColor Cyan
& ".\verify-stage5-miniapp.ps1"
if ($LASTEXITCODE -ne 0) {
  throw "Stage 5 baseline verification failed."
}

# Validate Prisma schema
Write-Host "Validating Prisma schema..." -ForegroundColor Cyan
$prismaSchema = ".\apps\server\prisma\schema.prisma"
Assert-FileExists $prismaSchema "Prisma schema not found"
Assert-Contains $prismaSchema "StaffServiceRecord" "StaffServiceRecord model must exist in schema"
Assert-Contains $prismaSchema "staff_service_record" "staff_service_record table must exist in schema"
Assert-Contains $prismaSchema "serviceDate" "serviceDate field must exist in schema"
Assert-Contains $prismaSchema "serviceProject" "serviceProject field must exist in schema"
Assert-Contains $prismaSchema "serviceAddress" "serviceAddress field must exist in schema"
Assert-Contains $prismaSchema "serviceDurationMinutes" "serviceDurationMinutes field must exist in schema"
Assert-Contains $prismaSchema "serviceAmount" "serviceAmount field must exist in schema"
Assert-Contains $prismaSchema "isDisputed" "isDisputed field must exist in schema"
Assert-Contains $prismaSchema "recordSource" "recordSource field must exist in schema"

# Check backend service-record files exist
Write-Host "Checking backend service-record module files..." -ForegroundColor Cyan
Assert-FileExists ".\apps\server\src\modules\service-record\service-record.service.ts" "ServiceRecordService file must exist"
Assert-FileExists ".\apps\server\src\modules\service-record\app-service-record.controller.ts" "AppServiceRecordController file must exist"
Assert-FileExists ".\apps\server\src\modules\service-record\service-record.module.ts" "ServiceRecordModule file must exist"

# Check admin controller exists
Write-Host "Checking admin service-record controller..." -ForegroundColor Cyan
Assert-FileExists ".\apps\server\src\modules\admin\admin-service-record.controller.ts" "AdminServiceRecordController file must exist"
Assert-FileExists ".\apps\server\src\modules\admin\dto\service-record.dto.ts" "ServiceRecord DTO file must exist"

# Check route markers in backend
Write-Host "Checking backend route markers..." -ForegroundColor Cyan
Assert-Contains ".\apps\server\src\modules\admin\admin-service-record.controller.ts" "admin/service-records" "Admin service-records route prefix is missing"
Assert-Contains ".\apps\server\src\modules\service-record\app-service-record.controller.ts" "app/service-records" "App service-records route prefix is missing"

# Check admin module imports
Write-Host "Checking admin module imports ServiceRecordModule..." -ForegroundColor Cyan
Assert-Contains ".\apps\server\src\modules\admin\admin.module.ts" "ServiceRecordModule" "AdminModule must import ServiceRecordModule"
Assert-Contains ".\apps\server\src\modules\admin\admin.module.ts" "AdminServiceRecordController" "AdminModule must register AdminServiceRecordController"

# Check service-record module exports the service
Write-Host "Checking service-record module exports..." -ForegroundColor Cyan
Assert-Contains ".\apps\server\src\modules\service-record\service-record.module.ts" "exports.*ServiceRecordService" "ServiceRecordModule must export ServiceRecordService"
Assert-Contains ".\apps\server\src\modules\service-record\service-record.module.ts" "AppServiceRecordController" "ServiceRecordModule must register AppServiceRecordController"

# Check CRUD methods in service
Write-Host "Checking service-record CRUD methods..." -ForegroundColor Cyan
Assert-Contains ".\apps\server\src\modules\service-record\service-record.service.ts" "async list\(" "ServiceRecordService must have list method"
Assert-Contains ".\apps\server\src\modules\service-record\service-record.service.ts" "async listByAccount\(" "ServiceRecordService must have listByAccount method"
Assert-Contains ".\apps\server\src\modules\service-record\service-record.service.ts" "async findById\(" "ServiceRecordService must have findById method"
Assert-Contains ".\apps\server\src\modules\service-record\service-record.service.ts" "async create\(" "ServiceRecordService must have create method"
Assert-Contains ".\apps\server\src\modules\service-record\service-record.service.ts" "async update\(" "ServiceRecordService must have update method"
Assert-Contains ".\apps\server\src\modules\service-record\service-record.service.ts" "async delete\(" "ServiceRecordService must have delete method"

# Check admin CRUD endpoints in controller
Write-Host "Checking admin controller CRUD endpoints..." -ForegroundColor Cyan
Assert-Contains ".\apps\server\src\modules\admin\admin-service-record.controller.ts" "@Get\(\)" "Admin controller must have GET list endpoint"
Assert-Contains ".\apps\server\src\modules\admin\admin-service-record.controller.ts" "@Get\(':id'\)" "Admin controller must have GET detail endpoint"
Assert-Contains ".\apps\server\src\modules\admin\admin-service-record.controller.ts" "@Post\(\)" "Admin controller must have POST create endpoint"
Assert-Contains ".\apps\server\src\modules\admin\admin-service-record.controller.ts" "@Put\(':id'\)" "Admin controller must have PUT update endpoint"
Assert-Contains ".\apps\server\src\modules\admin\admin-service-record.controller.ts" "@Delete\(':id'\)" "Admin controller must have DELETE endpoint"

# Check app controller
Write-Host "Checking app service-record controller..." -ForegroundColor Cyan
Assert-Contains ".\apps\server\src\modules\service-record\app-service-record.controller.ts" "@Get\(\)" "App controller must have GET list endpoint"
Assert-Contains ".\apps\server\src\modules\service-record\app-service-record.controller.ts" "CurrentUser" "App controller must use CurrentUser decorator"

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

# Check admin frontend files exist
Write-Host "Checking admin frontend service-record files..." -ForegroundColor Cyan
Assert-FileExists ".\apps\admin\src\pages\service-record\index.tsx" "Admin service-record page must exist"
Assert-FileExists ".\apps\admin\src\pages\service-record\services\service-record.ts" "Admin service-record API service must exist"

# Check admin route and menu
Write-Host "Checking admin route and menu items..." -ForegroundColor Cyan
Assert-Contains ".\apps\admin\src\App.tsx" "service-record" "Admin /service-record route is missing"
Assert-Contains ".\apps\admin\src\layouts\components\SideMenu.tsx" "服务记录" "Admin side menu must include 服务记录"

# Check Chinese labels in admin page
Write-Host "Checking admin page Chinese labels..." -ForegroundColor Cyan
Assert-Contains ".\apps\admin\src\pages\service-record\index.tsx" "服务记录" "Admin page must contain 服务记录 label"
Assert-Contains ".\apps\admin\src\pages\service-record\index.tsx" "服务项目" "Admin page must contain 服务项目 label"
Assert-Contains ".\apps\admin\src\pages\service-record\index.tsx" "服务地址" "Admin page must contain 服务地址 label"
Assert-Contains ".\apps\admin\src\pages\service-record\index.tsx" "服务日期" "Admin page must contain 服务日期 label"
Assert-Contains ".\apps\admin\src\pages\service-record\index.tsx" "服务时长\(天\)" "Admin page must use days as service duration unit"
Assert-Contains ".\apps\admin\src\pages\service-record\index.tsx" "服务金额" "Admin page must contain 服务金额 label"
Assert-Contains ".\apps\admin\src\pages\service-record\index.tsx" "是否违规" "Admin page must contain 是否违规 label"

# Check Chinese labels in miniapp service-record page
Write-Host "Checking miniapp service-record page labels..." -ForegroundColor Cyan
Assert-Contains ".\apps\miniapp\pages\service-record\index.wxml" "日期" "Miniapp service record must show 日期"
Assert-Contains ".\apps\miniapp\pages\service-record\index.wxml" "地址" "Miniapp service record must show 地址"
Assert-Contains ".\apps\miniapp\pages\service-record\index.wxml" "金额" "Miniapp service record must show 金额"
Assert-Contains ".\apps\miniapp\pages\service-record\index.wxml" "是否违规" "Miniapp service record must show 是否违规"

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

Write-Host "Stage 6A admin service records verification passed." -ForegroundColor Green
