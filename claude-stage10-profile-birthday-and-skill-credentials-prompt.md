# Claude Code Task: Stage 10 Profile Birthday And Skill Credential Redesign

You are working in:

`/Users/a1234/Desktop/Staff-entry-mini-program`

## Required First Step

Before coding, read and follow:

- `AGENTS.md`
- `claude-skills/self-review/SKILL.md`
- `claude-skills/self-review/references/report-template.md`

Use the enhanced self-review protocol:

- Run `git status --short` before editing.
- Record all pre-existing dirty files in the self-review report.
- Run a baseline verifier before editing when one exists. If no suitable baseline exists, state that clearly.
- Make focused changes only.
- Run final verification after editing.
- If verification fails, make at most two focused repair attempts and rerun the same verifier after each attempt.
- Always write one structured report under `claude-reports/`, whether verification passes or fails.
- Do not commit code.

## Task Summary

Implement the user-confirmed stage 10 changes:

1. Personal profile birthday should be derived from the resident ID card number in credential management, not manually entered.
2. Improve miniapp resident ID-card number editing UX when the mobile keyboard appears.
3. Redesign skill credential entry into independent housekeeping/cook skill toggles plus three optional certificate-backed skill entries.
4. Update backend/admin/miniapp validation and display rules accordingly.

## Critical Product Boundaries

This project remains the stage-one staff onboarding MVP, a staff qualification center only.

Strictly do not implement:

- Customer ordering
- Map-based staff selection
- Dispatching
- Order fulfillment
- Payment
- Wallet/deposit
- Revenue sharing
- Debt records
- Middle-number phone service
- Full dispute workflow
- Real dispute voting
- Automatic punishment
- Automatic dispatch freeze

Do not read or print `.env`. Do not run `git reset`, `git checkout --`, delete files, rewrite Git history, or commit code.

## User-Confirmed Requirements

### 1. Personal Profile Birthday

Current issue:

- The personal profile page currently asks the user to manually fill birthday.

Required behavior:

1. Personal profile page must not ask the user to manually fill birthday.
2. Birthday must be derived from the resident ID-card number maintained under credential management.
3. If the user has not filled an ID-card number yet, birthday displays as empty.
4. The profile page may display birthday, but it must be read-only and not manually editable.
5. Resident ID-card number still belongs to credential management and remains required there.
6. Do not reintroduce ID-card number editing into personal profile.

Implementation notes:

- Prefer one shared ID-card birthday parsing helper if a suitable utility does not already exist.
- For Chinese resident ID cards, support 18-digit IDs. If existing code supports 15-digit IDs, preserve or improve it, but do not broaden scope unnecessarily.
- Keep credential management as the source of truth for ID-card number.
- Ensure backend/admin/miniapp do not rely on manually submitted birthday from personal profile.

### 2. Resident ID-Card Input Keyboard UX In Miniapp

Current issue:

- In credential management, resident ID-card number is required.
- When the user taps the ID-card number input, the mobile keyboard covers about half of the input box and the save button, causing poor UX.

Required behavior:

1. When the ID-card number input receives focus and the keyboard appears, move the ID-card edit page content upward by about three lines of vertical height.
2. The save button must not be hidden by the keyboard.
3. The keyboard should show a top-right `完成` action where supported by WeChat input APIs.
4. After the user enters the ID-card number, tapping `完成` or tapping another area should dismiss the keyboard.
5. After dismissing the keyboard, the user can save normally.
6. Do not make the page jump permanently; restore normal layout when the keyboard is hidden.

Implementation hints:

- Inspect existing miniapp credential edit page files before changing.
- Use WeChat mini program input properties/events where appropriate, such as confirm type, focus/blur handlers, cursor spacing, or keyboard height handling.
- Keep the UX simple and robust on true-device debugging.

### 3. Independent Skill Toggles: Housekeeping And Cook

Add two independent skill selections in credential management:

- `保洁`
- `厨师`

Rules:

1. `保洁` and `厨师` are independent skill toggles, not certificate-backed skill entries.
2. They must not appear in `技能一` / `技能二` / `技能三` skill-name list.
3. They do not require skill certificate image upload.
4. If the user only selects `保洁`, only selects `厨师`, or selects both `保洁` and `厨师`, and does not fill any certificate-backed skill entry:
   - Required admission credentials are only:
     - 居民身份证
     - 健康证
     - 无犯罪记录证明
   - 征信报告 and 体检报告 are not required.
