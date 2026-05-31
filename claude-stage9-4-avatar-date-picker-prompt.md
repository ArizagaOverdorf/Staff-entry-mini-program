# Claude Code Task: Stage 9.4 Avatar Persistence And Credential Date Pickers

You are working in:

`D:\CodexProjects\housekeeping-system\Staff entry mini-program`

## Required First Step

Before coding, read and follow:

- `CLAUDE.md`
- `claude-skills/self-review/SKILL.md`
- `claude-skills/self-review/references/report-template.md`
- `handoff.md` if it exists
- `claude-reports/20260530-stage9-3-id-card-profile-sync-final-self-review.md`

Use the enhanced self-review protocol:

- Run `git status --short` before editing.
- Run the baseline verifier before editing.
- Make focused changes only.
- Run the final verifier after editing.
- If verification fails, make at most two focused repair attempts.
- Always write one structured report under `claude-reports/`, whether verification passes or fails.
- Do not commit code.

## Permission And Interaction Policy

Work non-interactively where possible:

- Accept normal code edits.
- Run routine reads, builds, type checks, syntax checks, verifier scripts, and local Prisma CLI commands without asking the user.
- Do not ask for confirmation for local validation commands.

Strict approval rule:

- If you need to delete files, move files, overwrite unrelated files, reset git, checkout files, rewrite history, read or print `.env`, or touch files outside this project, STOP and ask the user first.
- Do not run deletion/cleanup commands automatically.
- Do not use `npx prisma`.
- Do not modify Word requirement documents.
- Do not implement customer ordering, dispatch, payment, wallet, commission/distribution, dispute voting, or automatic punishment.

## User-Reported Issues

### Issue 1: Avatar upload appears to save, but does not persist/display

Observed behavior:

- In miniapp profile edit page, user uploads an avatar and sees the new image on the edit page.
- After tapping save and returning to home, the home avatar still does not show the uploaded image.
- Re-entering profile edit page also loses the uploaded avatar and shows the initial/default state.
- Name sync works, so profile update itself is partly working.

Files to inspect:

- `apps/miniapp/pages/profile/edit/index.js`
- `apps/miniapp/pages/profile/edit/index.wxml`
- `apps/miniapp/pages/profile/view/index.js`
- `apps/miniapp/pages/home/index.js`
- `apps/miniapp/pages/account/index.js`
- `apps/miniapp/pages/resume/index.js`
- `apps/miniapp/utils/request.js`
- `apps/miniapp/utils/upload.js`
- `apps/server/src/modules/staff/staff.service.ts`
- `apps/server/src/modules/file/file.controller.ts`
- `apps/server/src/modules/file/file.service.ts`
- `apps/server/src/modules/file/file.constants.ts`

Required behavior:

- Uploaded avatar must persist after save.
- Home page, profile view page, profile edit page, account page, and resume page must all display the same saved avatar.
- Profile edit page must store the durable file ID or durable URL in `avatarUrl`, not only the local temporary file path.
- If the backend stores a file ID, every miniapp page must convert it to a valid preview URL consistently.
- If avatar preview requires authentication, use a working authorized preview strategy. If public preview is intended, ensure the backend allows avatar public preview safely.
- Do not store raw temporary local file paths in profile data.
- Do not expose private certificate files publicly while fixing avatars.

Implementation guidance:

- Prefer a shared miniapp helper if possible, for example a reusable `normalizeAvatarUrl()` / `buildAvatarPreviewUrl()` in `apps/miniapp/utils`.
- Make sure uploaded avatar file IDs from `uploadUtil.uploadFile()` are parsed correctly from all known response shapes.
- After `request.put(constants.API.PROFILE_UPDATE, profileData)` succeeds, verify the returned/stored profile can be loaded and displayed using the same `avatarUrl`.
- If backend profile update rejects/filters `avatarUrl`, fix DTO/service/controller as needed.

### Issue 2: Expiring credential dates are manually typed and easy to format wrong

Observed behavior:

