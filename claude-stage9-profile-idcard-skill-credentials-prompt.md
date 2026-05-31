# Claude Code Task: Stage 9 Profile Avatar, ID Card, And Skill Credential Rework

You are working in:

`D:\CodexProjects\housekeeping-system\Staff entry mini-program`

## Required First Step

Before coding, read and follow:

- `CLAUDE.md`
- `claude-skills/self-review/SKILL.md`
- `claude-skills/self-review/references/report-template.md`
- `handoff.md` if it exists

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

## Current Context

There are existing uncommitted Stage 8 support-chat and profile changes in the worktree. Do not revert or overwrite unrelated work. Only touch files needed for this task.

Manual testing found these issues:

1. Miniapp profile avatar upload appears in the edit page immediately, but after saving and returning, the profile/view/home pages still show the initial avatar. Re-entering profile shows the uploaded avatar disappeared.
2. Credential management shows "身份证"; it must be renamed to "居民身份证".
3. Resident ID card upload currently supports only one image. Real workflow requires two images: front side and back side.
4. When saving resident ID card, ID number must be required.
5. After uploading ID card image and returning/re-entering credential management, previously uploaded ID card image disappears.
6. Skill certificate module must be rewritten. One skill certificate must contain:
   - skill certificate name, free text
   - level: 初级 / 中级 / 高级 / 专家
   - linked service skill: 月嫂 / 育儿嫂 / 住家保姆 / 白班保姆 / 养老保姆
   - certificate image
7. The user must be able to maintain at least 5 skill certificates. Current behavior looks like only one skill certificate can be uploaded.

## Baseline And Final Verification

Baseline verifier:

```powershell
.\verify-stage8-2-support-chat-experience.cmd
```

Final verifier:

```powershell
.\verify-stage9-profile-idcard-skill-credentials.cmd
```

If the final verifier does not exist yet, create it as part of this task. It must run Stage 8.2 first and then assert the Stage 9 markers below.

## Read First

- `apps/server/prisma/schema.prisma`
- `apps/server/src/modules/staff/*`
- `apps/server/src/modules/credential/*`
- `apps/server/src/modules/intake/*`
- `apps/server/src/modules/admin/admin-staff.*`
- `apps/server/src/modules/file/*`
- `apps/miniapp/utils/constants.js`
- `apps/miniapp/utils/request.js`
- `apps/miniapp/utils/upload.js`
- `apps/miniapp/pages/profile/edit/index.*`
- `apps/miniapp/pages/profile/view/index.*`
- `apps/miniapp/pages/home/index.*`
- `apps/miniapp/pages/credential/index.*`
- `apps/miniapp/pages/credential/edit/index.*`
- `apps/miniapp/pages/submit/index.*`
- `apps/admin/src/pages/staff/detail.tsx`
- `apps/admin/src/pages/staff/components/*`

## Requirements

### 1. Avatar persistence and display consistency

Fix the profile avatar workflow:

- Editing profile must allow choosing/taking a photo and uploading it.
- Uploaded avatar must be saved to the staff profile/backend, not only shown locally in the edit page.
- After save and return, profile view page must display the uploaded avatar.
- Home page avatar/initial circle must display the uploaded avatar when available; fall back to initial only when no avatar exists.
- Re-entering edit profile must show the saved uploaded avatar.
- Ensure avatar preview URLs work on real device debug, including relative `/api/...` URLs and file IDs.
- Do not expose private credential files. Avatar may remain public if current file-service design already treats avatar as public.

### 2. Resident ID card naming and two-sided upload

Rename ID card copy:

- User-facing miniapp/admin text should use `居民身份证`, not just `身份证`, for the credential type label.

ID card upload:

- Resident ID card must support front and back images.
- The user must clearly see two upload slots:
  - `人像面`
  - `国徽面`
- Both sides are required for resident ID card submission.
- ID number is required when saving resident ID card.
- If the ID number already exists in profile/basic info, prefill it; if it is edited from credential page, keep profile/basic info consistent where appropriate.
- After uploading/saving and returning/re-entering, previously saved front/back images must still display.
- Backend validation must reject resident ID card save without required ID number and both required images.
- Admin credential review must clearly show both resident ID card images.
- Intake preview/submit must treat resident ID card as complete only when both sides exist.

Implementation guidance:

- Prefer using the existing `StaffCredentialFile` list with a role/side field if one already exists.
- If no side field exists, add a small schema field such as `fileSide` / `side` / `fileRole` to distinguish `front` and `back`.
- Keep backward compatibility for legacy single-image ID card records where practical, but new saves must enforce two sides.

### 3. Skill certificate module rework

Skill certificate business shape:

- Each skill certificate record has:
  - `credentialName` / name: free text
  - `skillLevel`: 初级 / 中级 / 高级 / 专家
  - linked service skill: one of 月嫂 / 育儿嫂 / 住家保姆 / 白班保姆 / 养老保姆
  - certificate image
- Skill certificate does not require effective date / expiry unless existing business rules intentionally keep it. Current user expectation: skill certificate fields should not include issuing authority, certificate number, or expiry date.
- One staff can maintain multiple current skill certificates. Must support at least 5 current skill certificates.
- Adding a new skill certificate must not overwrite/supersede existing skill certificates.
- Editing one skill certificate must update/version that logical certificate only.
- Credential management page should show all current skill certificates clearly, with name, level, linked skill, and image/status.
- Miniapp UI should provide an obvious "add skill certificate" path and a list of existing skill certificates.
- Backend validation must require name, level, linked service skill, and at least one certificate image for skill certificate saves.
- Admin review must show all skill certificates and their fields.
- Resume page should be able to show multiple skill certificates if resume code already exists.

Allowed skill levels:

- 初级
- 中级
- 高级
- 专家

Allowed linked service skills for this stage:

- 月嫂
- 育儿嫂
- 住家保姆
- 白班保姆
- 养老保姆

### 4. Data persistence and API correctness

For avatar, resident ID card, and skill certificates:

- Do not rely on local-only miniapp state.
- Reloading page or leaving/re-entering must display saved data from backend.
- Do not return raw sensitive ID card image URLs in public/integration APIs.
- Keep existing JWT and permission rules.
- Keep existing upload size/type limits.
- If schema changes are required, create Prisma migration files and run the project-local Prisma CLI, not `npx prisma`.

### 5. Verification script

Create:

- `verify-stage9-profile-idcard-skill-credentials.ps1`
- `verify-stage9-profile-idcard-skill-credentials.cmd`

The PS1 must:

- Run `.\verify-stage8-2-support-chat-experience.ps1` first.
- Validate Prisma schema.
- Build server.
- Run admin TypeScript check.
- Validate miniapp JSON.
- Check miniapp JS syntax.
- Assert Stage 9 markers:
  - avatar persistence/display markers in profile edit, profile view, and home
  - `居民身份证` label exists
  - resident ID card front/back markers exist, using names like `front/back`, `人像面`, `国徽面`, or equivalent
  - resident ID card ID number required validation exists
  - backend validation for resident ID card two images exists
  - skill level includes `专家`
  - skill certificate linked service skill validation exists
  - multiple skill certificate support exists and does not supersede all `skill_cert` records
  - at least five skill certificates can be represented by UI/business logic
  - admin review displays resident ID card two-sided images and multiple skill certificate fields

Ensure the PS1 is saved as UTF-8 with BOM if it contains Chinese labels.

### 6. Self-review report

Write a report under:

`claude-reports/`

Suggested filename:

`20260529-stage9-profile-idcard-skill-credentials-self-review.md`

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
