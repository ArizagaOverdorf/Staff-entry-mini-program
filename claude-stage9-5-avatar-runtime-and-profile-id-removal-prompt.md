# Claude Code Task: Stage 9.5 Avatar Runtime Persistence And Profile ID Number Removal

You are working in:

`D:\CodexProjects\housekeeping-system\Staff entry mini-program`

## Required First Step

Before coding, read and follow:

- `CLAUDE.md`
- `claude-skills/self-review/SKILL.md`
- `claude-skills/self-review/references/report-template.md`
- `handoff.md`

Use the enhanced self-review protocol:

- Run `git status --short` before editing.
- Run the baseline verifier before editing.
- Make focused changes only.
- Run the final verifier after editing.
- If verification fails, make at most two focused repair attempts.
- Always write one structured report under `claude-reports/`, whether verification passes or fails.
- Do not commit code.

## Critical Context

The date picker issue from Stage 9.4 is already fixed in manual testing.

The avatar issue is still not fixed:

- User uploads avatar in miniapp personal profile edit page.
- User taps save.
- After save, the edit page does not show the new avatar.
- Returning to home does not show the new avatar.
- Re-entering personal profile edit page also does not show the previously uploaded avatar.
- No backend error appears.

Also remove duplicate identity-card editing from personal profile:

- The personal profile page must not ask the user to type an ID card number.
- ID card number belongs only to credential management, under resident ID card.
- Do not remove backend storage/sync for ID number; credential management still syncs ID number into the profile internally.

## Baseline And Final Verification

Baseline verifier:

```powershell
.\verify-stage9-4-avatar-date-picker.cmd
```

Final verifier:

```powershell
.\verify-stage9-5-avatar-runtime-and-profile-id-removal.cmd
```

If the final verifier does not exist yet, create it as part of this task.

## Read First

Read these files before editing:

- `apps/miniapp/utils/upload.js`
- `apps/miniapp/utils/request.js`
- `apps/miniapp/utils/avatar.js`
- `apps/miniapp/utils/constants.js`
- `apps/miniapp/pages/profile/edit/index.js`
- `apps/miniapp/pages/profile/edit/index.wxml`
- `apps/miniapp/pages/profile/edit/index.wxss`
- `apps/miniapp/pages/profile/view/index.js`
- `apps/miniapp/pages/profile/view/index.wxml`
- `apps/miniapp/pages/home/index.js`
- `apps/miniapp/pages/home/index.wxml`
- `apps/miniapp/pages/account/index.js`
- `apps/miniapp/pages/resume/index.js`
- `apps/server/src/modules/staff/staff.service.ts`
- `apps/server/src/modules/staff/dto/update-profile.dto.ts`
- `apps/server/src/modules/file/file.controller.ts`
- `apps/server/src/modules/file/file.service.ts`

## Requirements

### 1. Fix avatar persistence by fixing the real data flow

Do not make a marker-only change. The fix must handle runtime behavior.

Implement a robust avatar flow:

1. Avatar upload must extract the durable file ID from all plausible upload response shapes:
   - `uploadRes.id`
   - `uploadRes.fileId`
   - `uploadRes.data.id`
   - `uploadRes.data.fileId`
   - `uploadRes.file.id`
   - `uploadRes.data.file.id`
2. Put the extraction logic in a clearly named helper, for example `extractUploadedFileId(uploadRes)`.
3. After avatar upload, keep showing the local temporary image immediately for good UX.
4. On save, send only the durable avatar file ID to `PUT /api/app/profile`.
5. After profile save succeeds, immediately call `GET /api/app/profile` and verify/read the returned `profile.avatarUrl`.
6. If the backend returns an avatar value, update both:
   - stored avatar file ID state
   - preview URL state via `normalizeAvatarUrl(returnedAvatarUrl)`
7. Only navigate back after the save and refresh sequence completes.
8. If the avatar was uploaded but the backend returns no `avatarUrl`, show a clear toast and keep the user on the edit page. Do not silently navigate away while the avatar was lost.
9. Make sure `home`, `profile/view`, `account`, and `resume` all use the shared avatar helper consistently.
10. Do not store `wxfile://...`, temp paths, or public preview URLs into `avatarUrl`. Store the durable file ID only.
11. Keep avatar files public previewable. If the current upload `purpose: 'avatar'` is not reliably reaching the backend, fix the frontend upload formData path rather than changing avatar display to private authenticated URLs.

