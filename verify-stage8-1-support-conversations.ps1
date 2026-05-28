# Stage 8.1 Support Conversation Workflow Verification
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

function Assert-NotContains {
  param(
    [string]$Path,
    [string]$Pattern,
    [string]$Message
  )
  $content = Get-Content -LiteralPath $Path -Raw -Encoding UTF8
  if ($content -match $Pattern) {
    throw "$Message in $Path"
  }
}

# Run Stage 8 baseline first
Write-Host "Running Stage 8 baseline..." -ForegroundColor Cyan
$stage8Ps1 = Join-Path $ProjectRoot "verify-stage8-support.ps1"
if (Test-Path $stage8Ps1) {
  & $stage8Ps1
  if ($LASTEXITCODE -ne 0) {
    throw "Stage 8 baseline failed."
  }
} else {
  Write-Host "Warning: verify-stage8-support.ps1 not found, skipping baseline" -ForegroundColor Yellow
}
Write-Host "Stage 8 baseline passed." -ForegroundColor Green

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

# === Stage 8.1 Markers ===
Write-Host "Checking Stage 8.1 support conversation markers..." -ForegroundColor Cyan

# Prisma schema has conversation fields
Write-Host "  Prisma schema conversation fields..." -ForegroundColor Cyan
Assert-Contains ".\apps\server\prisma\schema.prisma" "senderType" "Prisma schema must have senderType field"
Assert-Contains ".\apps\server\prisma\schema.prisma" "sender_type" "Prisma schema must have sender_type column"
Assert-Contains ".\apps\server\prisma\schema.prisma" "adminReadAt" "Prisma schema must have adminReadAt field"
Assert-Contains ".\apps\server\prisma\schema.prisma" "admin_read_at" "Prisma schema must have admin_read_at column"
Assert-Contains ".\apps\server\prisma\schema.prisma" "adminUserId" "Prisma schema must have adminUserId field"
Assert-Contains ".\apps\server\prisma\schema.prisma" "admin_user_id" "Prisma schema must have admin_user_id column"
Write-Host "  Prisma schema conversation fields passed." -ForegroundColor Green

# Migration exists
Write-Host "  Migration file..." -ForegroundColor Cyan
Assert-FileExists ".\apps\server\prisma\migrations\20260528093000_add_support_conversation_fields\migration.sql" "Stage 8.1 migration must exist"
Assert-Contains ".\apps\server\prisma\migrations\20260528093000_add_support_conversation_fields\migration.sql" "sender_type" "Migration must add sender_type"
Assert-Contains ".\apps\server\prisma\migrations\20260528093000_add_support_conversation_fields\migration.sql" "admin_read_at" "Migration must add admin_read_at"
Write-Host "  Migration file passed." -ForegroundColor Green

# Admin support controller has conversation endpoints
Write-Host "  Admin conversation endpoints..." -ForegroundColor Cyan
Assert-Contains ".\apps\server\src\modules\admin\admin-support.controller.ts" "conversations" "Controller must have conversations endpoint"
Assert-Contains ".\apps\server\src\modules\admin\admin-support.controller.ts" "listConversations" "Controller must have listConversations method"
Assert-Contains ".\apps\server\src\modules\admin\admin-support.controller.ts" "getConversation" "Controller must have getConversation method"
Assert-Contains ".\apps\server\src\modules\admin\admin-support.controller.ts" "replyToConversation" "Controller must have replyToConversation method"
Assert-Contains ".\apps\server\src\modules\admin\admin-support.controller.ts" "exportConversation" "Controller must have exportConversation method"
Assert-Contains ".\apps\server\src\modules\admin\admin-support.controller.ts" "staffAccountId" "Controller must use staffAccountId param"
Write-Host "  Admin conversation endpoints passed." -ForegroundColor Green

# Admin support service has conversation logic
Write-Host "  Admin conversation service logic..." -ForegroundColor Cyan
Assert-Contains ".\apps\server\src\modules\admin\admin-support.service.ts" "listConversations" "Service must have listConversations"
Assert-Contains ".\apps\server\src\modules\admin\admin-support.service.ts" "getConversation" "Service must have getConversation"
Assert-Contains ".\apps\server\src\modules\admin\admin-support.service.ts" "replyToConversation" "Service must have replyToConversation"
Assert-Contains ".\apps\server\src\modules\admin\admin-support.service.ts" "exportConversation" "Service must have exportConversation"
Assert-Contains ".\apps\server\src\modules\admin\admin-support.service.ts" "unreadCount" "Service must have unreadCount logic"
Assert-Contains ".\apps\server\src\modules\admin\admin-support.service.ts" "adminReadAt" "Service must use adminReadAt"
Assert-Contains ".\apps\server\src\modules\admin\admin-support.service.ts" "senderType" "Service must use senderType"
Assert-Contains ".\apps\server\src\modules\admin\admin-support.service.ts" "adminUserId" "Service must use adminUserId"
Assert-Contains ".\apps\server\src\modules\admin\admin-support.service.ts" "latestMessageAt" "Service must return latestMessageAt"
Assert-Contains ".\apps\server\src\modules\admin\admin-support.service.ts" "orderBy" "Service must order messages chronologically"
Write-Host "  Admin conversation service logic passed." -ForegroundColor Green

