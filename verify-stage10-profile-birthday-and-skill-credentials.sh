#!/bin/bash
# Stage 10 Profile Birthday And Skill Credential Redesign Verification (Mac/Linux)
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

export PATH="$HOME/.local/lib/npm-global/bin:/usr/local/bin:/opt/homebrew/bin:$PATH"

echo "Running Stage 10 verification..."

if ! command -v pnpm >/dev/null 2>&1; then
  echo "pnpm not found. Add pnpm to PATH before running this verifier."
  exit 1
fi

echo "Checking Stage 10 migration..."
if ! grep -R "staff_independent_skill" apps/server/prisma/migrations >/dev/null 2>&1; then
  echo "FAIL: missing migration for staff_independent_skill"
  exit 1
fi
if ! grep -R "staff_skill_entry" apps/server/prisma/migrations >/dev/null 2>&1; then
  echo "FAIL: missing migration for staff_skill_entry"
  exit 1
fi

echo "Validating Prisma schema..."
pnpm --filter @staff-entry/server exec prisma validate --schema prisma/schema.prisma
echo "Prisma schema is valid."

echo "Building server..."
pnpm --filter @staff-entry/server build
echo "Server build passed."

echo "Building admin..."
pnpm --filter @staff-entry/admin build
echo "Admin build passed."

echo "Validating miniapp JSON files..."
find apps/miniapp -name "*.json" -exec sh -c '
  for f; do
    node -e "JSON.parse(require(\"fs\").readFileSync(\"$f\",\"utf8\"))" || { echo "Invalid JSON in $f"; exit 1; }
  done
' _ {} +
echo "Miniapp JSON files valid."

echo "Checking miniapp JavaScript syntax..."
find apps/miniapp -name "*.js" -exec node --check {} \;
echo "Miniapp JS syntax check passed."

echo "Checking Stage 10 markers..."

echo "  1. Profile birthday read-only..."
grep -q "form-value" apps/miniapp/pages/profile/edit/index.wxml || { echo "FAIL: Birthday must be read-only form-value"; exit 1; }

echo "  2. Birthday derived from ID card..."
grep -q "parseIdCardBirthday" apps/server/src/utils/mask.util.ts || { echo "FAIL: parseIdCardBirthday missing"; exit 1; }
grep -q "parseIdCardBirthday" apps/miniapp/utils/idcard.js || { echo "FAIL: miniapp idcard utility missing"; exit 1; }
grep -q "parseIdCardBirthday" apps/server/src/modules/staff/staff.service.ts || { echo "FAIL: StaffService must use parseIdCardBirthday"; exit 1; }

echo "  3. ID card keyboard handling..."
grep -q "cursor-spacing" apps/miniapp/pages/credential/edit/index.wxml || { echo "FAIL: cursor-spacing missing"; exit 1; }
grep -q "confirm-type" apps/miniapp/pages/credential/edit/index.wxml || { echo "FAIL: confirm-type missing"; exit 1; }
grep -q "idCardKeyboardActive" apps/miniapp/pages/credential/edit/index.js || { echo "FAIL: idCardKeyboardActive missing"; exit 1; }
grep -q "keyboard-spacer" apps/miniapp/pages/credential/edit/index.wxml || { echo "FAIL: keyboard spacer missing"; exit 1; }

echo "  4. Independent skill toggles..."
grep -q "INDEPENDENT_SKILLS" apps/miniapp/utils/constants.js || { echo "FAIL: INDEPENDENT_SKILLS missing"; exit 1; }
grep -q "INDEPENDENT_SKILL_KEYS" apps/server/src/modules/credential/credential.constants.ts || { echo "FAIL: INDEPENDENT_SKILL_KEYS missing"; exit 1; }
grep -q "hasAnyIndependentSkillSelection" apps/server/src/modules/intake/intake.service.ts || { echo "FAIL: intake must check independent skill selection"; exit 1; }
grep -q "hasAnyIndependentSkillSelection" apps/server/src/modules/admin/admin-staff.service.ts || { echo "FAIL: admin review must check independent skill selection"; exit 1; }

echo "  5. Skill selector includes and excludes required names..."
grep -q "中式面点师" apps/miniapp/utils/constants.js || { echo "FAIL: 中式面点师 missing"; exit 1; }
grep -q "护士" apps/miniapp/utils/constants.js || { echo "FAIL: 护士 missing"; exit 1; }
grep -q "医师" apps/miniapp/utils/constants.js || { echo "FAIL: 医师 missing"; exit 1; }
if awk '/CERTIFICATE_SKILL_OPTIONS/{flag=1} /Related service skills/{flag=0} flag' apps/miniapp/utils/constants.js | grep -E "'保洁'|'保洁员'|'厨师'" >/dev/null; then
  echo "FAIL: certificate-backed skill selector must not include 保洁/保洁员/厨师"
  exit 1
fi

echo "  6. Related service skills include 保洁/厨师/护士..."
grep -A20 "RELATED_SERVICE_SKILLS" apps/miniapp/utils/constants.js | grep -q "保洁" || { echo "FAIL: 保洁 missing from related skills"; exit 1; }
grep -A20 "RELATED_SERVICE_SKILLS" apps/miniapp/utils/constants.js | grep -q "厨师" || { echo "FAIL: 厨师 missing from related skills"; exit 1; }
grep -A20 "RELATED_SERVICE_SKILLS" apps/miniapp/utils/constants.js | grep -q "护士" || { echo "FAIL: 护士 missing from related skills"; exit 1; }

echo "  7. Skill entry duplicate prevention..."
grep -q "已在其他技能条目中使用" apps/server/src/modules/credential/credential.service.ts || { echo "FAIL: server duplicate check missing"; exit 1; }
grep -q "已在其他条目中使用" apps/miniapp/pages/credential/index.js || { echo "FAIL: miniapp duplicate check missing"; exit 1; }

echo "  8. Skill entry image validation..."
grep -q "最多上传3张证书图片" apps/server/src/modules/credential/credential.service.ts || { echo "FAIL: server max image validation missing"; exit 1; }
grep -q "证书图片为必填项" apps/server/src/modules/credential/credential.service.ts || { echo "FAIL: server required image validation missing"; exit 1; }
grep -q "最多上传3张证书图片" apps/miniapp/pages/credential/index.js || { echo "FAIL: miniapp max image validation missing"; exit 1; }

echo "  9. Conditional credential logic..."
grep -q "shouldRequireConditionalCredentials" apps/server/src/modules/intake/intake.service.ts || { echo "FAIL: intake conditional logic marker missing"; exit 1; }
grep -q "shouldRequireConditionalCredentials" apps/server/src/modules/admin/admin-staff.service.ts || { echo "FAIL: admin conditional logic marker missing"; exit 1; }
grep -q "强准入资料未通过或缺失" apps/server/src/modules/admin/admin-staff.service.ts || { echo "FAIL: admin approval must block missing/unapproved credentials"; exit 1; }

echo " 10. Prisma schema and admin display..."
grep -q "StaffIndependentSkill" apps/server/prisma/schema.prisma || { echo "FAIL: StaffIndependentSkill model missing"; exit 1; }
grep -q "StaffSkillEntry" apps/server/prisma/schema.prisma || { echo "FAIL: StaffSkillEntry model missing"; exit 1; }
grep -q "skillEntries" apps/admin/src/pages/staff/detail.tsx || { echo "FAIL: admin detail missing skillEntries"; exit 1; }
grep -q "independentSkills" apps/admin/src/pages/staff/detail.tsx || { echo "FAIL: admin detail missing independentSkills"; exit 1; }

echo ""
echo "Stage 10 verification passed."