5. If the user selects `保洁` and/or `厨师` but also fills any certificate-backed skill entry in `技能一` / `技能二` / `技能三`, then 征信报告 and 体检报告 remain required according to the original strong-admission rules.
6. Existing test/demo data does not need real historical compatibility because it will be deleted before production, but seed/demo scripts must not crash.

### 4. Certificate-Backed Skills: Skill 1 / Skill 2 / Skill 3

Redesign credential management to show three optional skill entry points:

- 技能一
- 技能二
- 技能三

Each skill entry contains:

1. 技能名称
2. 等级
3. 相关工作时长
4. 关联服务技能
5. 证书图片

Each entry is optional:

- The user may fill none of the three.
- The user may fill only one.
- The user may fill two or three.

If the user does not enter/fill a skill entry, that entry has no required fields.

If the user fills a skill entry, then:

- 技能名称 is required.
- 等级 is required.
- 相关工作时长 is required and must be a positive integer in months.
- 关联服务技能 is multi-select and may be freely selected.
- 证书图片 is required, at least 1 image and at most 3 images.

The three skill entries must not have duplicate skill names.

### 5. Certificate-Backed Skill Name List

The skill-name selector for 技能一/二/三 must contain exactly these values:

- 月嫂
- 育婴员
- 育婴师
- 育儿嫂
- 家政服务员
- 母婴护理师
- 产后恢复师
- 产后康复师
- 催乳师
- 保育员
- 整理收纳师
- 小儿推拿师
- 早期教育指导师
- 老年护理师
- 养老护理师
- 护工
- 陪诊师
- 保姆
- 管家
- 中式管家
- 家电清洗师
- 公共营养师
- 健康管理师
- 中式面点师
- 护士
- 医师

Important:

- Do not include `保洁`, `保洁员`, or `厨师` in this selector.
- `中式面点师` stays in this selector and requires certificate images because it requires certification.
- `护士` stays in this selector and requires certificate images because nurses have nurse qualification certificates.

### 6. Skill Level List

The level selector must contain:

- 初级
- 中级
- 高级
- 专家

### 7. Related Work Duration

The work duration field:

- Label: `相关工作时长`
- Unit: months
- Must accept positive integer month values.
- Display unit clearly as `月`.

### 8. Related Service Skills

The related service skill multi-select list must contain:

- 月嫂
- 育儿嫂
- 住家保姆
- 白班保姆
- 养老保姆
- 保洁
- 厨师
- 护士

Rules:

1. This field remains multi-select.
2. It can be freely selected.
3. Do not enforce strong binding between skill name and related service skills.
4. The business reason is that actual qualification is checked offline during trial work; online association is only declared service capability.
5. Do not implement online punishment, deduction, deposit handling, order restriction, or dispatch logic.

### 9. Certificate Images For Skill Entries

For each filled certificate-backed skill entry:

- At least 1 certificate image is required.
- At most 3 certificate images are allowed.

For independent `保洁` / `厨师` toggles:

- No certificate image is required.

### 10. Backend/API/Data Model Requirements

Update backend and data model as needed so the system can persist and retrieve:

- Independent skill toggles:
  - 保洁 selected or not
  - 厨师 selected or not
- Up to three certificate-backed skill entries:
  - skill name
  - level
  - related work duration in months
  - related service skills
  - 1-3 certificate images

Preserve the stable stage-one domain language:

- Use staff qualification/onboarding terms.
- Avoid naming these as orders.
- Prefer existing credential/staff skill patterns if they already exist.

If a Prisma schema change is necessary:

1. Add a proper migration.
2. Do not run `npx prisma`.
3. Use the project/local Prisma CLI style already used in this repo.
4. Do not read or print `.env`.

### 11. Admin Requirements

Update the admin management side so reviewers can see:

- Whether `保洁` is selected.
- Whether `厨师` is selected.
- Skill 1/2/3 details:
  - 技能名称
  - 等级
  - 相关工作时长
  - 关联服务技能
  - certificate images

Update admin review display/validation so:

- Independent `保洁` / `厨师` do not require certificate images.
- Certificate-backed skill entries require certificate images only when filled.
- If only independent `保洁` / `厨师` are selected and no certificate-backed skill entry is filled, 征信报告 and 体检报告 are not mandatory.
- If any certificate-backed skill entry is filled, keep 征信报告 and 体检报告 mandatory according to the original strong-admission rule.

