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
& ".\verify-stage4-2.ps1"
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
Assert-Contains ".\apps\miniapp\pages\auth\phone-bind\index.wxml" "请输入验证码" "SMS code input is missing"
Assert-Contains ".\apps\miniapp\pages\auth\phone-bind\index.wxml" "获取验证码登录" "SMS login button is missing"
Assert-Contains ".\apps\miniapp\pages\auth\phone-bind\index.js" "MOCK_SMS_CODE|123456" "Local mock SMS code marker is missing"
Assert-Contains ".\apps\miniapp\pages\privacy\index.wxml" "隐私" "Privacy page copy is missing"

Assert-Contains ".\apps\miniapp\pages\home\index.wxml" "个人资料" "Home profile entry is missing"
Assert-Contains ".\apps\miniapp\pages\home\index.wxml" "证件管理" "Home credential entry is missing"
Assert-Contains ".\apps\miniapp\pages\home\index.wxml" "我的简历" "Home resume entry is missing"
Assert-Contains ".\apps\miniapp\pages\home\index.wxml" "查看进度" "Home intake status card must expose audit progress"
Assert-Contains ".\apps\miniapp\pages\home\index.wxml" "联系客服" "Home customer service entry is missing"
Assert-Contains ".\apps\miniapp\pages\home\index.js" "loadProfileHeader" "Home must refresh profile name/avatar from profile API"
Assert-Contains ".\apps\miniapp\pages\home\index.js" "goToResume" "Home resume navigation is missing"

Assert-Contains ".\apps\miniapp\pages\profile\edit\index.wxml" "服务类别" "Profile service category UI is missing"
Assert-Contains ".\apps\miniapp\pages\profile\edit\index.wxml" "服务区域" "Profile service area UI is missing"
Assert-Contains ".\apps\miniapp\pages\profile\edit\index.wxml" "点击更换头像" "Profile avatar upload UI is missing"
Assert-Contains ".\apps\miniapp\components\category-picker\index.js" "dictValue" "Category picker must support backend dict item shape"
Assert-Contains ".\apps\miniapp\components\area-picker\index.js" "dictValue" "Area picker must support backend dict item shape"
Assert-Contains ".\apps\miniapp\utils\constants.js" "全国" "Default nationwide service area is missing"
Assert-Contains ".\apps\miniapp\utils\constants.js" "新疆维吾尔自治区" "Province-city service area list is missing"
Assert-Contains ".\apps\miniapp\pages\profile\view\index.js" "onShow" "Profile view must refresh after returning from edit"
Assert-Contains ".\apps\miniapp\pages\account\index.wxml" "用户服务协议" "Account settings must list user agreement"
Assert-Contains ".\apps\miniapp\pages\account\index.wxml" "隐私政策" "Account settings must list privacy policy"
Assert-Contains ".\apps\miniapp\pages\account\index.wxml" "修改手机号" "Account settings must include phone change entry"
Assert-Contains ".\apps\miniapp\pages\account\index.js" "handleChangePhone" "Account phone change navigation is missing"
Assert-Contains ".\apps\miniapp\app.json" "pages/auth/phone-change/index" "Phone change page is not registered"
Assert-Contains ".\apps\miniapp\utils\constants.js" "PHONE_CHANGE" "Phone change API constant is missing"
Assert-Contains ".\apps\miniapp\pages\auth\phone-change\index.wxml" "已实名账号换绑手机号|实名认证" "Phone change page must describe identity verification"
Assert-Contains ".\apps\miniapp\pages\auth\phone-change\index.js" "PHONE_CHANGE" "Phone change page must call phone change API"
Assert-Contains ".\apps\server\src\modules\auth\auth.controller.ts" "change-phone" "Backend phone change endpoint is missing"
Assert-Contains ".\apps\server\src\modules\auth\auth.service.ts" "identityVerified" "Backend phone change must require identity verification"
Assert-Contains ".\apps\server\src\modules\file\file.controller.ts" "public/:fileId/preview" "Avatar public preview endpoint is missing"

