# Claude Code Task: Stage 9.3 Finalize Resident ID Profile Sync

You are working in:

`D:\CodexProjects\housekeeping-system\Staff entry mini-program`

## Required First Step

Before coding, read and follow:

- `CLAUDE.md`
- `claude-skills/self-review/SKILL.md`
- `claude-skills/self-review/references/report-template.md`
- `handoff.md` if it exists
- `claude-reports/20260529-stage9-2-hardening-review-fixes-self-review.md`

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

## Codex Review Finding To Fix

Stage 9.2 is not ready to commit. Codex re-reviewed the actual code and found that `syncProfileIdNumber()` still has two runtime/business defects.

File:

- `apps/server/src/modules/credential/credential.service.ts`

Current problematic logic:

```ts
const existing = await tx.staffProfile.findUnique({
  where: { staffAccountId: accountId },
  select: { idNumberEncrypted: true },
});
if (!existing?.idNumberEncrypted) {
  const encryptionKey = this.config.encryptionKey;
  await tx.staffProfile.upsert({
    where: { staffAccountId: accountId },
    create: {
      staffAccountId: accountId,
      idNumberEncrypted: encrypt(trimmed, encryptionKey),
      idNumberMasked: maskIdNumber(trimmed),
    },
    update: {
      idNumberEncrypted: encrypt(trimmed, encryptionKey),
      idNumberMasked: maskIdNumber(trimmed),
    },
  });
}
```

Problems:

1. `StaffProfile.staffId` is required in Prisma schema, but the upsert `create` payload does not provide `staffId`. If a staff profile does not exist yet and the user saves the resident ID card first, this can fail at runtime.
2. The `if (!existing?.idNumberEncrypted)` guard means an existing profile ID number is never updated. If the user corrects the resident ID card number in credential management, the personal profile can remain stale.

## Required Fix

Implement a robust `syncProfileIdNumber()`:

- Always sync the explicit resident ID card number into `StaffProfile` when `syncProfileIdNumber()` is called with a non-empty `idNumber`.
- Do not skip updates just because `idNumberEncrypted` already exists.
- Include required `staffId` in the `upsert.create` payload.
- Obtain `staffId` safely from the current `StaffAccount` inside the transaction, or refactor the method signature/call site to pass `staffId` if cleaner.
- If the staff account cannot be found, throw a clear error instead of silently skipping.
- Keep using `ConfigService.encryptionKey`, `encrypt(trimmed, encryptionKey)`, and `maskIdNumber(trimmed)`.
- Do not add silent catches.
- Keep plaintext ID number out of public/integration APIs.
- Do not change schema or add migrations.

Do not rework the skill certificate logic unless a build/type error forces a tiny related fix.

## Baseline And Final Verification

Baseline verifier:

```powershell
.\verify-stage9-2-hardening-review-fixes.cmd
```

Final verifier:

```powershell
.\verify-stage9-3-id-card-profile-sync-final.cmd
```

If the final verifier does not exist yet, create it as part of this task. It must run Stage 9.2 first and then assert the Stage 9.3 markers below.

## Verification Script Requirements

Create:

- `verify-stage9-3-id-card-profile-sync-final.ps1`
- `verify-stage9-3-id-card-profile-sync-final.cmd`

The PS1 must:

- Run `.\verify-stage9-2-hardening-review-fixes.ps1` first.
- Validate Prisma schema.
- Build server.
- Run admin TypeScript check.
- Validate miniapp JSON.
- Check miniapp JS syntax.
- Assert Stage 9.3 markers:
  - `syncProfileIdNumber` no longer gates the profile upsert/update behind `if (!existing?.idNumberEncrypted)`.
  - The upsert `create` path includes required `staffId`.
  - The method obtains or receives `staffId` from a trusted server-side source, not from client input.
  - The update path writes `idNumberEncrypted` and `idNumberMasked` every time a non-empty resident ID card number is synced.
  - The method still uses `encrypt(trimmed, encryptionKey)` and `maskIdNumber(trimmed)`.
  - No silent `catch (_e)` or empty catch is introduced.
  - Server build and type checks pass.

Ensure the PS1 is saved as UTF-8 with BOM if it contains Chinese labels.

## Self-Review Report

Write a report under:

`claude-reports/`

Suggested filename:

`20260530-stage9-3-id-card-profile-sync-final-self-review.md`

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
