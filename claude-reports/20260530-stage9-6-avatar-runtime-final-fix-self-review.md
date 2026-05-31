# Claude Self-Review Report

## Status

Status: `PASSED`

Task slug: stage9-6-avatar-runtime-final-fix

Task summary: Fix avatar upload runtime persistence bug where avatars upload successfully but fail to display on home/profile pages, and fix frontend false-success on avatar save failure.

Report time: 2026-05-30

## Scope

Requested change:

1. Backend: `StaffService.updateProfile()` must promote avatar file assets to `accessLevel: 'public'`, guarded by staff account ownership, so the miniapp public-preview endpoint can serve them.
2. Frontend: profile edit `handleSave()` must enforce post-save `GET /api/app/profile` refresh when avatar was changed; must not navigate back on failure; must compare returned avatarUrl against uploaded file ID; must show diagnostic `console.error`.
3. Preserve prior fixes: no ID card number in personal profile edit/view, resident ID card credential page remains intact.

Explicit non-goals:

- Do not touch ID card number removal.
- Do not add ID card number back to personal profile.
- Do not implement customer ordering, dispatch, payment, wallet, commission, dispute voting, or automatic punishment.
- Do not read/print `.env`, do not use `npx prisma`, do not commit code.

Pre-existing dirty files before editing:

29 modified files from prior stages (stages 8.2, 9.1-9.5), plus 18 untracked files (prior self-review reports, prompt files, verification scripts).

## Files Changed

Server:
- `apps/server/src/modules/staff/staff.service.ts` — Added avatar file public-promotion logic in `updateProfile()`: after setting `profileData.avatarUrl`, when the value is a durable file ID (not an HTTP URL), calls `this.prisma.fileAsset.updateMany()` to set `accessLevel: 'public'`, restricted by `id` and `uploadedByStaffAccountId: accountId`.

Miniapp:
- `apps/miniapp/pages/profile/edit/index.js` — Three changes:
  1. Added `avatarChanged: false` to page data.
  2. Set `avatarChanged: true` when avatar upload succeeds in `chooseAvatarAndUpload()`.
  3. Rewrote `handleSave()` post-save logic: when `avatarChanged` is true, GET refresh is mandatory; if refresh fails, shows `头像保存确认失败，请重试` and stays on page; if returned `avatarUrl` does not match `uploadedFileId`, shows `头像未保存成功，请重试` and stays on page; adds `console.error('[AvatarSaveConfirm] ...')` diagnostics.

Scripts/verifiers:
- `verify-stage9-6-avatar-runtime-final-fix.ps1` — New final verifier (UTF-8 with BOM).
- `verify-stage9-6-avatar-runtime-final-fix.cmd` — New CMD wrapper.

Database/migrations:
- No schema changes, no migrations.

## Commands Run

| Command | Purpose | Result |
| --- | --- | --- |
| `git status --short` | Pre-check | 29M + 20?? |
| `.\verify-stage9-5-avatar-runtime-and-profile-id-removal.cmd` | Baseline verifier | PASSED |
| `.\verify-stage9-6-avatar-runtime-final-fix.cmd` | Final verifier | PASSED |

## Baseline Verification

Baseline command: `.\verify-stage9-5-avatar-runtime-and-profile-id-removal.cmd`

Baseline result: PASSED (all markers including R1-R7, I1-I5, C1-C3 passed).

Notes: Baseline cascades through all prior stages (4 → 4.1 → 4.2 → 5 → 6A → 6B-1 → 6B-2 → 6B-3 → 7 → 8 → 8.1 → 8.2 → 9 → 9.1 → 9.2 → 9.3 → 9.4 → 9.5), all passing.

## Final Verification

Final command: `.\verify-stage9-6-avatar-runtime-final-fix.cmd`

Final result: PASSED

Key output summary:

