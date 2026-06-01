# Claude Code Task: Stage 11 Miniapp Profile And Credential Merge

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
- Run a baseline verifier before editing when one exists.
- Make focused changes only.
- Run final verification after editing.
- If verification fails, make at most two focused repair attempts and rerun the same verifier after each attempt.
- Always write one structured report under `claude-reports/`, whether verification passes or fails.
- Do not commit code.

## Important Instruction

Before coding, output a short implementation plan and list the files you expect to change.

## Task Summary

Implement Stage 11 miniapp UX changes:

1. Merge personal profile and credential management into one miniapp page named `个人资料`.
2. Remove the separate home entry for `证件管理`; home should keep only one onboarding-data entry named `个人资料`.
3. Remove `单项技能` / independent 保洁、厨师 from the current miniapp experience and business flow for now.
4. Make all strong-admission credentials mandatory again:
   - 居民身份证
   - 健康证
   - 无犯罪记录证明
   - 征信报告
   - 体检报告
5. Apply two small ID-card edit page UX fixes:
   - Reduce the upward movement when the keyboard opens by about one line.
   - Move the ID-card number input content inward from the right screen edge by about two Chinese characters.

## Product Context

The user has decided that 保洁 and 厨师 will belong to a later home-service appointment mini program, not this staff onboarding qualification mini program. Current miniapp should be simpler and focus on qualification materials and certificate-backed skills.

Keep the app within stage-one staff onboarding MVP. Do not implement ordering, dispatching, payment, wallet, customer flows, dispute voting, automatic punishment, or any future business system.

## Confirmed Requirements

### 1. Home Page Entry

Current home has separate grid entries:

- `个人资料`
- `证件管理`

Required:

- Home should have only one entry for onboarding/profile data: `个人资料`.
- Remove the standalone `证件管理` grid entry from the home page.
- Tapping `个人资料` should open the merged page.
- Keep other existing home entries such as 我的简历、服务记录、消息中心、联系客服、账号设置 unless existing code requires minor layout adjustment.

### 2. Merged Page Name

The merged page must be called:

`个人资料`

Use this as the navigation title where relevant.

### 3. Merged Page Structure

Build the merged `个人资料` page with this structure:

```text
个人资料

一、基本信息
- 头像
- 姓名
- 性别
- 出生日期（从居民身份证号自动读取，只读）
- 手机号（只读）
- 家庭住址
- 紧急联系人
- 紧急联系人电话

二、服务信息
- 服务类别
  月嫂、育儿嫂、住家保姆、白班保姆、养老保姆
- 服务区域

三、技能证书
- 技能一
- 技能二
- 技能三

四、强准入资料
- 居民身份证
- 健康证
- 无犯罪记录证明
- 征信报告
- 体检报告

五、选填资料
- 保险
- 学历/毕业证
- 学生证
- 其他资料

底部固定按钮：
- 保存资料
- 提交审核
```

### 4. Profile Editing In Merged Page

The user approved direct inline editing on the merged page.

Required:

- Basic info, service categories, service areas, and emergency contact fields should be directly editable inside the merged page.
- `保存资料` should save profile fields, service categories, and service areas.
- Credential uploads and skill entry saves may keep their existing immediate-save/upload behavior.
- Birthday remains read-only and derived from resident ID-card number. If no ID-card number exists, show an empty/appropriate placeholder.
- Do not reintroduce manual birthday editing.
- Do not reintroduce ID-card number editing into personal profile basic info. ID-card number remains inside resident ID-card credential edit.

Implementation suggestion:

- Prefer reusing existing logic from:
  - `apps/miniapp/pages/profile/edit/`
  - `apps/miniapp/pages/credential/index/`
- It is acceptable to transform `apps/miniapp/pages/profile/edit/index.*` into the merged page and stop using `credential/index` as a standalone home entry.
- Keep backward compatibility for pages that still navigate to old credential edit pages.

### 5. Remove Independent Skills From Current Miniapp UX

Remove from the current miniapp visible flow:

- `单项技能`
- `服务技能` section for independent skills
- 保洁
- 厨师

Important:

- Use方案 A: do not drop backend Prisma models/tables for `StaffIndependentSkill`. Leave Stage 10 migration and backend tables in place, unused.
- Do not create a drop-table migration.
- Do not show independent skill toggles on the merged page.
- Do not call independent skill APIs from the merged miniapp page.
- Admin may keep old code if it is harmless, but the current miniapp flow should not expose or depend on 保洁/厨师.

### 6. Strong Admission Credential Rules

After removing 保洁/厨师 single skills, the strong admission rules should be simple:

The following are all required for the current miniapp flow:

- 居民身份证
- 健康证
- 无犯罪记录证明
- 征信报告
- 体检报告

Required backend/API behavior:

- Intake preview should mark all five as required.
- Intake submit should require all five.
- Admin approval should require all five to be present and approved.
- Remove or bypass the Stage 10 relaxation logic that allowed credit_report / medical_report to be optional for selected independent skills.
- Do not remove database tables for independent skills.

Required miniapp text behavior:

- Remove text such as:
  - `仅勾选保洁/厨师...`
  - `仅选择单项技能...`
  - `默认必传；仅选择单项技能且不填写技能证书时可不传`
- The credential section should present five required credentials under `强准入资料`.
- There should be no separate `技能附加资料` section for 征信报告/体检报告 unless there is a strong UX reason. Prefer putting all five in `强准入资料`.

### 7. Skill Certificate Entries

Keep the Stage 10 certificate-backed skill entries:

- 技能一
- 技能二
- 技能三

Keep existing rules:

