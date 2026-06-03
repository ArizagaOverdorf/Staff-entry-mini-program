# Claude Self-Review Report

## Status

Status: `PASSED`

Task slug: profile-area-address-insurance-optional-image

Task summary: Update miniapp profile service-area and address behavior, tighten insurance credential rules, and require images for optional credentials once edited.

Report time: 2026-06-03 21:41

## Scope

Requested change:

- Change profile service area selection to 全国、国外、31个省份省市选择、香港、澳门、台湾.
- Change home address to manual detailed-address input with enough right-side space.
- Change insurance company picker placeholder behavior; selecting 其他 shows a manual input.
- Require insurance image and insurance policy number.
- Require image upload for optional credential types once the user chooses to fill them: 保险、学历/毕业证、学生证、其他资料.

Explicit non-goals:

- No customer ordering, dispatch, payment, wallet, distribution, or dispute workflow changes.
- No admin UI changes.
- No schema or migration changes.
- No `.env` reading or printing.

Pre-existing dirty files before editing:

- `apps/server/prisma/schema.prisma` appeared in `git status`, but it did not appear in `git diff --stat`; this is the same line-ending status warning seen before this task.

## Files Changed

Server:

- `apps/server/src/modules/credential/credential.service.ts`

Admin:

- None.

Miniapp:

- `apps/miniapp/pages/profile/edit/index.js`
- `apps/miniapp/pages/profile/edit/index.wxml`
- `apps/miniapp/pages/profile/edit/index.wxss`
- `apps/miniapp/pages/profile/edit/index.json`
- `apps/miniapp/pages/credential/edit/index.js`
- `apps/miniapp/pages/credential/edit/index.wxml`
- `apps/miniapp/utils/constants.js`

Database/migrations:

- None.

Scripts/verifiers:

- None.

Docs/prompts:

- This report.

Other:

- None.

## Commands Run

| Command | Purpose | Result |
| --- | --- | --- |
| `git status --short` | Pre-check | Passed; noted pre-existing schema line-ending status. |
| `pnpm --filter @staff-entry/server build` | Server TypeScript build | Passed. |
| `Get-ChildItem apps\miniapp -Recurse -Filter *.js | node --check` | Miniapp JS syntax check | Passed. |
| `Get-ChildItem apps\miniapp -Recurse -Filter *.json | node -e "JSON.parse(...)"` | Miniapp JSON parse check | Passed. |
| `git diff --stat` | Confirm changed scope | Passed; eight source files changed. |

## Baseline Verification

Baseline command:

No usable stage baseline was run.

Baseline result:

`UNVERIFIED_ENV_BLOCKED`

Notes:

- The latest chained stage verifier was already known to have Windows PowerShell encoding/parsing damage from prior work.
- I used direct build and syntax checks for changed server and miniapp areas.

## Final Verification

Final command:

- `pnpm --filter @staff-entry/server build`
- Miniapp JS syntax check
- Miniapp JSON parse check

Final result:

`PASSED`

Key output summary:

- Server build completed successfully.
- Miniapp JavaScript syntax check completed successfully.
- Miniapp JSON files parsed successfully.

## Repair Attempts

Attempt 1:

- Trigger: While reviewing service-area selected tags, backend-loaded areas could lack `value` and `label`.
- Fix: Added `normalizeServiceAreaItem()` and normalized selected service areas on load/change/add/remove.
- Result: Final checks passed.

Attempt 2:

- Not needed.

## Database And Migration Notes

Schema changed: `no`

Migration added: `no`

Migration name: none

Seed/demo data changed: `no`

## Manual Test Notes

Admin:

- Not changed.

Miniapp:

- Personal profile: verify 家庭住址 is a right-aligned manual input and saves after blur/save.
- Personal profile: verify 服务区域 popup supports 全国、国外、省份->城市、香港、澳门、台湾, supports selecting and removing multiple areas, and saves/re-enters correctly.
- Insurance credential: verify picker initially shows 请选择保险公司, selecting 其他 shows manual insurance-company input.
- Insurance credential: verify missing insurance image, insurance policy number, or insurance company blocks save.
- Optional credentials: verify 学历/毕业证、学生证、其他资料 cannot save without an uploaded image after the user enters that edit page.

Server/API:

- Backend now rejects missing images for insurance, education, student_card, and other credential types.
- Backend now rejects insurance without credential number or issuing authority.

Not manually verified:

- Real-device UI layout and picker interaction.

## Residual Risks

- The service-area popup is custom to the profile page and no longer uses the shared `area-picker`; future shared component cleanup can be done separately if needed.
- Physical behavior of WXML layout should still be checked in WeChat Developer Tools/true-device debugging.

## Codex Review Checklist

- Confirm diff matches requested scope.
- Confirm no `.env` or secrets were read or committed.
- Confirm no out-of-scope modules were implemented.
- Confirm verifier result is credible.
- Confirm manual miniapp checks are acceptable before commit.
