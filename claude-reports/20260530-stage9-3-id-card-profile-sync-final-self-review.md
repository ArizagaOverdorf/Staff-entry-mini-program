# Claude Self-Review Report

## Status

Status: `PASSED`

Task slug: stage9-3-id-card-profile-sync-final

Task summary: Fix two runtime/business defects in `syncProfileIdNumber()` found by Stage 9.2 Codex re-review: (1) missing required `staffId` in upsert create payload causing runtime failure when profile doesn't exist yet; (2) stale-profile bug where existing profile ID numbers are never updated because the method gates behind `if (!existing?.idNumberEncrypted)`.

Report time: 2026-05-30

## Scope

Requested change:

1. Remove the `if (!existing?.idNumberEncrypted)` guard — always sync the resident ID card number into `StaffProfile` when `syncProfileIdNumber()` is called with a non-empty `idNumber`.
2. Include required `staffId` in the upsert `create` payload.
3. Obtain `staffId` from `StaffAccount` via a trusted server-side query inside the transaction.
4. Throw a clear error if the staff account cannot be found (instead of silently skipping).
5. Keep using `ConfigService.encryptionKey`, `encrypt(trimmed, encryptionKey)`, and `maskIdNumber(trimmed)`.
6. Create `verify-stage9-3-id-card-profile-sync-final.ps1` and `.cmd` verifier scripts.

Explicit non-goals:

- No Prisma schema or migration changes.
- No miniapp or admin UI changes.
- No changes to `credential.constants.ts`, `upsert-credential.dto.ts`, or other files.
- No rework of skill certificate logic (no changes needed).
- No customer ordering, dispatch, payment, wallet, or dispute features.

Pre-existing dirty files before editing:

Stage 8.2 handoff + Stage 9 + Stage 9.1 + Stage 9.2 changes (27+ modified, 16+ untracked files): admin support polling, miniapp support chat, file limits, profile pages, credential pages, constants, request.js, verifier scripts, and Stage 9.x reports/prompts.

## Files Changed

Server:

- `apps/server/src/modules/credential/credential.service.ts` — `syncProfileIdNumber()` rewritten:
  - Removed the `const existing = await tx.staffProfile.findUnique(...)` guard and the `if (!existing?.idNumberEncrypted)` condition — the method now always syncs when called with a non-empty ID number.
  - Added `StaffAccount` query: `tx.staffAccount.findUnique({ where: { id: accountId }, select: { staffId: true } })` to obtain the business `staffId` from a trusted server-side source.
  - Added explicit throw: `throw new BadRequestException('Staff account not found, cannot sync profile ID number')` when account is missing.
  - Added `staffId: account.staffId` to the upsert `create` payload (required by `StaffProfile.staffId` in Prisma schema).
  - Both `create` and `update` paths now write `idNumberEncrypted` and `idNumberMasked` every time.
  - Retained `this.config.encryptionKey`, `encrypt(trimmed, encryptionKey)`, and `maskIdNumber(trimmed)`.

Admin:

- (no changes)

Miniapp:

- (no changes)

Database/migrations:

- Schema changed: `no`
- Migration added: `no`

Scripts/verifiers:

- `verify-stage9-3-id-card-profile-sync-final.ps1` — New: runs Stage 9.2 baseline, validates schema, builds server, checks admin TS, validates miniapp JSON/JS, asserts 7 Stage 9.3 markers
- `verify-stage9-3-id-card-profile-sync-final.cmd` — New: CMD wrapper

Docs/prompts:

- (none modified)

Other:

- (none)

## Commands Run

| Command | Purpose | Result |
| --- | --- | --- |
| `git status --short` | Pre-check | 27 modified + 16 untracked files |
| `.\verify-stage9-2-hardening-review-fixes.cmd` | Baseline | Passed (8/8 Stage 9.2 markers) |
| `npm run build` (server) | Quick build check after edit | Passed |
| `.\verify-stage9-3-id-card-profile-sync-final.cmd` | Final | Passed (7/7 Stage 9.3 markers) |

## Baseline Verification

Baseline command: `.\verify-stage9-2-hardening-review-fixes.cmd`

Baseline result: Passed. All 8 Stage 9.2 markers passed, along with all prior stages (4, 4.1, 4.2, 5, 6A, 6B-1, 6B-2, 6B-3, 7, 8, 8.1, 8.2, 9, 9.1).

