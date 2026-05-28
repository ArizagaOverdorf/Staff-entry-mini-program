# Claude Code Task: Stage 6B-3 Credential Expiry And Re-review

You are working in:

`D:\CodexProjects\housekeeping-system\Staff entry mini-program`

## Required First Step

Before coding, read and follow:

- `CLAUDE.md`
- `claude-skills/self-review/SKILL.md`
- `claude-skills/self-review/references/report-template.md`

Use the enhanced self-review protocol:

- Run `git status --short` before editing.
- Run the baseline verifier before editing.
- Make focused changes only.
- Run the final verifier after editing.
- If verification fails, make at most two focused repair attempts.
- Always write one structured report under `claude-reports/`, whether verification passes or fails.
- Do not commit code.

## Task

Implement only **credential expiry and re-review behavior**.

This task follows Stage 6B-2 staff management status. Do not implement customer ordering, dispatch, payment, wallet, commission, dispute voting, or automatic punishment.

## Baseline And Final Verification

Baseline verifier:

```powershell
.\verify-stage6b2-management-status.cmd
```

Final verifier:

```powershell
.\verify-stage6b3-credential-expiry.cmd
```

If the final verifier does not exist yet, create it as part of this task. It must run Stage 6B-2 first and then assert the Stage 6B-3 markers below.

## Read First

- `CLAUDE.md`
- `claude-skills/self-review/SKILL.md`
- `apps/server/src/modules/credential/credential.constants.ts`
- `apps/server/src/modules/credential/credential.service.ts`
- `apps/server/src/modules/credential/dto/upsert-credential.dto.ts`
- `apps/server/src/modules/intake/intake.service.ts`
- `apps/server/src/modules/admin/admin-staff.service.ts`
- `apps/admin/src/pages/staff/components/CredentialReviewList.tsx`
- `apps/admin/src/pages/staff/services/staff.ts`
- `apps/miniapp/pages/credential/edit/index.*`
- `apps/miniapp/pages/credential/index.*`
- `apps/miniapp/pages/resume/index.*`
- `apps/miniapp/utils/constants.js`

## Business Rules

Credential validity date is part of entry risk control.

When uploading/editing credentials during onboarding:

- Credentials that can expire must require an expiry date.
- Expired mandatory credentials should block submission.
- Expired credentials should display `证件过期`.
- Updating a credential after approval must still trigger re-review before returning to normal eligibility.

Existing behavior already appears to set approved staff back to `pending_review` after credential changes. Preserve and verify this behavior.

## Expiry Requirements

Require expiry date for these credential types:

- `health_cert` 健康证
- `no_crime_cert` 无犯罪记录证明
- `credit_report` 征信报告
- `medical_report` 体检报告
- `insurance` 保险

Do not require expiry date for:

- `id_card` 身份证
- `education` 学历/毕业证
- `student_card` 学生证
- `skill_cert` 技能证书
- `other` 其他

Reason: current product design intentionally keeps skill certificate fields simple: name, level, linked service skills, and image. Do not add skill certificate expiry in this stage.

## Backend Requirements

In `credential.constants.ts`:

- Add a reusable list such as `EXPIRING_CREDENTIAL_TYPES` or `CREDENTIAL_TYPES_REQUIRE_EXPIRY`.
- Add a helper/constant for mandatory credential expiry if useful.

In `credential.service.ts`:

- Validate required expiry date in both create and update.
- If a required-expiry type has no expiry date, throw clear business error.
- If expiry date format is invalid, throw clear business error.
- In `formatCredential`, compute:
  - `isExpired`
  - `expiryStatusLabel` with `证件过期` when expired
  - `badge` should be `expired` when current date is past expiry date
  - `statusLabel` can remain separate; do not overwrite admin audit status unless the code already does so cleanly.

In `intake.service.ts`:

- `preview()` must include expired status for mandatory credentials.
- `preview()` must add issue text and set `canSubmit=false` if a mandatory credential is expired.
- `submit()` must block submission if a mandatory credential is expired.
- Error text should include `证件过期`.

In `admin-staff.service.ts`:

- Credential response returned to admin must include `isExpired`, `expiryStatusLabel`, and `badge`.
- Admin approval should not approve an expired credential for required-expiry types. If admin tries, return a business error containing `证件过期`.

## Miniapp Requirements

Credential edit page:

- Show expiry date field only for required-expiry credential types listed above.
- Mark it required visually with `*`.
- Validate it before save.
- Do not show expiry date field for skill certificates.
- Do not show expiry date field for education/student_card/id_card/other unless already needed for a separate reason.

Credential list page:

- Show `证件过期` for expired current credentials.
- Required credential cards should display expired status clearly.
- Submit review must be blocked by backend preview if expired; frontend should show returned issue text.

Resume page:

- For sensitive audit items:
  - no_crime_cert: display approved status plus `开具日期`
  - health_cert / credit_report / medical_report: display approved status plus `有效期至`
  - if expired, display `证件过期`
- Insurance should display `有效` only when approved and not expired; otherwise `无效` or `证件过期` as appropriate.

## Admin Frontend Requirements

Credential review list:

- Show expiry date.
- Show `证件过期` badge/tag when expired.
- Make expired credentials visually obvious.
- If approve action returns backend error, display it.

Do not redesign the entire staff detail page.

## Verification Script

Create:

- `verify-stage6b3-credential-expiry.ps1`
- `verify-stage6b3-credential-expiry.cmd`

The PS1 must:

- Run `.\verify-stage6b2-management-status.ps1` first.
- Validate Prisma schema using the existing local Prisma CLI pattern in prior verifiers; do not use `npx prisma`.
- Build server.
- Run admin TypeScript check.
- Check miniapp JavaScript syntax.
- Assert backend markers:
  - `EXPIRING_CREDENTIAL_TYPES` or `CREDENTIAL_TYPES_REQUIRE_EXPIRY`
  - `health_cert`
  - `no_crime_cert`
  - `credit_report`
  - `medical_report`
  - `insurance`
  - `isExpired`
  - `expiryStatusLabel`
  - `证件过期`
  - submit/preview expired blocking marker
  - admin approve expired blocking marker
- Assert miniapp markers:
  - required expiry field marker
  - `证件过期`
  - skill certificate expiry not required marker or equivalent comment/condition
- Assert admin markers:
  - expiry date display
  - `证件过期`

Ensure the PS1 is saved as UTF-8 with BOM so Windows PowerShell 5.1 handles Chinese labels correctly.

## Strictly Forbidden

- Do not read or print `.env`.
- Do not use `npx prisma`.
- Do not modify Word requirement documents.
- Do not delete or move unrelated files.
- Do not run `git reset`, `git checkout`, or rewrite Git history.
- Do not commit code.
- Do not implement customer ordering, dispatch, payment, wallet, commission/distribution, dispute voting, or automatic punishment.
- Do not add skill certificate expiry in this stage.

## Self-review report

Write:

`claude-reports/20260528-stage6b3-credential-expiry-self-review.md`

Use status:

- `PASSED`
- `FAILED_AFTER_TWO_REPAIRS`
- `UNVERIFIED_ENV_BLOCKED`
- `PARTIAL_NEEDS_CODEX_REVIEW`

## Final Response

Report:

1. What changed.
2. Which file groups changed.
3. Final verifier result.
4. Self-review report path.
5. Manual admin/miniapp checks still needed.