Suggested implementation details:

- In `profile/edit/index.js`, keep two separate pieces of state:
  - `avatarFileId`: the durable file ID saved to backend.
  - `avatarPreviewUrl`: local temp path right after upload, or normalized public preview URL after reload.
- If you keep `avatarUrl` for compatibility, ensure it always means durable file ID, never preview URL.
- In `handleSave`, build `profileData.avatarUrl` from the durable file ID.
- After `request.put`, call `request.get(constants.API.PROFILE)` and hydrate the page from the persisted profile before navigating back.

### 2. Remove ID card number editing from personal profile UI

The personal profile UI must no longer contain an ID card number field because the resident ID card credential page is the single source of truth.

Implement:

- Remove ID card number input row from `apps/miniapp/pages/profile/edit/index.wxml`.
- Remove ID card number display row from `apps/miniapp/pages/profile/view/index.wxml`.
- Remove `idNumber` from profile edit page data state unless still needed only for display-free internal compatibility.
- Remove `onIdNumberInput`.
- Remove ID number validation from personal profile `validate()`.
- Remove `idNumber` from the personal profile save payload.
- Do not delete the server DTO field or database fields unless absolutely necessary. Existing credential-to-profile sync must remain available.
- Do not break resident ID card credential logic. The resident ID card credential page must still require ID number and two images.

### 3. Verification script

Create:

- `verify-stage9-5-avatar-runtime-and-profile-id-removal.ps1`
- `verify-stage9-5-avatar-runtime-and-profile-id-removal.cmd`

The PS1 must:

1. Run `.\verify-stage9-4-avatar-date-picker.ps1` first.
2. Validate Prisma schema using the local Prisma CLI only:
   - `.\apps\server\node_modules\.bin\prisma.CMD validate --schema .\apps\server\prisma\schema.prisma`
   - Do not use `npx prisma`.
3. Build server.
4. Run admin TypeScript check.
5. Check miniapp JS syntax.
6. Assert avatar runtime markers:
   - `extractUploadedFileId`
   - `avatarFileId`
   - `request.get(constants.API.PROFILE)` after profile save
   - `normalizeAvatarUrl(savedProfile.avatarUrl` or equivalent persisted-profile hydration
   - no storage of `avatarPreviewUrl` as backend `avatarUrl`
   - no `wxfile://`/temp path assigned to saved avatar field
7. Assert personal profile ID-number removal markers:
   - `profile/edit/index.wxml` does not contain `身份证号` / `idNumber` input row.
   - `profile/view/index.wxml` does not contain `身份证号` / `profile.idNumber` row.
   - `profile/edit/index.js` does not contain `onIdNumberInput`.
   - `profile/edit/index.js` does not include `idNumber:` in the `profileData` save payload.
   - `profile/edit/index.js` does not show ID-number validation toasts.
8. Assert resident ID credential remains intact:
   - `credential/edit/index.js` still contains `idNumber` validation for `id_card`.
   - `credential/edit/index.wxml` still has ID card number field.
   - `credential/edit/index.wxml` still has both ID card upload sides: front/person side and back/emblem side markers.

Ensure the PS1 is saved as UTF-8 with BOM so Windows PowerShell 5.1 handles Chinese labels correctly.

## Manual Checks To Include In Report

Your self-review report must list these manual checks explicitly:

1. Miniapp: upload avatar, save profile, remain long enough to confirm profile refresh, then return to home and verify avatar displays.
2. Miniapp: re-enter personal profile edit and verify previously saved avatar displays.
3. Miniapp: verify personal profile edit/view no longer shows ID card number.
4. Miniapp: verify resident ID card credential still requires ID number and both ID card images.

## Strictly Forbidden

- Do not read or print `.env`.
- Do not use `npx prisma`.
- Do not modify Word requirement documents.
- Do not delete or move unrelated files.
- Do not run `git reset`, `git checkout`, or rewrite Git history.
- Do not commit code.
- Do not implement customer ordering, dispatch, payment, wallet, commission/distribution, dispute voting, or automatic punishment.
- Do not remove backend ID-number storage or credential ID-card sync.

## Final Response

Report:

1. What changed.
2. Which file groups changed.
3. Why the avatar issue should now be fixed at runtime.
4. Final verifier result.
5. Self-review report path.
6. Manual miniapp checks still needed.
