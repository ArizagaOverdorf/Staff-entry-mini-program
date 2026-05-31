# Claude Code Task: Stage 9.6 Avatar Runtime Final Fix

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

## Current User-Confirmed Runtime Bug

Stage 9.5 verifier passed, but real miniapp testing still fails:

- In personal profile edit page, uploading an avatar immediately displays the local temporary image.
- After tapping save, returning to home still shows the old/default avatar.
- Re-entering personal profile edit page also does not show the uploaded avatar.
- ID card number removal is fixed and must not be touched except to preserve it.

This means marker-only/static checks are not enough. Fix the actual runtime persistence/display chain.

## Baseline And Final Verification

Baseline verifier:

```powershell
.\verify-stage9-5-avatar-runtime-and-profile-id-removal.cmd
```

Final verifier:

```powershell
.\verify-stage9-6-avatar-runtime-final-fix.cmd
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
- `apps/miniapp/pages/home/index.js`
- `apps/miniapp/pages/home/index.wxml`
- `apps/miniapp/pages/profile/view/index.js`
- `apps/miniapp/pages/account/index.js`
- `apps/miniapp/pages/resume/index.js`
- `apps/server/src/modules/staff/staff.service.ts`
- `apps/server/src/modules/staff/dto/update-profile.dto.ts`
- `apps/server/src/modules/file/file.controller.ts`
- `apps/server/src/modules/file/file.service.ts`
- `apps/server/prisma/schema.prisma`

## Required Fixes

### 1. Backend must guarantee saved avatars are public-previewable

The likely runtime gap is: `wx.uploadFile` may upload the image successfully, but if multipart `purpose=avatar` is not received exactly as expected, `FileController.upload()` stores the file as `private`. Then miniapp pages use `/app/files/public/:fileId/preview`, which cannot show a private file.

Implement a backend persistence guarantee in `StaffService.updateProfile()`:

- When `dto.avatarUrl` is provided and it is a durable file ID, update the matching `FileAsset` row to `accessLevel: 'public'`.
- Restrict the update to files uploaded by the current staff account where possible:
  - `id: dto.avatarUrl`
  - `uploadedByStaffAccountId: accountId`
- If the file is already public, keep it public.
- Do not allow a staff user to promote another staff user's private file.
- Do not break existing public avatars or older external HTTP avatar URLs. If `dto.avatarUrl` starts with `http://` or `https://`, do not treat it as a file ID.
- Keep storing only the durable file ID in `StaffProfile.avatarUrl`, not the preview URL and not a temp path.
- If you decide to throw an error when a provided file ID does not belong to the current staff account, use a clear business-facing message. Avoid breaking old records that already contain HTTP URLs.

### 2. Frontend must not hide failed avatar persistence

In `apps/miniapp/pages/profile/edit/index.js`, the current code has a risky fallback:

- If save succeeds but the post-save `GET /api/app/profile` refresh fails, it still shows save success and navigates back.

Change this behavior:

- If an avatar was uploaded or changed in this edit session, post-save refresh is mandatory.
- If `GET /api/app/profile` fails after saving an avatar, show a clear toast such as `头像保存确认失败，请重试` and stay on the edit page.
- If `GET /api/app/profile` succeeds but the returned `profile.avatarUrl` is empty or does not match the durable uploaded file ID, show `头像未保存成功，请重试` and stay on the edit page.
- If no avatar was changed in this edit session, normal save can still navigate back after success.
- Use the `PUT /api/app/profile` response as an additional signal, but do not rely on it alone; persisted `GET /api/app/profile` is the authority before navigating away after avatar change.
- Add a boolean state like `avatarChanged` or equivalent to distinguish avatar changes in the current edit session.

### 3. Add one runtime-friendly debug marker without noisy logs

Do not spam logs. But make the failure diagnosable:

- On avatar save confirmation failure, `console.error` should include:
  - uploaded file ID
  - returned profile avatarUrl, if any
  - whether refresh failed
- Do not print tokens or secrets.

### 4. Preserve what is already fixed

Do not reintroduce the personal profile ID number field.

Preserve:

- `profile/edit/index.wxml` has no ID card number field.
- `profile/view/index.wxml` has no ID card number row.
- Resident ID card credential page still requires ID number and both sides.

## Verification Script

Create:

- `verify-stage9-6-avatar-runtime-final-fix.ps1`
- `verify-stage9-6-avatar-runtime-final-fix.cmd`

The PS1 must:

1. Run `.\verify-stage9-5-avatar-runtime-and-profile-id-removal.ps1` first.
2. Validate Prisma schema using the same local CLI convention as prior verifiers. Do not use `npx prisma`.
3. Build server.
4. Run admin TypeScript check.
5. Check miniapp JS syntax.
6. Assert backend avatar public-promotion markers:
   - `StaffService.updateProfile()` updates `fileAsset` or `fileAsset.updateMany`.
   - The update sets `accessLevel` to `public`.
   - The update restricts by `uploadedByStaffAccountId: accountId`.
   - The update is guarded so external HTTP avatar URLs are not treated as file IDs.
7. Assert frontend no-false-success markers:
   - profile edit page has `avatarChanged` or equivalent.
   - post-save refresh failure does not navigate back when avatar changed.
   - returned avatar is compared against the uploaded durable file ID.
   - failure path shows a toast and stays on page.
   - `console.error` includes avatar confirmation context.
8. Assert prior ID-number removal markers still pass:
   - no ID card number field in personal profile edit/view.
   - resident ID card credential page remains intact.

Ensure the PS1 is saved as UTF-8 with BOM so Windows PowerShell 5.1 handles Chinese labels correctly.

## Manual Checks To Include In Report

Your self-review report must list these manual checks explicitly:

1. Restart `pnpm dev:server` and `pnpm dev:admin`.
2. WeChat DevTools: clear cache and recompile.
3. True-device debugging: personal profile -> edit -> upload avatar -> save.
4. Confirm save does not navigate away if avatar persistence verification fails.
5. Confirm home avatar shows after save.
6. Re-enter profile edit and confirm saved avatar still displays.
7. If still failing, inspect backend logs for `PUT /api/app/profile` and `GET /api/app/profile`, and inspect whether the file asset access level is public.

## Strictly Forbidden

- Do not read or print `.env`.
- Do not use `npx prisma`.
- Do not modify Word requirement documents.
- Do not delete or move unrelated files.
- Do not run `git reset`, `git checkout`, or rewrite Git history.
- Do not commit code.
- Do not re-add ID card number to personal profile.
- Do not implement customer ordering, dispatch, payment, wallet, commission/distribution, dispute voting, or automatic punishment.

## Final Response

Report:

1. What changed.
2. Which file groups changed.
3. Why this fixes the real avatar runtime issue.
4. Final verifier result.
5. Self-review report path.
6. Exact manual miniapp checks still needed.
