# Claude Stage 14 — Admin Age, Skill Images, Role Management, Message Read State

You are working in the repository `Staff-entry-mini-program`.

## Hard Rules

- Do not read, print, summarize, or modify `.env`.
- Do not run `npx prisma`; if Prisma is needed, use the workspace `pnpm --filter @staff-entry/server exec prisma ...` pattern or the existing verifier.
- Do not run `git reset`, `git checkout --`, delete files, rewrite Git history, commit, or push.
- Keep the scope limited to the four requested fixes below.
- Follow `claude-skills/self-review/SKILL.md` and write a self-review report under `claude-reports/`.
- Preserve the stage-one staff onboarding MVP scope. Do not implement ordering, dispatch, payment, wallet, deposit, distribution, or dispute voting.

## Baseline

Before editing, run:

```bash
git status --short
./verify-stage13-admin-review-sensitive-and-images.sh
```

If the Stage 13 verifier cannot run on Windows, run the `.cmd` equivalent and record the exact result in the report.

## Requested Changes

### 1. Admin staff basic info: age must display

Problem:

- In 后台管理 -> 服务人员管理 -> 基本信息, the 年龄 field currently shows empty.
- Age must be derived from the resident ID card number/birthday, not manually typed.

Implementation requirements:

- Derive age in the admin staff detail response, using the same source of truth as the profile birthday logic:
  - Prefer `StaffProfile.birthday` when present.
  - If birthday is absent but a full ID number is available after decrypting `profile.idNumberEncrypted`, derive birthday using the existing server utility `parseIdCardBirthday` from `apps/server/src/utils/mask.util.ts`.
- Age must be a number when birthday can be determined, otherwise omit or return `undefined`/`null` so the frontend still shows `-`.
- The frontend `StaffProfileCard` should continue rendering `staff.age ?? '-'`.
- Do not expose additional sensitive information in the API.

### 2. Admin review page skill certificate images: inline display and current-page preview

Problem:

- In the admin staff detail 审核 page, the "技能证书条目" section currently shows certificate images as buttons.
- Clicking those buttons opens a new browser page via `window.open`.

Implementation requirements:

- Replace the skill certificate image buttons in `apps/admin/src/pages/staff/detail.tsx`.
- Show all skill certificate images inline in the "技能证书条目" section.
- Use Ant Design `Image` / `Image.PreviewGroup`, same pattern as `CredentialReviewList.tsx`.
- Fetch protected images through `/api/admin/files/:fileId/preview` with the admin bearer token.
- Clicking an inline image must enlarge it in the current page lightbox. Do not open a new tab/window.
- Reuse or extract the existing authenticated image-loading pattern if practical.
- Revoke blob URLs to avoid memory leaks.
- Remove `window.open` from the skill certificate image path.

### 3. Role menu and role creation

Requested behavior:

- In the admin sidebar menu, rename `角色权限` to `角色管理`.
- On the role management page, rename the page title from `角色权限管理` to `角色管理`.
- Add a "新增角色" function on the role management page.
- Role creation is authorized by the super administrator. Implement this as:
  - Only `isSuper === true` admin users can create roles.
  - Non-super admins must not see the create button in the frontend.
  - The backend must also reject non-super admins even if they call the API directly.

Implementation requirements:

- Add backend endpoint under existing admin roles API, for example `POST /api/admin/roles`.
- Add DTO validation for role creation:
  - `name` required, max 64 chars.
  - `code` required, max 64 chars, stable machine key, allow letters/numbers/underscore/hyphen only.
  - `description` optional, max 255 chars.
- Enforce unique role code and return a clear error if duplicate.
- Newly created roles should default to `isActive: true`.
- Write an operation log for successful role creation if there is an existing operation log pattern available in admin modules.
- Add frontend modal form on `apps/admin/src/pages/role/index.tsx`:
  - Button label: `新增角色`.
  - Fields: 角色名称, 角色编码, 描述.
  - Submit to the new service method.
  - Refresh list after success.
  - Only show the button when current admin is super admin.
