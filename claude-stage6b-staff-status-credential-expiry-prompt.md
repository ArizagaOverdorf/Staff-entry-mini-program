# Claude Code Task: Stage 6B Staff Management Status And Credential Expiry

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

Implement **staff draft cleanup policy, backend management status, and credential expiry behavior**.

This is still the stage-one staff onboarding MVP. Do not implement customer ordering, dispatch, payment, wallet, commission, distribution, dispute voting, or automatic punishment.

## Baseline And Final Verification

Baseline verifier:

```powershell
.\verify-stage6a-admin-service-records.cmd
```

Final verifier:

```powershell
.\verify-stage6b-staff-status-credential-expiry.cmd
```

If the final verifier does not exist yet, create it as part of this task. It must run Stage 6A first, then assert the Stage 6B markers below.

## Read First

- `CLAUDE.md`
- `claude-skills/self-review/SKILL.md`
- `apps/server/prisma/schema.prisma`
- `apps/server/src/modules/admin/admin-staff.controller.ts`
- `apps/server/src/modules/admin/admin-staff.service.ts`
- `apps/server/src/modules/staff/staff.service.ts`
- `apps/server/src/modules/listing/*`
- `apps/server/src/modules/credential/*`
- `apps/server/src/modules/intake/*`
- `apps/admin/src/pages/staff/index.tsx`
- `apps/admin/src/pages/staff/detail.tsx`
- `apps/admin/src/pages/staff/components/*`
- `apps/miniapp/pages/home/index.*`
- `apps/miniapp/pages/resume/index.*`
- `apps/miniapp/pages/credential/edit/index.*`
- `apps/miniapp/pages/credential/index.*`
- `apps/miniapp/pages/submit/index.*`
- `apps/miniapp/utils/constants.js`

## Requirements

### 1. Draft staff governance

Business rule:

- `draft/草稿` means the user has logged in and may have bound phone, but has not submitted an intake review.
- Draft staff should not appear in the default admin staff management list.
- Draft records may be kept for 7 days so a user can continue filling data.
- Draft records older than 7 days should be excluded from the default admin list and should have a clear cleanup path.

Implement:

- Admin staff list default excludes `draft` intake status.
- Add an explicit filter/option to include or view draft staff when needed.
- Add backend support for this filter.
- Add a cleanup API or service method for draft staff older than 7 days. Prefer soft delete if schema supports `deletedAt` on `StaffAccount`; otherwise use the existing deletion convention in the project.
- Add an admin UI action for cleanup only if it can be made safe and obvious; otherwise backend method + verifier marker is acceptable.
- Do not delete submitted/rejected/needs_more_info/approved accounts.

### 2. Management status: normal / paused / blacklisted

Add a backend-controlled staff management status, separate from:

- intake status
- listing/online status

Use these statuses:

- `normal` = 正常
- `paused` = 暂停
- `blacklisted` = 拉黑

Implementation guidance:

- Prefer adding fields to the existing `StaffListingStatus` model if appropriate:
  - `managementStatus`
  - `managementReason`
  - `managementUpdatedAt`
  - `managementUpdatedBy`
- If using a different existing model is cleaner, document why in the self-review report.

Admin requirements:

- Service staff detail page must show management status.
- Admin can set status to 正常 / 暂停 / 拉黑.
- Changing to 暂停 or 拉黑 must require a reason.
- Write operation/audit log using the project's existing audit/operation/message patterns.
- Send a station message to the staff when status changes.
- List page should display management status.

Miniapp requirements:

- Home page should display management status in a professional wording:
  - normal: `服务状态：正常`
  - paused: `服务状态：暂停服务`
  - blacklisted: `服务状态：已限制服务`
- If management status is paused or blacklisted, staff cannot switch online.
- Resume page should display:
  - normal: full resume may show `服务状态：正常`
  - paused: show `暂停服务`
  - blacklisted: do not show full resume details; show a professional unavailable message such as `该服务人员当前不可服务`
- Do not use the customer-facing word `拉黑` in miniapp/resume copy.

### 3. Credential expiry and review behavior

Business rule:

- When uploading/editing credentials during onboarding, credential validity date must be provided for credentials that can expire.
- Updating a credential after approval must trigger re-review before staff returns to normal eligibility.
- Expired credentials should show `证件过期`.

Credential validity requirements:

- Require expiry date for:
  - 健康证 `health_cert`
  - 无犯罪记录证明 `no_crime_cert`
  - 征信报告 `credit_report`
  - 体检报告 `medical_report`
  - 保险 `insurance`
  - 技能证书 `skill_cert` only if the current page/business design keeps an expiry field for skills; if skills intentionally do not use expiry, leave skill certificate without expiry and document this.
- 身份证 may not require expiry if current design treats it as long-term identity material.
- 学历/毕业证 and 学生证 may remain optional/non-blocking.

Implement:

- Miniapp credential edit page requires expiry date for applicable types.
- Backend validates required expiry date for applicable types.
- If a current approved staff updates or creates a credential, existing behavior must still set intake/status back to review-required.
- Credential list and resume should show `证件过期` when current date is past expiry.
- Admin credential review list should clearly show expiry date and expired badge/status.
- Submit preview should block submission if mandatory credential is expired.

### 4. Verification script

Create:

- `verify-stage6b-staff-status-credential-expiry.ps1`
- `verify-stage6b-staff-status-credential-expiry.cmd`

The PS1 must:

- Run `.\verify-stage6a-admin-service-records.ps1` first.
- Validate Prisma schema.
- Build server.
- Run admin TypeScript check.
- Check miniapp JS syntax.
- Assert draft governance markers:
  - default admin staff list excludes draft
  - include/view draft filter exists
  - 7-day draft cleanup marker exists
- Assert management status markers:
  - `managementStatus`
  - `normal`
  - `paused`
  - `blacklisted`
  - `暂停服务`
  - `已限制服务`
- Assert credential expiry markers:
  - required expiry validation in backend and miniapp
  - `证件过期`
  - expired mandatory credential blocks submit preview

Ensure the PS1 is saved as UTF-8 with BOM so Windows PowerShell 5.1 handles Chinese labels correctly.

### 5. Self-review report

Write a report under:

`claude-reports/`

Suggested filename:

`20260528-stage6b-staff-status-credential-expiry-self-review.md`

Use status:

- `PASSED` if final verifier passes.
- `FAILED_AFTER_TWO_REPAIRS` if two repairs still fail.
- `UNVERIFIED_ENV_BLOCKED` only if environment prevents verification.
- `PARTIAL_NEEDS_CODEX_REVIEW` only if the feature is incomplete but useful changes were made.

## Strictly Forbidden

- Do not read or print `.env`.
- Do not use `npx prisma`.
- Do not modify Word requirement documents.
- Do not delete or move unrelated files.
- Do not run `git reset`, `git checkout`, or rewrite Git history.
- Do not commit code.
- Do not implement customer ordering, dispatch, payment, wallet, commission/distribution, dispute voting, or automatic punishment.

## Final Response

Report:

1. What changed.
2. Which file groups changed.
3. Final verifier result.
4. Self-review report path.
5. Manual admin/miniapp checks still needed.