Assert-Contains ".\apps\miniapp\pages\credential\index.wxml" "学历/学生证" "Education/student-card quick entry is missing"
Assert-Contains ".\apps\miniapp\pages\credential\index.wxml" "提交审核" "Credential page must submit review directly after document updates"
Assert-Contains ".\apps\miniapp\pages\credential\index.js" "INTAKE_PREVIEW" "Credential submit must validate intake preview before submission"
Assert-Contains ".\apps\miniapp\pages\credential\index.js" "SUBMIT_INTAKE" "Credential submit must call intake submit API"
Assert-Contains ".\apps\miniapp\pages\credential\index.wxml" "skillEntries|技能一|最多可填写3项证书技能" "Multi skill-certificate entry is missing"
Assert-Contains ".\apps\miniapp\pages\credential\index.wxml" "证书图片（1-3张）|editFiles.length < 3" "Skill-certificate multi-upload copy is missing"
Assert-Contains ".\apps\miniapp\pages\credential\edit\index.wxml" "关联服务技能" "Skill certificate linking UI is missing"
Assert-Contains ".\apps\miniapp\pages\credential\edit\index.wxml" "请选择等级" "Skill level input is missing"
Assert-Contains ".\apps\miniapp\utils\constants.js" "月嫂" "Fixed service skill option is missing"
Assert-Contains ".\apps\miniapp\utils\constants.js" "白班保姆" "Fixed service skill option is missing"
Assert-Contains ".\apps\miniapp\pages\credential\edit\index.js" "staffSkillCategories" "Skill certificate save payload must include linked service skill categories"
Assert-Contains ".\apps\miniapp\pages\credential\edit\index.wxml" "证件图片" "Credential image upload UI is missing"
Assert-Contains ".\apps\miniapp\pages\credential\edit\index.js" "isTypeLocked" "Credential edit page must lock preselected credential type"
Assert-Contains ".\apps\server\src\modules\credential\dto\upsert-credential.dto.ts" "staffSkillCategories" "Backend DTO must accept linked service skill categories"
Assert-Contains ".\apps\server\src\modules\credential\credential.service.ts" "credential type cannot be changed after creation" "Server must reject credential type mutation"

Assert-Contains ".\apps\miniapp\pages\submit\index.wxml" "强准入证件" "Submit mandatory credential section is missing"
Assert-Contains ".\apps\miniapp\pages\submit\index.wxml" "技能证书要求" "Submit skill certificate section is missing"
Assert-Contains ".\apps\miniapp\pages\submit\index.wxml" "学历/学生证" "Submit optional education summary is missing"

Assert-Contains ".\apps\miniapp\app.json" "pages/resume/index" "Resume page is not registered"
Assert-Contains ".\apps\miniapp\pages\resume\index.wxml" "服务能力" "Resume service ability section is missing"
Assert-Contains ".\apps\miniapp\pages\resume\index.wxml" "资质审核" "Resume audit section is missing"
Assert-Contains ".\apps\miniapp\pages\resume\index.wxml" "技能证书" "Resume skill certificate section is missing"
Assert-Contains ".\apps\miniapp\pages\resume\index.wxml" "最高学历/学生证" "Resume education/student-card section is missing"
Assert-Contains ".\apps\miniapp\pages\resume\index.wxml" "保险" "Resume insurance section is missing"
Assert-Contains ".\apps\miniapp\pages\resume\index.wxml" "服务记录" "Resume service record section is missing"
Assert-Contains ".\apps\miniapp\pages\resume\index.js" "SENSITIVE_AUDIT_TYPES" "Resume sensitive audit summary config is missing"
Assert-Contains ".\apps\miniapp\pages\resume\index.js" "已审核通过" "Resume approved audit label is missing"
Assert-Contains ".\apps\miniapp\pages\resume\index.js" "开具日期" "Resume no-crime certificate issue date is missing"
Assert-Contains ".\apps\miniapp\pages\resume\index.js" "有效期至" "Resume credential expiry date is missing"
Assert-Contains ".\apps\miniapp\pages\resume\index.js" "insuranceValid" "Resume insurance validity marker is missing"
Assert-Contains ".\apps\miniapp\pages\resume\index.js" "SERVICE_RECORDS" "Resume must load service records"

Assert-Contains ".\apps\miniapp\pages\service-record\index.wxml" "日期" "Service record date field is missing"
Assert-Contains ".\apps\miniapp\pages\service-record\index.wxml" "地址" "Service record address field is missing"
Assert-Contains ".\apps\miniapp\pages\service-record\index.wxml" "项目" "Service record project field is missing"
Assert-Contains ".\apps\miniapp\pages\service-record\index.wxml" "时长" "Service record duration field is missing"
Assert-Contains ".\apps\miniapp\pages\service-record\index.wxml" "金额" "Service record amount field is missing"
Assert-Contains ".\apps\miniapp\pages\service-record\index.wxml" "是否违规" "Service record violation field is missing"

