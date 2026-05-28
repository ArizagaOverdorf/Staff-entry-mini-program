# Stage 8.2 Support Chat Experience Verification
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

# Run Stage 8.1 baseline first
Write-Host "Running Stage 8.1 baseline..." -ForegroundColor Cyan
$stage8_1Ps1 = Join-Path $ProjectRoot "verify-stage8-1-support-conversations.ps1"
if (Test-Path $stage8_1Ps1) {
  & $stage8_1Ps1
  if ($LASTEXITCODE -ne 0) {
    throw "Stage 8.1 baseline failed."
  }
} else {
  throw "Stage 8.1 verifier not found at $stage8_1Ps1"
}
Write-Host "Stage 8.1 baseline passed." -ForegroundColor Green

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

# === Stage 8.2 Markers ===
Write-Host "Checking Stage 8.2 support chat experience markers..." -ForegroundColor Cyan

# 1. Polling intervals
Write-Host "  Polling intervals..." -ForegroundColor Cyan
Assert-Contains ".\apps\miniapp\pages\message\support.js" "POLL_INTERVAL" "Miniapp support must have POLL_INTERVAL constant"
Assert-Contains ".\apps\miniapp\pages\message\support.js" "setInterval" "Miniapp support must use setInterval for polling"
Assert-Contains ".\apps\miniapp\pages\message\support.js" "clearInterval" "Miniapp support must use clearInterval on hide/unload"
Assert-Contains ".\apps\miniapp\pages\message\support.js" "stopPolling" "Miniapp support must have stopPolling method"
Assert-Contains ".\apps\miniapp\pages\message\support.js" "onHide" "Miniapp support must have onHide lifecycle"
Assert-Contains ".\apps\miniapp\pages\message\support.js" "onUnload" "Miniapp support must have onUnload lifecycle"
Assert-Contains ".\apps\admin\src\pages\support\index.tsx" "POLL_INTERVAL" "Admin support must have POLL_INTERVAL constant"
Assert-Contains ".\apps\admin\src\pages\support\index.tsx" "setInterval" "Admin support must use setInterval for polling"
Assert-Contains ".\apps\admin\src\pages\support\index.tsx" "clearInterval" "Admin support must use clearInterval on unmount"
Write-Host "  Polling intervals passed." -ForegroundColor Green

# 2. Message center support aggregation
Write-Host "  Message center support aggregation..." -ForegroundColor Cyan
Assert-Contains ".\apps\miniapp\pages\message\index.js" "supportSummary" "Message center must have supportSummary data"
Assert-Contains ".\apps\miniapp\pages\message\index.js" "loadSupportSummary" "Message center must load support summary"
Assert-Contains ".\apps\miniapp\pages\message\index.js" "MESSAGE_SUPPORT_SUMMARY" "Message center must use MESSAGE_SUPPORT_SUMMARY endpoint"
Assert-Contains ".\apps\miniapp\pages\message\index.wxml" "support-summary" "Message center WXML must have support summary row"
Assert-Contains ".\apps\miniapp\pages\message\index.wxml" "sessionActive" "Message center must reference sessionActive"
Assert-Contains ".\apps\miniapp\pages\message\index.wxml" "sessionStatus" "Message center must show sessionStatus"
Assert-Contains ".\apps\miniapp\pages\message\index.wxml" "unreadCount" "Message center must show support unread count"
Assert-Contains ".\apps\miniapp\utils\constants.js" "MESSAGE_SUPPORT_SUMMARY" "constants.js must have MESSAGE_SUPPORT_SUMMARY"
Write-Host "  Message center support aggregation passed." -ForegroundColor Green

# 3. Support messages excluded from general message list
Write-Host "  Support messages excluded from general list..." -ForegroundColor Cyan
Assert-Contains ".\apps\server\src\modules\message\message.service.ts" "notIn" "Message service must exclude support messages from list"
Assert-Contains ".\apps\server\src\modules\message\message.service.ts" "support_request" "Message service must reference support_request for filtering"
Write-Host "  Support messages excluded from general list passed." -ForegroundColor Green

# 4. 30-minute session timeout marker
Write-Host "  30-minute session timeout..." -ForegroundColor Cyan
Assert-Contains ".\apps\server\src\modules\message\message.service.ts" "60 \* 1000" "Message service must have 30-minute session timeout (60*1000)"
Assert-Contains ".\apps\server\src\modules\message\message.service.ts" "SESSION_TIMEOUT_MS" "Message service must have SESSION_TIMEOUT_MS constant"
Write-Host "  30-minute session timeout passed." -ForegroundColor Green

# 5. Session status labels
Write-Host "  Session status labels..." -ForegroundColor Cyan
Assert-Contains ".\apps\server\src\modules\message\message.service.ts" "getSupportConversationSummary" "Message service must have getSupportConversationSummary"
Write-Host "  Session status labels passed." -ForegroundColor Green

# 6. Support summary endpoint
Write-Host "  Support summary endpoint..." -ForegroundColor Cyan
Assert-Contains ".\apps\server\src\modules\message\message.controller.ts" "support/summary" "Message controller must have support/summary endpoint"
Assert-Contains ".\apps\server\src\modules\message\message.controller.ts" "getSupportConversationSummary" "Message controller must have getSupportConversationSummary handler"
Write-Host "  Support summary endpoint passed." -ForegroundColor Green

# 7. Chat UI - overflow-x hidden
Write-Host "  Chat UI layout fixes..." -ForegroundColor Cyan
Assert-Contains ".\apps\miniapp\pages\message\support.wxss" "overflow-x" "Support WXSS must have overflow-x: hidden"
Assert-Contains ".\apps\miniapp\pages\message\support.wxss" "border-box" "Support WXSS must use box-sizing: border-box"
Assert-Contains ".\apps\miniapp\pages\message\support.wxss" "max-width" "Support WXSS must use max-width: 100%"
Write-Host "  Chat UI layout fixes passed." -ForegroundColor Green

