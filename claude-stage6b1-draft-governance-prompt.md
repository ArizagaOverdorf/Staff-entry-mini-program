# Claude Code Task: Stage 6B-1 Draft Staff Governance

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

Implement only **draft staff governance**.

Do not implement management status. Do not implement credential expiry in this task. Those will be later tasks.

## Baseline And Final Verification

Baseline verifier:

```powershell
.\verify-stage6a-admin-service-records.cmd
```

Final verifier:

```powershell
.\verify-stage6b1-draft-governance.cmd
```

If the final verifier does not exist yet, create it as part of this task. It must run Stage 6A first and then assert the Stage 6B-1 markers below.

## Read First

- `CLAUDE.md`
- `claude-skills/self-review/SKILL.md`
- `apps/server/src/modules/admin/admin-staff.controller.ts`
- `apps/server/src/modules/admin/admin-staff.service.ts`
- `apps/admin/src/pages/staff/index.tsx`
- `apps/admin/src/pages/staff/services/staff.ts`
- `apps/admin/src/pages/staff/components/StaffTable.tsx`
- `apps/server/prisma/schema.prisma`

## Requirements

### Business rules

- `draft/草稿` means the user has logged in and may have bound phone, but has not submitted intake review.
- Draft staff should not appear in the default admin staff management list.
- Draft records may be kept for 7 days so a user can continue filling data.
- Draft records older than 7 days should have a safe cleanup path.
- Do not delete submitted/rejected/needs_more_info/approved accounts.

### Backend

Implement in admin staff list:

- Default excludes draft staff.
- Add query support for one of:
  - `includeDraft=true`, or
  - `showDraft=true`, or
  - `intakeStatus=draft`
- If admin explicitly filters `intakeStatus=draft`, show drafts.
- If admin does not explicitly ask for drafts, exclude `draft`.

Implement draft cleanup:

- Add admin endpoint under `/api/admin/staff` for cleaning drafts older than 7 days.
- Use existing `deletedAt` on `StaffAccount` for soft delete.
- Only clean accounts whose intake status is `draft` and whose createdAt is older than 7 days.
- Return count of cleaned records.
- Do not clean submitted/rejected/needs_more_info/approved accounts.

### Admin frontend

In service staff list page:

- Default view should not show draft users.
- Add a clear filter switch/checkbox: `包含草稿`.
- Add a safe cleanup button: `清理7天前草稿`.
- Cleanup action must ask confirmation before calling API.
- After cleanup, refresh the list.

### Verification script

Create:

- `verify-stage6b1-draft-governance.ps1`
- `verify-stage6b1-draft-governance.cmd`

The PS1 must:

- Run `.\verify-stage6a-admin-service-records.ps1` first.
- Build server.
- Run admin TypeScript check.
- Assert backend markers:
  - `includeDraft`
  - `cleanupDraft`
  - `deletedAt`
  - `7`
- Assert admin frontend markers:
  - `包含草稿`
  - `清理7天前草稿`
  - cleanup confirmation text
- Ensure the PS1 is saved as UTF-8 with BOM so Windows PowerShell 5.1 handles Chinese labels correctly.

## Strictly Forbidden

- Do not read or print `.env`.
- Do not use `npx prisma`.
- Do not modify Word requirement documents.
- Do not delete or move unrelated files.
- Do not run `git reset`, `git checkout`, or rewrite Git history.
- Do not commit code.
- Do not implement management status.
- Do not implement credential expiry.
- Do not implement customer ordering, dispatch, payment, wallet, commission/distribution, or dispute voting.

## Self-review report

Write:

`claude-reports/20260528-stage6b1-draft-governance-self-review.md`

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
5. Manual admin checks still needed.
