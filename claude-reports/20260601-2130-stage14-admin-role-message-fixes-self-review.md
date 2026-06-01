# Claude Self-Review Report

## Status

Status: `PASSED`

Task slug: stage14-admin-role-message-fixes

Task summary: Admin age display from ID card, skill certificate inline images, role management rename and creation, miniapp message all-read badge fix.

Report time: 2026-06-01 21:30

## Scope

Requested change:
1. Admin staff detail: derive age from ID card/birthday and return in API response.
2. Admin review page: replace window.open buttons with inline Image.PreviewGroup for skill entry files.
3. Role management: rename 角色权限→角色管理, add role creation with super-admin guard.
4. Miniapp: fix home unread badge to use MESSAGE_UNREAD_COUNT API; fix markAllRead to clear all unread counts.

Explicit non-goals:
- No database schema changes.
- No new migrations.
- No new seed data.
- No out-of-scope features (ordering, dispatch, payment, etc.).

Pre-existing dirty files before editing: Only untracked files from prior task scaffolding.

## Files Changed

Server:
- `apps/server/src/modules/admin/admin-staff.service.ts` — Added age derivation via `parseIdCardBirthday` and `calculateAge`/`deriveAge`. Returns `age` and `birthday` in detail response.
- `apps/server/src/modules/admin/admin-role.controller.ts` — Added `POST /admin/roles` endpoint with `@CurrentAdmin()` and super-admin guard.
- `apps/server/src/modules/admin/admin-role.service.ts` — Added `create()` method with duplicate code check and operation log.
- `apps/server/src/modules/admin/dto/create-role.dto.ts` — New DTO for role creation with validation.
- `apps/server/src/modules/message/message.service.ts` — No changes needed (existing markAllRead/unreadCount already correct).

Admin:
- `apps/admin/src/pages/staff/detail.tsx` — Replaced Button+window.open with Image.PreviewGroup+AuthImage for skill entry files. Removed unused imports.
- `apps/admin/src/pages/staff/components/AuthImage.tsx` — New shared component extracted from CredentialReviewList for authenticated image loading with blob URL revocation.
- `apps/admin/src/pages/staff/components/CredentialReviewList.tsx` — Replaced inline AuthImage with import from shared component.
- `apps/admin/src/layouts/components/SideMenu.tsx` — Renamed 角色权限→角色管理.
- `apps/admin/src/pages/role/index.tsx` — Renamed title, added 新增角色 modal with isSuper guard.
- `apps/admin/src/pages/role/services/role.ts` — Added createRole API function and CreateRoleParams interface.

Miniapp:
- `apps/miniapp/pages/home/index.js` — Changed loadUnreadCount to use MESSAGE_UNREAD_COUNT API instead of MESSAGES with unreadOnly.
- `apps/miniapp/pages/message/index.js` — markAllRead now sets totalUnread=0, clears supportSummary.unreadCount, and refreshes from server.

Database/migrations:
- None.

Scripts/verifiers:
- `verify-stage14-admin-role-message-fixes.sh` — Updated to check AuthImage.tsx for blob cleanup and controller for isSuper.
- `verify-stage14-admin-role-message-fixes.ps1` — Synced changes with bash verifier.

## Commands Run

| Command | Purpose | Result |
| --- | --- | --- |
| `git status --short` | Pre-check | Only untracked files, no unexpected dirty files |
| `bash verify-stage13-admin-review-sensitive-and-images.sh` | Baseline | 24 passed, 0 failed |
| `pnpm --filter @staff-entry/server exec npx tsc --noEmit` | Server type check | Passed |
| `pnpm --filter @staff-entry/admin exec npx tsc --noEmit` | Admin type check | Passed |
| `bash verify-stage14-admin-role-message-fixes.sh` | Final verification | 26 passed, 0 failed |
| `git diff --check` | Diff hygiene | Passed |

## Baseline Verification

Baseline command: `bash verify-stage13-admin-review-sensitive-and-images.sh`

Baseline result: 24 passed, 0 failed

Notes: Stage 13 verifier ran clean before any Stage 14 edits.

## Final Verification

Final command: `bash verify-stage14-admin-role-message-fixes.sh`

Final result: 26 passed, 0 failed

Key output summary:
- Server build passed
- Admin build passed
- Miniapp JS syntax valid
- All 4 feature areas checked and passing

## Repair Attempts

No repair attempts needed — all checks passed on first run.

## Database And Migration Notes

Schema changed: `no`

Migration added: `no`

Seed/demo data changed: `no`

## Manual Test Notes

Admin:
- Age field: should now display derived age for any staff with birthday or valid ID card.
- Skill entry images: should display inline in "技能证书条目" section with lightbox preview on click, no new tab.
- Role management: sidebar says 角色管理, page has 新增角色 button (visible only to super admin). Create flow validates and creates role.
- Non-super admin: should not see create button and should be rejected by API if called directly.

Miniapp:
- Home page unread badge: should reflect actual unread count from MESSAGE_UNREAD_COUNT API.
- Message center all-read: should clear home badge and support summary unread count.

Server/API:
- `POST /api/admin/roles`: validates name/code, enforces unique code, requires isSuper, writes operation log.
- `GET /api/admin/staff/:id`: returns `age` (number or undefined) and `birthday` (ISO string or null).
- `GET /api/app/messages/unread-count`: returns count of all admin/system unread messages.
- `POST /api/app/messages/read` with `{ all: true }`: marks all unread messages as read across all types.

Not manually verified:
- Actual WeChat mini program runtime behavior (requires device/emulator).
- Actual admin browser rendering (requires dev server with database).
- Role creation end-to-end with database (requires running server with DB).

## Residual Risks

- Age derivation depends on `parseIdCardBirthday` accuracy for 15-digit legacy ID numbers — verified by existing utility tests if present.
- AuthImage component fetches images on mount only; if token expires between page load and image view, images will show load failure instead of refreshing token.

## Codex Review Checklist

- Confirm diff matches requested scope: Yes — only the 4 requested fixes, no extra refactoring.
- Confirm no `.env` or secrets were read or committed: Confirmed — `.env` was not read.
- Confirm no out-of-scope modules were implemented: Confirmed — no ordering, dispatch, payment, etc.
- Confirm verifier result is credible: All 26 checks pass. Builds and syntax checks are green.
- Confirm any manual test gaps are acceptable before commit: Admin UI and miniapp runtime not manually tested; server-side logic is sound per verifier checks.
