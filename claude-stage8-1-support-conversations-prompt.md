# Claude Code Task: Stage 8.1 Support Conversation Workflow

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

- Run routine reads, builds, type checks, syntax checks, migrations, and verifier scripts without asking the user.
- Accept normal code edits.
- Do not ask for confirmation for local read-only checks, local builds, local type checks, local verifier scripts, or Prisma migration commands using the local project Prisma CLI.

Strict approval rule:

- If you need to delete files, move files, overwrite unrelated files, reset git, checkout files, rewrite history, read or print `.env`, or touch files outside this project, STOP and ask the user first.
- Do not run deletion/cleanup commands automatically.
- Do not use `npx prisma`.

## Task

Refactor Stage 8 support from a flat message list into a practical customer-service conversation workflow.

The current admin page is a message-row list. This is not acceptable for real support operations. Implement:

- One service staff account = one support conversation.
- Admin support page shows a conversation inbox, not raw message rows.
- Conversation list is sorted by latest message time descending.
- Each conversation row shows staff name, staff ID, masked phone, latest message preview, latest message time, and unread count.
- Unread count is a red circular badge with the actual unread number. It disappears after the admin opens the conversation.
- Opening a conversation shows WeChat-like chat history.
- Chat history shows sender identity:
  - service staff display name from profile or staff ID.
  - admin reply display name from admin realName or username.
- Admin can reply in the chat view.
- Chat records can be exported from the conversation view.
- Miniapp staff side should have a usable support conversation page: staff sends messages, sees admin replies in chronological chat order, and can continue the conversation.

Do not implement real-time WebSocket, WeCom integration, WeChat customer-service API, customer ordering, dispatch, payment, wallet, commission/distribution, dispute voting, or automatic punishment.

## Important Business Rules

1. Message list behavior:
   - The admin support page default view is a conversation inbox.
   - It is not a flat list of every message.
   - Latest conversation appears first.
   - Search should still support staff name, staff ID, or phone.

2. Unread behavior:
   - Unread count on admin side means unread service-staff messages in that conversation.
   - When admin opens a conversation, admin-side unread count for that conversation becomes 0.
   - Staff-side unread still means unread admin/system messages.
   - Do not reuse a single ambiguous `isRead` flag for both sides if it creates incorrect behavior. If needed, add explicit fields to the Message model, such as `senderType`, `adminUserId`, `adminReadAt`, `staffReadAt`, or equivalent. Keep the design simple and document it.

3. Sender identity:
   - Staff messages must display the staff name if available, otherwise staff ID.
   - Admin messages must display the admin real name if available, otherwise username.
   - System messages should display as system/platform messages.

4. Export:
   - Add an admin export action in the conversation view.
   - CSV export is enough for MVP.
   - Export fields should include time, sender role, sender name, staff ID, message title if any, and content.
   - Avoid leaking private raw identifiers unless already shown in the admin UI.

5. Miniapp:
   - `联系客服` should open a support conversation page, not just a one-time form.
   - The page should show chat bubbles in chronological order and an input area.
   - Staff can send a message from that page.
   - Admin replies should appear in the same conversation.
   - Keep the native WeChat contact button on the home page unchanged.

## Baseline And Final Verification

Baseline verifier:

```powershell
.\verify-stage8-support.cmd
```

Final verifier:

```powershell
.\verify-stage8-1-support-conversations.cmd
```

If the final verifier does not exist yet, create it as part of this task. It must run Stage 8 first and then assert Stage 8.1 markers.

## Read First

- `CLAUDE.md`
- `claude-skills/self-review/SKILL.md`
- `apps/server/prisma/schema.prisma`
- `apps/server/src/modules/message/*`
- `apps/server/src/modules/admin/admin-support.*`
- `apps/server/src/modules/admin/admin-user.*`
- `apps/server/src/modules/admin/admin.module.ts`
- `apps/admin/src/pages/support/*`
- `apps/admin/src/services/request.ts`
- `apps/admin/src/layouts/components/SideMenu.tsx`
- `apps/miniapp/utils/constants.js`
- `apps/miniapp/pages/message/index.*`
- `apps/miniapp/pages/message/detail.*`
- `apps/miniapp/pages/message/support.*`
- `verify-stage8-support.ps1`

