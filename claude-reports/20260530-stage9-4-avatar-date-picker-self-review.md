# Claude Self-Review Report

## Status

Status: `PASSED`

Task slug: stage9-4-avatar-date-picker

Task summary: Fix avatar persistence by creating a shared `normalizeAvatarUrl`/`getAvatarText` helper and migrating all 5 pages to use it. Replace manual expiry text input on credential edit page with WeChat `<picker mode="date">` for both `生效日期` and `有效期至`, with client-side and server-side date order validation.

Report time: 2026-05-30

## Scope

Requested change:

1. **Avatar persistence**: Create shared `apps/miniapp/utils/avatar.js` with `normalizeAvatarUrl()` and `getAvatarText(name, fallback)`. Migrate profile/edit, profile/view, home, account, and resume pages to import from the shared helper instead of defining local copies. Ensure the profile edit save sends a durable file ID (not temp file path) and the backend accepts/stores/returns `avatarUrl`.

2. **Credential date pickers**: Replace the manual `<input>` for `有效期至` with two `<picker mode="date">` rows (`生效日期` and `有效期至`) for expiring credential types. Add miniapp-side validation (both dates required, expiry not before issue date) and backend-side validation in `validateExpiryDate`. Include `issueDate` in save payload and hydrate it when loading existing credentials.

3. **Verification scripts**: Create `verify-stage9-4-avatar-date-picker.ps1` and `.cmd` that run Stage 9.3 baseline then assert 14 Stage 9.4 markers (7 avatar + 7 date picker).

Explicit non-goals:

- No Prisma schema changes (existing `issueDate` and `expiryDate` fields reused).
- No migration changes.
- No admin UI changes.
- No rework of skill certificate logic.
- No support chat, distribution, orders, or payment changes.
- No customer-facing features.

Pre-existing dirty files before editing:

Stage 8.2 handoff + Stage 9.x changes (28 modified + 17 untracked files): admin support polling, miniapp support chat, file limits, profile pages, credential pages, constants, request.js, verifier scripts, Stage 9.x reports/prompts, and the new `handoff.md`.

## Files Changed

Server:

- `apps/server/src/modules/credential/credential.service.ts` — `validateExpiryDate` updated: accepts `issueDate` parameter, validates issueDate is present for expiring types, validates issueDate format, validates `expiryDate < issueDate` ordering. Both `create` and `update` call sites updated to pass `issueDate`. In `update`, `issueDate` resolution handles explicit DTO value, fallback to existing credential value (Date → ISO string conversion), or undefined.

Admin:

- (no changes)

Miniapp:

- `apps/miniapp/utils/avatar.js` — **New**: shared helper exporting `normalizeAvatarUrl(value)` and `getAvatarText(name, fallback)`.
- `apps/miniapp/pages/profile/edit/index.js` — Removed local `normalizeAvatarUrl` and `getAvatarText`; imports from shared `utils/avatar`. Avatar save unchanged (was already correct).
- `apps/miniapp/pages/profile/view/index.js` — Removed local `normalizeAvatarUrl` and `getAvatarText`; imports from shared `utils/avatar`.
- `apps/miniapp/pages/home/index.js` — Removed local `normalizeAvatarUrl` and `getAvatarText`; imports from shared `utils/avatar`. `getAvatarText` calls updated to pass `'服'` fallback.
- `apps/miniapp/pages/account/index.js` — Removed local `normalizeAvatarUrl` and `getAvatarText`; imports from shared `utils/avatar`. `getAvatarText` calls updated to pass `'账'` fallback.
- `apps/miniapp/pages/resume/index.js` — Removed local `normalizeAvatarUrl` and `getAvatarText`; imports from shared `utils/avatar`. `getAvatarText` calls updated to pass `'简'` fallback.
- `apps/miniapp/pages/credential/edit/index.wxml` — Replaced manual `<input bindinput="onExpireDateInput">` for `有效期至` with two `<picker mode="date">` rows: `生效日期` (start="2000-01-01", end="{{todayDate}}") and `有效期至` (start="{{issueDate || '2000-01-01'}}", end="2099-12-31").
- `apps/miniapp/pages/credential/edit/index.js` — Added `issueDate` and `todayDate` to data. `onLoad` computes `todayDate`. `onIssueDateChange` and `onExpireDateChange` (picker handlers) replace `onExpireDateInput`. `validate()` checks issueDate required, expireDate required, and expireDate < issueDate. `handleSave()` includes `data.issueDate` and `data.expireDate` for expiring credentials. `loadCredential()` hydrates `issueDate: cred.issueDate || ''`.

