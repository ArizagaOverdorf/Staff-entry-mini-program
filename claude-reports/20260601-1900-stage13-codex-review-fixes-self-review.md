# Claude Self-Review Report

## Status

Status: `PASSED`

Task slug: stage13-codex-review-fixes

Task summary: Review Claude's Stage 13 admin review implementation, repair authorization and image-preview cleanup issues, and rerun verification.

Report time: 2026-06-01 19:00

## Scope

Requested change:

Review and validate Claude's Stage 13 changes for admin review sensitive-data display, credential image inline review, duplicate credential title cleanup, credential review persistence, and overall intake approval image validation.

Explicit non-goals:

- No miniapp functional changes.
- No customer ordering, dispatch, payment, wallet, or dispute voting.
- No `.env` reads or prints.
- No git reset/checkout/delete/history rewrite.

Pre-existing dirty files before editing:

- Claude Stage 13 implementation files were modified.
- Stage 13 prompt/script files were untracked.
- `sync-patches/` was already untracked and unrelated.
- Claude reused `claude-reports/20260601-1508-stage13-claude-command-script-self-review.md` for the implementation report.

## Files Changed

Server:

- `apps/server/prisma/seed-admin.js`
  - Added `staff.sensitive.view` permission.
  - Codex fix: removed `staff.sensitive.view` from default ordinary `admin` role permissions, so ordinary admins must be explicitly granted this permission.
- `apps/server/src/modules/admin/admin-staff.controller.ts`
  - Passes current admin context to staff detail.
- `apps/server/src/modules/admin/admin-staff.service.ts`
  - Uses `isSuper` or `staff.sensitive.view` before decrypting full real name, phone, and ID number.
  - Writes `staff_sensitive_view` operation log when full sensitive data is returned.
  - Filters admin credentials endpoint to current credential rows and includes file side labels.

Admin:

- `apps/admin/src/pages/staff/services/staff.ts`
  - Adds `canViewSensitive` and `fileSide` typings.
- `apps/admin/src/pages/staff/components/StaffProfileCard.tsx`
  - Shows full phone/ID only when `canViewSensitive` is true.
- `apps/admin/src/pages/staff/components/CredentialReviewList.tsx`
  - Renders credential images inline with Ant Design `Image.PreviewGroup`.
  - Removes `window.open` preview behavior.
  - De-duplicates titles like `体检报告 - 体检报告`.
  - Codex fix: revokes object URLs created for authenticated image previews.

Miniapp:

- No changes.

Database/migrations:

- No schema changes.
- No migration added.
- Seed changed: re-run admin seed to create `staff.sensitive.view` permission in existing databases.

Scripts/verifiers:

- `verify-stage13-admin-review-sensitive-and-images.sh`
- `verify-stage13-admin-review-sensitive-and-images.ps1`
- `verify-stage13-admin-review-sensitive-and-images.cmd`
  - Codex fix: verifier now validates Prisma schema, confirms ordinary `admin` role does not receive sensitive permission by default, and checks image blob URL cleanup.

Docs/prompts:

- `claude-stage13-admin-review-sensitive-and-credential-images-prompt.md`
- `claude-stage13-admin-review-sensitive-and-credential-images.command`
- `run-claude-stage13-admin-review-sensitive-and-credential-images.ps1`
- `run-claude-stage13-admin-review-sensitive-and-credential-images.cmd`
- `claude-reports/20260601-1508-stage13-claude-command-script-self-review.md`
- This Codex review report.

Other:

- `sync-patches/` remains untracked and untouched.

## Commands Run

| Command | Purpose | Result |
| --- | --- | --- |
| `git status --short --branch` | Pre-check | Dirty Stage 13 files plus untracked `sync-patches/` |
| `./verify-stage13-admin-review-sensitive-and-images.sh` | Claude final verifier before Codex fixes | PASSED, 22/22 |
| `./verify-stage13-admin-review-sensitive-and-images.sh` | Final verifier after Codex fixes | PASSED, 24/24 |
| `git diff --check` | Whitespace/conflict marker check | PASSED |
| `node --check apps/server/prisma/seed-admin.js` | Seed script syntax check | PASSED |
| `./verify-stage12-login-autosave-required-images.sh` | Regression verifier | PASSED, 28/28 |

