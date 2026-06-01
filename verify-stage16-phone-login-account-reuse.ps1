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

Write-Host "=== Stage 16 Verification: Phone Login Account Reuse ==="

Write-Host "--- Build And Syntax Checks ---"
pnpm --filter @staff-entry/server build
if ($LASTEXITCODE -eq 0) { Pass "Server build passed" } else { Fail "Server build failed" }

$miniappJs = Get-ChildItem apps/miniapp -Recurse -Filter *.js
$jsOk = $true
foreach ($file in $miniappJs) {
  node --check $file.FullName
  if ($LASTEXITCODE -ne 0) { $jsOk = $false }
}
if ($jsOk) { Pass "Miniapp JS syntax valid" } else { Fail "Miniapp JS syntax invalid" }

Write-Host "--- Server Account Reuse Logic ---"
$authService = "apps/server/src/modules/auth/auth.service.ts"
if (HasText $authService "findActiveAccountByPhone") { Pass "Auth service finds existing account by phone" } else { Fail "Missing phone account lookup" }
if (HasText $authService "decrypt") { Pass "Auth service decrypts phone candidates for exact match" } else { Fail "Missing decrypt candidate match" }
if (HasText $authService "reuseExistingPhoneAccount: true") { Pass "bindPhone allows existing account reuse" } else { Fail "bindPhone reuse option missing" }
if (HasText $authService "reuseExistingPhoneAccount: false") { Pass "changePhone rejects existing phone account reuse" } else { Fail "changePhone duplicate guard missing" }
if (HasText $authService "手机号已绑定其他服务人员账号") { Pass "changePhone duplicate phone error present" } else { Fail "Duplicate phone error missing" }
if (HasText $authService "deletedAt: now") { Pass "Temporary duplicate account is soft-deleted" } else { Fail "Temporary account soft-delete missing" }
if (HasText $authService "openid: currentAccount.openid") { Pass "Existing account receives current openid" } else { Fail "Existing account openid transfer missing" }
if (HasText $authService "reusedAccount: true") { Pass "Bind response marks reused account" } else { Fail "Bind response reusedAccount missing" }
if (HasText $authService "signStaffToken") { Pass "Bind response returns token for reused account" } else { Fail "Reused account token missing" }

Write-Host "--- Miniapp Stores Reused Account Token ---"
$authIndex = "apps/miniapp/pages/auth/index.js"
$phoneBind = "apps/miniapp/pages/auth/phone-bind/index.js"
if ((HasText $authIndex "res.token") -and (HasText $authIndex "setToken\(res.token\)")) { Pass "Login page stores bind-phone token" } else { Fail "Login page token update missing" }
if ((HasText $authIndex "res.staffId") -and (HasText $authIndex "setStaffId\(res.staffId\)")) { Pass "Login page stores reused staffId" } else { Fail "Login page staffId update missing" }
if ((HasText $phoneBind "res.token") -and (HasText $phoneBind "setToken\(res.token\)")) { Pass "Legacy phone-bind page stores bind-phone token" } else { Fail "Legacy phone-bind token update missing" }
if ((HasText $phoneBind "res.staffId") -and (HasText $phoneBind "setStaffId\(res.staffId\)")) { Pass "Legacy phone-bind page stores reused staffId" } else { Fail "Legacy phone-bind staffId update missing" }

Write-Host "--- Diff Hygiene ---"
git diff --check
if ($LASTEXITCODE -eq 0) { Pass "git diff --check passed" } else { Fail "git diff --check failed" }

Write-Host ""
Write-Host "=== Stage 16 Verification Complete ==="
Write-Host "  Passed: $script:Pass"
Write-Host "  Failed: $script:Fail"

if ($script:Fail -gt 0) {
  exit 1
}

