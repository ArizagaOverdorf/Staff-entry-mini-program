# Claude Code Task: Stage 7 End-to-End Regression And Bug Fix

You are working in:

`D:\CodexProjects\housekeeping-system\Staff entry mini-program`

## Required First Step

Before coding, read and follow:

- `CLAUDE.md`
- `claude-skills/self-review/SKILL.md`
- `claude-skills/self-review/references/report-template.md`

Use the enhanced self-review protocol:

- Run `git status --short` before editing.
- Run the baseline verifier before editing.
- Make focused fixes only.
- Run the final verifier after editing.
- If verification fails, make at most two focused repair attempts.
- Always write one structured report under `claude-reports/`, whether verification passes or fails.
- Do not commit code.

## Permission And Interaction Policy

The human user does not understand most command prompts and wants you to avoid unnecessary pauses.

Work non-interactively where possible:

- Prefer existing verifier scripts.
- Prefer local build/type-check/syntax-check commands.
- Prefer read-only inspection commands.
- Prefer `apply_patch` or direct file edits through Claude Code for small fixes.
- Do not ask the user to approve routine reads, builds, type checks, syntax checks, or verifier runs.

Strict approval rule:

- If you need to delete files, move files, overwrite unrelated files, reset git, checkout files, rewrite history, or touch files outside this project, STOP and ask the user first.
- If a command attempts deletion or cleanup, do not run it automatically.

## Task

Perform **Stage 7 end-to-end regression review and bug fix** for the current MVP.

This is not a feature-expansion stage. Your goal is to find and fix obvious blockers in the existing staff onboarding MVP across:

- admin backend
- admin frontend
- miniapp
- verification scripts

Do not implement customer ordering, dispatch, payment, wallet, commission/distribution, dispute voting, or automatic punishment.

## Baseline And Final Verification

Baseline verifier:

```powershell
.\verify-stage6b3-credential-expiry.cmd
```

Final verifier:

```powershell
.\verify-stage7-regression.cmd
```

If the final verifier does not exist yet, create it as part of this task. It must run Stage 6B-3 first and then assert the Stage 7 checks below.

## Read First

- `CLAUDE.md`
- `claude-skills/self-review/SKILL.md`
- `apps/server/prisma/schema.prisma`
- `apps/server/src/app.module.ts`
- `apps/server/src/main.ts`
- `apps/server/src/modules/auth/*`
- `apps/server/src/modules/account/*`
- `apps/server/src/modules/staff/*`
- `apps/server/src/modules/credential/*`
- `apps/server/src/modules/intake/*`
- `apps/server/src/modules/listing/*`
- `apps/server/src/modules/message/*`
- `apps/server/src/modules/service-record/*`
- `apps/server/src/modules/admin/*`
- `apps/admin/src/App.tsx`
- `apps/admin/src/layouts/components/SideMenu.tsx`
- `apps/admin/src/services/request.ts`
- `apps/admin/src/pages/staff/**/*`
- `apps/admin/src/pages/service-record/**/*`
- `apps/miniapp/app.json`
- `apps/miniapp/utils/*.js`
- `apps/miniapp/pages/auth/**/*`
- `apps/miniapp/pages/home/**/*`
- `apps/miniapp/pages/profile/**/*`
- `apps/miniapp/pages/credential/**/*`
- `apps/miniapp/pages/submit/**/*`
- `apps/miniapp/pages/audit/**/*`
- `apps/miniapp/pages/resume/**/*`
- `apps/miniapp/pages/service-record/**/*`
- `apps/miniapp/pages/account/**/*`

## Regression Scope

Check and fix obvious defects in these flows:

### Miniapp user flow

1. Login page can call login API.
2. Phone binding requires phone + SMS code and cannot bypass through home icon.
3. Privacy confirmation works.
4. Home page loads profile/intake/listing/management status.
5. Profile view/edit round-trips:
   - avatar
   - name
   - gender
   - birthday
   - service categories
   - service areas
   - emergency contact
