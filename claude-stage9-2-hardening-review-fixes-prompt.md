# Claude Code Task: Stage 9.2 Fix Codex Review Findings For ID Sync And Skill Validation

You are working in:

`D:\CodexProjects\housekeeping-system\Staff entry mini-program`

## Required First Step

Before coding, read and follow:

- `CLAUDE.md`
- `claude-skills/self-review/SKILL.md`
- `claude-skills/self-review/references/report-template.md`
- `handoff.md` if it exists
- `claude-reports/20260529-stage9-1-profile-idcard-skill-hardening-self-review.md`

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

## Codex Review Findings To Fix

Stage 9.1 is not ready to commit because Codex found two concrete backend issues:

### Bug 1: ID card number sync silently fails

File:

- `apps/server/src/modules/credential/credential.service.ts`

Current issue:

- `syncProfileIdNumber()` dynamically requires `encrypt` and calls `encrypt(trimmed)` without the required encryption key.
- The actual utility signature is `encrypt(text: string, key: string): string`.
- The method catches and silently ignores errors, so resident ID card number sync can fail while the API still reports success.

Required fix:

- Inject/use `ConfigService` in `CredentialService` like `StaffService` does, or otherwise safely access the configured encryption key without reading/printing `.env`.
- Call `encrypt(trimmed, encryptionKey)`.
- Use `maskIdNumber(trimmed)` normally.
- Do not silently swallow sync failures. If syncing the ID number to profile fails, the credential save should fail rather than pretending the profile is synced.
- If `StaffProfile` create has required fields that make upsert unsafe, use an implementation that still succeeds when only ID number is being synced, or document and handle the real schema constraints. Do not use a silent catch.
- Keep plaintext ID number out of public/integration APIs.

### Bug 2: skill certificate category restriction can be bypassed with staffSkillIds

File:

- `apps/server/src/modules/credential/credential.service.ts`

Current issue:

- Stage 9.1 restricts `staffSkillCategories` to the five allowed category IDs:
  - `maternity_matron`
  - `childcare_nanny`
  - `live_in_nanny`
  - `daytime_nanny`
  - `elderly_nanny`
- But `staffSkillIds` are only checked for account ownership. If an existing staff skill has another category ID, the API can link that disallowed skill to a skill certificate by passing `staffSkillIds`.

Required fix:

- When resolving `staffSkillIds` for `skill_cert`, load the corresponding `StaffSkill.categoryId` values and reject any not in `ALLOWED_SKILL_CERT_CATEGORY_IDS`.
- Keep account ownership validation.
- Keep existing support for `staffSkillCategories`.
- Ensure both paths, `staffSkillIds` and `staffSkillCategories`, enforce the same allowed category rule.

## Optional Cleanup If Safe

- Avoid dynamic `require()` inside Nest service methods if a normal import is already available.
- Keep validation messages clear and business-facing.
- If the Stage 9.1 verifier only checks weak markers, strengthen it so these two bugs would fail in the future:
  - assert `encrypt(trimmed,` or equivalent keyed encryption use
  - assert no silent `catch (_e)` around profile ID sync
  - assert staffSkillIds category validation inspects categoryId

## Baseline And Final Verification

Baseline verifier:

```powershell
.\verify-stage9-1-profile-idcard-skill-hardening.cmd
```

Final verifier:

```powershell
.\verify-stage9-2-hardening-review-fixes.cmd
```

If the final verifier does not exist yet, create it as part of this task. It must run Stage 9.1 first and then assert the Stage 9.2 markers below.

## Verification Script Requirements

Create:

- `verify-stage9-2-hardening-review-fixes.ps1`
- `verify-stage9-2-hardening-review-fixes.cmd`

The PS1 must:

- Run `.\verify-stage9-1-profile-idcard-skill-hardening.ps1` first.
- Validate Prisma schema.
- Build server.
- Run admin TypeScript check.
- Validate miniapp JSON.
- Check miniapp JS syntax.
- Assert Stage 9.2 markers:
  - `CredentialService` receives/uses `ConfigService` or equivalent safe config access.
  - ID sync calls encryption with the configured key.
  - `syncProfileIdNumber` does not silently swallow errors with empty catch.
  - `staffSkillIds` path validates linked `StaffSkill.categoryId` against `ALLOWED_SKILL_CERT_CATEGORY_IDS`.
  - `staffSkillCategories` path still validates category IDs.
  - Server build and type checks pass.

Ensure the PS1 is saved as UTF-8 with BOM if it contains Chinese labels.

## Self-Review Report

Write a report under:

`claude-reports/`

Suggested filename:

`20260529-stage9-2-hardening-review-fixes-self-review.md`

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
6. Manual/API checks still needed.
