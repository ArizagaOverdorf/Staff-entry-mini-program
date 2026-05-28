# Claude Code Task: Stage 8.2 Support Chat Experience

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

- Run routine reads, builds, type checks, syntax checks, verifier scripts, and local Prisma CLI commands without asking the user.
- Accept normal code edits.
- Do not ask for confirmation for local validation commands.

Strict approval rule:

- If you need to delete files, move files, overwrite unrelated files, reset git, checkout files, rewrite history, read or print `.env`, or touch files outside this project, STOP and ask the user first.
- Do not run deletion/cleanup commands automatically.
- Do not use `npx prisma`.

## Task

Improve the Stage 8.1 support conversation into a more practical WeChat-like customer-service experience.

Current problems found in manual testing:

1. Admin and miniapp both require manual refresh to see new messages.
2. Miniapp message center shows every support chat message as a separate row. It should show one support conversation summary row per active/recent support session, with unread badge.
3. Chat page can horizontally move/scroll, font sizes are too small, input bar is too short, and the send button is too wide.
4. Chat input should behave more like WeChat: fixed bottom input bar, text wraps, input grows with content, max 500 characters, small send button, voice/photo/video actions.

Do not implement WebSocket, WeCom integration, official WeChat customer-service API, customer ordering, dispatch, payment, wallet, commission/distribution, dispute voting, or automatic punishment.

## Baseline And Final Verification

Baseline verifier:

```powershell
.\verify-stage8-1-support-conversations.cmd
```

Final verifier:

```powershell
.\verify-stage8-2-support-chat-experience.cmd
```

If the final verifier does not exist yet, create it as part of this task. It must run Stage 8.1 first and then assert Stage 8.2 markers.

## Read First

- `CLAUDE.md`
- `claude-skills/self-review/SKILL.md`
- `apps/server/prisma/schema.prisma`
- `apps/server/src/modules/message/*`
- `apps/server/src/modules/admin/admin-support.*`
- `apps/server/src/modules/file/*`
- `apps/admin/src/pages/support/*`
- `apps/miniapp/utils/constants.js`
- `apps/miniapp/utils/request.js`
- `apps/miniapp/utils/upload.js`
- `apps/miniapp/pages/message/index.*`
- `apps/miniapp/pages/message/support.*`
- `apps/miniapp/app.json`
- `verify-stage8-1-support-conversations.ps1`

## Requirements

### 1. Auto refresh / polling

Implement polling, not WebSocket.

Admin:

- Conversation inbox auto refreshes while the support page is open.
- Active chat conversation auto refreshes while it is open.
- Use a conservative interval such as 5 seconds.
- Opening a conversation still marks admin-side unread staff messages as read.
- Avoid stealing focus from reply textarea.
- Clear timers on component unmount.

Miniapp:

- Support conversation page auto refreshes while visible.
- Use a conservative interval such as 5 seconds.
- Stop polling in `onHide` and `onUnload`.
- When new messages arrive, update the list and keep scroll behavior sensible:
  - If user is near bottom or just sent a message, scroll to bottom.
  - Do not create horizontal scroll.

### 2. Message center support conversation aggregation

Miniapp message center must not list every support chat message as a separate row.

Expected behavior:

- Message center can still show system/announcement/station messages as rows.
- Support chat should appear as one aggregated conversation row, not many raw chat rows.
- The support row should show:
  - title such as `客服会话`
  - latest support message preview
  - latest support message time
  - unread badge/red dot with count for unread admin replies
  - status text:
    - active conversation: `会话进行中`
    - ended conversation: `会话已结束`
- Clicking the support row navigates to `/pages/message/support`.
- Clicking the home `联系客服` entry also navigates to `/pages/message/support`.

Session rule:

- A support session is active if the latest support message is within 30 minutes.
- If no message in the conversation for 30 minutes, the current session is considered ended.
- If user opens support after session ended and sends a new message, it starts a new session.
- For MVP, it is acceptable to compute this from latest support message time without creating a separate conversation table, but document the limitation in the self-review report.

Backend support:

- Add app-side endpoint(s) if useful, for example:
  - `GET /api/app/messages/support/summary`
  - Return latest message, unread count, active/ended status based on 30-minute inactivity.
- Update app-side message list if needed to exclude raw support messages from general message list, or do filtering in miniapp. Prefer backend filtering if cleaner.

### 3. Chat UI layout and typography

Miniapp support chat page:

- Must be fixed width, no horizontal scrolling or side movement.
- Use `box-sizing: border-box`, `width: 100%`, `max-width: 100%`, `overflow-x: hidden`.
- Increase readable font sizes:
  - sender name at least 13px
  - message text at least 15px
  - input text at least 15px
- Sender name should be readable, not tiny.
- Chat page should be vertically stable with bottom input bar fixed.

Input bar should be closer to WeChat:

- Bottom fixed toolbar.
- Left voice icon button.
- Flexible textarea input, not short single-line input.
- Text wraps.
- Textarea grows with content up to a reasonable max height.
- Show all typed text up to max height.
- Max text length: 500 characters.
- Small send button, not too wide.
- Include photo/video action button(s), for example plus button opens an action sheet:
  - choose image, max 3MB
  - choose video, max 10MB
- Use existing upload utility and file endpoint if possible.
- If media upload is not fully wired into backend message content yet, implement enough for local test:
  - choose file
  - validate file size
  - upload file through existing upload utility
  - send a support message containing a structured textual placeholder or file URL/reference
  - display image/video preview in chat where possible
  - document limitations.

Do not implement voice recording in this stage unless simple and safe. The voice icon may be a visible placeholder with a toast such as `语音输入暂未开放`, but the UI layout should reserve it.

### 4. Backend message content and media

Keep the database changes minimal.

Acceptable MVP options:

- Option A: store media message as JSON string in `content`, with `messageType='support_request'`, `senderType='staff'`, and a simple `title`, then parse/display in UI.
- Option B: add `contentType` / `fileIds` fields if it is clearly cleaner and migration is safe.

Whichever option is chosen:

- Keep text messages limited to 500 characters for support chat.
- Keep previous validation for old one-time support endpoint if still retained.
- Media file validation must enforce:
  - image <= 3MB
  - video <= 10MB

### 5. Admin chat page

Admin support page should also refresh automatically.

- Inbox list auto refreshes every 5 seconds.
- Active conversation auto refreshes every 5 seconds.
- New staff message should appear without clicking manual refresh.
- Unread badge should update.
- Export still works.
- Chat display should handle media placeholders or previews if media support is implemented.
- Reply text max 500 characters in the chat input.

### 6. Verification script

Create:

- `verify-stage8-2-support-chat-experience.ps1`
- `verify-stage8-2-support-chat-experience.cmd`

The PS1 must:

- Run `.\verify-stage8-1-support-conversations.ps1` first.
- Validate Prisma schema.
- Build server.
- Run admin TypeScript check.
- Validate miniapp JSON and JS syntax.
- Assert Stage 8.2 markers:
  - admin polling interval exists and is cleared
  - miniapp polling interval exists and is cleared in `onHide`/`onUnload`
  - message center support summary/aggregation marker exists
  - support raw messages are excluded from normal message center rows or aggregated into one row
  - `30 * 60 * 1000` or clear 30-minute session marker exists
  - `会话进行中`
  - `会话已结束`
  - `overflow-x: hidden`
  - `textarea` chat input
  - max text length 500
  - image size limit 3MB
  - video size limit 10MB
  - upload action marker
  - voice placeholder marker or implemented voice action
- Ensure the PS1 is saved as UTF-8 with BOM.

## Self-Review Report

Write:

`claude-reports/20260528-stage8-2-support-chat-experience-self-review.md`

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
- Do not implement WebSocket or external customer-service integrations.
- Do not implement customer ordering, dispatch, payment, wallet, commission/distribution, dispute voting, or automatic punishment.

## Final Response

Report:

1. What changed.
2. Whether schema/migration changed.
3. Which file groups changed.
4. Final verifier result.
5. Self-review report path.
6. Manual admin/miniapp checks still needed.