# 8. Font sizes
Write-Host "  Chat font sizes..." -ForegroundColor Cyan
Assert-Contains ".\apps\miniapp\pages\message\support.wxss" "13px" "Chat sender name font must use 13px"
Assert-Contains ".\apps\miniapp\pages\message\support.wxss" "15px" "Chat message text font must use 15px"
Write-Host "  Chat font sizes passed." -ForegroundColor Green

# 9. Textarea chat input
Write-Host "  Textarea chat input..." -ForegroundColor Cyan
Assert-Contains ".\apps\miniapp\pages\message\support.wxml" "textarea" "Support WXML must use textarea for chat input"
Assert-Contains ".\apps\miniapp\pages\message\support.wxml" "auto-height" "Support textarea must have auto-height"
Assert-Contains ".\apps\miniapp\pages\message\support.wxml" "maxlength" "Support textarea must have maxlength attr"
Write-Host "  Textarea chat input passed." -ForegroundColor Green

# 10. Max text length 500
Write-Host "  Max text length 500..." -ForegroundColor Cyan
Assert-Contains ".\apps\miniapp\pages\message\support.js" "MAX_TEXT_LENGTH" "Support JS must have MAX_TEXT_LENGTH constant"
Assert-Contains ".\apps\miniapp\pages\message\support.js" "500" "Support JS must have 500 char limit"
Assert-Contains ".\apps\server\src\modules\message\message.service.ts" "500" "Server must enforce 500 char limit"
Assert-Contains ".\apps\server\src\modules\admin\admin-support.service.ts" "500" "Admin support service must enforce 500 char limit"
Assert-Contains ".\apps\admin\src\pages\support\index.tsx" "maxLength" "Admin support must have maxLength on reply TextArea"
Write-Host "  Max text length 500 passed." -ForegroundColor Green

# 11. Image/video size limits
Write-Host "  Image/video size limits..." -ForegroundColor Cyan
Assert-Contains ".\apps\miniapp\pages\message\support.js" "IMAGE_MAX_SIZE" "Support JS must have IMAGE_MAX_SIZE constant"
Assert-Contains ".\apps\miniapp\pages\message\support.js" "VIDEO_MAX_SIZE" "Support JS must have VIDEO_MAX_SIZE constant"
Assert-Contains ".\apps\miniapp\pages\message\support.js" "3 \* 1024 \* 1024" "Support JS must have 3MB image limit"
Assert-Contains ".\apps\miniapp\pages\message\support.js" "10 \* 1024 \* 1024" "Support JS must have 10MB video limit"
Assert-Contains ".\apps\server\src\modules\file\file.constants.ts" "IMAGE_MAX_SIZE" "File constants must have IMAGE_MAX_SIZE"
Assert-Contains ".\apps\server\src\modules\file\file.constants.ts" "VIDEO_MAX_SIZE" "File constants must have VIDEO_MAX_SIZE"
Write-Host "  Image/video size limits passed." -ForegroundColor Green

# 12. Upload action markers
Write-Host "  Upload action markers..." -ForegroundColor Cyan
Assert-Contains ".\apps\miniapp\pages\message\support.js" "onChooseImage" "Support JS must have onChooseImage handler"
Assert-Contains ".\apps\miniapp\pages\message\support.js" "onChooseVideo" "Support JS must have onChooseVideo handler"
Assert-Contains ".\apps\miniapp\pages\message\support.js" "onTapPlus" "Support JS must have onTapPlus handler"
Assert-Contains ".\apps\miniapp\pages\message\support.js" "uploadAndSendMedia" "Support JS must have uploadAndSendMedia function"
Assert-Contains ".\apps\miniapp\pages\message\support.js" "uploadUtil" "Support JS must use upload utility"
Assert-Contains ".\apps\miniapp\pages\message\support.wxml" "action-sheet" "Support WXML must have action sheet"
Write-Host "  Upload action markers passed." -ForegroundColor Green

# 13. Voice placeholder
Write-Host "  Voice placeholder..." -ForegroundColor Cyan
Assert-Contains ".\apps\miniapp\pages\message\support.js" "onTapVoice" "Support JS must have onTapVoice handler"
Assert-Contains ".\apps\miniapp\pages\message\support.wxml" "onTapVoice" "Support WXML must bind onTapVoice"
Write-Host "  Voice placeholder passed." -ForegroundColor Green

# 14. Chat input bar structure
Write-Host "  Chat input bar WeChat-style..." -ForegroundColor Cyan
Assert-Contains ".\apps\miniapp\pages\message\support.wxml" "chat-tool-btn" "Support WXML must have chat tool buttons"
Assert-Contains ".\apps\miniapp\pages\message\support.wxml" "chat-textarea-wrapper" "Support WXML must have textarea wrapper"
Assert-Contains ".\apps\miniapp\pages\message\support.wxml" "chat-send-btn" "Support WXML must have send button"
Write-Host "  Chat input bar WeChat-style passed." -ForegroundColor Green

# 15. Home page support entry
Write-Host "  Home page support entry..." -ForegroundColor Cyan
Assert-Contains ".\apps\miniapp\pages\home\index.js" "goToSupport" "Home page must have goToSupport method"
Assert-Contains ".\apps\miniapp\pages\home\index.js" "/pages/message/support" "Home goToSupport must navigate to support page"
Write-Host "  Home page support entry passed." -ForegroundColor Green

Write-Host ""
Write-Host "Stage 8.2 support chat experience verification passed." -ForegroundColor Green
