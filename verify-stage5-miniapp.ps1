$ErrorActionPreference = "Stop"

$ProjectRoot = $PSScriptRoot
Set-Location -LiteralPath $ProjectRoot

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

function Assert-JsonFile {
  param([string]$Path)

  try {
    Get-Content -LiteralPath $Path -Raw -Encoding UTF8 | ConvertFrom-Json | Out-Null
  } catch {
    throw "Invalid JSON file: $Path. $($_.Exception.Message)"
  }
}

Write-Host "Running Stage 4.2 baseline verification..." -ForegroundColor Cyan
& ".\verify-stage4-2.cmd"
if ($LASTEXITCODE -ne 0) {
  throw "Stage 4.2 baseline verification failed."
}

Write-Host "Validating miniapp JSON files..." -ForegroundColor Cyan
Get-ChildItem -LiteralPath ".\apps\miniapp" -Recurse -Filter "*.json" -File |
  ForEach-Object { Assert-JsonFile $_.FullName }

Write-Host "Checking miniapp JavaScript syntax..." -ForegroundColor Cyan
Get-ChildItem -LiteralPath ".\apps\miniapp" -Recurse -Filter "*.js" -File |
  ForEach-Object {
    & node --check $_.FullName | Out-Null
    if ($LASTEXITCODE -ne 0) {
      throw "JavaScript syntax check failed: $($_.FullName)"
    }
  }

Write-Host "Checking miniapp required labels and flow markers..." -ForegroundColor Cyan
Assert-Contains ".\apps\miniapp\app.json" "家政服务人员入驻" "Miniapp title is missing"
Assert-Contains ".\apps\miniapp\utils\constants.js" "草稿" "Intake draft label is missing"
Assert-Contains ".\apps\miniapp\utils\constants.js" "待审核" "Pending-review label is missing"
Assert-Contains ".\apps\miniapp\utils\constants.js" "身份证" "ID-card credential label is missing"
Assert-Contains ".\apps\miniapp\utils\constants.js" "无犯罪记录证明" "No-crime credential label is missing"
Assert-Contains ".\apps\miniapp\utils\constants.js" "学历/毕业证" "Education credential label is missing"
Assert-Contains ".\apps\miniapp\utils\constants.js" "学生证" "Student-card credential label is missing"

Assert-Contains ".\apps\miniapp\pages\auth\index.wxml" "微信一键登录" "Login button label is missing"
Assert-Contains ".\apps\miniapp\pages\auth\phone-bind\index.wxml" "请输入手机号" "Manual phone input is missing"
Assert-Contains ".\apps\miniapp\pages\auth\phone-bind\index.wxml" "getPhoneNumber" "WeChat phone binding capability is missing"
Assert-Contains ".\apps\miniapp\pages\privacy\index.wxml" "隐私" "Privacy page copy is missing"

Assert-Contains ".\apps\miniapp\pages\home\index.wxml" "个人资料" "Home profile entry is missing"
Assert-Contains ".\apps\miniapp\pages\home\index.wxml" "证件管理" "Home credential entry is missing"
Assert-Contains ".\apps\miniapp\pages\home\index.wxml" "提交入驻" "Home submit entry is missing"
Assert-Contains ".\apps\miniapp\pages\home\index.wxml" "审核进度" "Home audit entry is missing"

Assert-Contains ".\apps\miniapp\pages\profile\edit\index.wxml" "服务类别" "Profile service category UI is missing"
Assert-Contains ".\apps\miniapp\pages\profile\edit\index.wxml" "服务区域" "Profile service area UI is missing"

Assert-Contains ".\apps\miniapp\pages\credential\index.wxml" "学历/学生证" "Education/student-card quick entry is missing"
Assert-Contains ".\apps\miniapp\pages\credential\edit\index.wxml" "关联服务技能" "Skill certificate linking UI is missing"
Assert-Contains ".\apps\miniapp\pages\credential\edit\index.wxml" "技能等级" "Skill level input is missing"
Assert-Contains ".\apps\miniapp\pages\credential\edit\index.wxml" "证件图片" "Credential image upload UI is missing"

Assert-Contains ".\apps\miniapp\pages\submit\index.wxml" "强准入证件" "Submit mandatory credential section is missing"
Assert-Contains ".\apps\miniapp\pages\submit\index.wxml" "技能证书要求" "Submit skill certificate section is missing"
Assert-Contains ".\apps\miniapp\pages\submit\index.wxml" "学历/学生证" "Submit optional education summary is missing"

Write-Host "Checking request and upload response handling..." -ForegroundColor Cyan
Assert-Contains ".\apps\miniapp\utils\request.js" "Authorization" "Request wrapper must send Authorization header"
Assert-Contains ".\apps\miniapp\utils\request.js" "body\.code === 0" "Request wrapper must handle unified success response"
Assert-Contains ".\apps\miniapp\utils\upload.js" "body\.code === 0" "Upload wrapper must handle unified success response"
Assert-Contains ".\apps\miniapp\utils\upload.js" "Authorization" "Upload wrapper must send Authorization header"

Write-Host "Checking broken local image references..." -ForegroundColor Cyan
$imageReferences = @()
Get-ChildItem -LiteralPath ".\apps\miniapp" -Recurse -Include "*.wxml","*.js","*.wxss","*.json" -File |
  ForEach-Object {
    $relativePath = $_.FullName.Substring($ProjectRoot.Length + 1)
    $content = Get-Content -LiteralPath $_.FullName -Raw -Encoding UTF8
    $matches = [regex]::Matches($content, "/images/[^`"' )}]+")
    foreach ($match in $matches) {
      $imageReferences += [PSCustomObject]@{
        File = $relativePath
        Path = $match.Value
      }
    }
  }

foreach ($ref in $imageReferences) {
  $localPath = Join-Path ".\apps\miniapp" ($ref.Path.TrimStart("/") -replace "/", "\")
  if (-not (Test-Path -LiteralPath $localPath)) {
    throw "Missing miniapp image asset $($ref.Path), referenced from $($ref.File). Replace decorative images or add the asset."
  }
}

Write-Host "Checking for common mojibake fragments in miniapp source..." -ForegroundColor Cyan
$badText = & rg -n "瀹舶|瀹舵斂|寰俊|鐧诲綍|璇疯|鍏ラ|鎻愪氦|娑堟伅|绛惧彂|韬唤|鍋ュ悍|闅愮|鐘舵|浣撴|鎶€|瀛﹀巻|瀛︾敓|姣曚笟|鍦板潃|璐﹀彿|鏈|宸查|缂哄|鍖哄煙" ".\apps\miniapp" 2>$null
if ($badText) {
  Write-Host $badText
  throw "Common mojibake fragments remain in miniapp source."
}

Write-Host "Checking Stage 5 scope boundaries..." -ForegroundColor Cyan
$forbidden = & rg -n "支付|派单|钱包|佣金|分销|大家评评理|投票|自动处罚|客户下单|订单支付" ".\apps\miniapp" ".\apps\server\src" 2>$null
if ($forbidden) {
  Write-Host $forbidden
  throw "Out-of-scope business terms were introduced."
}

Write-Host "Stage 5 miniapp verification passed." -ForegroundColor Green