## Baseline Verification

Baseline command:

`./verify-stage12-login-autosave-required-images.sh`

Baseline result:

PASSED, 28 passed / 0 failed.

Notes:

Claude also ran it before implementation. Codex reran it after review fixes to confirm no Stage 12 regression.

## Final Verification

Final command:

`./verify-stage13-admin-review-sensitive-and-images.sh`

Final result:

PASSED, 24 passed / 0 failed.

Key output summary:

- Server build passed.
- Admin build passed.
- Prisma schema validates.
- `staff.sensitive.view` exists in seed.
- Super admin keeps all permissions.
- Ordinary `admin` role does not receive `staff.sensitive.view` by default.
- Admin detail checks `isSuper` or `staff.sensitive.view`, decrypts only when authorized, writes operation log, and returns `canViewSensitive`.
- Credential title dedup and inline image preview are present.
- `window.open` preview is removed.
- Authenticated image object URLs are revoked.
- Admin credentials endpoint filters `isCurrent: true`.
- Intake approval validates current credential files.

## Repair Attempts

Attempt 1:

- Trigger: Review found `staff.sensitive.view` was granted to the ordinary `admin` role by default, contrary to the requirement that ordinary admins need explicit highest-admin authorization.
- Fix: Removed `staff.sensitive.view` from the default `admin` role seed and strengthened verifier.
- Result: Stage 13 verifier passed.

Attempt 2:

- Trigger: Review found authenticated inline image blob URLs were created but not revoked.
- Fix: Added `URL.revokeObjectURL` cleanup in `AuthImage` and verifier coverage.
- Result: Stage 13 verifier and Stage 12 regression verifier passed.

## Database And Migration Notes

Schema changed: `no`

Migration added: `no`

Migration name: N/A

Seed/demo data changed: `yes`

Seed command needed for existing databases:

`node apps/server/prisma/seed-admin.js`

Note: run only in an environment where the required admin seed password env vars are already configured. Do not print `.env`.

## Manual Test Notes

Admin:

- Login as super admin; full name, phone, and ID number should show.
- Login as ordinary admin without `staff.sensitive.view`; phone/ID remain masked.
- Grant `staff.sensitive.view` to an ordinary admin role; full data becomes visible.
- Confirm operation log records `staff_sensitive_view`.
- Confirm all credential images render inline and click-to-enlarge opens in-page.
- Confirm `体检报告` does not render as `体检报告 - 体检报告`.
- Approve one credential, leave and re-enter; status should remain approved.
- Overall intake approval should pass after all current required credentials are uploaded and approved.

Miniapp:

- No direct changes in this stage.

Server/API:

- `/api/admin/staff/:staffId/credentials` should return only current credential rows with file arrays for `credit_report` and `medical_report`.
- `/api/admin/staff/:staffId/credentials/:credentialId/review` should persist status on the current row.
- `/api/admin/staff/:staffId/review/approve` should validate files on current credential rows.

Not manually verified:

- End-to-end admin UI and database operation-log checks were not run in browser in this Codex session.

## Residual Risks

- Existing databases need the seed rerun before `staff.sensitive.view` appears in permission management.
- If existing ordinary admin roles already gained `staff.sensitive.view` from a previous local seed run, removing it from seed does not automatically revoke it. The highest admin should review role permissions after seeding.

## Codex Review Checklist

- [x] Confirm diff matches requested scope.
- [x] Confirm no `.env` or secrets were read or committed.
- [x] Confirm no out-of-scope modules were implemented.
- [x] Confirm verifier result is credible.
- [x] Confirm manual test gaps are acceptable before commit.