Write-Host "Checking resume privacy boundaries..." -ForegroundColor Cyan
$resumeSensitive = Get-ChildItem ".\apps\miniapp\pages\resume" -Recurse -File -ErrorAction SilentlyContinue |
  Select-String -Pattern "idNumber|homeAddress|emergencyContact|emergencyPhone|certificateNo|credentialNo|fileUrl|files|imageUrl" |
  Where-Object { $_.Line -notmatch "normalizeAvatarUrl|/app/files/public/" } |
  Select-Object -First 1
if ($resumeSensitive) {
  Write-Host $resumeSensitive
  throw "Resume page must not expose identity number, address, contact, certificate number, or certificate image fields."
}

Write-Host "Checking request and upload response handling..." -ForegroundColor Cyan
Assert-Contains ".\apps\miniapp\utils\request.js" "Authorization" "Request wrapper must send Authorization header"
Assert-Contains ".\apps\miniapp\utils\request.js" "body\.code === 0" "Request wrapper must handle unified success response"
Assert-Contains ".\apps\miniapp\utils\upload.js" "body\.code === 0" "Upload wrapper must handle unified success response"
Assert-Contains ".\apps\miniapp\utils\upload.js" "Authorization" "Upload wrapper must send Authorization header"

Write-Host "Checking WXML expression safety..." -ForegroundColor Cyan
$unsafeWxml = Get-ChildItem ".\apps\miniapp" -Recurse -Filter "*.wxml" -File -ErrorAction SilentlyContinue | Select-String -Pattern "\.charAt\(|\.slice\(" | Select-Object -First 1
if ($unsafeWxml) {
  Write-Host $unsafeWxml
  throw "Avoid method calls inside WXML bindings. Compute display values in page JS instead."
}

$realPhoneAuth = Get-ChildItem ".\apps\miniapp\pages\auth\phone-bind" -Recurse -File -ErrorAction SilentlyContinue | Select-String -Pattern "getPhoneNumber|bindgetphonenumber|encryptedData|iv:" | Select-Object -First 1
if ($realPhoneAuth) {
  Write-Host $realPhoneAuth
  throw "Phone binding must use SMS-code flow in this MVP, not WeChat real-phone authorization."
}

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
$badText = Get-ChildItem ".\apps\miniapp" -Recurse -File -ErrorAction SilentlyContinue | Select-String -Pattern "瀹舶|瀹舵斂|寰俊|鐧诲綍|璇疯|鍏ラ|鎻愪氦|娑堟伅|绛惧彂|韬唤|鍋ュ悍|闅愮|鐘舵|浣撴|鎶€|瀛﹀巻|瀛︾敓|姣曚笟|鍦板潃|璐﹀彿|鏈|宸查|缂哄|鍖哄煙" | Select-Object -First 1
if ($badText) {
  Write-Host $badText
  throw "Common mojibake fragments remain in miniapp source."
}

$emojiText = Get-ChildItem ".\apps\miniapp" -Recurse -Include "*.wxml","*.js","*.wxss","*.json" -File -ErrorAction SilentlyContinue |
  Select-String -Pattern "[\uD800-\uDBFF][\uDC00-\uDFFF]|✉|⚙" |
  Select-Object -First 1
if ($emojiText) {
  Write-Host $emojiText
  throw "Emoji or platform-dependent symbol icons remain in miniapp source. Use stable text or CSS shapes."
}

Write-Host "Checking Stage 5 scope boundaries..." -ForegroundColor Cyan
$forbidden = Get-ChildItem ".\apps\miniapp",".\apps\server\src" -Recurse -File -ErrorAction SilentlyContinue | Select-String -Pattern "支付|派单|钱包|佣金|分销|大家评评理|投票|自动处罚|客户下单|订单支付" | Select-Object -First 1
if ($forbidden) {
  Write-Host $forbidden
  throw "Out-of-scope business terms were introduced."
}

Write-Host "Stage 5 miniapp verification passed." -ForegroundColor Green
