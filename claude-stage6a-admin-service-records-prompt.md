# Claude Code Task: Stage 6A Admin Service Record Management

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

Implement the missing stage-one **service record management** vertical slice.

This is an admin-maintained service summary feature, not a real order system. Do not implement customer ordering, dispatch, payment, wallet, commission, distribution, or dispute voting.

## Baseline And Final Verification

Baseline verifier:

```powershell
.\verify-stage5-miniapp.cmd
```

Final verifier:

```powershell
.\verify-stage6a-admin-service-records.cmd
```

If the final verifier does not exist yet, create it as part of this task. It must include the Stage 5 verifier as its baseline and then assert the Stage 6A markers described below.

## Read First

- `CLAUDE.md`
- `claude-skills/self-review/SKILL.md`
- `apps/server/prisma/schema.prisma`
- `apps/server/src/modules/service-record/service-record.module.ts`
- `apps/server/src/modules/admin/admin-staff.service.ts`
- `apps/server/src/modules/admin/admin.module.ts`
- `apps/server/src/modules/admin/guards/*`
- `apps/admin/src/App.tsx`
- `apps/admin/src/layouts/components/SideMenu.tsx`
- `apps/admin/src/pages/staff/index.tsx`
- `apps/admin/src/pages/staff/detail.tsx`
- `apps/miniapp/pages/service-record/index.*`
- `apps/miniapp/pages/resume/index.*`

## Requirements

### 1. Backend admin service record APIs

Create usable admin APIs under `/api/admin/service-records`.

Required operations:

- List service records with pagination and filters:
  - staff keyword/name/staffId/phone where practical
  - service project
  - date range
  - whether disputed/violated
- Create service record manually.
- Update service record manually.
- Delete or soft-delete service record. Prefer soft-delete only if the existing schema already supports it; otherwise hard delete is acceptable for this stage.

Required fields based on current schema:

- `staffAccountId`
- `serviceDate`
- `externalOrderNo`
- `serviceProject`
- `serviceDurationMinutes`
- `customerName`
- `serviceDesc`
- `rating`
- `isDisputed`
- `disputeResult`
- `disputeRemark`
- `recordSource`

For UI and miniapp display, expose derived fields:

- date as `YYYY/MM/DD` or ISO plus frontend formatting
- address/city if available from service description or explicit field support; do not add schema unless truly needed
- project
- duration text
- amount text if schema supports it; if not, leave unset and do not add payment/order tables
- violation/dispute yes/no

Do not name this feature `order` in backend code. Use `serviceRecord`.

### 2. Miniapp app API for service records

Create usable miniapp API under `/api/app/service-records`.

Rules:

- Return only current logged-in staff account records.
- Do not expose admin remarks beyond fields intended for service summary.
- Must support pagination.
- Response must work with the existing miniapp service record and resume pages.

### 3. Admin frontend service record management

Add a visible admin menu item:

- `服务记录`

Add route:

- `/service-record`

Create a management page that supports:

- list records
- filter/search
- add record
- edit record
- delete record

Use React + Ant Design patterns already present in `apps/admin/src/pages`.

The form should include:

- service staff selector or staffAccountId input/search
- service date
- external order number
- service project
- service duration
- customer name
- service description
- rating
- whether disputed/violated
- dispute result
- dispute remark

Keep the page practical and testable. It does not need perfect UX, but it must be usable.

### 4. Verification script

Create:

- `verify-stage6a-admin-service-records.ps1`
- `verify-stage6a-admin-service-records.cmd`

The PS1 must:

- Run `.\verify-stage5-miniapp.ps1` first.
- Validate Prisma schema.
- Build server.
- Check admin TypeScript build or existing admin type check command.
- Assert that admin service-record backend controller/service/module exist.
- Assert `/api/admin/service-records` route markers exist.
- Assert `/api/app/service-records` route markers exist.
- Assert admin `/service-record` route and menu item exist.
- Assert visible Chinese labels exist:
  - `服务记录`
  - `服务项目`
  - `服务日期`
  - `是否违规`

### 5. Self-review report

Write a report under:

`claude-reports/`

Suggested filename:

`20260527-stage6a-admin-service-records-self-review.md`

Use status:

- `PASSED` if final verifier passes.
- `FAILED_AFTER_TWO_REPAIRS` if two repairs still fail.
- `UNVERIFIED_ENV_BLOCKED` only if environment prevents verification.
- `PARTIAL_NEEDS_CODEX_REVIEW` only if the feature is incomplete but some useful changes were made.

## Strictly Forbidden

- Do not read or print `.env`.
- Do not use `npx prisma`.
- Do not modify Word requirement documents.
- Do not delete or move unrelated files.
- Do not run `git reset`, `git checkout`, or rewrite Git history.
- Do not commit code.
- Do not implement customer ordering, dispatch, payment, wallet, commission/distribution, or dispute voting.

## Final Response

Report:

1. What changed.
2. Which file groups changed.
3. Final verifier result.
4. Self-review report path.
5. Manual browser/admin checks still needed.
