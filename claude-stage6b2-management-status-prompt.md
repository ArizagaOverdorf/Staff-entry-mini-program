# Claude Code Task: Stage 6B-2 Staff Management Status

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

Implement only **backend-controlled staff management status**.

This task follows Stage 6B-1 draft governance. Do not implement credential expiry in this task. Credential expiry will be Stage 6B-3.

## Baseline And Final Verification

Baseline verifier:

```powershell
.\verify-stage6b1-draft-governance.cmd
```

Final verifier:

```powershell
.\verify-stage6b2-management-status.cmd
```

If the final verifier does not exist yet, create it as part of this task. It must run Stage 6B-1 first and then assert the Stage 6B-2 markers below.

## Read First

- `CLAUDE.md`
- `claude-skills/self-review/SKILL.md`
- `apps/server/prisma/schema.prisma`
- `apps/server/src/modules/admin/admin-staff.controller.ts`
- `apps/server/src/modules/admin/admin-staff.service.ts`
- `apps/server/src/modules/listing/listing.service.ts`
- `apps/server/src/modules/staff/staff.service.ts`
- `apps/server/src/modules/account/account.service.ts`
- `apps/server/src/modules/message/*`
- `apps/server/src/modules/operation-log/*`
- `apps/admin/src/pages/staff/index.tsx`
- `apps/admin/src/pages/staff/detail.tsx`
- `apps/admin/src/pages/staff/components/StaffTable.tsx`
- `apps/admin/src/pages/staff/components/StaffProfileCard.tsx`
- `apps/admin/src/pages/staff/services/staff.ts`
- `apps/miniapp/pages/home/index.*`
- `apps/miniapp/pages/resume/index.*`
- `apps/miniapp/utils/constants.js`

## Requirements

### Business rules

Add a backend-controlled management status for service staff. It is separate from:

- intake status: draft / pending_review / approved / rejected / needs_more_info
- listing status: on / off, meaning staff self-service online/resting state

Use these statuses:

- `normal` = 正常
- `paused` = 暂停
- `blacklisted` = 拉黑

For miniapp/customer-facing copy:

- `normal`: `服务状态：正常`
- `paused`: `服务状态：暂停服务`
- `blacklisted`: `服务状态：已限制服务`

Do not show the customer-facing word `拉黑` in miniapp/resume copy.

### Database

Prefer adding fields to `StaffListingStatus`:

- `managementStatus` mapped to `management_status`, default `normal`, indexed
- `managementReason` mapped to `management_reason`
- `managementUpdatedAt` mapped to `management_updated_at`
- `managementUpdatedBy` mapped to `management_updated_by`

Add a Prisma migration. Do not use `npx prisma`.

If you choose a different existing model, document why in the self-review report.

### Backend admin

Implement:

- Service staff list returns management status and label.
- Service staff detail returns management status and label.
- Admin endpoint to set management status:
  - route under `/api/admin/staff/:staffId`
  - accepts status `normal | paused | blacklisted`
  - `paused` and `blacklisted` require a reason
  - `normal` may clear the reason
- When status changes:
  - write an operation log or existing audit log using project patterns
  - send a station message to the staff
  - if status becomes `paused` or `blacklisted`, force listing offline/resting (`listingStatus = off`, `isAvailable = false`)

### Backend app/listing behavior

Miniapp staff must not be able to switch online if management status is:

- `paused`
- `blacklisted`

The listing resume endpoint should reject with a clear professional message:

- paused: `服务状态暂停，暂不能上线`
- blacklisted: `服务状态受限，暂不能上线`

### Admin frontend

In service staff management:

- List page displays management status.
- Detail page/profile card displays management status.
- Detail page provides a safe admin action to set status:
  - 正常
  - 暂停
  - 拉黑
- Setting 暂停 or 拉黑 must require a reason in the UI.
- After change, refresh detail/list data.

Keep UI simple and practical. Do not redesign the entire admin.

### Miniapp home

Home page should display management status:

- normal: `服务状态：正常`
- paused: `服务状态：暂停服务`
- blacklisted: `服务状态：已限制服务`

If paused or blacklisted:

- User cannot switch online.
- Show a toast using the professional copy above.
- Do not use `拉黑` in miniapp copy.

### Miniapp resume

Resume page should display service status:

- normal: full resume may show `服务状态：正常`
- paused: show `暂停服务`
- blacklisted: do not show full resume details; show `该服务人员当前不可服务`

Do not expose private admin reason to customers unless already designed as staff-visible message.

### Verification script

Create:

- `verify-stage6b2-management-status.ps1`
- `verify-stage6b2-management-status.cmd`

The PS1 must:

- Run `.\verify-stage6b1-draft-governance.ps1` first.
- Validate Prisma schema using the existing local Prisma CLI pattern in prior verifiers; do not use `npx prisma`.
- Build server.
- Run admin TypeScript check.
- Check miniapp JavaScript syntax.
- Assert database/backend markers:
  - `managementStatus`
  - `management_status`
  - `managementReason`
  - `managementUpdatedAt`
  - `managementUpdatedBy`
  - `normal`
  - `paused`
  - `blacklisted`
  - station message creation
  - operation log or audit log creation
- Assert admin frontend markers:
  - `管理状态`
  - `正常`
  - `暂停`
  - `拉黑`
  - reason-required marker
- Assert miniapp markers:
  - `服务状态：正常`
  - `服务状态：暂停服务`
  - `服务状态：已限制服务`
  - `该服务人员当前不可服务`
  - no miniapp/resume customer-facing `拉黑` copy

Ensure the PS1 is saved as UTF-8 with BOM so Windows PowerShell 5.1 handles Chinese labels correctly.

## Strictly Forbidden

- Do not read or print `.env`.
- Do not use `npx prisma`.
- Do not modify Word requirement documents.
- Do not delete or move unrelated files.
- Do not run `git reset`, `git checkout`, or rewrite Git history.
- Do not commit code.
- Do not implement credential expiry.
- Do not implement customer ordering, dispatch, payment, wallet, commission/distribution, dispute voting, or automatic punishment.

## Self-review report

Write:

`claude-reports/20260528-stage6b2-management-status-self-review.md`

Use status:

- `PASSED`
- `FAILED_AFTER_TWO_REPAIRS`
- `UNVERIFIED_ENV_BLOCKED`
- `PARTIAL_NEEDS_CODEX_REVIEW`

## Final Response

Report:

1. What changed.
2. Which file groups changed.
3. Migration name.
4. Final verifier result.
5. Self-review report path.
6. Manual admin/miniapp checks still needed.
