# Claude Code Project Instructions

## Project

This repository is for the stage-one MVP of the "家政服务人员入驻独立小程序" project.

Primary product documents:

- `家政服务人员入驻_需求文档（独立版）.docx`
- `家政服务人员入驻小程序_开发技术方案.md`
- `小程序开发环境与上线准备清单.md`

Reference-only documents:

- `家政服务人员入驻_需求文档_v2_3_开发确认版.docx`
- `大家评评理_供应商需求文档_v1_5_开发确认版.docx`
- `审查报告_家政服务人员入驻_独立版.md`

When there is a conflict, follow the current independent PRD and technical plan first. The original v2.3 and dispute-review documents are historical references, not the implementation scope for stage one.

## Current Scope

Only build stage-one staff onboarding MVP.

Must include:

- WeChat mini program login and phone binding.
- Privacy consent before submission.
- Staff profile form.
- Service category and service area selection.
- Credential upload and credential review status.
- Intake submission and review status.
- Admin review workflow: approve, reject, request more information.
- Listing availability status with manual pause/resume.
- Credential expiry badge, reminder, and admin filtering.
- Admin-maintained service record summary.
- Message center.
- Operation logs.
- Sensitive data access control and logging.
- PostgreSQL data model.
- Private file storage abstraction.

## Explicitly Out of Scope for Stage One

Do not implement:

- C-end customer ordering.
- Map-based staff selection.
- Dispatching.
- Order fulfillment.
- Payment.
- Deposit or wallet.
- Revenue sharing.
- Debt records.
- Middle-number phone service.
- Full "大家评评理" workflow.
- Real dispute voting.
- Automatic punishment or automatic dispatch freeze.

Future integration interfaces may be defined, but they must not become full business implementations in stage one.

## Important Product Rules

- This system is a staff qualification center, not a full housekeeping transaction system.
- Use stable `staff_id` as the external integration key.
- Appointment/distribution systems may later read available staff data.
- "大家评评理" may later read staff identity/status and write dispute-related events.
- Stage one service records are manually maintained summaries, not real orders.
- Manual dispute result fields in service records do not trigger payment, deposit deduction, refund, revenue sharing, debt, automatic freeze, or real dispute workflow.
- Credential expiry does not automatically stop dispatch in MVP. It creates an expiry badge, reminder, admin filter, and allows manual pause.
- External systems should only read unified availability fields such as `is_available` / `listing_status`; internal pause reasons remain internal details.

## Recommended Tech Stack

Use this stack unless the user explicitly changes it:

- Mini program: WeChat native mini program.
- Backend: Node.js LTS + NestJS.
- ORM: Prisma.
- Database: PostgreSQL.
- Admin frontend: React + Ant Design Pro, or Vue 3 + Element Plus if the repo already uses Vue.
- File storage: local private storage for development; Aliyun OSS private bucket for production.
- API groups:
  - `/api/app/*` for mini program.
  - `/api/admin/*` for admin backend.
  - `/api/integration/*` for future integration contracts only.

## Development Order

Do not attempt to implement the entire system in one pass.

Recommended phases:

1. Project skeleton, environment files, Prisma schema, module structure.
2. Auth, account, role, permission, dictionary modules.
3. Staff profile and credential upload.
4. Admin review workflow.
5. Listing availability, credential expiry labels, manual pause/resume.
6. Service record summary maintenance.
7. Message center, operation logs, sensitive file preview.
8. P1/P2 integration contracts only after MVP is stable.

Before coding a large phase, first output a short implementation plan and list of files to be changed.

## Data and Security Constraints

- Never put secrets in frontend code.
- Never commit real AppSecret, database password, OSS AccessKey, or JWT secrets.
- Use `.env.example` for placeholders.
- Do not expose PostgreSQL to the public internet.
- Store sensitive files privately.
- Do not make credential images publicly readable.
- Viewing real phone numbers, ID numbers, or credential images must require permission and write an operation log.
- External interfaces must not return ID number, credential images, real phone number, address, evidence, dispute details, or admin remarks by default.

## Naming Guidance

Prefer these domain terms:

- `staff_id`
- `intake_status`
- `listing_status`
- `is_available`
- `credential_status`
- `credential_badge`
- `pause_reason`
- `staff_service_record`
- `operation_log`
- `external_event_log`

Avoid naming service record summaries as real orders. Use `service_record` or `service_summary`, not `order`, unless implementing future appointment-system integration.

## Verification

For each completed phase, run available checks:

- Type check.
- Lint.
- Unit tests if present.
- Database migration generation/validation.
- Basic API smoke tests.

If a check cannot run because dependencies or environment variables are missing, state that clearly and provide the exact missing item.

## Mandatory Self-Review Protocol

For every coding task, read and follow:

- `claude-skills/self-review/SKILL.md`
- `claude-skills/self-review/references/report-template.md`

The short version:

1. Check `git status` before editing.
2. Run the task's baseline verification script before editing when one exists.
3. Make focused changes only.
4. Run the task's verification script after editing.
5. If verification fails, analyze the failure, make at most two focused repair attempts, and rerun the same verification after each attempt.
6. If verification still fails after the second repair attempt, stop broad editing.
7. Always write one structured self-review report under `claude-reports/`, even when verification passes.
8. Use this status vocabulary in the report:
   - `PASSED`
   - `FAILED_AFTER_TWO_REPAIRS`
   - `UNVERIFIED_ENV_BLOCKED`
   - `PARTIAL_NEEDS_CODEX_REVIEW`
9. In the final response, include the report path, verifier result, changed file groups, and any manual test gaps.

Do not commit code, read `.env`, run `npx prisma`, or rewrite Git history unless the user explicitly asks.
