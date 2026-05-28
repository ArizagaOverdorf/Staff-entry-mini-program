# Claude Code Task: Stage 8 Admin Support Module And Manual-Test Fixes

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
- Make focused changes only.
- Run the final verifier after editing.
- If verification fails, make at most two focused repair attempts.
- Always write one structured report under `claude-reports/`, whether verification passes or fails.
- Do not commit code.

## Permission And Interaction Policy

Work non-interactively where possible:

- Run routine reads, builds, type checks, syntax checks, and verifier scripts without asking the user.
- Accept normal code edits.
- Do not ask for confirmation for routine local validation commands.

Strict approval rule:

- If you need to delete files, move files, overwrite unrelated files, reset git, checkout files, rewrite history, or touch files outside this project, STOP and ask the user first.
- Do not run deletion/cleanup commands automatically.

## Task

Implement **Stage 8: admin support module + manual-test bug fixes**.

The miniapp already has:

- Home page `联系客服` using WeChat native contact button.
- Message center pages for staff-side station messages.

The admin backend/frontend currently lacks a support module to view and reply to staff messages. Build an MVP support module using the existing station-message system. Also fix obvious manual-test blockers found while implementing this stage.

Do not implement full real-time IM, WebSocket, WeCom integration, WeChat customer-service API, customer ordering, dispatch, payment, wallet, commission/distribution, dispute voting, or automatic punishment.

## Baseline And Final Verification

Baseline verifier:

```powershell
.\verify-stage7-regression.cmd
```

Final verifier:

```powershell
.\verify-stage8-support.cmd
```

If the final verifier does not exist yet, create it as part of this task. It must run Stage 7 first and then assert Stage 8 markers.

## Read First

- `CLAUDE.md`
- `claude-skills/self-review/SKILL.md`
- `apps/server/prisma/schema.prisma`
- `apps/server/src/modules/message/*`
- `apps/server/src/modules/admin/*`
- `apps/server/src/modules/staff/*`
- `apps/server/src/modules/account/*`
- `apps/admin/src/App.tsx`
- `apps/admin/src/layouts/components/SideMenu.tsx`
- `apps/admin/src/services/request.ts`
- `apps/admin/src/pages/staff/services/staff.ts`
- `apps/miniapp/utils/constants.js`
- `apps/miniapp/pages/home/index.*`
- `apps/miniapp/pages/message/index.*`
- `apps/miniapp/pages/message/detail.*`

## Product Requirements

### Support model

Implement a simple station-message based support workflow:

- Staff can send a support message from miniapp message center.
- Admin can view support messages in a backend `客服消息` module.
- Admin can reply to a staff support message.
- Admin reply appears in the staff miniapp message center.
- Staff can mark messages read as already implemented.

This is not real-time chat. It is acceptable as a ticket-style MVP:

- staff sends message -> admin sees it -> admin replies as a new station message.

### Reuse or extend existing Message model

Existing schema has `Message`:

- `staffAccountId`
- `title`
- `content`
- `messageType`
- `isRead`
- `readAt`
- `createdAt`

Prefer reusing this model if possible:

- staff-originated support message: `messageType = support_request`
- admin reply: `messageType = support_reply`

If you need extra fields such as `source`, `replyToMessageId`, or `handledAt`, add them only if truly necessary and create a migration. Keep schema changes minimal.

### Miniapp requirements

In message center:

- Add a clear `联系客服` / `发送咨询` entry.
- Provide a simple form page or modal:
  - title/subject
  - content
  - submit button
- Submit creates a support request via app API.
- Submitted support request appears in message center list.
- Admin replies appear in message center list.
- Existing message detail/read flow must still work.

Do not remove the home page WeChat native `open-type="contact"` button. It can coexist with station-message support.

### Backend app API

Add app API endpoint(s), for example:

- `POST /api/app/messages/support`

Payload:

- `title`
- `content`

Validation:

- title required, max reasonable length
- content required, max reasonable length

Creates a `Message` row for the current staff account with `messageType = support_request`.

### Backend admin API

Add admin support endpoints under `/api/admin/support` or `/api/admin/messages`:

- list support messages
- detail support message
- reply to support message

Minimum list filters:

- staff name or phone keyword if easy using existing relations
- message type support request/reply
- read/handled status only if supported by model

Reply behavior:

- Create new `Message` for the same staff account:
  - `title`: `客服回复：{original title}` or similar
  - `content`: admin reply text
  - `messageType = support_reply`
  - `isRead = false`
- Write an `OperationLog` entry.

### Admin frontend

Add module:

- Menu item: `客服消息`
- Route: `/support` or `/messages`
- Page shows support request list:
  - time
  - staff id/name/phone
  - title
  - content preview
  - message type
  - read status if meaningful
  - action: `回复`
- Reply modal:
  - original staff message visible
  - reply textarea required
  - submit sends admin reply
  - list refreshes after reply

Keep it practical and simple; do not build full chat UI unless it is quick and low-risk.

### Manual-test fixes

While implementing, fix small obvious blockers discovered by reading/running verification. Examples:

- frontend route/menu mismatch
- API response shape mismatch
- message list empty due wrong field name
- customer-service duplicate entry
- broken message detail/read path
- TypeScript errors
- miniapp JS/JSON syntax errors

Do not make speculative product changes. Document larger issues in the report.

## Final Verifier Requirements

Create:

- `verify-stage8-support.ps1`
- `verify-stage8-support.cmd`

The PS1 must:

- Run `.\verify-stage7-regression.ps1` first.
- Validate Prisma schema using local Prisma CLI, not `npx prisma`.
- Build server.
- Run admin TypeScript check.
- Validate miniapp JSON files.
- Check miniapp JavaScript syntax with `node --check`.
- Assert Stage 8 markers:
  - app support submit endpoint exists
  - admin support list endpoint exists
  - admin support reply endpoint exists
  - `support_request`
  - `support_reply`
  - admin menu label `客服消息`
  - admin route/page for support module
  - miniapp message center has `联系客服` or `发送咨询`
  - reply creates staff station message
  - operation log for admin reply

Ensure the PS1 is saved as UTF-8 with BOM so Windows PowerShell 5.1 handles Chinese labels correctly.

## Strictly Forbidden

- Do not read or print `.env`.
- Do not use `npx prisma`.
- Do not modify Word requirement documents.
- Do not delete files unless the user explicitly approves it.
- Do not move files unless the user explicitly approves it.
- Do not run `git reset`, `git checkout`, or rewrite Git history.
- Do not commit code.
- Do not implement full real-time chat, WebSocket, WeChat customer-service API, customer ordering, dispatch, payment, wallet, commission/distribution, dispute voting, or automatic punishment.

## Self-review report

Write:

`claude-reports/20260528-stage8-support-self-review.md`

Use status:

- `PASSED`
- `FAILED_AFTER_TWO_REPAIRS`
- `UNVERIFIED_ENV_BLOCKED`
- `PARTIAL_NEEDS_CODEX_REVIEW`

The report must include:

1. What support workflow was implemented.
2. Backend endpoints added.
3. Admin frontend module added.
4. Miniapp changes added.
5. Manual-test bugs fixed.
6. Final verifier result.
7. Manual checks still needed.

## Final Response

Report:

1. What changed.
2. Which file groups changed.
3. Whether migration was added.
4. Final verifier result.
5. Self-review report path.
6. Manual admin/miniapp checks still needed.