6. Credential management:
   - all required credential cards appear
   - skill certificate supports multiple certificates
   - skill certificate requires name, level, at least one service skill, image
   - required-expiry credential types show expiry field and validate it
   - non-expiry types do not show expiry field
   - submit review uses preview and blocks invalid data
7. Audit/status page displays review status and remarks.
8. Resume page displays masked resume data, management status, credential expiry, insurance status, service records.
9. Service record page loads records and displays duration in days.
10. Account settings:
    - user agreement
    - privacy policy
    - about us
    - clear cache
    - logout
    - no duplicate customer-service entry if home already has it

### Admin flow

1. Admin login still works with seed admin.
2. Staff list:
   - default hides drafts
   - include draft switch works
   - cleanup old drafts endpoint/button exists
   - columns are readable
3. Staff detail:
   - profile card loads
   - credentials list loads
   - review tabs do not jump after approve/reject
   - approve/reject/request-more-info actions refresh in-place
4. Management status:
   - normal/paused/blacklisted can be set
   - paused/blacklisted requires reason
   - paused/blacklisted forces offline
5. Credential expiry:
   - expired credential tag appears
   - expired credential cannot be approved
   - expired mandatory credential blocks intake approval
6. Service records:
   - admin CRUD page compiles
   - staff selector/search is usable
   - duration unit is days
   - app API returns current staff records only

### Backend API contracts

Look for mismatches between frontend calls and backend response shapes:

- `{ list, total }` vs arrays
- `data` wrapper vs direct result
- `typeId` vs `credentialType`
- `expireDate` vs `expiryDate`
- service duration minutes vs days
- management status copy
- credential status labels

Fix only real mismatches or obvious runtime errors. Avoid cosmetic refactors.

## Final Verifier Requirements

Create:

- `verify-stage7-regression.ps1`
- `verify-stage7-regression.cmd`

The PS1 must:

- Run `.\verify-stage6b3-credential-expiry.ps1` first.
- Validate Prisma schema using local Prisma CLI, not `npx prisma`.
- Build server.
- Run admin TypeScript check.
- Validate miniapp JSON files.
- Check miniapp JavaScript syntax with `node --check`.
- Assert key Stage 7 markers:
  - phone binding cannot navigate home before mobile bound
  - credential expiry required markers exist
  - skill certificate multiple/current markers exist
  - management status markers exist
  - service record duration days marker exists
  - account clear cache marker exists
  - resume masked/no-sensitive-field markers exist
  - no customer-facing `拉黑` in miniapp pages
  - no obvious missing local image references

Ensure the PS1 is saved as UTF-8 with BOM so Windows PowerShell 5.1 handles Chinese labels correctly.

## Fixing Rules

- Keep fixes narrow.
- Do not rewrite working pages.
- Do not redesign UI unless there is a clear bug such as overlap, missing item, broken navigation, or wrong field.
- Do not change business rules unless they contradict the current documented MVP behavior.
- If you find a larger product question, document it in the self-review report instead of implementing a speculative solution.

## Strictly Forbidden

- Do not read or print `.env`.
- Do not use `npx prisma`.
- Do not modify Word requirement documents.
- Do not delete files unless the user explicitly approves it.
- Do not move files unless the user explicitly approves it.
- Do not run `git reset`, `git checkout`, or rewrite Git history.
- Do not commit code.
- Do not implement customer ordering, dispatch, payment, wallet, commission/distribution, dispute voting, or automatic punishment.

## Self-review report

Write:

`claude-reports/20260528-stage7-regression-self-review.md`

Use status:

- `PASSED`
- `FAILED_AFTER_TWO_REPAIRS`
- `UNVERIFIED_ENV_BLOCKED`
- `PARTIAL_NEEDS_CODEX_REVIEW`

The report must include:

1. What was checked.
2. What bugs were found.
3. What bugs were fixed.
4. What remains manual.
5. Final verifier result.

## Final Response

Report:

1. What changed.
2. Which file groups changed.
3. Final verifier result.
4. Self-review report path.
5. Manual admin/miniapp checks still needed.
