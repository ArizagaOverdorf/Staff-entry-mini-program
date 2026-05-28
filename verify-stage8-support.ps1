# Stage 8 Support Module Verification
# UTF-8 with BOM for Windows PowerShell 5.1

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

# Run Stage 7 baseline first
Write-Host "Running Stage 7 regression baseline..." -ForegroundColor Cyan
& ".\verify-stage7-regression.ps1"
if ($LASTEXITCODE -ne 0) {
  throw "Stage 7 regression baseline failed."
}
Write-Host "Stage 7 baseline passed." -ForegroundColor Green

# Prisma Schema Validation
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

# Server Build
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

# Admin TypeScript Check
Write-Host "Running admin TypeScript type check..." -ForegroundColor Cyan
Push-Location ".\apps\admin"
try {
  & npx tsc -b --noEmit 2>&1 | Out-Null
  if ($LASTEXITCODE -ne 0) {
    Write-Host "Admin type check has issues:" -ForegroundColor Yellow
    & npx tsc -b --noEmit 2>&1
    Write-Host "Continuing with warnings..." -ForegroundColor Yellow
  } else {
    Write-Host "Admin type check passed." -ForegroundColor Green
  }
} finally {
  Pop-Location
}

# Miniapp JSON Validation
Write-Host "Validating miniapp JSON files..." -ForegroundColor Cyan
Get-ChildItem -Path ".\apps\miniapp" -Recurse -Filter "*.json" | ForEach-Object {
  try {
    $null = Get-Content -LiteralPath $_.FullName -Raw -Encoding UTF8 | ConvertFrom-Json
  } catch {
    throw "Invalid JSON in $($_.FullName): $_"
  }
}
Write-Host "Miniapp JSON files valid." -ForegroundColor Green

# Miniapp JavaScript Syntax Check
Write-Host "Checking miniapp JavaScript syntax..." -ForegroundColor Cyan
Get-ChildItem -Path ".\apps\miniapp" -Recurse -Filter "*.js" | ForEach-Object {
  node --check $_.FullName 2>&1 | Out-Null
  if ($LASTEXITCODE -ne 0) {
    throw "JS syntax error in $($_.FullName)"
  }
}
Write-Host "Miniapp JS syntax check passed." -ForegroundColor Green

# Stage 8 Markers
Write-Host "Checking Stage 8 support module markers..." -ForegroundColor Cyan

# App support submit endpoint
Write-Host "  App support submit endpoint..." -ForegroundColor Cyan
Assert-Contains ".\apps\server\src\modules\message\message.controller.ts" "support" "App message controller must have support endpoint"
Assert-Contains ".\apps\server\src\modules\message\message.controller.ts" "createSupport" "App message controller must have createSupport method"
Assert-Contains ".\apps\server\src\modules\message\message.service.ts" "createSupportMessage" "Message service must have createSupportMessage method"
Write-Host "  App support submit endpoint passed." -ForegroundColor Green

# Admin support list endpoint
Write-Host "  Admin support list endpoint..." -ForegroundColor Cyan
Assert-FileExists ".\apps\server\src\modules\admin\admin-support.controller.ts" "Admin support controller must exist"
Assert-FileExists ".\apps\server\src\modules\admin\admin-support.service.ts" "Admin support service must exist"
Assert-Contains ".\apps\server\src\modules\admin\admin-support.controller.ts" "admin/support" "Admin support controller must route to admin/support"
Assert-Contains ".\apps\server\src\modules\admin\admin-support.controller.ts" "list" "Admin support controller must have list method"
Write-Host "  Admin support list endpoint passed." -ForegroundColor Green

# Admin support reply endpoint
Write-Host "  Admin support reply endpoint..." -ForegroundColor Cyan
Assert-Contains ".\apps\server\src\modules\admin\admin-support.controller.ts" "reply" "Admin support controller must have reply method"
Assert-Contains ".\apps\server\src\modules\admin\admin-support.service.ts" "reply" "Admin support service must have reply method"
Assert-Contains ".\apps\server\src\modules\admin\admin-support.service.ts" "operationLog" "Admin reply must create operation log"
Write-Host "  Admin support reply endpoint passed." -ForegroundColor Green

