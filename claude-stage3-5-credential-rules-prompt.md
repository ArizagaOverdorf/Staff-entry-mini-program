# Claude Code Task: Stage 3.5 Credential Admission Rules

You are working in:

`D:\CodexProjects\housekeeping-system\Staff entry mini-program`

## Context

Stages 0 through 3 are complete and committed.

Current issue:

- The code currently treats only `id_card` and `health_cert` as mandatory credentials.
- Real onboarding requires more admission materials.
- Skill certificates must be tied to the specific service skill they prove, otherwise admin review cannot know which skill is covered.

This task is a focused Stage 3.5 correction before Stage 4. Do not start Stage 4.

## Read first

Before coding, inspect:

- `CLAUDE.md`
- `家政服务人员入驻小程序_开发技术方案.md`
- `apps/server/src/modules/credential/credential.constants.ts`
- `apps/server/src/modules/credential/credential.service.ts`
- `apps/server/src/modules/credential/dto/upsert-credential.dto.ts`
- `apps/server/src/modules/intake/intake.service.ts`
- `apps/server/src/modules/admin/admin-staff.service.ts`
- `apps/miniapp/pages/credential`
- `apps/miniapp/pages/submit`
- `apps/miniapp/utils/constants.js`
- `apps/admin/src/pages/staff/components/CredentialReviewList.tsx`
- `apps/server/prisma/seed-demo-staff.js`

## Goal

Improve the admission credential rules and UI/API support:

1. More full-staff mandatory documents.
2. Skill certificates linked to selected service skills.
3. Submit/review validation reflects those rules.
4. Demo seed data remains useful for admin testing.

## Required backend changes

### 1. Credential type constants

Update credential constants so these types exist everywhere backend validation uses credential types:

- `id_card`: 身份证
- `health_cert`: 健康证
- `no_crime_cert`: 无犯罪记录证明
- `credit_report`: 征信报告
- `medical_report`: 体检报告
- `insurance`: 保险
- `skill_cert`: 技能证书
- `education`: 学历
- `other`: 其他

Mandatory full-staff credentials for MVP must be:

```ts
export const MANDATORY_CREDENTIAL_TYPES = [
  'id_card',
  'health_cert',
  'no_crime_cert',
  'credit_report',
  'medical_report',
];
```

Also define a clearly named conditional skill-cert rule, for example:

```ts
export const SKILL_CREDENTIAL_REQUIRED_CATEGORY_IDS = [
  'nanny',
  'elderly_care',
  'postpartum_care',
  'infant_care',
  'nursing',
];
```

Use the existing `StaffSkill.categoryId` values for this check. Keep this as a local constant for MVP; do not build a full rules engine.

### 2. Prisma relation for skill certificates

Add a relation table so one skill certificate credential can be linked to one or more selected staff skills.

Required model name:

`StaffCredentialSkill`

Required columns:

- `id`
- `staffCredentialId`
- `staffSkillId`
- `createdAt`

Relations:

- `StaffCredentialSkill.staffCredential -> StaffCredential`
- `StaffCredentialSkill.staffSkill -> StaffSkill`

Indexes/constraints:

- unique `staffCredentialId + staffSkillId`
- index by `staffCredentialId`
- index by `staffSkillId`

Update `StaffCredential` and `StaffSkill` with relation arrays.

Run Prisma migration only if schema changes:

```powershell
.\apps\server\node_modules\.bin\prisma.CMD migrate dev --name stage3_5_credential_skill_rules --schema apps\server\prisma\schema.prisma
```

Do not use `npx prisma`.

### 3. Credential DTO and service

Update credential create/update DTOs to accept:

- `staffSkillIds?: string[]`

Rules:

- For `credentialType === 'skill_cert'`, `staffSkillIds` is required and must contain at least one valid current user's `StaffSkill.id`.
- For non-`skill_cert`, ignore or reject `staffSkillIds`; prefer rejecting with a clear error to avoid ambiguous data.
- When creating a new credential version, persist skill links to the new `StaffCredentialSkill` rows.
- When updating a skill certificate, keep versioning behavior: old credential remains, new credential version gets the new skill links.
- File ownership validation from Stage 2 must remain intact.
- Response formatting should include linked skills, for example:
  - `linkedSkills: [{ id, categoryId, categoryName }]`
  - `staffSkillIds: [...]`

### 4. Intake validation

Update:

- `GET /api/app/intake/preview`
- `POST /api/app/intake/submit`

Validation must include:

- Missing full-staff mandatory credentials:
  - 身份证
  - 健康证
  - 无犯罪记录证明
  - 征信报告
  - 体检报告
- Missing conditional skill certificates:
  - If a selected skill's `categoryId` is in `SKILL_CREDENTIAL_REQUIRED_CATEGORY_IDS`, at least one current `skill_cert` must link to that `StaffSkill.id`.

Preview response should clearly return both:

- `mandatoryCredentials`
- `skillCredentialRequirements`

The submit endpoint should return clear validation messages if anything is missing.

### 5. Admin review validation/display

Update admin staff/credential APIs so admin detail and credential list include linked skill info.

Overall approval should still require all mandatory credentials to be approved.

Additionally, for each selected skill that requires a certificate, the linked `skill_cert` covering that skill must be approved before overall approval.

Do not auto-list, auto-pause, auto-dispatch, or implement Stage 4.

### 6. Admin frontend

Update staff credential review UI:

- Display credential type labels for `credit_report` and `medical_report`.
- Display whether a credential is mandatory/optional/skill certificate.
- For skill certificates, display linked skills.
- Keep the current review actions.

Do not redesign the whole admin app.

### 7. Miniapp frontend

Update miniapp constants and pages minimally:

- Add `credit_report` and `medical_report`.
- Ensure credential list/upload page can show the full mandatory set.
- For `skill_cert`, allow choosing one or more already selected service skills.
- Submit preview page should display missing mandatory documents and missing skill-certificate requirements.

Keep the UI simple and consistent with existing miniapp pages.

### 8. Demo seed data

Update `apps/server/prisma/seed-demo-staff.js`:

- Demo staff should include all full-staff mandatory credentials.
- At least one demo staff should include a `skill_cert` linked to a skill that requires certification, such as `nanny`.
- Keep demo staff IDs:
  - `DEMO1001`
  - `DEMO1002`
  - `DEMO1003`
- Re-running `seed-demo-staff.cmd` should still safely reset only those demo staff records.

## Strictly forbidden

Do not implement:

- Stage 4 listing availability management, manual pause/resume, expiry automation.
- Stage 5 service record summary maintenance.
- Stage 6 operation log query UI.
- Stage 7 integration APIs.
- Stage 8 大家评评理 workflow.
- Payment, deposit, wallet, debt, revenue sharing, order fulfillment, dispatch, map selection, customer ordering.

Do not:

- Read `.env` contents.
- Commit secrets.
- Delete or move unrelated files.
- Run `git reset`, `git checkout`, or rewrite Git history.
- Use `npx prisma`.
- Modify product requirement Word documents.

## Verification

When done, run:

```powershell
.\verify-stage3-5.cmd
```

If schema changes were made, ensure migration files are included.

Report:

1. Files changed.
2. Credential types and mandatory rules implemented.
3. Skill certificate relation implemented.
4. Migration name if any.
5. Demo seed status.
6. Verification result.
7. What remains deferred to Stage 4.