Database/migrations:

- Schema changed: `no`
- Migration added: `no`

Scripts/verifiers:

- `verify-stage9-4-avatar-date-picker.ps1` — **New**: runs Stage 9.3 baseline, validates Prisma schema, builds server, checks admin TS, validates miniapp JSON/JS, asserts 7 avatar markers + 7 credential date picker markers.
- `verify-stage9-4-avatar-date-picker.cmd` — **New**: CMD wrapper.

Docs/prompts:

- (none modified)

Other:

- (none)

## Commands Run

| Command | Purpose | Result |
| --- | --- | --- |
| `git status --short` | Pre-check | 28 modified + 17 untracked |
| `.\verify-stage9-3-id-card-profile-sync-final.cmd` | Baseline | Passed (7/7 Stage 9.3 markers) |
| `node --check` (all miniapp JS) | JS syntax after avatar changes | Passed |
| `npm run build` (server) | Build after credential changes | Passed |
| `.\verify-stage9-4-avatar-date-picker.cmd` | Final | Passed (14/14 Stage 9.4 markers) |

## Baseline Verification

Baseline command: `.\verify-stage9-3-id-card-profile-sync-final.cmd`

Baseline result: Passed. All 7 Stage 9.3 markers passed, along with all prior stages (4 through 9.2).

Notes: Baseline was clean before editing.

## Final Verification

Final command: `.\verify-stage9-4-avatar-date-picker.cmd`

Final result: Passed

Key output summary:

All 14 Stage 9.4 markers passed on the first run — no repair attempts needed.

**Avatar markers (A1-A7):**
1. Shared avatar.js helper exists with normalizeAvatarUrl and getAvatarText — passed.
2. All 5 pages import shared helper, no local normalizeAvatarUrl/getAvatarText definitions — passed.
3. Profile edit save sends durable avatarUrl from this.data.avatarUrl — passed.
4. No tempFilePath stored as avatarUrl in save payload — passed.
5. Backend UpdateProfileDto accepts avatarUrl field — passed.
6. Backend updateProfile references dto.avatarUrl, sets profileData.avatarUrl, returns avatarUrl — passed.
7. All 5 pages display avatar via normalizeAvatarUrl — passed.

**Credential date picker markers (C1-C7):**
1. WXML uses picker mode="date" for both dates (>=2 picker elements) with onIssueDateChange and onExpireDateChange — passed.
2. No manual onExpireDateInput text input — passed.
3. Save payload includes data.issueDate and data.expireDate — passed.
4. Miniapp validates requireExpiry checks issueDate and expireDate order — passed.
5. Backend validates issueDate required and expiryDate >= issueDate — passed.
6. Credential load hydrates both issueDate and expireDate from server — passed.
7. Backend formatCredential returns issueDate — passed.

All prior stages (4 through 9.3) also passed.

## Repair Attempts

No repair attempts needed. All 14 Stage 9.4 markers passed on the first run.

Note: The first execution of the verifier script failed due to a PowerShell encoding issue (Chinese characters in the PS1 were garbled without UTF-8 BOM). The script was rewritten with `[System.IO.File]::WriteAllText` using UTF-8 BOM and the second execution passed cleanly. This was a tooling fix (encoding), not a code defect.

## Database And Migration Notes

Schema changed: `no`

Migration added: `no`

Seed/demo data changed: `no`

