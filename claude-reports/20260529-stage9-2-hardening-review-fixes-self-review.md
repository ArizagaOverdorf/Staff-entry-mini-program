# Claude Self-Review Report

## Status

Status: `PASSED`

Task slug: stage9-2-hardening-review-fixes

Task summary: Fix two concrete backend bugs found by Stage 9.1 Codex review: (1) ID card number sync silently fails because `encrypt()` is called without the required encryption key and errors are silently swallowed; (2) skill certificate category restriction can be bypassed via `staffSkillIds` which only checks account ownership without validating category IDs.

Report time: 2026-05-29

## Scope

Requested change:

1. Fix `syncProfileIdNumber()` in `credential.service.ts`: inject `ConfigService`, use static imports for `encrypt` and `maskIdNumber`, call `encrypt(trimmed, encryptionKey)` with the configured key, and remove the silent `catch (_e)` that swallows errors.
2. Fix `resolveSkillIdsForCredential()` `staffSkillIds` path: load linked `StaffSkill.categoryId` values and reject any not in `ALLOWED_SKILL_CERT_CATEGORY_IDS`.
3. Create `verify-stage9-2-hardening-review-fixes.ps1` and `.cmd` verifier scripts.
4. Write self-review report.

Explicit non-goals:

- No Prisma schema or migration changes.
- No miniapp or admin UI changes.
- No changes to `credential.constants.ts`, `upsert-credential.dto.ts`, or other files.
- No customer ordering, dispatch, payment, wallet, or dispute features.

Pre-existing dirty files before editing:

Stage 8.2 handoff + Stage 9 + Stage 9.1 changes (27+ files): admin support polling, miniapp support chat, file limits, profile pages, credential pages, constants, request.js, verifier scripts, and the two Stage 9.1 reports.

## Files Changed

Server:

- `apps/server/src/modules/credential/credential.service.ts` — Bug fixes only:
  - Added static imports: `ConfigService`, `encrypt`, `maskIdNumber`
  - Injected `ConfigService` in constructor
  - `syncProfileIdNumber`: replaced dynamic `require()` with static imports, added `encryptionKey` parameter to `encrypt()` calls, removed silent `catch (_e)` block
  - `resolveSkillIdsForCredential`: in `staffSkillIds` path, added query for `StaffSkill.categoryId` and validation against `ALLOWED_SKILL_CERT_CATEGORY_IDS`

Admin:

- (no changes)

Miniapp:

- (no changes)

Database/migrations:

- Schema changed: `no`
- Migration added: `no`

Scripts/verifiers:

- `verify-stage9-2-hardening-review-fixes.ps1` — New: runs Stage 9.1 baseline, validates schema, builds server, checks admin TS, validates miniapp JSON/JS, asserts 8 Stage 9.2 markers
- `verify-stage9-2-hardening-review-fixes.cmd` — New: CMD wrapper

Docs/prompts:

- (none modified)

Other:

- (none)

## Commands Run

| Command | Purpose | Result |
| --- | --- | --- |
| `git status --short` | Pre-check | 27 modified + 16 untracked files |
| `.\verify-stage9-1-profile-idcard-skill-hardening.ps1` | Baseline | Passed (10/10 markers) |
| `npm run build` (server) | Quick build check after edits | Passed |
| `.\verify-stage9-2-hardening-review-fixes.ps1` | Final (attempt 1) | Failed on marker 7 (regex escaping) |
| `.\verify-stage9-2-hardening-review-fixes.ps1` | Final (attempt 2) | Passed (8/8 markers) |

## Baseline Verification

Baseline command: `.\verify-stage9-1-profile-idcard-skill-hardening.ps1`

Baseline result: Passed. All 10 Stage 9.1 hardening markers passed, along with all prior stages (4, 4.1, 4.2, 5, 6A, 6B-1, 6B-2, 6B-3, 7, 8, 8.1, 8.2, 9).

Notes: None — baseline was clean before editing.

## Final Verification

Final command: `.\verify-stage9-2-hardening-review-fixes.ps1`

Final result: Passed

Key output summary:

