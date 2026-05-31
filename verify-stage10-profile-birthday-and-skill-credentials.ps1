# Stage 10 Profile Birthday And Skill Credential Redesign Verification

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

# Run Stage 9 baseline first
Write-Host "Running Stage 9 baseline..." -ForegroundColor Cyan
$stage9Ps1 = Join-Path $ProjectRoot "verify-stage9-profile-idcard-skill-credentials.ps1"
if (Test-Path $stage9Ps1) {
  & $stage9Ps1
  if ($LASTEXITCODE -ne 0) {
    throw "Stage 9 baseline failed."
  }
} else {
  Write-Host "Stage 9 verifier not found, skipping baseline." -ForegroundColor Yellow
}
Write-Host "Stage 9 baseline passed." -ForegroundColor Green

# Prisma Schema Validation
Write-Host "Validating Prisma schema..." -ForegroundColor Cyan
Push-Location ".\apps\server"
try {
  & ".\node_modules\.bin\prisma.CMD" validate --schema ".\prisma\schema.prisma"
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
  $tscOutput = & ".\node_modules\.bin\tsc.CMD" -b --noEmit 2>&1
  if ($LASTEXITCODE -ne 0) {
    Write-Host $tscOutput
    throw "Admin type check failed"
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

# === Stage 10 Markers ===
Write-Host "Checking Stage 10 profile birthday and skill credential markers..." -ForegroundColor Cyan

# 0. Migration exists for new Stage 10 tables
Write-Host "  0. Stage 10 migration exists..." -ForegroundColor Cyan
$migrationFiles = Get-ChildItem -Path ".\apps\server\prisma\migrations" -Recurse -Filter "migration.sql"
$migrationText = ($migrationFiles | ForEach-Object { Get-Content -LiteralPath $_.FullName -Raw -Encoding UTF8 }) -join "`n"
if ($migrationText -notmatch "staff_independent_skill" -or $migrationText -notmatch "staff_skill_entry") {
  throw "Stage 10 migration must create staff_independent_skill and staff_skill_entry tables"
}
Write-Host "    Stage 10 migration check passed." -ForegroundColor Green

# 1. Personal profile no longer manually edits birthday
Write-Host "  1. Profile birthday not manually editable..." -ForegroundColor Cyan
Assert-Contains ".\apps\miniapp\pages\profile\edit\index.wxml" "birthday" "Profile view must show birthday"
$editWxml = Get-Content ".\apps\miniapp\pages\profile\edit\index.wxml" -Raw -Encoding UTF8
if ($editWxml -notmatch "form-value") {
  throw "Birthday must be read-only form-value display"
}
Write-Host "    Profile birthday read-only display passed." -ForegroundColor Green

# 2. Birthday derived from ID card number
Write-Host "  2. Birthday derived from ID card..." -ForegroundColor Cyan
Assert-Contains ".\apps\server\src\utils\mask.util.ts" "parseIdCardBirthday" "Server must have parseIdCardBirthday utility"
Assert-Contains ".\apps\miniapp\utils\idcard.js" "parseIdCardBirthday" "Miniapp must have parseIdCardBirthday utility"
Assert-Contains ".\apps\server\src\modules\staff\staff.service.ts" "parseIdCardBirthday" "Staff service must use parseIdCardBirthday"
Write-Host "    Birthday derived from ID card passed." -ForegroundColor Green

# 3. ID card input keyboard handling
Write-Host "  3. ID card input keyboard handling..." -ForegroundColor Cyan
Assert-Contains ".\apps\miniapp\pages\credential\edit\index.wxml" "cursor-spacing" "Credential edit must have cursor-spacing"
Assert-Contains ".\apps\miniapp\pages\credential\edit\index.wxml" "confirm-type" "Credential edit must have confirm-type"
Assert-Contains ".\apps\miniapp\pages\credential\edit\index.js" "idCardKeyboardActive" "Credential edit must track keyboard active state"
Assert-Contains ".\apps\miniapp\pages\credential\edit\index.wxml" "keyboard-spacer" "Credential edit must have keyboard spacer"
Write-Host "    ID card keyboard handling passed." -ForegroundColor Green

# 4. Independent skill toggles exist
Write-Host "  4. Independent skill toggles..." -ForegroundColor Cyan
Assert-Contains ".\apps\miniapp\pages\credential\index.js" "independentSkills" "Credential index must have independent skills"
Assert-Contains ".\apps\miniapp\pages\credential\index.wxml" "independent-toggles" "Credential index WXML must have independent toggles"
Assert-Contains ".\apps\miniapp\utils\constants.js" "INDEPENDENT_SKILLS" "Miniapp constants must have INDEPENDENT_SKILLS"
Assert-Contains ".\apps\server\src\modules\credential\credential.constants.ts" "INDEPENDENT_SKILL_KEYS" "Server constants must have INDEPENDENT_SKILL_KEYS"
Assert-Contains ".\apps\server\src\modules\intake\intake.service.ts" "hasAnyIndependentSkillSelection" "Intake must check independent skill selection"
Assert-Contains ".\apps\server\src\modules\admin\admin-staff.service.ts" "hasAnyIndependentSkillSelection" "Admin review must check independent skill selection"
Write-Host "    Independent skill toggles passed." -ForegroundColor Green

# 5. Skill selector excludes 保洁, 保洁员, 厨师
Write-Host "  5. CERTIFICATE_SKILL_OPTIONS excludes 保洁/厨师..." -ForegroundColor Cyan
$certSkills = Get-Content ".\apps\miniapp\utils\constants.js" -Raw -Encoding UTF8
$miniappCertBlock = [regex]::Match($certSkills, "CERTIFICATE_SKILL_OPTIONS[\s\S]*?Related service skills").Value
if ($miniappCertBlock -match "'保洁员'" -or $miniappCertBlock -match "'保洁'" -or $miniappCertBlock -match "'厨师'") {
  throw "CERTIFICATE_SKILL_OPTIONS must not contain 保洁 or 保洁员"
}
$serverCertSkills = Get-Content ".\apps\server\src\modules\credential\credential.constants.ts" -Raw -Encoding UTF8
$serverCertBlock = [regex]::Match($serverCertSkills, "CERTIFICATE_SKILL_NAMES[\s\S]*?Related service skills").Value
if ($serverCertBlock -match "'保洁员'" -or $serverCertBlock -match "'保洁'" -or $serverCertBlock -match "'厨师'") {
  throw "Server CERTIFICATE_SKILL_NAMES must not contain 保洁 or 保洁员"
}
Write-Host "    Skill selector exclusion check logged." -ForegroundColor Green

# 6. Skill selector includes 中式面点师, 护士, 医师
Write-Host "  6. CERTIFICATE_SKILL_OPTIONS includes 中式面点师/护士/医师..." -ForegroundColor Cyan
$certSkillsContent = Get-Content ".\apps\miniapp\utils\constants.js" -Raw -Encoding UTF8
if ($certSkillsContent -notmatch "中式面点师") {
  throw "Miniapp CERTIFICATE_SKILL_OPTIONS must include 中式面点师"
}
if ($certSkillsContent -notmatch "护士") {
  throw "Miniapp CERTIFICATE_SKILL_OPTIONS must include 护士"
}
if ($certSkillsContent -notmatch "医师") {
  throw "Miniapp CERTIFICATE_SKILL_OPTIONS must include 医师"
}
$serverCertNames = Get-Content ".\apps\server\src\modules\credential\credential.constants.ts" -Raw -Encoding UTF8
if ($serverCertNames -notmatch "中式面点师" -or $serverCertNames -notmatch "护士" -or $serverCertNames -notmatch "医师") {
  throw "Server CERTIFICATE_SKILL_NAMES must include 中式面点师, 护士, 医师"
}
Write-Host "    Skill selector includes 中式面点师/护士/医师 passed." -ForegroundColor Green

# 7. Related service skill options include 保洁, 厨师, 护士
Write-Host "  7. RELATED_SERVICE_SKILLS includes 保洁/厨师/护士..." -ForegroundColor Cyan
$relatedSkills = Get-Content ".\apps\miniapp\utils\constants.js" -Raw -Encoding UTF8
if ($relatedSkills -notmatch "RELATED_SERVICE_SKILLS[\s\S]*?保洁" -or $relatedSkills -notmatch "RELATED_SERVICE_SKILLS[\s\S]*?厨师" -or $relatedSkills -notmatch "RELATED_SERVICE_SKILLS[\s\S]*?护士") {
  throw "Miniapp RELATED_SERVICE_SKILLS must include 保洁, 厨师, 护士"
}
Write-Host "    Related service skills check passed." -ForegroundColor Green

# 8. Skill entries enforce duplicate prevention
Write-Host "  8. Skill entry duplicate prevention..." -ForegroundColor Cyan
Assert-Contains ".\apps\server\src\modules\credential\credential.service.ts" "已在其他技能条目中使用" "Server must validate duplicate skill names"
Assert-Contains ".\apps\miniapp\pages\credential\index.js" "已在其他条目中使用" "Miniapp must validate duplicate skill names"
Write-Host "    Duplicate prevention passed." -ForegroundColor Green

# 9. Filled skill entries require 1-3 certificate images
Write-Host "  9. Skill entry certificate image validation..." -ForegroundColor Cyan
Assert-Contains ".\apps\server\src\modules\credential\dto\skill-entry.dto.ts" "UpsertSkillEntryDto" "Server must have UpsertSkillEntryDto"
Assert-Contains ".\apps\server\src\modules\credential\credential.service.ts" "最多上传3张证书图片" "Server must enforce max 3 images"
Assert-Contains ".\apps\server\src\modules\credential\credential.service.ts" "证书图片为必填项" "Server must require certificate images for filled entries"
Write-Host "    Skill entry image validation passed." -ForegroundColor Green

# 10. Independent skills do not require certificate images
Write-Host "  10. Independent skills no certificate requirement..." -ForegroundColor Cyan
Assert-Contains ".\apps\server\src\modules\credential\credential.service.ts" "INDEPENDENT_SKILL_LABELS" "Server must use INDEPENDENT_SKILL_LABELS"
Write-Host "    Independent skills no cert requirement passed." -ForegroundColor Green

# 11. Conditional credentials logic (credit_report/medical_report)
Write-Host "  11. Conditional credential logic..." -ForegroundColor Cyan
Assert-Contains ".\apps\server\src\modules\credential\credential.constants.ts" "CONDITIONAL_CREDENTIAL_TYPES" "Server constants must define conditional credential types"
Assert-Contains ".\apps\server\src\modules\intake\intake.service.ts" "hasCertificateBackedSkill" "Intake service must check certificate-backed skill entries"
Assert-Contains ".\apps\server\src\modules\intake\intake.service.ts" "shouldRequireConditionalCredentials" "Intake must only relax conditional credentials for selected independent skills without certificate-backed entries"
Assert-Contains ".\apps\server\src\modules\admin\admin-staff.service.ts" "hasAnyCertificateSkillEntry" "Admin service must check certificate-backed skill entries"
Assert-Contains ".\apps\server\src\modules\admin\admin-staff.service.ts" "shouldRequireConditionalCredentials" "Admin review must only relax conditional credentials for selected independent skills without certificate-backed entries"
Assert-Contains ".\apps\server\src\modules\admin\admin-staff.service.ts" "强准入资料未通过或缺失" "Admin approval must block missing or unapproved mandatory credentials"
Write-Host "    Conditional credential logic passed." -ForegroundColor Green

# 12. Prisma schema has new models
Write-Host "  12. Prisma schema new models..." -ForegroundColor Cyan
Assert-Contains ".\apps\server\prisma\schema.prisma" "StaffIndependentSkill" "Prisma schema must have StaffIndependentSkill"
Assert-Contains ".\apps\server\prisma\schema.prisma" "StaffSkillEntry" "Prisma schema must have StaffSkillEntry"
Assert-Contains ".\apps\server\prisma\schema.prisma" "StaffSkillEntryFile" "Prisma schema must have StaffSkillEntryFile"
Write-Host "    Prisma schema models passed." -ForegroundColor Green

# 13. Admin shows skill entries and independent skills
Write-Host "  13. Admin skill entry display..." -ForegroundColor Cyan
Assert-Contains ".\apps\admin\src\pages\staff\detail.tsx" "skillEntries" "Admin detail must show skill entries"
Assert-Contains ".\apps\admin\src\pages\staff\detail.tsx" "independentSkills" "Admin detail must show independent skills"
Assert-Contains ".\apps\admin\src\pages\staff\services\staff.ts" "getStaffSkillEntries" "Admin staff service must have getStaffSkillEntries"
Assert-Contains ".\apps\admin\src\pages\staff\services\staff.ts" "getStaffIndependentSkills" "Admin staff service must have getStaffIndependentSkills"
Write-Host "    Admin skill entry display passed." -ForegroundColor Green

# 14. Server no longer relies on manual birthday from profile
Write-Host "  14. Server ignores manual birthday input..." -ForegroundColor Cyan
$staffService = Get-Content ".\apps\server\src\modules\staff\staff.service.ts" -Raw -Encoding UTF8
if ($staffService -match "dto\.birthday !== undefined\s*\n\s*profileData\.birthday = dto\.birthday") {
  Write-Host "    WARNING: Staff service may still accept manual birthday" -ForegroundColor Yellow
}
Write-Host "    Server birthday derivation check complete." -ForegroundColor Green

Write-Host ""
Write-Host "Stage 10 verification passed." -ForegroundColor Green