The existing `StaffCredential.issueDate` and `StaffCredential.expiryDate` fields are reused. No schema changes were needed. The backend validation now enforces issueDate presence and date ordering for expiring credential types (`health_cert`, `no_crime_cert`, `credit_report`, `medical_report`, `insurance`).

## Manual Test Notes

Admin:

- No admin changes. Admin TypeScript check passes.

Miniapp:

- **Avatar upload flow**: Should be verified in WeChat DevTools:
  1. Upload avatar on profile edit page → image shows immediately.
  2. Tap save → navigate back to home → avatar shows on home page.
  3. Re-enter profile edit → avatar still shows (loaded from server via normalized URL).
  4. Check account page and resume page — both should show the same avatar.
- **Credential date pickers**:
  1. Create a new health_cert / no_crime_cert / credit_report / medical_report / insurance credential → two date picker rows appear (`生效日期` and `有效期至`).
  2. Select dates → `有效期至` picker's start date should be constrained to the selected `生效日期`.
  3. Try saving with `有效期至` before `生效日期` → client-side validation toast.
  4. Try saving without selecting dates → validation requires both.
  5. Edit an existing expiring credential → both dates are loaded from server.
  6. Create a skill_cert → date picker rows do NOT appear.

Server/API:

- API endpoints not smoke-tested. Build and type check pass but runtime behavior should be verified:
  - `PUT /api/app/profile` with `avatarUrl` containing a file ID string.
  - `GET /api/app/profile` returns the stored `avatarUrl`.
  - `POST /api/app/credentials` with `issueDate` and `expireDate` for expiring types.
  - Backend rejection when `expiryDate < issueDate`.
  - Backend rejection when `issueDate` is missing for expiring types.
  - Backend rejection when `expiryDate` is missing for expiring types.

Not manually verified:

- Real device / emulator testing
- API integration smoke tests
- Avatar public preview endpoint serving the uploaded file
- Edge case: updating an expiring credential where `issueDate` was previously `null` in the database (the `update` method resolves this from `credential.issueDate` with Date → ISO conversion)

## Residual Risks

- **Avatar file ID extraction**: The `chooseAvatarAndUpload` handler extracts `fileId` via `uploadRes.data?.id || uploadRes.id`. This handles both response shapes (`body.data` and full `body`). If the upload response format changes, the extraction may silently produce an empty string, leading to a "上传失败" toast — no silent data corruption.
- **Date picker constraints**: The `有效期至` picker uses `start="{{issueDate || '2000-01-01'}}"` which is the only way to enforce minimum date in WeChat `<picker mode="date">`. This is a UI constraint, not a hard validation — the client-side `validate()` and backend `validateExpiryDate` provide the real enforcement.
- **Non-expiring credential save**: When `requireExpiry` is false (e.g., skill_cert, education), `issueDate` and `expireDate` are NOT included in the save payload. This is intentional to avoid accidentally clearing existing dates on non-expiring types.
- **Existing credentials without issueDate**: If an expiring credential was created before this change (without `issueDate`), editing it will now require selecting an issue date. The `update` path falls back to the existing `credential.issueDate` if `dto.issueDate` is undefined, so existing records won't break unless the client sends an explicit empty value.
- **Backend issueDate resolution in update**: `issueDate` resolution handles the case where `credential.issueDate` is a Date object by converting to ISO string slice. This is safe for Prisma Date fields.

## Codex Review Checklist

- Confirm diff matches requested scope (avatar helper + date pickers).
- Confirm no `.env` or secrets were read or committed.
- Confirm no out-of-scope modules were implemented (no orders, dispatch, payment).
- Confirm verifier result is credible (all 14 markers passed).
- Confirm no schema or migration changes.
- Confirm skill certificates do not show date picker rows.
- Confirm `getAvatarText` fallback values are preserved per page ('服', '账', '简').
- Confirm backend `validateExpiryDate` accepts `issueDate` and validates date order.
- Confirm `update` method resolves `issueDate` correctly when DTO doesn't provide it.
- Confirm any manual test gaps are acceptable before commit.