- Keep existing "配置权限" flow unchanged. Super admin can create the role first, then configure permissions.

### 4. Miniapp message center: all-read must clear home unread badge

Problem:

- In the miniapp 消息中心, tapping 全部已读/全部标记已读 appears successful.
- After returning to the home page, the 消息中心 still shows unread提示.
- Clearing cache in account settings also does not remove the unread提示.

Likely root causes to verify and fix:

- Home page currently calls `constants.API.MESSAGES` with `{ unreadOnly: true, pageSize: 1 }`, but the server list endpoint may ignore `unreadOnly`, causing `res.total` to be total messages, not unread messages.
- Message center `markAllRead` may update local `totalUnread` using a stale support unread count.

Implementation requirements:

- Home page unread badge must call `constants.API.MESSAGE_UNREAD_COUNT` and read `unreadCount`/`count`, not total message count.
- Server unread-count must include all staff-visible unread messages from admin/system, including support replies.
- "全部标记已读" in message center must mark all staff-visible unread messages as read, including support replies.
- After mark-all-read succeeds, refresh unread count and support summary, and set local unread badge/count to 0 when appropriate.
- The support summary unread badge must also clear after all-read.
- Preserve existing behavior that opening the support conversation marks admin replies as read.
- Do not rely on clearing local cache to fix server unread state.

## Suggested Files To Inspect

- `apps/server/src/modules/admin/admin-staff.service.ts`
- `apps/admin/src/pages/staff/detail.tsx`
- `apps/admin/src/pages/staff/components/CredentialReviewList.tsx`
- `apps/admin/src/pages/staff/components/StaffProfileCard.tsx`
- `apps/admin/src/pages/staff/services/staff.ts`
- `apps/admin/src/layouts/components/SideMenu.tsx`
- `apps/admin/src/pages/role/index.tsx`
- `apps/admin/src/pages/role/services/role.ts`
- `apps/server/src/modules/admin/admin-role.controller.ts`
- `apps/server/src/modules/admin/admin-role.service.ts`
- `apps/server/src/modules/admin/decorators/current-admin.decorator.ts`
- `apps/miniapp/pages/home/index.js`
- `apps/miniapp/pages/message/index.js`
- `apps/server/src/modules/message/message.controller.ts`
- `apps/server/src/modules/message/message.service.ts`
- `apps/miniapp/utils/constants.js`

## Verification

Create and run a new verifier:

- `verify-stage14-admin-role-message-fixes.sh`
- `verify-stage14-admin-role-message-fixes.ps1`
- `verify-stage14-admin-role-message-fixes.cmd`

The verifier must check at least:

- Server build passes.
- Admin build passes.
- Miniapp JS syntax passes.
- Admin staff service imports/uses `parseIdCardBirthday` or otherwise derives age from ID-card/birthday.
- Admin detail response returns `age`.
- `apps/admin/src/pages/staff/detail.tsx` uses `Image.PreviewGroup` or `Image` for skill entry files.
- `apps/admin/src/pages/staff/detail.tsx` no longer uses `window.open`.
- Sidebar label and role page title use `角色管理`, not `角色权限管理`.
- Frontend role page has `新增角色` UI and hides it unless `isSuper`.
- Backend has a create-role route and a super-admin check for creation.
- Message home badge uses `MESSAGE_UNREAD_COUNT`, not `MESSAGES` with `unreadOnly`.
- Message center mark-all-read refreshes or clears regular/support unread counts.
- Server markAllRead includes support replies/admin/system messages and unreadCount remains compatible.

Also run:

```bash
git diff --check
```

## Report

Write a report:

```text
claude-reports/YYYYMMDD-HHMM-stage14-admin-role-message-fixes-self-review.md
```

Use the template at `claude-skills/self-review/references/report-template.md`.

Final response must include:

- Verifier result.
- Report path.
- Changed file groups.
- Manual test gaps.
- Whether database schema or migration changed.

