# Claude Self-Review Report

## Status

Status: `PASSED`

Task slug: stage6b1-draft-governance

Task summary: Implement draft staff governance — default exclude drafts from admin list, add includeDraft filter, add cleanup endpoint for drafts older than 7 days, admin frontend filter switch and cleanup button.

Report time: 2026-05-28

## Scope

Requested change:
- Default exclude draft staff from admin staff management list.
- Add `includeDraft` query param to optionally show drafts.
- Add `POST /api/admin/staff/cleanup-draft` endpoint to soft-delete drafts older than 7 days.
- Admin frontend: add "包含草稿" checkbox and "清理7天前草稿" button with confirmation.
- Create verify-stage6b1-draft-governance.ps1/.cmd.

Explicit non-goals:
- No management status implementation.
- No credential expiry implementation.
- No modification to dashboard stats.
- No database schema changes.
- No migration.

Pre-existing dirty files before editing:
- Multiple modified files from prior stages (miniapp, admin, server, schema, migrations).

## Files Changed

Server:
- `apps/server/src/modules/admin/admin-staff.service.ts` — Added `includeDraft` to `StaffListParams`; modified `list()` to exclude drafts by default (when `includeDraft` is false and no explicit `intakeStatus` filter); added `cleanupDrafts()` method that soft-deletes draft records older than 7 days via `deletedAt`.
- `apps/server/src/modules/admin/admin-staff.controller.ts` — Added `includeDraft` query param to `list()`; added `POST cleanup-draft` endpoint guarded by `staff.audit` permission.

Admin:
- `apps/admin/src/pages/staff/index.tsx` — Added `includeDraft` checkbox ("包含草稿") and cleanup button ("清理7天前草稿") with `Modal.confirm` dialog ("确认清理"); wired `includeDraft` into fetch params; reset clears the checkbox.
- `apps/admin/src/pages/staff/services/staff.ts` — Added `includeDraft` to `StaffListParams`; added `cleanupDraftStaff()` API function.

Miniapp:
- None.

Database/migrations:
- None. Uses existing `deletedAt` on `StaffAccount`.

Scripts/verifiers:
- `verify-stage6b1-draft-governance.ps1` — Created; runs Stage 6A baseline, builds server, runs admin type check, asserts backend markers (`includeDraft`, `cleanupDraft`, `deletedAt`, `7`), asserts frontend markers (`包含草稿`, `清理7天前草稿`, `确认清理`).
- `verify-stage6b1-draft-governance.cmd` — Created; thin wrapper around PS1.

Docs/prompts:
- None.

Other:
- None.

## Commands Run

| Command | Purpose | Result |
| --- | --- | --- |
| `git status --short` | Pre-check | PASS |
| `.\verify-stage6a-admin-service-records.cmd` | Baseline verification | PASS |
| `.\verify-stage6b1-draft-governance.cmd` | Final verification | PASS |

## Baseline Verification

Baseline command: `.\verify-stage6a-admin-service-records.cmd`

Baseline result: PASSED

Notes: Stage 6A verifier ran through all stages (4→4.1→4.2→5→6A), server build passed, admin type check passed.

## Final Verification

Final command: `.\verify-stage6b1-draft-governance.cmd`

Final result: PASSED

Key output summary:
- Stage 6A baseline: PASSED
- Server build: PASSED
- Admin type check: PASSED
- Backend markers (`includeDraft`, `cleanupDraft`, `deletedAt`, `7`): all found
- Frontend markers (`包含草稿`, `清理7天前草稿`, `确认清理`): all found

## Repair Attempts

No repairs needed. Verification passed on first run.

## Database And Migration Notes

Schema changed: `no`

Migration added: `no`

Migration name: N/A

Seed/demo data changed: `no`

## Manual Test Notes

Admin:
- Verify the staff list page loads without showing draft users by default.
- Check "包含草稿" checkbox and verify draft users appear.
- Uncheck and verify drafts are hidden again.
- Test "清理7天前草稿" button — confirm the confirmation dialog appears, then test the API call.
- Verify cleanup result message shows the count.

Miniapp:
- None.

Server/API:
- Test `GET /api/admin/staff` without params — should exclude draft records.
- Test `GET /api/admin/staff?includeDraft=true` — should include draft records.
- Test `GET /api/admin/staff?intakeStatus=draft` — should show only draft records.
- Test `POST /api/admin/staff/cleanup-draft` — should return cleaned count, only affect draft records older than 7 days.

Not manually verified:
- API endpoints not tested with actual database (requires running server and DB).
- Cleanup with real data not tested.
- Chinese character rendering in the UI not visually verified.

## Residual Risks

- Draft exclusion logic uses `intakeStatus: { intakeStatus: { not: 'draft' } }` which relies on the relation existing. Accounts without a `StaffIntakeStatus` record are excluded by the Prisma relation filter (null relation doesn't match `{ not: 'draft' }`), which is the desired behavior — those accounts are effectively draft.
- Dashboard stats (`totalStaff`) still counts draft accounts. The requirement did not ask to change this, but it could cause a mismatch between the stats count and the list count.
- Cleanup only targets accounts with explicit `intakeStatus.intakeStatus = 'draft'`. Accounts without an `StaffIntakeStatus` record (also effectively draft) are not cleaned.

## Codex Review Checklist

- Confirm diff matches requested scope.
- Confirm no `.env` or secrets were read or committed.
- Confirm no out-of-scope modules were implemented.
- Confirm verifier result is credible.
- Confirm any manual test gaps are acceptable before commit.
