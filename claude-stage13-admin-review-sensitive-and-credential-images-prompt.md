# Claude Code Task: Stage 13 Admin Review Sensitive Data And Credential Image Workflow

You are working in:

`/Users/a1234/Desktop/Staff-entry-mini-program`

## Required First Step

Before coding, read and follow:

- `AGENTS.md`
- `claude-skills/self-review/SKILL.md`
- `claude-skills/self-review/references/report-template.md`

Use the enhanced self-review protocol:

- Run `git status --short` before editing.
- Record pre-existing dirty/untracked files in the report.
- Run a baseline verifier before editing when one exists.
- Make focused changes only.
- Run final verification after editing.
- If verification fails, make at most two focused repair attempts and rerun the same verifier after each attempt.
- Always write one structured report under `claude-reports/`.
- Do not commit code.

## Important Project Rules

- Do not read or print `.env`.
- Do not run `npx prisma`.
- Do not run `git reset`, `git checkout`, delete files, or rewrite git history.
- Do not edit Word documents.
- Do not implement out-of-scope ordering, dispatch, payment, wallet, dispute voting, or future appointment-system workflows.
- Keep changes scoped to admin review and credential review behavior.

## Task Summary

Fix admin review usability and credential review correctness:

1. Admin review page must show complete sensitive identity data only to authorized admins:
   - Highest/super admin sees full data.
   - Ordinary admins can see full data only when explicitly authorized by the highest admin through permission configuration.
   - Full data needed on the review page: real name, phone number, resident ID number.
   - Viewing full sensitive data must write an operation log.
2. Fix duplicate credential titles like `体检报告 - 体检报告`; show only one label.
3. Fix missing images for `体检报告` and `征信报告` in admin credential review even when miniapp uploaded images.
4. When opening admin credential review, show all credential images directly in the page at review-friendly size, while keeping click-to-enlarge preview in the current page (modal/lightbox, not a new browser tab/page).
5. Re-audit business logic bugs:
   - Per-credential review buttons currently appear to succeed, but after leaving/re-entering review page the status may revert to `未审核`.
   - One-click overall intake approval may incorrectly report all required credential fields have no uploaded images even though images were uploaded and individual credential review worked.
   - Do not paper over these bugs in frontend only. Trace backend data returned by `/api/admin/staff/:staffId/credentials`, credential current-version logic, credential file associations, credential review persistence, and intake approval validation.

## Confirmed Product Requirements

### Sensitive Data Rules

Highest admin:

- `isSuper === true` can see full real name, phone, and ID number.

Ordinary admin:

- Can see full real name, phone, and ID number only when granted a sensitive-data permission by the highest admin.
- Prefer an explicit permission code such as `staff.sensitive.view` or use the existing local naming pattern if one already exists.
- Add this permission to the backend permission seed/definition if the project has one.
- Surface it in the admin role permission tree so highest admin can grant it.

Security:

- Do not expose full sensitive data to admins without `isSuper` or the sensitive permission.
- When returning full sensitive fields from admin review/detail endpoint, write an operation log such as:
  - targetType: `staff_sensitive_data`
  - targetId: staffId
  - action: `staff_sensitive_view`
  - detail: include that admin viewed review sensitive data, not the raw sensitive values.

Implementation hint:

- Inspect existing admin auth/current admin decorators and permission guard:
  - `apps/server/src/modules/admin/decorators/current-admin.decorator.ts`
  - `apps/server/src/modules/admin/guards/permissions.guard.ts`
  - `apps/server/src/modules/admin/admin-auth.service.ts`
  - `apps/server/src/modules/admin/admin-role.service.ts`
- Admin JWT already carries `isSuper`; permissions are available in request user or can be loaded.
- `StaffService` already decrypts app-side data. Reuse the same crypto helpers and `ConfigService` pattern for admin-side full values.

### Credential Title Duplicate

Current UI can show:

`体检报告 - 体检报告`

Required:

- If `credentialName` equals the credential type label, display only the type label.
- Still show a distinct custom credential name when it is actually different.
- Apply to credential review list and credential info list if both use the same component.

### Credential Images Direct Display

When opening the admin review tab:

- All images for each credential should display inline automatically.
- Images should not be tiny.
- Suggested default size:
  - width around `240px` to `320px`
  - max height around `360px`
  - object-fit contain
  - clear labels such as 人像面、国徽面、证件图片
- Keep click-to-enlarge preview.
- Preview should happen in the current page via Ant Design `Image.PreviewGroup`, `Image`, `Modal`, or equivalent.
- Do not open a new browser tab/window for credential image preview.

Images to direct-display:

- 居民身份证人像面
- 居民身份证国徽面
- 健康证
- 无犯罪记录证明
- 征信报告
- 体检报告
- Optional credential images and skill certificate images may also use the same display component if already in this area.

