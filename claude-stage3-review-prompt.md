# Claude Code Task: Stage 3 Admin Review Workflow

You are working in the repository:

`D:\CodexProjects\housekeeping-system\Staff entry mini-program`

## Context

Stage 0, Stage 1, and Stage 2 have already been committed.

Latest completed stage:

- Stage 2 commit: `feat: implement stage2 profile credential intake`
- Stage 2 verification command: `.\verify-stage2.cmd`
- Stage 2 provides miniapp profile/credential/intake submission, private file upload, staff profile APIs, credential APIs, and admin readonly staff list/detail.

Before coding:

1. Read `CLAUDE.md`.
2. Read `家政服务人员入驻小程序_开发技术方案.md`, section "阶段 3：后台审核闭环".
3. Inspect the current code under:
   - `apps/server/src/modules/admin`
   - `apps/server/src/modules/intake`
   - `apps/server/src/modules/credential`
   - `apps/server/src/modules/file`
   - `apps/server/src/modules/message`
   - `apps/server/src/modules/operation-log`
   - `apps/admin/src/pages/staff`
   - `apps/miniapp/pages/audit`
   - `apps/miniapp/pages/message`

Do not start by rewriting existing Stage 2 code. Extend it conservatively.

## Goal

Implement Stage 3 only: admin review workflow for staff onboarding.

Stage 3 must let an admin review submitted staff records, review credentials, approve, reject, request more information, record audit history, create staff messages, and let the miniapp user see review status and messages.

## Required backend work

### 1. Admin staff review APIs

Extend the existing admin staff module, or add narrowly scoped files inside `apps/server/src/modules/admin`.

Required endpoints:

- `GET /api/admin/staff`
  - Keep existing list behavior.
  - Make status filters use canonical backend values: `draft`, `pending_review`, `approved`, `rejected`, `needs_more_info`.
  - Include enough fields for review list display.

- `GET /api/admin/staff/:staffId`
  - Keep existing detail behavior.
  - Include intake status, review remark, submittedAt, reviewedAt, skills, service areas, listing status, and recent audit records.

- `GET /api/admin/staff/:staffId/credentials`
  - Keep existing behavior.
  - Include credential status, badge, version, isCurrent, remark, and fileAsset IDs for preview.

- `POST /api/admin/staff/:staffId/credentials/:credentialId/review`
  - Body: `{ "action": "approve" | "reject", "remark"?: string }`
  - Guard: admin JWT + permission `staff.audit`.
  - Reject requires a non-empty remark.
  - Only current credentials of this staff account can be reviewed.
  - `approve` sets `credential_status = approved`, clears or preserves remark reasonably.
  - `reject` sets `credential_status = rejected`, writes remark.
  - Write `audit_record`.
  - Write `operation_log`.
  - Create a staff `message`.

- `POST /api/admin/staff/:staffId/review/approve`
  - Guard: admin JWT + permission `staff.audit`.
  - Only allowed when intake status is `pending_review`.
  - Validate required current credentials are approved before overall approval.
  - Set `staff_intake_status.intake_status = approved`, set `reviewedAt`, set remark.
  - Initialize `staff_listing_status` if missing as `offline` and `is_available = false`.
  - Do not implement manual listing/pause/resume in Stage 3.
  - Write `audit_record`, `operation_log`, and a staff `message`.

- `POST /api/admin/staff/:staffId/review/reject`
  - Body: `{ "remark": string }`
  - Guard: admin JWT + permission `staff.audit`.
  - Only allowed when intake status is `pending_review`.
  - Remark is required.
  - Set `staff_intake_status.intake_status = rejected`, set `reviewedAt`, set reviewRemark.
  - Write `audit_record`, `operation_log`, and a staff `message`.

- `POST /api/admin/staff/:staffId/review/request-more-info`
  - Body: `{ "remark": string }`
  - Guard: admin JWT + permission `staff.audit`.
  - Only allowed when intake status is `pending_review`.
  - Remark is required.
  - Set `staff_intake_status.intake_status = needs_more_info`, set `reviewedAt`, set reviewRemark.
  - Write `audit_record`, `operation_log`, and a staff `message`.

Use consistent action strings:

- `credential_approve`
- `credential_reject`
- `intake_approve`
- `intake_reject`
- `intake_request_more_info`

### 2. Admin private file preview

Add or extend backend support for:

- `GET /api/admin/files/:fileId/preview`

Requirements:

- Guard: admin JWT + permission `staff.view` or `staff.audit`.
- File must be a known private file.
- Return the file stream through the backend, not a public static path.
- Write `operation_log` with action `file_preview`.
- Do not expose OSS keys or local filesystem paths.

