# Codex Self-Review Report

## Status

Status: `PASSED`

Task slug: `credential-review-buttons-after-resubmit`

Task summary: Fix missing credential approve/reject buttons on the admin staff review page after a staff member resubmits rejected materials.

## Scope Control

This change is limited to the admin staff review page credential action visibility. It does not change miniapp submission logic, credential validation rules, profile fields, service areas, backend review actions, or database schema.

## Problem

The credential review list only showed approve/reject buttons when a credential status was exactly `pending`. If a staff member resubmitted an intake after a material had previously been rejected, the intake could be in `pending_review` while the corresponding current credential still had `rejected` status. In that case, the miniapp correctly said the intake was under review, but the admin credential row had no visible review buttons.

## Changes

Admin frontend:

- `apps/admin/src/pages/staff/components/CredentialReviewList.tsx`
  - Added `intakeStatus` as an optional prop.
  - Keeps showing credential review buttons for `pending` credentials.
  - Also shows credential review buttons for `rejected` credentials when the staff intake is currently `pending_review`.
  - Accepts `pending_review` as a defensive credential status label.

- `apps/admin/src/pages/staff/detail.tsx`
  - Passes the current staff `intakeStatus` into credential review lists on both the review tab and credential tab.

## Verification

- `.\node_modules\.bin\tsc.cmd -p apps/admin/tsconfig.json --noEmit`: `PASSED`
- `pnpm --filter @staff-entry/server build`: `PASSED`

## Manual Test Gaps

Please verify in the running admin:

1. Reject a credential or material.
2. Resubmit from the miniapp so intake status becomes `pending_review`.
3. Open the staff admin review page.
4. The rejected credential row should now show `通过` and `驳回` buttons.
5. Clicking those buttons should still use the existing credential review APIs.