- In credential edit page, credentials that require expiry currently use a manual text input for `有效期至`.
- User wants date selection, not manual number/text entry.
- Required UI: `生效日期` and `有效期至` should both be selected by date picker.

Files to inspect:

- `apps/miniapp/pages/credential/edit/index.js`
- `apps/miniapp/pages/credential/edit/index.wxml`
- `apps/miniapp/pages/credential/edit/index.wxss`
- `apps/miniapp/utils/constants.js`
- `apps/server/src/modules/credential/dto/upsert-credential.dto.ts`
- `apps/server/src/modules/credential/credential.service.ts`
- `apps/admin/src/pages/staff/components/CredentialReviewList.tsx`
- `apps/miniapp/pages/resume/index.js`

Required behavior:

- For credential types in `CREDENTIAL_TYPES_REQUIRE_EXPIRY`, show two date picker rows:
  - `生效日期`
  - `有效期至`
- Use WeChat `<picker mode="date">`, not manual `<input>`, for both dates.
- Date format should be `YYYY-MM-DD`.
- `有效期至` is required for expiring credentials.
- `生效日期` should be required for expiring credentials unless there is a strong existing backend reason not to; if you decide not to require it, document the reason in the self-review report.
- `有效期至` must not be earlier than `生效日期`.
- Existing credentials should load and display both saved dates.
- Save payload must include `issueDate` and `expireDate`/`expiryDate` consistently.
- Backend validation should reject invalid date order for expiring credentials.
- Non-expiring credentials should not show these picker rows.
- Skill certificates currently do not require expiry; do not force expiry fields on skill certificates unless current constants already mark them as requiring expiry.

## Strict Scope

Do not rework support chat, distribution, orders, payment, customer miniapp, or the new overall PRD in this task.

Do not change database schema unless absolutely necessary. Existing fields `issueDate` and `expiryDate` should be reused.

## Baseline And Final Verification

Baseline verifier:

```powershell
.\verify-stage9-3-id-card-profile-sync-final.cmd
```

Final verifier:

```powershell
.\verify-stage9-4-avatar-date-picker.cmd
```

If the final verifier does not exist yet, create it as part of this task. It must run Stage 9.3 first and then assert the Stage 9.4 markers below.

## Verification Script Requirements

Create:

- `verify-stage9-4-avatar-date-picker.ps1`
- `verify-stage9-4-avatar-date-picker.cmd`

The PS1 must:

- Run `.\verify-stage9-3-id-card-profile-sync-final.ps1` first.
- Validate Prisma schema.
- Build server.
- Run admin TypeScript check.
- Validate miniapp JSON.
- Check miniapp JS syntax.
- Assert avatar markers:
  - profile edit saves a durable `avatarUrl`.
  - avatar display is normalized consistently on home, profile view, profile edit, account, and resume pages.
  - no code saves `tempFilePath` as the durable profile avatar.
  - backend profile update accepts/stores/returns `avatarUrl`.
- Assert credential date picker markers:
  - credential edit WXML uses `picker mode="date"` for `生效日期` and `有效期至`.
  - manual text input for expiry date is removed for expiring credentials.
  - miniapp save payload includes `issueDate` and expiry date.
  - miniapp validates required expiry and date order.
  - backend validates invalid expiry date and invalid date order.
  - existing credential load hydrates both dates.

Ensure the PS1 is saved as UTF-8 with BOM if it contains Chinese labels.

## Self-Review Report

Write a report under:

`claude-reports/`

Suggested filename:

`20260530-stage9-4-avatar-date-picker-self-review.md`

Use status:

- `PASSED` if final verifier passes.
- `FAILED_AFTER_TWO_REPAIRS` if two repairs still fail.
- `UNVERIFIED_ENV_BLOCKED` only if environment prevents verification.
- `PARTIAL_NEEDS_CODEX_REVIEW` only if the feature is incomplete but useful changes were made.

## Final Response

Report:

1. What changed.
2. Which file groups changed.
3. Whether schema/migration changed.
4. Final verifier result.
5. Self-review report path.
6. Manual miniapp checks still needed.