## Suggested Implementation Shape

You may adjust if the existing code suggests a cleaner approach, but keep the user-facing behavior the same.

### Backend

Add or update APIs under existing modules:

- `GET /api/admin/support/conversations`
  - Returns paginated conversation rows grouped by `staffAccountId`.
  - Sorted by latest message time desc.
  - Includes `unreadCount`, `latestMessage`, `latestMessageAt`, staff name, staff ID, masked phone.

- `GET /api/admin/support/conversations/:staffAccountId`
  - Returns chronological messages for one staff account.
  - Marks admin-side unread staff messages as read.
  - Includes sender role/name for each message.

- `POST /api/admin/support/conversations/:staffAccountId/reply`
  - Sends admin reply into that staff conversation.
  - Records sender identity.
  - Creates operation log.

- `GET /api/admin/support/conversations/:staffAccountId/export`
  - Returns exportable chat history data or a CSV string.
  - If the admin request service wrapper cannot download files yet, the frontend may generate CSV from returned JSON.

- `GET /api/app/messages/support/conversation`
  - Staff gets chronological support conversation messages.
  - Marks staff-side unread admin replies as read.

- `POST /api/app/messages/support`
  - Staff sends a support message into the same conversation.

If changing Prisma schema:

- Use local Prisma CLI from `apps/server/node_modules/.bin/prisma.CMD`.
- Create a migration with a clear name like `stage8_1_support_conversation_read_state`.
- Run migrate deploy or dev according to existing project pattern.
- Do not use `npx prisma`.

### Admin Frontend

Replace the flat support table with an inbox-style layout:

- Left or top conversation list:
  - staff name
  - masked phone/staff ID
  - latest preview
  - latest time
  - red unread badge with number
- Right or modal/drawer chat panel:
  - chronological message bubbles
  - sender names
  - timestamps
  - reply text area
  - send button
  - export button
- Opening a conversation refreshes unread count to 0 for that conversation.
- Keep filters/search simple.

### Miniapp

Update `pages/message/support` into a conversation page:

- Show chat bubbles in chronological order.
- Show staff-sent messages and admin replies differently.
- Input at bottom.
- Submit sends a support message.
- On load/show, fetch conversation and mark staff-side unread replies read.
- Keep message center entry leading to this support page.

### Verification Script

Create:

- `verify-stage8-1-support-conversations.ps1`
- `verify-stage8-1-support-conversations.cmd`

The PS1 must:

- Run `.\verify-stage8-support.ps1` first.
- Validate Prisma schema.
- Build server.
- Run admin TypeScript check.
- Validate miniapp JSON and JS syntax.
- Assert Stage 8.1 markers:
  - `conversations`
  - `unreadCount`
  - `latestMessageAt`
  - `senderType`
  - `adminReadAt` or equivalent explicit admin-side read state
  - `staffReadAt` or equivalent explicit staff-side read state
  - `导出聊天记录`
  - `红色` badge or AntD `Badge`
  - chronological chat order marker
  - miniapp support conversation fetch endpoint
  - admin reply endpoint by `staffAccountId`
- Ensure PS1 is UTF-8 with BOM for Windows PowerShell 5.1.

## Self-Review Report

Write:

`claude-reports/20260528-stage8-1-support-conversations-self-review.md`

Use status:

- `PASSED` if final verifier passes.
- `FAILED_AFTER_TWO_REPAIRS` if two repairs still fail.
- `UNVERIFIED_ENV_BLOCKED` only if environment prevents verification.
- `PARTIAL_NEEDS_CODEX_REVIEW` only if feature is incomplete but useful changes were made.

## Strictly Forbidden

- Do not read or print `.env`.
- Do not use `npx prisma`.
- Do not modify Word requirement documents.
- Do not delete or move unrelated files.
- Do not run `git reset`, `git checkout`, or rewrite Git history.
- Do not commit code.
- Do not implement customer ordering, dispatch, payment, wallet, commission/distribution, dispute voting, automatic punishment, WebSocket, or external customer-service integrations.

## Final Response

Report:

1. What changed.
2. Whether schema/migration changed.
3. Which file groups changed.
4. Final verifier result.
5. Self-review report path.
6. Manual admin/miniapp checks still needed.
