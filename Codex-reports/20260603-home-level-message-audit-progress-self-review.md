# Codex Self-Review Report

## Status

Status: `PASSED`

Task slug: `home-level-message-audit-progress`

Task summary: Move staff onboarding audit progress out of the home page status card into the message center, add a dedicated audit progress summary row, and show credential-level review details on the audit status page.

## Scope

Changed the miniapp home page first status card from onboarding status to placeholder values for future level and credit score.

Added a message-center row titled `个人资料审核进度`, which opens the existing audit status page.

Added credential review details to the audit status page, including credential type, credential name, review status, expiry date, expired badge, and review remarks.

Added a backend audit message when a staff member submits onboarding materials.

Excluded `audit` messages from the regular app message list because the miniapp now aggregates audit progress into a dedicated row.

## Verification

- `node --check apps/miniapp/pages/message/index.js`: passed.
- `node --check apps/miniapp/pages/audit/status.js`: passed.
- `node --check apps/miniapp/pages/home/index.js`: passed.
- `pnpm --filter @staff-entry/server build`: passed.

## Changed File Groups

- Miniapp home: `apps/miniapp/pages/home/index.wxml`
- Miniapp message center: `apps/miniapp/pages/message/index.js`, `apps/miniapp/pages/message/index.wxml`, `apps/miniapp/pages/message/index.wxss`
- Miniapp audit status: `apps/miniapp/pages/audit/status.js`, `apps/miniapp/pages/audit/status.wxml`, `apps/miniapp/pages/audit/status.wxss`
- Server: `apps/server/src/modules/intake/intake.service.ts`, `apps/server/src/modules/message/message.service.ts`

## Manual Checks Still Needed

- In WeChat Developer Tools or true-device debugging, confirm the home card shows `等级称号 / 开发中` and `信用分：开发中`.
- Submit onboarding materials and confirm the message center shows `个人资料审核进度`.
- Tap the audit progress row and confirm credential-level statuses display correctly after backend review actions.

## Notes

The project instruction references `Codex-skills/self-review`, but that directory is not present in this repository. I followed the same self-review workflow manually and wrote this report under `Codex-reports/`.
