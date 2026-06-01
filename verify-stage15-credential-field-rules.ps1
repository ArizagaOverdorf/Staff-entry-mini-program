$ErrorActionPreference = "Continue"

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $Root

$script:Pass = 0
$script:Fail = 0

function Pass($Message) {
  $script:Pass += 1
  Write-Host "  PASS: $Message" -ForegroundColor Green
}

function Fail($Message) {
  $script:Fail += 1
  Write-Host "  FAIL: $Message" -ForegroundColor Red
}

function HasText($Path, $Pattern) {
  if (-not (Test-Path $Path)) { return $false }
  return Select-String -Path $Path -Pattern $Pattern -Quiet
}

function ExpiryBlock($Path) {
  $text = Get-Content $Path -Raw
  $match = [regex]::Match($text, "CREDENTIAL_TYPES_REQUIRE_EXPIRY\s*=\s*\[(?<body>[\s\S]*?)\]")
  if ($match.Success) { return $match.Groups["body"].Value }
  return ""
}

Write-Host "=== Stage 15 Verification: Credential Field Rules ==="

Write-Host "--- Build And Syntax Checks ---"
pnpm --filter @staff-entry/server build
if ($LASTEXITCODE -eq 0) { Pass "Server build passed" } else { Fail "Server build failed" }

pnpm --filter @staff-entry/admin build
if ($LASTEXITCODE -eq 0) { Pass "Admin build passed" } else { Fail "Admin build failed" }

$miniappJs = Get-ChildItem apps/miniapp -Recurse -Filter *.js
$jsOk = $true
foreach ($file in $miniappJs) {
  node --check $file.FullName
  if ($LASTEXITCODE -ne 0) { $jsOk = $false }
}
if ($jsOk) { Pass "Miniapp JS syntax valid" } else { Fail "Miniapp JS syntax invalid" }

Write-Host "--- Miniapp Field Configuration ---"
$constants = "apps/miniapp/utils/constants.js"
$credJs = "apps/miniapp/pages/credential/edit/index.js"
$credWxml = "apps/miniapp/pages/credential/edit/index.wxml"
if (HasText $constants "EDUCATION_LEVEL_OPTIONS") { Pass "Education level options exist" } else { Fail "Education level options missing" }
if (HasText $constants "高中/中专") { Pass "Education option uses 高中/中专" } else { Fail "Education option 高中/中专 missing" }
if (HasText $constants "INSURANCE_COMPANY_OPTIONS") { Pass "Insurance company options exist" } else { Fail "Insurance company options missing" }
if (HasText $constants "其他") { Pass "Insurance company supports 其他" } else { Fail "Insurance company missing 其他" }
if (HasText $credJs "useEducationLevelPicker") { Pass "Education/student card use picker mode" } else { Fail "Education picker mode missing" }
if (HasText $credJs "showCredentialNumber") { Pass "Credential number visibility is type-driven" } else { Fail "Credential number visibility missing" }
if (HasText $credJs "showIssuingAuthority") { Pass "Issuing authority visibility is type-driven" } else { Fail "Issuing authority visibility missing" }
if ((HasText $credJs "showIssueDate") -and (HasText $credJs "showExpireDate")) { Pass "Issue/expiry date visibility is split" } else { Fail "Issue/expiry date visibility missing" }
if (HasText $credJs "保险单号") { Pass "Insurance policy number label configured" } else { Fail "Insurance policy number label missing" }
if (HasText $credJs "保险公司") { Pass "Insurance company label configured" } else { Fail "Insurance company label missing" }
if (HasText $credJs "专业") { Pass "Student card major field configured" } else { Fail "Student card major field missing" }
if (HasText $credJs "isEducation \|\| isStudentCard \? '专业'") { Pass "Education and student card both use major field" } else { Fail "Education major field missing" }
if (HasText $credJs "onInsuranceCompanyOtherInput") { Pass "Other insurance company input handler exists" } else { Fail "Other insurance company handler missing" }
if (HasText $credWxml "showInsuranceCompanyOther") { Pass "Other insurance company input rendered" } else { Fail "Other insurance company input missing" }

Write-Host "--- Expiry Requirement Narrowed ---"
$serverBlock = ExpiryBlock "apps/server/src/modules/credential/credential.constants.ts"
$miniBlock = ExpiryBlock $constants
if (($serverBlock -match "health_cert") -and ($serverBlock -match "insurance")) { Pass "Server expiry-required list keeps health/insurance" } else { Fail "Server expiry-required list missing health/insurance" }
if ($serverBlock -match "no_crime_cert|credit_report|medical_report") { Fail "Server still requires expiry for no-crime/credit/medical" } else { Pass "Server no longer requires expiry for no-crime/credit/medical" }
if ($miniBlock -match "no_crime_cert|credit_report|medical_report") { Fail "Miniapp still requires expiry for no-crime/credit/medical" } else { Pass "Miniapp no longer requires expiry for no-crime/credit/medical" }

Write-Host "--- Admin Display Labels ---"
$credReview = "apps/admin/src/pages/staff/components/CredentialReviewList.tsx"
$staffCred = "apps/admin/src/pages/staff/components/StaffCredentialList.tsx"
if ((HasText $credReview "保险单号") -and (HasText $credReview "保险公司")) { Pass "Admin review uses insurance labels" } else { Fail "Admin review insurance labels missing" }
if ((HasText $credReview "学历水平") -and (HasText $credReview "专业")) { Pass "Admin review uses student-card labels" } else { Fail "Admin review student-card labels missing" }
if (HasText $credReview "education.*student_card.*专业") { Pass "Admin review labels education major" } else { Fail "Admin review education major label missing" }
if ((HasText $staffCred "保险单号") -and (HasText $staffCred "保险公司")) { Pass "Admin credential list uses insurance labels" } else { Fail "Admin credential list insurance labels missing" }

Write-Host "--- Resume Display Dates ---"
$resumeJs = "apps/miniapp/pages/resume/index.js"
if (HasText $resumeJs "credit_report'.*dateMode: 'issue'") { Pass "Resume credit report uses issue date" } else { Fail "Resume credit report still uses expiry" }
if (HasText $resumeJs "medical_report'.*dateMode: 'issue'") { Pass "Resume medical report uses issue date" } else { Fail "Resume medical report still uses expiry" }

Write-Host "--- Diff Hygiene ---"
git diff --check
if ($LASTEXITCODE -eq 0) { Pass "git diff --check passed" } else { Fail "git diff --check failed" }

Write-Host ""
Write-Host "=== Stage 15 Verification Complete ==="
Write-Host "  Passed: $script:Pass"
Write-Host "  Failed: $script:Fail"

if ($script:Fail -gt 0) {
  exit 1
}
