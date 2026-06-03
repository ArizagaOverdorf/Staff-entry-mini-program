# Codex Self-Review Report

## Status

Status: `PASSED`

Task slug: `admin-review-entry-for-pending-credentials`

Task summary: Fix the admin staff list not showing a review entry after material/credential resubmission.

## Scope Control

This change is limited to the admin review entry visibility for resubmitted materials. It does not change profile fields, credential field requirements, service areas, submission validation rules, review actions, or other business modules.

## Problem

The admin staff list only showed the `审核` action when `intakeStatus === pending_review`. In real use, an admin can reject a material/credential, and the staff can upload a replacement credential. That creates a pending credential review item, but the list row may not expose the review entry if the intake status itself is not the only signal being checked.

This made the miniapp appear to be in review while the admin list had no visible review entry.

## Changes

Server:

- `apps/server/src/modules/admin/admin-staff.service.ts`
  - Staff list now returns `pendingCredentialCount`.
  - Staff list now returns `needsReview`, true when intake status is `pending_review` or there is at least one current pending credential.
  - Staff list sorts staff with pending credential reviews ahead of older normal rows after latest submitted time ordering.

Admin frontend:

- `apps/admin/src/pages/staff/services/staff.ts`
  - Added `pendingCredentialCount` and `needsReview` to `StaffRecord`.

- `apps/admin/src/pages/staff/components/StaffTable.tsx`
  - The `审核` button now appears when `needsReview` is true, or when the legacy pending-review checks match.

## Verification

- `pnpm --filter @staff-entry/server build`: `PASSED`
- `.\node_modules\.bin\tsc.cmd -p apps/admin/tsconfig.json --noEmit`: `PASSED`
- `.\node_modules\.bin\tsc.cmd -p apps/server/tsconfig.json --noEmit`: `PASSED`

## Verification Notes

`pnpm --filter @staff-entry/admin build` and `pnpm --filter @staff-entry/admin exec tsc --noEmit` were blocked by a local `fetch failed` issue before TypeScript output. The direct local TypeScript check passed.

## Manual Test Gaps

Please verify in the running admin and miniapp:

1. Admin rejects a credential/material or intake.
2. Staff updates the rejected material and submits again.
3. Admin staff list refreshes.
4. The row should show the `审核` action if the intake is pending or any current credential is pending.
5. Clicking `审核` should enter the review tab, where intake review and credential review remain unchanged.