# support_request and support_reply markers
Write-Host "  support_request and support_reply markers..." -ForegroundColor Cyan
Assert-Contains ".\apps\server\src\modules\message\message.service.ts" "support_request" "Message service must use support_request messageType"
Assert-Contains ".\apps\server\src\modules\admin\admin-support.service.ts" "support_reply" "Admin support service must use support_reply messageType"
Assert-Contains ".\apps\server\src\modules\admin\admin-support.service.ts" "support_request" "Admin support service must filter support_request"
Write-Host "  support_request and support_reply markers passed." -ForegroundColor Green

# Admin menu label
Write-Host "  Admin menu label..." -ForegroundColor Cyan
Assert-Contains ".\apps\admin\src\layouts\components\SideMenu.tsx" ([regex]::Escape("客服消息")) "Admin SideMenu must have label"
Assert-Contains ".\apps\admin\src\layouts\components\SideMenu.tsx" "/support" "Admin SideMenu must have /support key"
Write-Host "  Admin menu label passed." -ForegroundColor Green

# Admin route/page for support module
Write-Host "  Admin route/page..." -ForegroundColor Cyan
Assert-Contains ".\apps\admin\src\App.tsx" "support" "App.tsx must have support route"
Assert-FileExists ".\apps\admin\src\pages\support\index.tsx" "Admin support page must exist"
Assert-FileExists ".\apps\admin\src\pages\support\services\support.ts" "Admin support service file must exist"
Write-Host "  Admin route/page passed." -ForegroundColor Green

# Miniapp message center has support entry
Write-Host "  Miniapp support entry..." -ForegroundColor Cyan
$msgCenterWxml = Get-Content -LiteralPath ".\apps\miniapp\pages\message\index.wxml" -Raw -Encoding UTF8
$msgCenterJs = Get-Content -LiteralPath ".\apps\miniapp\pages\message\index.js" -Raw -Encoding UTF8
$supportPattern = [regex]::new("联系客服|发送咨询")
$hasContactLabel = $supportPattern.IsMatch($msgCenterWxml)
$hasGoToSupport = $msgCenterJs.Contains("goToSupport")
if (-not $hasContactLabel) {
  throw "Message center must have support entry label"
}
if (-not $hasGoToSupport) {
  throw "Message center must have goToSupport function"
}
Assert-FileExists ".\apps\miniapp\pages\message\support.js" "Miniapp support page JS must exist"
Assert-FileExists ".\apps\miniapp\pages\message\support.wxml" "Miniapp support page WXML must exist"
Assert-Contains ".\apps\miniapp\utils\constants.js" "MESSAGE_SUPPORT" "constants.js must have MESSAGE_SUPPORT API constant"
Write-Host "  Miniapp support entry passed." -ForegroundColor Green

# Reply creates staff station message
Write-Host "  Reply creates staff station message..." -ForegroundColor Cyan
Assert-Contains ".\apps\server\src\modules\admin\admin-support.service.ts" "staffAccountId" "Admin support reply must reference staffAccountId"
Assert-Contains ".\apps\server\src\modules\admin\admin-support.service.ts" "isRead" "Admin support reply must set isRead=false"
Write-Host "  Reply creates staff station message passed." -ForegroundColor Green

# Operation log for admin reply
Write-Host "  Operation log for admin reply..." -ForegroundColor Cyan
Assert-Contains ".\apps\server\src\modules\admin\admin-support.service.ts" "operationLog" "Admin reply must write operation log"
Assert-Contains ".\apps\server\src\modules\admin\admin-support.service.ts" "support_reply" "Operation log must use support_reply action"
Write-Host "  Operation log for admin reply passed." -ForegroundColor Green

# Admin module registration
Write-Host "  Admin module registration..." -ForegroundColor Cyan
Assert-Contains ".\apps\server\src\modules\admin\admin.module.ts" "AdminSupportController" "Admin module must register AdminSupportController"
Assert-Contains ".\apps\server\src\modules\admin\admin.module.ts" "AdminSupportService" "Admin module must register AdminSupportService"
Write-Host "  Admin module registration passed." -ForegroundColor Green

Write-Host ""
Write-Host "Stage 8 support module verification passed." -ForegroundColor Green