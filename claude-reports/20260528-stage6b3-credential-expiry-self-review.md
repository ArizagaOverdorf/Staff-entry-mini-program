# Claude Self-Review Report

## Status

Status: `PASSED`

Task slug: stage6b3-credential-expiry

Task summary: Implement credential expiry and re-review behavior — require expiry dates for certain credential types, compute isExpired/expiryStatusLabel/badge, block intake submission and admin approval when mandatory credentials are expired, and update miniapp/admin UI accordingly.

Report time: 2026-05-28

## Scope

Requested change: Implement credential expiry validation, expired-status display, and re-review triggering after credential changes. The 5 credential types that require expiry dates are: health_cert, no_crime_cert, credit_report, medical_report, insurance.

Explicit non-goals:
- No customer ordering, dispatch, payment, wallet, commission, or dispute voting.
- No skill certificate expiry (skill_cert expiry is out of scope).
- No automatic dispatch freeze on credential expiry.
- No database migration changes.
- No changes to Prisma schema.

Pre-existing dirty files before editing:
- claude-stage6b3-credential-expiry-prompt.md
- run-claude-stage6b3-credential-expiry.cmd
- run-claude-stage6b3-credential-expiry.ps1

## Files Changed

Server:
- `apps/server/src/modules/credential/credential.constants.ts` — Added `CREDENTIAL_TYPES_REQUIRE_EXPIRY` array.
- `apps/server/src/modules/credential/credential.service.ts` — Imported new constant; added `validateExpiryDate()` method; added expiry validation in `create()` and `update()`; added `isExpired`, `expiryStatusLabel`, `badge` computation in `formatCredential()`.
- `apps/server/src/modules/intake/intake.service.ts` — Imported `CREDENTIAL_TYPES_REQUIRE_EXPIRY`; added `isCredentialExpired` helper; added `isExpired` to mandatory credential preview; added expired-credential blocking in `preview()` and `submit()`.
- `apps/server/src/modules/admin/admin-staff.service.ts` — Imported `CREDENTIAL_TYPES_REQUIRE_EXPIRY`; added `isExpired`/`expiryStatusLabel`/computed `badge` to `credentials()` response; added expired-credential blocking in `approveIntake()` and `reviewCredential()`.

Admin:
- `apps/admin/src/pages/staff/services/staff.ts` — Added `isExpired` and `expiryStatusLabel` to `CredentialRecord` interface.
- `apps/admin/src/pages/staff/components/CredentialReviewList.tsx` — Updated expired badge from `已过期` to `证件过期`; added `isExpired` check alongside `badge`.

Miniapp:
- `apps/miniapp/utils/constants.js` — Added `CREDENTIAL_TYPES_REQUIRE_EXPIRY` constant and export.
- `apps/miniapp/pages/credential/edit/index.js` — Added `requireExpiry` to `applyTypeState()`; added expiry date validation in `validate()`.
- `apps/miniapp/pages/credential/edit/index.wxml` — Changed expiry field visibility from `showNormalCredentialFields` to `requireExpiry`; added required mark `*`.
- `apps/miniapp/pages/credential/index.js` — Added `isExpired`/`expiryStatusLabel` to `normalizeCredential()`; expired credentials show `证件过期` status.
- `apps/miniapp/pages/credential/index.wxml` — Added `证件过期` text for expired credentials in card bottom.
- `apps/miniapp/pages/resume/index.js` — Added `isCredExpired()` helper; updated `getAuditText()` to return `证件过期`; updated `isInsuranceValid()` to return `{valid, expired}`; updated `loadResume()` data construction.

Database/migrations:
- No schema changes. No migration added.

Scripts/verifiers:
- `verify-stage6b3-credential-expiry.ps1` — Created. Runs Stage 6B-2 baseline first, validates Prisma, builds server, checks admin TS and miniapp JS, asserts all stage-6b3 markers.
- `verify-stage6b3-credential-expiry.cmd` — Created. Launcher for the PS1.

Docs/prompts:
- None.

Other:
- None.

## Commands Run

| Command | Purpose | Result |
| --- | --- | --- |
| `git status --short` | Pre-check | 3 untracked prompt/runner files |
| `.\verify-stage6b3-credential-expiry.ps1` | Final verification | PASSED |