### Missing Image And Review State Bugs

The user observed:

- Miniapp uploaded all strong-admission images.
- In admin, individually approving corresponding credential fields appears to work.
- But after returning to parent/list page and re-entering review page, those fields may show as `未审核` again.
- One-click intake approval reports all fields have no images.

You must investigate and fix root cause:

- Check whether admin credential list returns old non-current credential versions mixed with current versions.
- Check whether frontend review list displays/reviews a non-current stale credential.
- Check whether `reviewCredential` persists status on the row that the review list later returns.
- Check whether `approveIntake` validates current credentials only, and whether current rows have files attached.
- Check whether `create/update` credential versioning copies file links correctly.
- Check whether files for `credit_report` and `medical_report` are returned from admin credentials endpoint.
- Check whether `fileType/fileSide` mapping hides `credential_image` files.

Likely desired behavior:

- The admin review list should show only current credentials for the current review workflow unless there is an explicit history section.
- Reviewing a credential should update the same current credential row that is returned after refresh.
- Overall intake approval should check the current credential row and its file links.
- If a required credential exists but has no file links, the error should name that specific credential; if it has files, approval must not say it has no image.

## Files To Inspect First

Server:

- `apps/server/src/modules/admin/admin-staff.controller.ts`
- `apps/server/src/modules/admin/admin-staff.service.ts`
- `apps/server/src/modules/admin/admin-file.controller.ts`
- `apps/server/src/modules/admin/admin-auth.service.ts`
- `apps/server/src/modules/admin/admin-role.service.ts`
- `apps/server/prisma/schema.prisma`
- Any seed scripts that define admin permissions/roles.
- `apps/server/src/modules/credential/credential.service.ts`
- `apps/server/src/modules/intake/intake.service.ts`

Admin frontend:

- `apps/admin/src/pages/staff/detail.tsx`
- `apps/admin/src/pages/staff/components/StaffProfileCard.tsx`
- `apps/admin/src/pages/staff/components/CredentialReviewList.tsx`
- `apps/admin/src/pages/staff/components/StaffCredentialList.tsx`
- `apps/admin/src/pages/staff/services/staff.ts`
- Role/permission UI files under `apps/admin/src/pages/role/`

## Verification Requirements

Create/update a verifier:

- `verify-stage13-admin-review-sensitive-and-images.sh`
- `verify-stage13-admin-review-sensitive-and-images.ps1`
- `verify-stage13-admin-review-sensitive-and-images.cmd`

The verifier must at minimum check:

1. Server build passes.
2. Admin build/type-check passes.
3. Prisma schema validates.
4. Admin sensitive data permission exists or equivalent logic is present.
5. Admin detail/review endpoint has authorization logic for full sensitive data (`isSuper` or sensitive permission).
6. Operation log is written when full sensitive data is returned.
7. `StaffProfileCard` no longer always masks phone/ID when authorized full values are returned.
8. Credential title display prevents duplicate `typeLabel - sameName`.
9. Credential images render inline in `CredentialReviewList` and use in-page preview, not `window.open`.
10. Admin credentials endpoint/review list is fixed to avoid stale non-current review rows.
11. `credit_report` and `medical_report` file/image data are included and rendered like the other strong-admission credentials.
12. Overall intake approval image validation checks files on current credential rows and does not incorrectly report uploaded-image credentials as missing.

Also run existing relevant verifier(s) if present:

- `./verify-stage12-login-autosave-required-images.sh`

## Manual Test Checklist For Report

Admin:

- Login as highest admin; open a pending staff review; full name, phone, and ID number are visible.
- Login as ordinary admin without sensitive permission; full phone/ID are not visible.
- Grant sensitive permission to ordinary admin; full data becomes visible.
- Confirm operation log records sensitive data access.
- Open review tab; all credential images display inline.
- Click an inline image; it enlarges in the current page.
- Verify title shows `体检报告`, not `体检报告 - 体检报告`.
- Individually approve a credential, leave page, re-enter, and confirm it stays approved.
- Overall approve intake after all required credentials are uploaded/approved; it should pass and must not falsely report missing images.
- Reject unclear image with reason still works.

Miniapp:

- No direct miniapp changes expected unless required to fix file metadata, but confirm uploaded credit/medical images appear in admin.

Server/API:

- Admin `/staff/:staffId/credentials` returns current credentials with file arrays for `credit_report` and `medical_report`.
- Admin credential review endpoint persists status on the row returned by the credentials endpoint.
- Admin intake approval validates file presence by current credential file links.

## Final Response Required

In your final response, include:

- Verifier result.
- Self-review report path.
- Changed file groups.
- Manual test gaps.
- Any database migration/seed changes and exact commands needed.