### 12. Miniapp Requirements

Update the miniapp credential management flow:

1. Show independent checkboxes/toggles for:
   - 保洁
   - 厨师
2. Show three entry points:
   - 技能一
   - 技能二
   - 技能三
3. Each skill entry should open a focused editor or section to edit the fields listed above.
4. Enforce duplicate skill-name prevention across the three entries.
5. Enforce certificate image count:
   - 0 allowed only when the entry is empty.
   - 1-3 required when the entry is filled.
6. Keep the UI clean for true-device debugging.

### 13. Verification Expectations

Run available checks. Prefer:

- Existing relevant verifier if present.
- Prisma schema validation if schema changed.
- Server build/type check.
- Admin build/type check.
- Miniapp JavaScript syntax checks if the repo has prior verifier style.

If no Stage 10 verifier exists, create:

- `verify-stage10-profile-birthday-and-skill-credentials.cmd`
- On Mac, also create a shell-friendly verifier if useful:
  - `verify-stage10-profile-birthday-and-skill-credentials.sh`

The verifier should check the important behavior markers without becoming marker-only:

- Personal profile no longer manually edits birthday.
- Birthday is derived from resident ID-card number.
- Resident ID-card page still requires ID number.
- ID-card input has keyboard avoidance/completion handling.
- Independent `保洁` / `厨师` toggles exist.
- Skill selector excludes `保洁`, `保洁员`, and `厨师`.
- Skill selector includes `中式面点师`, `护士`, and `医师`.
- Related service skill options include `保洁`, `厨师`, `护士`.
- Skill entries enforce duplicate prevention.
- Filled skill entries require 1-3 certificate images.
- Independent `保洁` / `厨师` do not require skill certificate images.
- Only independent `保洁` / `厨师` can relax 征信报告 and 体检报告 requirement.

### 14. Manual Checks To Include In Report

Your self-review report must explicitly list these manual checks:

1. Miniapp true-device debugging: resident ID-card edit page, tap ID number input, confirm keyboard does not hide input/save button.
2. Miniapp true-device debugging: tap keyboard `完成` or outside area and confirm keyboard hides normally.
3. Miniapp: fill resident ID-card number and confirm profile birthday displays derived date and remains read-only.
4. Miniapp: select only `保洁` and confirm submit/preview does not require 征信报告 or 体检报告.
5. Miniapp: select only `厨师` and confirm submit/preview does not require 征信报告 or 体检报告.
6. Miniapp: select `保洁` + `厨师` and confirm submit/preview does not require 征信报告 or 体检报告.
7. Miniapp: fill 技能一 with a certificate-backed skill and confirm certificate image is required.
8. Miniapp: confirm each filled skill entry allows 1-3 certificate images.
9. Miniapp: confirm duplicate skill names across 技能一/二/三 are blocked.
10. Admin: confirm reviewer can see independent skills and all filled skill-entry details/images.

## Suggested File Areas To Inspect

Before editing, inspect relevant existing files instead of guessing:

- `apps/miniapp/pages/profile/edit/`
- `apps/miniapp/pages/profile/view/`
- `apps/miniapp/pages/credential/`
- `apps/miniapp/utils/`
- `apps/server/prisma/schema.prisma`
- `apps/server/src/modules/credential/`
- `apps/server/src/modules/staff/`
- `apps/server/src/modules/intake/`
- `apps/server/src/modules/admin/`
- `apps/admin/src/pages/staff/`
- Existing stage 9 verifier scripts and prompt files for local conventions.

## Strictly Forbidden

- Do not read or print `.env`.
- Do not use `npx prisma`.
- Do not modify Word requirement documents.
- Do not delete or move unrelated files.
- Do not run `git reset`, `git checkout`, or rewrite Git history.
- Do not commit code.
- Do not implement customer ordering, dispatch, payment, wallet, commission/distribution, dispute voting, or automatic punishment.
- Do not add payment/deposit/deduction behavior for users who choose wrong service skills.

## Final Response

In your final response, include:

1. What changed.
2. Changed file groups.
3. Final verifier result.
4. Self-review report path.
5. Manual miniapp/admin checks still needed.
