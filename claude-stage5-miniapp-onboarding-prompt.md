# Claude Code Task: Stage 5 Miniapp Onboarding Flow Readiness

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

## Context

Stages 0 through 4.2 are complete and committed. The admin backend has usable review screens, but the user now needs the WeChat miniapp side to be made genuinely ready for local development and manual testing.

This stage is about the miniapp onboarding experience and only the minimal server-side compatibility fixes needed by that miniapp. Do not expand admin features unless a miniapp API response shape makes it necessary.

## Baseline And Final Verification

Baseline verifier:

```powershell
.\verify-stage4-2.cmd
```

Final verifier:

```powershell
.\verify-stage5-miniapp.cmd
```

## Read First

- `CLAUDE.md`
- `claude-skills/self-review/SKILL.md`
- `apps/miniapp/app.json`
- `apps/miniapp/project.config.json`
- `apps/miniapp/utils/constants.js`
- `apps/miniapp/utils/request.js`
- `apps/miniapp/utils/upload.js`
- `apps/miniapp/utils/auth.js`
- `apps/miniapp/pages/auth/index.*`
- `apps/miniapp/pages/auth/phone-bind/index.*`
- `apps/miniapp/pages/privacy/index.*`
- `apps/miniapp/pages/home/index.*`
- `apps/miniapp/pages/profile/edit/index.*`
- `apps/miniapp/pages/profile/view/index.*`
- `apps/miniapp/pages/credential/index.*`
- `apps/miniapp/pages/credential/edit/index.*`
- `apps/miniapp/pages/submit/index.*`
- `apps/miniapp/pages/audit/status.*`
- `apps/miniapp/pages/message/index.*`
- `apps/miniapp/pages/message/detail.*`
- `apps/miniapp/pages/service-record/index.*`
- `apps/miniapp/pages/account/index.*`
- `apps/miniapp/components/category-picker/index.*`
- `apps/miniapp/components/area-picker/index.*`
- `apps/server/src/modules/auth/*`
- `apps/server/src/modules/account/*`
- `apps/server/src/modules/staff/*`
- `apps/server/src/modules/credential/*`
- `apps/server/src/modules/intake/*`
- `apps/server/src/modules/file/*`

## Requirements

### 1. Miniapp must be readable and locally testable

- All visible Chinese copy in `apps/miniapp` must be readable UTF-8 Chinese.
- Keep the miniapp title as `家政服务人员入驻`.
- Remove or fix broken local image references such as `/images/logo.png`.
- Prefer replacing decorative image-only icons with CSS/text icons instead of adding large binary assets.
- If any `/images/...` reference remains, the referenced file must exist in `apps/miniapp/images/`.
- `project.config.json`, `app.json`, and all page JSON files must remain valid JSON.
- All miniapp `.js` files must pass `node --check`.

### 2. Login, phone binding, and privacy flow

Make this local development flow clear and usable:

1. Login page calls `wx.login`, backend mock login, stores token and staffId.
2. If the phone is not bound, go to phone binding.
3. Phone binding must support local manual phone input for development.
4. Keep `open-type="getPhoneNumber"` support for real WeChat capability.
5. After phone binding, go to privacy consent.
6. After privacy consent, go to home.

Do not hardcode a real AppSecret or real phone number.

### 3. Home and navigation

The home page should show:

- staff name or default name
- intake status
- listing status
- unread message count
- next-step friendly entry points:
  - personal profile
  - credential management
  - submit onboarding
  - audit progress
  - service records
  - messages
  - account settings

Navigation must use existing page paths in `app.json`.

### 4. Profile form

The profile edit page must support and validate:

- name
- ID number
- gender
- birthday
- address
- emergency contact and phone
- service categories
- service areas

It must call the existing app profile APIs and keep the existing category/area picker components working.

### 5. Credential upload and education/student-card flow

Credential management must support:

- mandatory credentials:
  - 身份证
  - 健康证
  - 无犯罪记录证明
  - 征信报告
  - 体检报告
- optional credentials:
  - 保险
  - 学历/毕业证
  - 学生证
  - 其他
- multiple skill certificates:
  - custom certificate name
  - skill level
  - one or more linked service skills
  - uploaded certificate image

The education/student-card quick entry must remain optional and visible.

The upload utility must correctly handle the backend unified response shape:

```json
{ "code": 0, "data": { "...": "..." } }
```

and still tolerate older raw response shapes.

### 6. Submit preview

The submit preview page must show:

- personal profile completion
- mandatory credential status
- skill-certificate requirements
- optional education/student-card summary when uploaded
- issues that block submission

Missing education/student-card must not block submission.

### 7. Do not overbuild

Do not implement:

- customer ordering
- dispatch
- payment
- deposit
- wallet
- commission/distribution
- map-based order flow
- "大家评评理"
- job matching
- automatic punishment/freeze

Do not modify Word requirement documents.

## Verification

Run:

```powershell
.\verify-stage5-miniapp.cmd
```

If it fails, follow `claude-skills/self-review/SKILL.md`: make at most two focused repair attempts, rerun verification after each attempt, then write the required self-review report.

## Final Response

Report:

1. Whether Stage 5 verifier passed.
2. Self-review report path.
3. Miniapp pages changed.
4. Any server compatibility changes.
5. Manual WeChat Developer Tools checks still needed.
