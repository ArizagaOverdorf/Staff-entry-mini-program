# Claude Code Task: Stage 4.2 Education And Student Card Upload

You are working in:

`D:\CodexProjects\housekeeping-system\Staff entry mini-program`

## Required first step

Before coding, read and follow:

- `claude-skills/self-review/SKILL.md`
- `claude-skills/self-review/references/report-template.md`

Use the enhanced protocol: make at most two focused repair attempts, then always write a structured report under `claude-reports/`, whether verification passes or fails.

## Context

Stages 0 through 4.1 are complete and committed.

Current user feedback:

- Admin review tab refresh is fixed.
- Multi skill certificate support is implemented.
- But the miniapp/admin experience still needs a clear `学历/学生证` upload path because some work values education background, and part-time students may upload a student card.

This stage is focused on education/student-card credential upload and review visibility. Do not implement job matching, ordering, dispatch, payment, distribution, or "大家评评理".

## Read first

- `CLAUDE.md`
- `claude-skills/self-review/SKILL.md`
- `apps/miniapp/pages/credential/index.js`
- `apps/miniapp/pages/credential/index.wxml`
- `apps/miniapp/pages/credential/index.wxss`
- `apps/miniapp/pages/credential/edit/index.js`
- `apps/miniapp/pages/credential/edit/index.wxml`
- `apps/miniapp/utils/constants.js`
- `apps/admin/src/pages/staff/components/CredentialReviewList.tsx`
- `apps/admin/src/pages/staff/services/staff.ts`
- `apps/server/src/modules/credential/credential.constants.ts`
- `apps/server/src/modules/credential/credential.service.ts`
- `apps/server/src/modules/admin/admin-staff.service.ts`
- `apps/server/prisma/seed-demo-staff.js`
- `apps/server/prisma/verify-stage4-2-demo.js`
- `verify-stage4-2.ps1`

## Requirements

### 1. Miniapp education/student-card upload entry

Make the credential page clearly support uploading education-related materials.

Required UX:

- Show a visible education section or quick action named `学历/学生证`.
- The user can upload:
  - `education`: 学历/毕业证
  - `student_card`: 学生证
- The user can fill:
  - credential name, for example `大专毕业证`, `本科毕业证`, `学生证`
  - school/issuing authority
  - credential number if available
  - expiry date if applicable, especially for student card
  - remark
  - file/image upload
- Existing generic credential upload must still work.

Implementation can reuse the existing credential edit page. Do not create a separate database module unless necessary.

### 2. Backend labels and response shape

Ensure both credential types are supported everywhere:

- `education`: `学历/毕业证`
- `student_card`: `学生证`

These are optional credentials in the MVP. Do not add them to `MANDATORY_CREDENTIAL_TYPES`.

The backend response should preserve:

- credential type label
- credential name
- issuing authority
- credential number
- expiry date
- files
- review status

### 3. Admin review visibility

Admin credential review should make education materials easy to identify:

- Display `学历/毕业证` and `学生证` labels.
- Add a tag such as `学历材料` for `education` and `student_card`.
- Keep approve/reject actions unchanged.
- Do not redesign the admin page.

### 4. Submit preview visibility

Miniapp submit preview should not require education/student card for everyone.

But if the user has uploaded education/student-card materials, the preview should show a small optional summary such as:

- 学历/学生证：已上传 N 项

Do not block submission if no education/student card exists.

### 5. Demo seed data

Update demo seed:

- `DEMO1001` should have at least one education-related credential with file attachment.
- `DEMO1003` should have at least one education-related credential with file attachment.
- `DEMO1002` may remain incomplete/negative.

Update `apps/server/prisma/verify-stage4-2-demo.js` if needed to verify this.

## Strictly forbidden

Do not implement:

- customer ordering
- dispatch
- payment
- deposit
- wallet
- commission/distribution
- map-based order flow
- "大家评评理"
- job matching or automatic service eligibility rules

Do not:

- Read or print `.env`.
- Use `npx prisma`.
- Modify Word requirement documents.
- Delete/move unrelated files.
- Run `git reset`, `git checkout`, or rewrite Git history.
- Commit code.

## Verification

Run:

```powershell
.\verify-stage4-2.cmd
```

Follow `claude-skills/self-review/SKILL.md`: if verification fails, make at most two focused repair attempts, rerun after each attempt, and always write a structured report under `claude-reports/`.

Report:

1. Whether education/student-card upload is visible in miniapp.
2. Whether admin review displays these materials clearly.
3. Whether they remain optional.
4. Demo seed verification result.
5. Self-review report path and final verification status.