Backend markers:
- [B1] fileAsset.updateMany in updateProfile — Passed
- [B2] accessLevel set to public — Passed
- [B3] Restricts by uploadedByStaffAccountId — Passed
- [B4] HTTP URL guard — Passed

Frontend markers:
- [F1] avatarChanged in profile edit state — Passed
- [F2] refresh failure shows avatar confirmation toast — Passed
- [F3] returned avatar vs uploaded file ID comparison — Passed
- [F4] failure path shows avatar mismatch toast — Passed
- [F5] console.error diagnostic markers — Passed

ID number removal markers:
- [I1] edit WXML - no ID number row — Passed
- [I2] view WXML - no ID number row — Passed
- [I3] edit JS - no onIdNumberInput — Passed
- [I4] edit JS - no idNumber in save payload — Passed
- [I5] Credential edit WXML - ID card number field preserved — Passed

Server build, Prisma schema validation, admin TypeScript check, miniapp JS syntax check — all passed.

## Repair Attempts

Attempt 1:
- Trigger: First run of verify-stage9-6 hit PowerShell parser errors (escaped regex patterns with `\n` and `\{` broke in single-quoted strings; Chinese chars mangled without BOM).
- Fix: Rewrote PS1 using `[regex]::Escape()` for Chinese text patterns, `\x7B`/`\x7D` for curly braces in regex, and saved with `Set-Content -Encoding UTF8` (BOM) via PowerShell.
- Result: All assertions passed on re-run.

## Database And Migration Notes

Schema changed: `no`

Migration added: `no`

Seed/demo data changed: `no`

## Manual Test Notes

Server/API:
- Restart `pnpm dev:server` and verify `PUT /api/app/profile` with a new avatar file ID triggers `fileAsset.accessLevel` promotion to `public`.
- Verify that an avatar file ID from another staff account is NOT promoted (use `updateMany` where clause with `uploadedByStaffAccountId` mismatch).

Miniapp:
1. Restart `pnpm dev:server` and `pnpm dev:admin`.
2. WeChat DevTools: clear cache and recompile.
3. True-device/simulator debugging: personal profile → edit → upload avatar → save.
4. Confirm save does NOT navigate away if avatar persistence verification fails (e.g., if `GET /api/app/profile` returns mismatched avatarUrl).
5. Confirm home page avatar shows the newly uploaded image after successful save.
6. Re-enter profile edit and confirm saved avatar still displays (not showing default/old avatar).
7. If still failing, inspect backend logs for `PUT /api/app/profile` and `GET /api/app/profile`, and inspect whether the `file_asset.access_level` is `public` for the avatar file ID.

Admin:
- No admin-facing changes in this stage.

Not manually verified:
- Real WeChat miniapp preview/build testing (requires WeChat DevTools with project configured).
- File storage behavior difference between local and OSS providers.

## Residual Risks

- The `purpose=avatar` field in `wx.uploadFile` multipart form data should already set `accessLevel: 'public'` in `FileController.upload()`. If the `@Body('purpose')` decorator is not receiving the multipart field correctly in the NestJS setup, the backend promotion in `updateProfile()` serves as defense-in-depth. Manual verification with a real upload is needed to confirm the full chain.
- The frontend `avatarChanged` tracking only triggers on new uploads in the current edit session. If a user enters the edit page and the loaded `avatarFileId` differs from what's on the server (e.g., after a failed previous save), the edit page would not detect this as a "change." This is an edge case but not a regression from prior behavior.

## Codex Review Checklist

- Confirm diff matches requested scope (backend avatar promotion + frontend no-false-success).
- Confirm no `.env` or secrets were read or committed.
- Confirm no out-of-scope modules were implemented.
- Confirm verifier result is credible (all 14 markers passed, server builds, type checks pass).
- Confirm any manual test gaps (real WeChat DevTools testing) are acceptable before commit.
- Confirm ID card number remains absent from personal profile edit/view.
- Confirm resident ID card credential page still requires ID number and both sides.