### 3. Message center APIs

Complete the message module for miniapp:

- `GET /api/app/messages`
  - Returns current staff user's messages, newest first, with pagination if easy.

- `GET /api/app/messages/unread-count`
  - Returns unread count.

- `POST /api/app/messages/:messageId/read`
  - Marks one message as read, only for current staff user.

Stage 3 messages are system messages created by review actions. Do not implement push subscriptions yet.

### 4. Intake status response

Update `GET /api/app/intake/status` so the miniapp can show:

- canonical `intakeStatus`
- label
- `submittedAt`
- `reviewedAt`
- `reviewerRemark`
- `rejectReason` when rejected
- recent audit records that are safe for the staff user to see

Do not return admin-only internal notes beyond the review remark intended for the staff user.

### 5. Operation log helper

If the operation-log module is still a placeholder, add a small service helper that can create operation logs for admin actions.

Keep it simple:

- `operatorId`
- `operatorType = admin`
- `targetType`
- `targetId`
- `action`
- `detail`
- optional `ipAddress` only if already easy to obtain

Do not build a full operation log query UI in Stage 3.

## Required admin frontend work

Work under `apps/admin/src/pages/staff` and existing request/service utilities.

Required UI behavior:

1. Staff list:
   - Filter by canonical intake statuses:
     - `draft`
     - `pending_review`
     - `approved`
     - `rejected`
     - `needs_more_info`
   - Display clear status tags.
   - Link to detail page.

2. Staff detail:
   - Show profile, service categories, service areas, intake status, review remark, and audit history.
   - Show credential list with status, version, expiry date, and preview action.
   - For current credentials, provide approve/reject buttons when appropriate.
   - Provide overall approve/reject/request-more-info actions when intake status is `pending_review`.
   - Use modal confirmation for approve.
   - Use modal form or prompt for reject/request-more-info remarks.
   - Refresh detail after each action.

3. File preview:
   - Use `/api/admin/files/:fileId/preview`.
   - Keep private backend proxy behavior. Do not use public file URLs.

Do not redesign the whole admin app. Make the smallest coherent extension.

## Required miniapp work

Work only where needed:

- `apps/miniapp/pages/audit/status`
- `apps/miniapp/pages/message`
- `apps/miniapp/pages/message/detail`
- shared constants/request helpers if endpoint names need alignment.

Required behavior:

- Audit status page displays the latest review status, remark, submittedAt, reviewedAt, and safe audit timeline.
- Message list loads from `GET /api/app/messages`.
- Message detail marks a message as read.
- Keep UI simple; do not redesign the miniapp.

## Prisma and migrations

Use existing tables if possible:

- `staff_intake_status`
- `staff_credential`
- `audit_record`
- `message`
- `operation_log`
- `staff_listing_status`
- `file_asset`

Only modify `apps/server/prisma/schema.prisma` if the current schema is genuinely insufficient.

If schema changes are necessary:

1. Modify schema.
2. Run local Prisma only:
   `.\apps\server\node_modules\.bin\prisma.CMD migrate dev --name stage3_review_workflow --schema apps\server\prisma\schema.prisma`

Do not use `npx prisma`.

## Strictly forbidden

Do not implement:

- Stage 4 listing availability management, pause, resume, or expiry automation.
- Stage 5 service record summary maintenance.
- Stage 6 operation log query UI.
- Stage 7 integration APIs.
- Stage 8 "大家评评理" workflow.
- Payment, deposit, wallet, debt, revenue sharing, order fulfillment, dispatch, map selection, customer ordering.
- Automatic punishment, automatic dispatch freeze, automatic wallet/deposit changes.

Do not:

- Read `.env` contents.
- Commit secrets.
- Delete or move files.
- Run `git reset`, `git checkout`, or rewrite Git history.
- Modify product requirement documents or existing phase plan documents.

## Verification

When done, run:

`.\verify-stage3.cmd`

If `verify-stage3.cmd` is missing or fails because of the verification script itself, run the equivalent local checks manually:

- `.\apps\server\node_modules\.bin\prisma.CMD validate --schema apps\server\prisma\schema.prisma`
- `.\apps\server\node_modules\.bin\prisma.CMD migrate status --schema apps\server\prisma\schema.prisma`
- build server
- type-check admin
- validate JSON
- check empty source files

Report:

1. Files changed.
2. APIs added or changed.
3. Database migration name if any.
4. Verification result.
5. Anything intentionally deferred to Stage 4 or later.
