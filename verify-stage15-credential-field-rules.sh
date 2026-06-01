#!/bin/bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

export PATH="$HOME/.local/lib/npm-global/bin:/usr/local/bin:/opt/homebrew/bin:$PATH"

PASS=0
FAIL=0

pass() { PASS=$((PASS + 1)); echo "  PASS: $1"; }
fail() { FAIL=$((FAIL + 1)); echo "  FAIL: $1"; }

echo "=== Stage 15 Verification: Credential Field Rules ==="

echo "--- Build And Syntax Checks ---"
pnpm --filter @staff-entry/server build >/tmp/stage15-server-build.log 2>&1 && pass "Server build passed" || { cat /tmp/stage15-server-build.log; fail "Server build failed"; }
pnpm --filter @staff-entry/admin build >/tmp/stage15-admin-build.log 2>&1 && pass "Admin build passed" || { cat /tmp/stage15-admin-build.log; fail "Admin build failed"; }
find apps/miniapp -name "*.js" -exec node --check {} \; && pass "Miniapp JS syntax valid" || fail "Miniapp JS syntax invalid"
find apps/miniapp -name "*.json" -exec sh -c 'for f; do node -e "JSON.parse(require(\"fs\").readFileSync(\"$f\",\"utf8\"))" || exit 1; done' _ {} + && pass "Miniapp JSON valid" || fail "Miniapp JSON invalid"

echo "--- Miniapp Field Configuration ---"
CONSTANTS="apps/miniapp/utils/constants.js"
CRED_JS="apps/miniapp/pages/credential/edit/index.js"
CRED_WXML="apps/miniapp/pages/credential/edit/index.wxml"
grep -q "EDUCATION_LEVEL_OPTIONS" "$CONSTANTS" && pass "Education level options exist" || fail "Education level options missing"
grep -q "高中/中专" "$CONSTANTS" && pass "Education option uses 高中/中专" || fail "Education option 高中/中专 missing"
grep -q "INSURANCE_COMPANY_OPTIONS" "$CONSTANTS" && pass "Insurance company options exist" || fail "Insurance company options missing"
grep -q "其他" "$CONSTANTS" && pass "Insurance company supports 其他" || fail "Insurance company missing 其他"
grep -q "useEducationLevelPicker" "$CRED_JS" && pass "Education/student card use picker mode" || fail "Education picker mode missing"
grep -q "showCredentialNumber" "$CRED_JS" && pass "Credential number visibility is type-driven" || fail "Credential number visibility missing"
grep -q "showIssuingAuthority" "$CRED_JS" && pass "Issuing authority visibility is type-driven" || fail "Issuing authority visibility missing"
grep -q "showIssueDate" "$CRED_JS" && grep -q "showExpireDate" "$CRED_JS" && pass "Issue/expiry date visibility is split" || fail "Issue/expiry date visibility missing"
grep -q "保险单号" "$CRED_JS" && pass "Insurance policy number label configured" || fail "Insurance policy number label missing"
grep -q "保险公司" "$CRED_JS" && pass "Insurance company label configured" || fail "Insurance company label missing"
grep -q "专业" "$CRED_JS" && pass "Student card major field configured" || fail "Student card major field missing"
grep -q "isEducation || isStudentCard ? '专业'" "$CRED_JS" && pass "Education and student card both use major field" || fail "Education major field missing"
grep -q "onInsuranceCompanyOtherInput" "$CRED_JS" && pass "Other insurance company input handler exists" || fail "Other insurance company handler missing"
grep -q "showInsuranceCompanyOther" "$CRED_WXML" && pass "Other insurance company input rendered" || fail "Other insurance company input missing"

echo "--- Expiry Requirement Narrowed ---"
SERVER_CONSTANTS="apps/server/src/modules/credential/credential.constants.ts"
if awk '/CREDENTIAL_TYPES_REQUIRE_EXPIRY = \[/{flag=1} flag{print} /\];/{if(flag){exit}}' "$SERVER_CONSTANTS" | grep -Eq "health_cert|insurance"; then
  pass "Server expiry-required list keeps health/insurance"
else
  fail "Server expiry-required list missing health/insurance"
fi
if awk '/CREDENTIAL_TYPES_REQUIRE_EXPIRY = \[/{flag=1} flag{print} /\];/{if(flag){exit}}' "$SERVER_CONSTANTS" | grep -Eq "no_crime_cert|credit_report|medical_report"; then
  fail "Server still requires expiry for no-crime/credit/medical"
else
  pass "Server no longer requires expiry for no-crime/credit/medical"
fi
if awk '/CREDENTIAL_TYPES_REQUIRE_EXPIRY = \[/{flag=1} flag{print} /\];/{if(flag){exit}}' "$CONSTANTS" | grep -Eq "no_crime_cert|credit_report|medical_report"; then
  fail "Miniapp still requires expiry for no-crime/credit/medical"
else
  pass "Miniapp no longer requires expiry for no-crime/credit/medical"
fi

echo "--- Admin Display Labels ---"
CRED_REVIEW="apps/admin/src/pages/staff/components/CredentialReviewList.tsx"
STAFF_CRED="apps/admin/src/pages/staff/components/StaffCredentialList.tsx"
grep -q "保险单号" "$CRED_REVIEW" && grep -q "保险公司" "$CRED_REVIEW" && pass "Admin review uses insurance labels" || fail "Admin review insurance labels missing"
grep -q "学历水平" "$CRED_REVIEW" && grep -q "专业" "$CRED_REVIEW" && pass "Admin review uses student-card labels" || fail "Admin review student-card labels missing"
grep -q "education.*student_card.*专业" "$CRED_REVIEW" && pass "Admin review labels education major" || fail "Admin review education major label missing"
grep -q "保险单号" "$STAFF_CRED" && grep -q "保险公司" "$STAFF_CRED" && pass "Admin credential list uses insurance labels" || fail "Admin credential list insurance labels missing"

echo "--- Resume Display Dates ---"
RESUME_JS="apps/miniapp/pages/resume/index.js"
grep -q "credit_report'.*dateMode: 'issue'" "$RESUME_JS" && pass "Resume credit report uses issue date" || fail "Resume credit report still uses expiry"
grep -q "medical_report'.*dateMode: 'issue'" "$RESUME_JS" && pass "Resume medical report uses issue date" || fail "Resume medical report still uses expiry"

echo "--- Diff Hygiene ---"
git diff --check && pass "git diff --check passed" || fail "git diff --check failed"

echo ""
echo "=== Stage 15 Verification Complete ==="
echo "  Passed: $PASS"
echo "  Failed: $FAIL"

if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
