# Codex Self-Review Report

## Status

Status: `PASSED`

Task slug: `resubmit-rejected-intake-review`

Task summary: Fix the workflow break where a rejected staff intake can be resubmitted and the app reports it is under review, but the admin staff list does not surface it for review again.

## Problem

After an admin rejects an intake, the staff can submit again from the miniapp. The backend changes the intake status back to `pending_review`, so a second submit correctly returns "入驻申请已在审核中". However, the admin staff list was ordered by account creation time, not by the latest intake submission time. A resubmitted older account could remain buried in the list, making it appear that the backend did not show the review item again.

The resubmit update also did not clear the old `reviewedAt`, leaving stale review metadata on a new pending review.

## Changes

Server:

- `apps/server/src/modules/intake/intake.service.ts`
  - On resubmission, set `reviewedAt` to `null` together with `intakeStatus: pending_review`, `submittedAt: now`, and `reviewRemark: null`.

- `apps/server/src/modules/admin/admin-staff.service.ts`
  - Staff list now sorts by latest `intakeStatus.submittedAt` first, then `createdAt`.
  - Dashboard `todaySubmitted` now counts intake submissions by `submittedAt`, not newly created staff accounts.

## Verification

- `pnpm --filter @staff-entry/server build`: `PASSED`

## Manual Test Gaps

Please verify the exact business flow in admin + miniapp:

1. Admin rejects an intake.
2. Staff corrects data and submits again.
3. Staff clicking submit again should still show "入驻申请已在审核中".
4. Admin staff list should show the same staff near the top as `待审核`.
5. Admin should be able to enter the review tab and approve/reject/request more info again.

## Notes

No database schema change was needed.
