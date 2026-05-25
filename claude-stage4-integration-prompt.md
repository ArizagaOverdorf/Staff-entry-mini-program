# Claude Code Task: Stage 4 Local Integration And Admin Usability

You are working in:

`D:\CodexProjects\housekeeping-system\Staff entry mini-program`

## Context

Stages 0 through 3.5 are complete and committed.

The next goal is not to add a new business module. The goal is to make the existing onboarding MVP testable end to end in the local development environment:

- Admin can see demo staff after running the seed script.
- Admin staff list, staff detail, credential review, and overall review work against the backend API.
- Miniapp profile, credential upload, and intake submit pages align with the backend response shape.
- Dashboard and empty states are honest and useful for local testing.

This stage should fix mismatches and broken flows only. Keep the scope tight.

## Read first

Before editing, inspect:

- `CLAUDE.md`
- `README.md`
- `apps/server/prisma/schema.prisma`
- `apps/server/prisma/seed-demo-staff.js`
- `apps/server/src/modules/admin/admin-staff.service.ts`
- `apps/server/src/modules/admin/admin-auth.controller.ts`
- `apps/server/src/modules/admin/admin-user.service.ts`
- `apps/server/src/modules/credential/credential.service.ts`
- `apps/server/src/modules/intake/intake.service.ts`
- `apps/admin/src/pages/dashboard/index.tsx`
- `apps/admin/src/pages/staff/index.tsx`
- `apps/admin/src/pages/staff/detail.tsx`
- `apps/admin/src/pages/staff/components`
- `apps/admin/src/pages/staff/services/staff.ts`
- `apps/admin/src/services/request.ts`
- `apps/miniapp/pages/profile`
- `apps/miniapp/pages/credential`
- `apps/miniapp/pages/submit`
- `apps/miniapp/utils/request.js`
- `apps/miniapp/utils/constants.js`

## Required workflow

1. Check current Git state first.
2. Run the current verification baseline before editing:

```powershell
.\verify-stage3-5.cmd
```

3. Run or inspect the demo seed path:

```powershell
.\seed-demo-staff.cmd
```

4. Identify actual API/frontend mismatches. Do not guess and do not hardcode fake frontend data.
5. Make the smallest code changes needed.
6. Run:

```powershell
.\verify-stage4.cmd
```

If `verify-stage4.cmd` is missing or broken, fix it as part of this task.

## Goals

### 1. Admin staff list must be useful

After `seed-demo-staff.cmd`, the admin staff page should show seeded demo staff when logged in locally.

Fix any backend/frontend mismatch around:

- response envelope
- pagination field names
- filter parameter names
- staff status field names
- phone/name display fields
- operation buttons and detail navigation

Do not hardcode demo staff in React. The table must use the API.

### 2. Admin staff detail must support review workflow

Staff detail should clearly show:

- basic profile
- service skills
- service areas
- intake status
- listing status
- credential list
- credential files/previews where available
- linked skills for skill certificates

Credential review actions should work:

- approve credential
- reject credential with reason

Overall review actions should work:

- approve staff only when required credentials and skill certificate rules pass
- reject staff / request more info with reason

If backend already has the correct logic, only fix frontend/service contract issues.

### 3. Dashboard should use real local data

The admin dashboard should show real counts from backend data where an endpoint already exists or can be added narrowly:

- total staff
- pending review
- approved
- today submitted

If adding a backend endpoint, keep it under the existing admin module and use existing guard/response patterns.

Do not build analytics, charts, export, or business reporting.

### 4. Miniapp flow should align with backend

Do a focused pass for API response mismatches in:

- profile edit/view
- credential list/edit
- submit preview
- intake status

Fix obvious blockers that would prevent a user from completing:

1. fill profile
2. choose skills and service areas
3. upload credentials
4. submit intake
5. see status

Do not redesign the miniapp UI. Do not implement WeChat production login/payment/ordering.

### 5. Improve local test guidance only if needed

If local testing requires a clear step, update `README.md` or add a short checklist file.

Do not modify Word requirement documents.

## Important business boundaries

This is still an independent staff onboarding mini program.

Do not implement:

- customer ordering
- service dispatch
- payment
- deposit
- wallet
- commission or distribution
- map-based order flow
- supplier/customer dispute workflow
- "大家评评理"
- integration with another existing booking system

Do not add admin-created staff as the primary flow unless there is already a broken existing route to fix. Staff records should normally come from miniapp registration or from `seed-demo-staff.cmd` for local testing.

## Technical constraints

- Do not read or print `.env` contents.
- Do not commit secrets.
- Do not use `npx prisma`.
- Use local Prisma binary when needed:

```powershell
.\apps\server\node_modules\.bin\prisma.CMD
```

- Do not run `git reset`, `git checkout`, or rewrite Git history.
- Do not delete or move unrelated files.
- Do not edit old requirement Word documents.
- Keep edits narrowly scoped to Stage 4 integration/usability.

## Verification expectations

Run:

```powershell
.\verify-stage4.cmd
```

Also report:

1. What was broken or mismatched.
2. What files changed.
3. How to manually test in the browser/admin.
4. Whether demo seed data was verified.
5. What remains deferred after Stage 4.