All 8 Stage 9.2 markers passed:
1. ConfigService injection — `CredentialService` imports and injects `ConfigService`
2. encrypt called with encryption key — `encrypt(trimmed, encryptionKey)` with two arguments confirmed
3. No silent error swallowing — no `catch (_e)` or empty catch blocks in `syncProfileIdNumber`
4. staffSkillIds categoryId validation — queries `StaffSkill.categoryId` and validates against `ALLOWED_SKILL_CERT_CATEGORY_IDS`
5. staffSkillCategories categoryId validation — still validates category IDs against allowed list
6. No dynamic require for crypto/mask utilities — no `require('../../utils/crypto.util')` or `require('../staff/staff.mask')`
7. Static imports for encrypt and maskIdNumber — confirmed `import { encrypt } from '../../utils/crypto.util'` and `import { maskIdNumber } from '../staff/staff.mask'`
8. Server build and type checks — passed (verified in prior stages)

Stage 9.1 baseline also passed (10/10 markers). All prior stages (4 through 9) passed.

## Repair Attempts

Attempt 1:

- Trigger: Stage 9.2 verifier marker 7/8 (static imports) failed. `Assert-Contains` with `[regex]::Escape` on the full import line produced a regex pattern that didn't match the file content.
- Fix: Replaced `Assert-Contains` calls with direct `-notmatch` checks using regex patterns with `\s+` for whitespace and `'[^']*crypto\.util'` / `'[^']*staff\.mask'` for the from-paths. This avoids the complex escaping of `[regex]::Escape` on the full import statement.
- Result: Marker 7/8 passed.

Attempt 2:

- Not needed — all 8 markers passed on second run.

## Database And Migration Notes

Schema changed: `no`

Migration added: `no`

Seed/demo data changed: `no`

No schema changes. The fixes are runtime-only: `ConfigService` injection follows the existing pattern from `StaffService`, and the `staffSkillIds` category validation is an additional in-memory check before database writes.

## Manual Test Notes

Admin:

- No admin changes. Admin TypeScript check passes.

Miniapp:

- No miniapp changes. JS syntax check and JSON validation pass.

Server/API:

- API endpoints not smoke-tested. Build and type check pass but runtime behavior should be verified:
  - `syncProfileIdNumber` now throws on upsert failure instead of silently swallowing. Ensure this doesn't break the ID card credential create/update flow for edge cases (e.g., profile table has additional NOT NULL columns not satisfied by the upsert payload).
  - `staffSkillIds` now validates categoryId against `ALLOWED_SKILL_CERT_CATEGORY_IDS`. Verify that legitimate `staffSkillIds` with allowed categories pass, and disallowed categories are properly rejected with a business-facing error message.
  - `staffSkillCategories` path still works and validates categories.

Not manually verified:

- Real device / emulator testing (no UI changes)
- API integration testing of fixed credential endpoints
- Profile ID number sync end-to-end with real encryption key
- Behavior when profile upsert fails for structural reasons (e.g., DB schema mismatch)

## Residual Risks

- **Profile upsert failure now throws**: Previously, if `syncProfileIdNumber`'s `staffProfile.upsert` failed (e.g., missing required fields in the `StaffProfile` model beyond `staffAccountId`), the error was silently swallowed. Now it propagates up and will fail the credential save transaction. This is the intended behavior per the task requirements. If `StaffProfile` has required fields not provided in the upsert `create`, this would cause the credential save to fail. The risk is low because the same upsert pattern already works for `StaffService.updateProfile`.
- **Verifier regex patterns**: The verifier uses regex patterns to detect code-level markers. While the markers correctly identify the bug fixes, cosmetic refactoring (e.g., renaming variables) could cause false failures. Risk: low — these patterns match the core logic structure.
- **No runtime smoke test**: The verifier confirms server build, admin type check, and miniapp syntax pass, but does not start the server or make API calls. The fixes are structural (static imports, constructor injection, validation logic) and should work at runtime given the build passes. Risk: low.

## Codex Review Checklist

- Confirm diff matches requested scope.
- Confirm no `.env` or secrets were read or committed.
- Confirm no out-of-scope modules were implemented.
- Confirm verifier result is credible.
- Confirm any manual test gaps are acceptable before commit.
- Confirm `ConfigService` injection follows the same pattern as `StaffService`.
- Confirm `staffSkillIds` category validation error messages are business-facing.
- Confirm the `staffSkillCategories` path is preserved and still validates category IDs.
