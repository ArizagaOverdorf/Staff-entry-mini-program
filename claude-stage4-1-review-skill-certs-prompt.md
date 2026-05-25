# Claude Code Task: Stage 4.1 Review UX And Multi Skill Certificates

You are working in:

`D:\CodexProjects\housekeeping-system\Staff entry mini-program`

## Context

Stages 0 through 4 are complete and committed.

Stage 4.1 fixes issues discovered during local admin review testing:

1. Admin review actions refresh the staff detail page and jump back to the basic info tab. This is poor UX.
2. Skill certificates are currently treated like a single credential type. Creating a second `skill_cert` can supersede the first one, which is wrong for real staff who have multiple skills and multiple certificates.
3. Optional credential types need to include student cards for part-time students.
4. Skill certificate entries must support user-filled certificate name, skill level, linked skills, and uploaded certificate images.

This is still the independent staff onboarding mini program. Do not implement ordering, dispatch, payment, distribution, or "大家评评理".

## Read first

Inspect these files before editing:

- `CLAUDE.md`
- `apps/admin/src/pages/staff/detail.tsx`
- `apps/admin/src/pages/staff/components/ReviewActions.tsx`
- `apps/admin/src/pages/staff/components/CredentialReviewList.tsx`
- `apps/admin/src/pages/staff/services/staff.ts`
- `apps/miniapp/pages/credential/edit/index.js`
- `apps/miniapp/pages/credential/edit/index.wxml`
- `apps/miniapp/pages/credential/edit/index.wxss`
- `apps/miniapp/pages/credential/index.js`
- `apps/miniapp/pages/credential/index.wxml`
- `apps/miniapp/utils/constants.js`
- `apps/server/prisma/schema.prisma`
- `apps/server/prisma/seed-demo-staff.js`
- `apps/server/prisma/verify-demo-staff.js`
- `apps/server/src/modules/credential/credential.constants.ts`
- `apps/server/src/modules/credential/dto/upsert-credential.dto.ts`
- `apps/server/src/modules/credential/credential.service.ts`
- `apps/server/src/modules/intake/intake.service.ts`
- `apps/server/src/modules/admin/admin-staff.service.ts`
- `verify-stage4.ps1`
- `verify-stage4-1.ps1`
- `apps/server/prisma/verify-stage4-1-demo.js`

## Required fixes

### 1. Keep admin on the current tab after review

Current issue:

- On staff detail, approving or rejecting either an intake review or a credential review refreshes data.
- The page re-renders and returns to the basic info tab.

Required behavior:

- If the admin is on the review tab, review actions must refresh the data and stay on the review tab.
- If the admin is on the credentials tab, credential actions must refresh the data and stay on the credentials tab.
- Do not navigate away from the detail page after a successful review action.
- The page may show local loading, but do not replace the whole detail page with the initial full-screen spinner after the first load.

Implementation guidance:

- Make the `Tabs` in `apps/admin/src/pages/staff/detail.tsx` controlled with `activeKey`.
- Initialize from `?tab=review` or `?tab=credentials` if present.
- Keep active tab state during `fetchData`.
- Preserve the existing back button and routes.

### 2. Add student card as an optional credential type

Add:

- `student_card`: `学生证`

Keep:

- `education`: use label `学历/毕业证` or equivalent.
- `student_card` is optional. It is not a full-staff mandatory credential.

Update all relevant backend/admin/miniapp constants and labels.

Do not move admission rules into dictionary management in this stage.

Important note about the "字典" menu:

- Dictionary management is for basic configurable options such as service categories and service areas.
- Core admission rules, mandatory credential types, and skill-certificate requirements must remain explicit backend rules in this MVP.

### 3. Support multiple current skill certificates

Current bug:

- `CredentialService.create()` marks all current credentials of the same `credentialType` as not current.
- This works for one-per-person documents such as ID card.
- It is wrong for `skill_cert`: a staff member may have multiple current skill certificates, each proving a different skill.

Required behavior:

- Creating a new `skill_cert` must not supersede other current `skill_cert` records.
- Updating an existing `skill_cert` must version only that specific certificate, not every skill certificate for the staff member.
- Admin credential review must show and review each current skill certificate independently.
- Intake submit and admin overall approval must still check every selected skill requiring a certificate has at least one current approved `skill_cert` linked to that `StaffSkill.id`.

Recommended schema change:

- Add `credentialGroupId` to `StaffCredential`, mapped to `credential_group_id`, UUID.
- For a newly created credential, create a new credential group.
- For updating an existing credential, reuse the existing credential's group, or if missing, use the old credential id as the group for migration compatibility.
- Version numbers should be per credential group.
- For non-`skill_cert` credential creation, keep one current credential per credential type.
- For `skill_cert` credential creation, allow multiple current credentials of the same type.
- For any credential update, only mark credentials in the same credential group as not current.

Use a Prisma migration only if schema changes:

```powershell
.\apps\server\node_modules\.bin\prisma.CMD migrate dev --name stage4_1_multi_skill_credentials --schema apps\server\prisma\schema.prisma
```

Do not use `npx prisma`.

### 4. Add skill level to skill certificate entries

Skill certificate upload/edit should allow the user to provide:

- credential type: `skill_cert`
- certificate name: user-filled text
- skill level: user-filled text, for example 初级/中级/高级/母婴护理师/养老护理员
- linked service skills: one or more selected `StaffSkill.id`
- certificate image/file upload: existing `fileIds`
- credential number, expiry date, remark if applicable

Backend:

- Add `skillLevel?: string` to DTO and response.
- Persist it on `StaffCredential` if schema change is needed.
- Only show or use it for skill certificates, but storing it as nullable is acceptable.

Miniapp:

- In credential edit page, when `skill_cert` is selected, show:
  - linked skill selector
  - skill level input
  - certificate name input remains user editable
  - file upload remains required or strongly prompted as existing flow allows
- The user must be able to add multiple skill certificates by creating multiple `skill_cert` records.

Admin:

- Display skill level in credential review list.
- Display linked skills for every skill certificate.
- Keep current approve/reject actions.

### 5. Demo seed data

Update demo staff seed data:

- `DEMO1001` should have at least two current `skill_cert` credentials.
- The two skill certificates should link to different selected service skills.
- Each demo skill certificate should have:
  - a custom credential name
  - a skill level
  - at least one file attachment
  - linked skills
- `DEMO1002` should remain useful as a negative/incomplete example.
- `DEMO1003` should remain approved and valid.

Update `apps/server/prisma/verify-stage4-1-demo.js` if needed so it verifies these requirements.

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
- integration APIs for the later booking/distribution system

Do not:

- Read or print `.env` contents.
- Commit secrets.
- Use `npx prisma`.
- Delete or move unrelated files.
- Run `git reset`, `git checkout`, or rewrite Git history.
- Modify Word requirement documents.
- Redesign the whole admin or miniapp UI.

## Verification

When done, run:

```powershell
.\verify-stage4-1.cmd
```

If it fails, fix the cause and rerun.

Report:

1. Whether tab jumping after review is fixed.
2. How multiple current skill certificates are supported.
3. Migration name if any.
4. Files changed.
5. Demo seed verification result.
6. What remains deferred.