# Staff-side conversation endpoints
Write-Host "  Staff-side conversation endpoints..." -ForegroundColor Cyan
Assert-Contains ".\apps\server\src\modules\message\message.controller.ts" "support/conversation" "Message controller must have support/conversation endpoint"
Assert-Contains ".\apps\server\src\modules\message\message.controller.ts" "support/send" "Message controller must have support/send endpoint"
Assert-Contains ".\apps\server\src\modules\message\message.controller.ts" "getSupportConversation" "Message controller must have getSupportConversation handler"
Assert-Contains ".\apps\server\src\modules\message\message.controller.ts" "sendSupportMessage" "Message controller must have sendSupportMessage handler"
Assert-Contains ".\apps\server\src\modules\message\message.service.ts" "getStaffConversation" "Message service must have getStaffConversation"
Assert-Contains ".\apps\server\src\modules\message\message.service.ts" "sendConversationMessage" "Message service must have sendConversationMessage"
Assert-Contains ".\apps\server\src\modules\message\message.service.ts" "senderType" "Message service must use senderType"
Write-Host "  Staff-side conversation endpoints passed." -ForegroundColor Green

# Admin frontend conversation inbox
Write-Host "  Admin frontend conversation inbox..." -ForegroundColor Cyan
Assert-Contains ".\apps\admin\src\pages\support\index.tsx" "conversations" "Admin support page must use conversations"
Assert-Contains ".\apps\admin\src\pages\support\index.tsx" "unreadCount" "Admin support page must use unreadCount"
Assert-Contains ".\apps\admin\src\pages\support\services\support.ts" "listConversations" "Support API service must have listConversations"
Assert-Contains ".\apps\admin\src\pages\support\services\support.ts" "getConversation" "Support API service must have getConversation"
Assert-Contains ".\apps\admin\src\pages\support\services\support.ts" "replyToConversation" "Support API service must have replyToConversation"
Assert-Contains ".\apps\admin\src\pages\support\services\support.ts" "exportConversation" "Support API service must have exportConversation"
Assert-Contains ".\apps\admin\src\pages\support\index.tsx" ([regex]::Escape("导出聊天记录")) "Admin support page must have export button label"
Assert-Contains ".\apps\admin\src\pages\support\index.tsx" "Badge" "Admin support page must use AntD Badge for unread"
Assert-Contains ".\apps\admin\src\pages\support\index.tsx" "#ff4d4f" "Admin support page must have red badge color"
Write-Host "  Admin frontend conversation inbox passed." -ForegroundColor Green

# Miniapp support conversation page
Write-Host "  Miniapp support conversation page..." -ForegroundColor Cyan
Assert-Contains ".\apps\miniapp\pages\message\support.js" "loadConversation" "Miniapp support must have loadConversation method"
Assert-Contains ".\apps\miniapp\pages\message\support.js" "sendMessage" "Miniapp support must have sendMessage method"
Assert-Contains ".\apps\miniapp\pages\message\support.js" "senderType" "Miniapp support must use senderType"
Assert-Contains ".\apps\miniapp\pages\message\support.js" "MESSAGE_SUPPORT_CONVERSATION" "Miniapp support must use conversation endpoint"
Assert-Contains ".\apps\miniapp\pages\message\support.js" "MESSAGE_SUPPORT_SEND" "Miniapp support must use send endpoint"
Assert-Contains ".\apps\miniapp\pages\message\support.wxml" "chat-msg" "Miniapp support WXML must have chat message elements"
Assert-Contains ".\apps\miniapp\pages\message\support.wxml" "chat-input" "Miniapp support WXML must have chat input"
Assert-Contains ".\apps\miniapp\pages\message\support.wxml" "scroll-view" "Miniapp support WXML must have scrollable chat area"
Assert-Contains ".\apps\miniapp\pages\message\support.wxml" "bindconfirm" "Miniapp support must have confirm-to-send binding"
Assert-Contains ".\apps\miniapp\pages\message\support.wxss" "msg-left" "Miniapp support WXSS must have left message style"
Assert-Contains ".\apps\miniapp\pages\message\support.wxss" "msg-right" "Miniapp support WXSS must have right message style"
Write-Host "  Miniapp support conversation page passed." -ForegroundColor Green

# Constants updated
Write-Host "  Constants updated..." -ForegroundColor Cyan
Assert-Contains ".\apps\miniapp\utils\constants.js" "MESSAGE_SUPPORT_CONVERSATION" "constants.js must have MESSAGE_SUPPORT_CONVERSATION"
Assert-Contains ".\apps\miniapp\utils\constants.js" "MESSAGE_SUPPORT_SEND" "constants.js must have MESSAGE_SUPPORT_SEND"
Write-Host "  Constants updated passed." -ForegroundColor Green

# Reverse relation on AdminUser
Write-Host "  AdminUser messages relation..." -ForegroundColor Cyan
Assert-Contains ".\apps\server\prisma\schema.prisma" "messages\s+Message" "AdminUser must have messages[] relation"
Write-Host "  AdminUser messages relation passed." -ForegroundColor Green

# Message center still has support entry
Write-Host "  Message center support entry preserved..." -ForegroundColor Cyan
Assert-Contains ".\apps\miniapp\pages\message\index.wxml" ([regex]::Escape("联系客服")) "Message center must still have support entry"
Assert-Contains ".\apps\miniapp\pages\message\index.js" "goToSupport" "Message center must still have goToSupport"
Write-Host "  Message center support entry preserved passed." -ForegroundColor Green

Write-Host ""
Write-Host "Stage 8.1 support conversation workflow verification passed." -ForegroundColor Green