## Baseline Verification

Baseline command: `.\verify-stage6b2-management-status.ps1` (invoked within final verifier)

Baseline result: PASSED — all Stage 4 through Stage 6B-2 checks passed before Stage 6B-3 assertions ran.

Notes: Baseline chain covers Stage 4, 4.1, 4.2, 5, 6A, 6B-1, 6B-2 before reaching 6B-3 markers.

## Final Verification

Final command: `.\verify-stage6b3-credential-expiry.ps1`

Final result: PASSED

Key output summary:
- Prisma schema valid (9 migrations, up to date).
- Server build passed (NestJS compilation clean).
- Admin TypeScript type check passed.
- Miniapp JS syntax check passed.
- All backend markers confirmed: CREDENTIAL_TYPES_REQUIRE_EXPIRY, health_cert, no_crime_cert, credit_report, medical_report, insurance, validateExpiryDate, isExpired, expiryStatusLabel.
- All miniapp markers confirmed: requireExpiry, isExpired, isCredExpired, CREDENTIAL_TYPES_REQUIRE_EXPIRY.
- All admin markers confirmed: isExpired, expiryStatusLabel in interface and component.

## Repair Attempts

Attempt 1:

- Trigger: Server build failed with TS1005 ';' expected at `}));` in admin-staff.service.ts line 267.
- Fix: The `credentials.map((credential) => {` callback had a mismatched closing. The original `}));` (close return object + close callback + close .map) was missing the callback block close. Changed to `};` (close return object) followed by `});` (close callback block + close .map).
- Result: Build passed on retry. Verification passed fully.

Attempt 2:
- None needed.

## Database And Migration Notes

Schema changed: `no`

Migration added: `no`

Migration name: N/A

Seed/demo data changed: `no`

## Manual Test Notes

Admin:
- Verify that an expired credential shows `证件过期` tag in the credential review list.
- Verify that approving an expired credential returns a `证件过期` error toast.
- Verify that approving intake with an expired mandatory credential returns a `证件过期` error.

Miniapp:
- Verify that credential edit page shows `有效期至 *` field only for health_cert, no_crime_cert, credit_report, medical_report, insurance.
- Verify that credential edit page does NOT show expiry field for id_card, education, student_card, skill_cert, other.
- Verify that save fails with "请填写有效期" when expiry date is empty for required-expiry types.
- Verify that credential list shows `证件过期` on expired credentials.
- Verify that submit review is blocked when a mandatory credential is expired, and the issue text is shown.
- Verify that resume page shows `证件过期` for expired no_crime_cert, health_cert, credit_report, medical_report.
- Verify that insurance shows `证件过期` when approved but expired.

Server/API:
- Verify that `POST /api/app/credentials` rejects creation of health_cert without expiry date.
- Verify that `PUT /api/app/credentials/:id` rejects update that clears expiry date for required-expiry type.
- Verify that `GET /api/app/intake/preview` includes `isExpired` in mandatory credentials and sets `canSubmit: false` when expired.
- Verify that `POST /api/app/intake/submit` blocks with `证件过期` error.
- Verify that admin credential review (approve) blocks with `证件过期` error for expired credentials.

Not manually verified:
- All API-level behavior not tested directly; only verified through build/type checks and marker assertions.
- Real WeChat miniapp runtime not available for testing.

## Residual Risks

- The `reviewCredential` expired check uses `isApprove` variable which is correctly declared before the check. Verified during build.
- The `isInsuranceValid` return type changed from boolean to object `{valid, expired}` — the resume page correctly destructures it; no other callers exist.
- The `credentials.map` callback in admin-staff.service.ts uses a block body with `return { ... };` — the indentation is not ideal but compiles cleanly.

## Codex Review Checklist

- Confirm diff matches requested scope.
- Confirm no `.env` or secrets were read or committed.
- Confirm no out-of-scope modules were implemented (ordering, dispatch, payment, wallet, dispute voting).
- Confirm verifier result is credible — all stages passed end-to-end.
- Confirm credential expiry does NOT auto-stop dispatch (per MVP rules).
- Confirm skill_cert expiry was NOT added (per explicit non-goal).
- Confirm any manual test gaps are acceptable before commit.