- Each is optional.
- If filled, skill name / level / work duration are required.
- If filled, 1-3 certificate images are required.
- Duplicate skill names across three entries are blocked.
- Related service skills remain multi-select.

Do not include 保洁 or 厨师 in certificate skill names.

### 8. ID-Card Edit Page Keyboard UX Fine Tuning

Current issue after Stage 10:

- When tapping the ID-card number input on resident ID-card upload page, keyboard opens and the page moves upward too much.
- The ID-card number input content starts too close to the phone screen edge.

Required:

1. Reduce upward movement by about one line.
   - Current code likely uses `cursor-spacing="180"` and `.keyboard-spacer { height: 180px; }`.
   - Adjust both downward by approximately one line height. A reasonable first pass is around `140px` / equivalent.
   - Keep behavior stable and easy to tune.
2. Move the ID-card number input content inward from the right screen edge by about two Chinese characters.
   - Add padding/right inset or width/margin adjustment specifically for the ID-card number input row/input.
   - Do not make other generic form inputs worse.
   - The goal is that the numeric/ID-card text is not visually stuck on the right edge when editing on a phone.

Relevant files to inspect:

- `apps/miniapp/pages/credential/edit/index.wxml`
- `apps/miniapp/pages/credential/edit/index.wxss`
- `apps/miniapp/pages/credential/edit/index.js`

### 9. Suggested Files To Inspect First

Inspect before editing:

- `apps/miniapp/pages/home/index.wxml`
- `apps/miniapp/pages/home/index.js`
- `apps/miniapp/pages/home/index.wxss`
- `apps/miniapp/pages/profile/edit/index.js`
- `apps/miniapp/pages/profile/edit/index.wxml`
- `apps/miniapp/pages/profile/edit/index.wxss`
- `apps/miniapp/pages/profile/edit/index.json`
- `apps/miniapp/pages/profile/view/index.js`
- `apps/miniapp/pages/profile/view/index.wxml`
- `apps/miniapp/pages/profile/view/index.json`
- `apps/miniapp/pages/credential/index.js`
- `apps/miniapp/pages/credential/index.wxml`
- `apps/miniapp/pages/credential/index.wxss`
- `apps/miniapp/pages/credential/index.json`
- `apps/miniapp/pages/credential/edit/index.js`
- `apps/miniapp/pages/credential/edit/index.wxml`
- `apps/miniapp/pages/credential/edit/index.wxss`
- `apps/miniapp/pages/submit/index.js`
- `apps/miniapp/pages/submit/index.wxml`
- `apps/miniapp/app.json`
- `apps/server/src/modules/intake/intake.service.ts`
- `apps/server/src/modules/admin/admin-staff.service.ts`
- Stage 10 verifier files.

### 10. Verification

Create or update Stage 11 verifier:

- `verify-stage11-profile-credential-merge.cmd`
- `verify-stage11-profile-credential-merge.ps1`
- `verify-stage11-profile-credential-merge.sh`

The verifier must:

1. Run the Stage 10 verifier first if available.
2. Validate Prisma schema if backend changed.
3. Build server if backend changed.
4. Build admin if admin changed.
5. Check miniapp JSON and JS syntax.
6. Assert home page no longer shows a standalone `证件管理` grid entry.
7. Assert home `个人资料` entry still exists.
8. Assert merged profile page contains sections/markers for:
   - 基本信息
   - 服务信息
   - 技能证书
   - 强准入资料
   - 选填资料
   - 保存资料
   - 提交审核
9. Assert merged page does not show independent skill toggles:
   - no `服务技能` independent section
   - no `单项技能`
   - no visible `保洁` / `厨师` independent toggles
10. Assert all five strong admission credentials are in the required list.
11. Assert 征信报告 / 体检报告 are no longer described as optional due to 保洁/厨师.
12. Assert intake/admin backend no longer relaxes credit_report / medical_report based on independent skills.
13. Assert ID-card keyboard tuning markers:
   - lower cursor spacing than Stage 10
   - lower keyboard spacer than Stage 10
   - ID-card input-specific inset/padding/margin exists.

Do not make the verifier marker-only if obvious build/type checks can run.

### 11. Manual Tests To Include In Report

The self-review report must list:

1. Miniapp true-device: home page shows one `个人资料` entry and no separate `证件管理` entry.
2. Miniapp true-device: `个人资料` opens the merged page.
3. Miniapp true-device: edit and save basic profile fields.
4. Miniapp true-device: select service categories and service areas, save, leave and return to confirm persistence.
5. Miniapp true-device: upload/update resident ID card.
6. Miniapp true-device: tap ID-card number input and confirm keyboard movement is lower than before.
7. Miniapp true-device: confirm ID-card number input text is visually inset from screen edge.
8. Miniapp: confirm all five strong admission credentials show as required.
9. Miniapp: confirm 保洁/厨师 are not shown in this app flow.
10. Miniapp: fill 技能一 and confirm image validation still works.
11. Admin: if backend/admin changed, confirm approval still requires all five strong admission credentials.

## Strictly Forbidden

- Do not read or print `.env`.
- Do not use `npx prisma`.
- Do not modify Word requirement documents.
- Do not delete or move unrelated files.
- Do not run `git reset`, `git checkout`, or rewrite Git history.
- Do not commit code.
- Do not implement customer ordering, dispatch, payment, wallet, commission/distribution, dispute voting, or automatic punishment.
- Do not drop the Stage 10 independent skill database tables in this task.

## Final Response

Include:

1. What changed.
2. Changed file groups.
3. Final verifier result.
4. Self-review report path.
5. Manual miniapp/admin checks still needed.
