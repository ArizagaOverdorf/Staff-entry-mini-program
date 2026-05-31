# Claude Code Task: Stage 9.1 Profile, Resident ID Card, And Skill Credential Hardening

You are working in:

`D:\CodexProjects\housekeeping-system\Staff entry mini-program`

## Required First Step

Before coding, read and follow:

- `CLAUDE.md`
- `claude-skills/self-review/SKILL.md`
- `claude-skills/self-review/references/report-template.md`
- `handoff.md` if it exists
- `claude-reports/20260529-stage9-profile-idcard-skill-credentials-self-review.md`

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

## Why This Follow-Up Exists

Codex review found that Stage 9 passed its verifier but still missed important business behavior:

1. Skill certificates are not fully enforced:
   - Miniapp does not require a certificate image for skill certificates.
   - Backend does not require skill certificate image.
   - Backend does not validate allowed skill levels.
   - Backend does not restrict linked service skill category ids to the current allowed five.
   - Stage 9 verifier only checked weak markers, so it did not catch this.
2. Resident ID card number is collected in credential edit but is not synced back to profile basic info where appropriate.
3. New resident ID card edit should prefill ID number from profile if it exists.
4. Avatar persistence should be robust across all user-facing pages that show profile avatar, not only edit/view/home. Pages such as account/resume must normalize fileId avatars too if they display avatars.
5. Uploaded credential images should reliably display after leaving and re-entering the edit page.

Do not redo unrelated Stage 8 support chat work.

## Baseline And Final Verification

Baseline verifier:

```powershell
.\verify-stage9-profile-idcard-skill-credentials.cmd
```

Final verifier:

```powershell
.\verify-stage9-1-profile-idcard-skill-hardening.cmd
```

If the final verifier does not exist yet, create it as part of this task. It must run Stage 9 first and then assert the Stage 9.1 hardening markers below.

## Read First

- `apps/server/src/modules/staff/*`
- `apps/server/src/modules/credential/*`
- `apps/server/src/modules/intake/*`
- `apps/server/prisma/schema.prisma`
- `apps/miniapp/utils/constants.js`
- `apps/miniapp/utils/upload.js`
- `apps/miniapp/pages/profile/edit/index.*`
- `apps/miniapp/pages/profile/view/index.*`
- `apps/miniapp/pages/home/index.*`
- `apps/miniapp/pages/account/index.*`
- `apps/miniapp/pages/resume/index.*`
- `apps/miniapp/pages/credential/index.*`
- `apps/miniapp/pages/credential/edit/index.*`
- `apps/admin/src/pages/staff/components/*`
- `verify-stage9-profile-idcard-skill-credentials.ps1`

## Required Fixes

### 1. Skill certificate validation must be real, not only UI text

Business shape for one skill certificate:

- name: free text, required
- level: one of `初级` / `中级` / `高级` / `专家`, required
- linked service skill: one or more of:
  - 月嫂 (`maternity_matron`)
  - 育儿嫂 (`childcare_nanny`)
  - 住家保姆 (`live_in_nanny`)
  - 白班保姆 (`daytime_nanny`)
  - 养老保姆 (`elderly_nanny`)
- certificate image: required

Implement:

- Miniapp credential edit validation must reject saving `skill_cert` without at least one uploaded certificate image.
- Backend credential create/update validation must reject `skill_cert` without at least one file entry.
- Backend must reject `skill_cert` if `skillLevel` is missing or not one of the four allowed values.
- Backend must reject linked skill category ids outside the five allowed current-stage categories.
- Keep the ability to maintain multiple current skill certificates. Adding one skill certificate must not supersede existing current skill certificates.
- Do not add expiry date, issuing authority, or certificate number fields to skill certificate UI.

### 2. Resident ID card number profile sync

When saving resident ID card:

- If user enters ID number in credential edit, save it as credential number and also update the profile ID number where appropriate, so profile basic info and resident ID card stay consistent.
- When opening a new resident ID card credential, prefill ID number from profile if profile already has ID number.
- If profile ID number and credential ID number conflict during edit, prefer the explicit value currently typed in the credential form for that credential save.
- Do not expose plaintext ID number to public/integration APIs.

### 3. Avatar display consistency across pages

Avatar file id must display consistently wherever the miniapp shows account/profile avatar:

- profile edit
- profile view
- home
- account settings
- resume, if resume displays avatar

Implement a local helper or equivalent per page to normalize:

- full `http://` / `https://` URL: use as-is
- `/api/...` relative URL: prefix host from `constants.API_BASE_URL`
- file id: build `/app/files/public/{fileId}/preview`

Do not break existing full URL avatars.

### 4. Credential image persistence display

After saving resident ID card front/back or a skill certificate image:

- Leaving and re-entering edit page must display already saved images.
- Skill certificate edit page must display the saved certificate image.
- The preview loading logic should work with the existing private credential preview endpoint and token.

### 5. Admin review display

Admin credential review should clearly show:

- Resident ID card two buttons/images labelled `人像面` and `国徽面`
- Skill certificate name, level, linked service skill tags, and certificate image preview button

Fix only if current implementation is incomplete or labels are unclear.

## Verification Script

Create:

- `verify-stage9-1-profile-idcard-skill-hardening.ps1`
- `verify-stage9-1-profile-idcard-skill-hardening.cmd`

The PS1 must:

- Run `.\verify-stage9-profile-idcard-skill-credentials.ps1` first.
- Validate Prisma schema.
- Build server.
- Run admin TypeScript check.
- Validate miniapp JSON.
- Check miniapp JS syntax.
- Assert hardening markers:
  - backend has allowed skill level validation including `专家`
  - backend rejects skill certificate without file entries
  - backend restricts linked skill category ids to `maternity_matron`, `childcare_nanny`, `live_in_nanny`, `daytime_nanny`, `elderly_nanny`
  - miniapp rejects skill certificate without uploaded image
  - skill certificate UI still hides normal credential number/authority/expiry fields
  - ID card save syncs or updates profile ID number
  - new ID card edit preloads profile ID number
  - account and resume avatar display normalize fileId avatars if those pages display avatars
  - resident ID card front/back preview persistence markers exist
  - admin labels for `人像面` / `国徽面` and skill certificate fields exist

Ensure the PS1 is saved as UTF-8 with BOM if it contains Chinese labels.

## Self-Review Report

Write a report under:

`claude-reports/`

Suggested filename:

`20260529-stage9-1-profile-idcard-skill-hardening-self-review.md`

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
6. Manual miniapp/admin checks still needed.