Notes: Baseline was clean before editing.

## Final Verification

Final command: `.\verify-stage9-3-id-card-profile-sync-final.cmd`

Final result: Passed

Key output summary:

All 7 Stage 9.3 markers passed:
1. No existing ID number guard — `syncProfileIdNumber` no longer gates behind `existing?.idNumberEncrypted` or any `existing` query; always syncs when called with non-empty ID number.
2. upsert create includes required `staffId` — `staffId: account.staffId` confirmed in create payload.
3. staffId from StaffAccount query — queries `staffAccount.findUnique` with `select: { staffId: true }` and checks `account?.staffId` before proceeding.
4. Update path always writes ID fields — both `create` and `update` paths write `idNumberEncrypted: encrypt(trimmed, encryptionKey)` and `idNumberMasked: maskIdNumber(trimmed)`.
5. Uses encrypt with key and maskIdNumber — `this.config.encryptionKey` + `encrypt(trimmed, encryptionKey)` + `maskIdNumber(trimmed)` confirmed.
6. No silent catch blocks — no `catch (_e)` or similar in the method body.
7. Server build and type checks — passed (verified in prior steps).

All prior stages (4 through 9.2) also passed.

## Repair Attempts

No repair attempts needed. All 7 Stage 9.3 markers passed on the first run.

## Database And Migration Notes

Schema changed: `no`

Migration added: `no`

Seed/demo data changed: `no`

No schema changes. The `staffId` field has always been required on `StaffProfile`. The fix simply populates it from `StaffAccount.staffId`, which already exists for every account, following the same pattern used by `StaffService.updateProfile()`.

## Manual Test Notes

Admin:

- No admin changes. Admin TypeScript check passes.

Miniapp:

- No miniapp changes. JS syntax check and JSON validation pass.

Server/API:

- API endpoints not smoke-tested. Build and type check pass but runtime behavior should be verified:
  - **New profile creation during ID card save**: When a user saves an ID card credential and no `StaffProfile` row exists yet (e.g., profile not yet edited), the upsert `create` path now includes `staffId` from `StaffAccount`. This was the case that would have failed at runtime before the fix.
  - **Profile ID number update on correction**: When a user corrects their ID card number (e.g., re-uploads a corrected ID card credential), the profile's `idNumberEncrypted` and `idNumberMasked` are now updated every time. Previously they would stay stale.
  - **Error propagation**: If `StaffAccount` is not found for the given `accountId`, a `BadRequestException` is now thrown inside the transaction, which will roll back and surface to the caller. This should not happen in normal operation (accountId comes from the authenticated session).

Not manually verified:

- Real device / emulator testing (no UI changes)
- API integration testing of ID card credential create/update endpoints
- Profile ID number sync end-to-end with real encryption key
- Edge case: user creates ID card credential before any profile data exists

## Residual Risks

- **Transaction error propagation**: Previously, if `staffProfile.upsert` failed (e.g., missing `staffId`), the error was silently swallowed and the credential save would appear to succeed while the profile ID number was never written. Now the error propagates and rolls back the transaction. This is the intended behavior, but testers should verify that the error message is user-friendly in the miniapp UI.
- **StaffAccount query inside transaction**: The fix adds one extra `staffAccount.findUnique` query per credential create/update when the credential type is `id_card` and `credentialNumber` is non-empty. This is lightweight (selects only `staffId` by primary key) and should not be a performance concern.
- **Verifier scope**: The verifier confirms code-level markers but does not start the server or make API calls. The fix is structural (guard removal, field addition, source-of-truth for staffId) and the server build passes, so the risk of a type/build-level regression is low.

## Codex Review Checklist

- Confirm diff matches requested scope.
- Confirm no `.env` or secrets were read or committed.
- Confirm no out-of-scope modules were implemented.
- Confirm verifier result is credible.
- Confirm any manual test gaps are acceptable before commit.
- Confirm `staffId` is obtained from `StaffAccount.staffId` (trusted server-side), not from client input.
- Confirm both `create` and `update` paths write `idNumberEncrypted` and `idNumberMasked` every time.
- Confirm no silent `catch` was reintroduced.
- Confirm the old `existing?.idNumberEncrypted` guard is fully removed.
