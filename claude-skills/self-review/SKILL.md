---
name: self-review
description: Require Claude Code to verify project coding work, make at most two focused repair attempts, and write a structured success or failure handoff report under claude-reports before telling the user it is done.
---

# Claude Self-Review

Use this skill for every project coding task before reporting completion.

## Goal

Reduce Codex review cost by making Claude Code produce a reliable handoff:

- Verify the task with the project verifier.
- Repair only within a strict limit.
- Always write a structured report under `claude-reports/`.
- Tell the user the report path and verification status.

## Hard Rules

- Do not commit code unless the user explicitly asks.
- Do not read, print, or summarize `.env`.
- Do not use `npx prisma`; use `.\apps\server\node_modules\.bin\prisma.CMD`.
- Do not run `git reset`, `git checkout`, or rewrite Git history.
- Do not edit Word requirement documents unless explicitly asked.
- Do not edit unrelated files to make verification pass.
- Do not implement out-of-scope product modules such as ordering, dispatch, payment, wallet, distribution, or dispute voting.

## Workflow

1. Inspect current state:
   - Run `git status --short`.
   - Identify the task prompt, baseline verifier, and final verifier.
   - If the worktree is dirty before editing, record the pre-existing files in the report.

2. Run the baseline check before editing when available:
   - Prefer the previous-stage verifier, for example `.\verify-stage4-1.cmd`.
   - If no baseline exists, state `No baseline verifier provided`.
   - If the baseline cannot run, record the exact missing dependency or command failure.

3. Implement the requested change:
   - Keep the scope narrow.
   - Preserve the current independent onboarding MVP boundaries.
   - Prefer existing patterns and local APIs.

4. Verify after editing:
   - Run the task-specific verifier, for example `.\verify-stage4-2.cmd`.
   - Also run build/type checks if the verifier does not cover changed areas.
   - Capture enough command output to explain pass/fail without dumping long logs.

5. Repair loop:
   - If verification passes, skip to report writing.
   - If verification fails, make focused repair attempt 1 and rerun the same verifier.
   - If it still fails, make focused repair attempt 2 and rerun the same verifier.
   - If it still fails after attempt 2, stop broad editing. Do not start a third repair attempt.

6. Write the report:
   - Always create one Markdown report, whether verification passed or failed.
   - Use this path format:

     `claude-reports/YYYYMMDD-HHMM-<task-slug>-self-review.md`

   - Use the exact section structure in `claude-skills/self-review/references/report-template.md`.
   - Mark the status as one of:
     - `PASSED`
     - `FAILED_AFTER_TWO_REPAIRS`
     - `UNVERIFIED_ENV_BLOCKED`
     - `PARTIAL_NEEDS_CODEX_REVIEW`

7. Final response to the user:
   - State whether the verifier passed.
   - State the report path.
   - State changed file groups, not a long file dump.
   - State any manual checks still needed.

## Report Quality Bar

The report must let Codex review quickly without re-reading the entire repository. Include:

- Task scope and explicit non-goals.
- Changed files grouped by app/server/admin/scripts/docs.
- Commands run and pass/fail status.
- Baseline result and final verification result.
- Repair attempts with exact cause and exact files touched.
- Residual risk and manual test notes.
- Whether database schema or migrations changed.
- Whether miniapp, admin, and server were each touched.
- A concise Codex review checklist.

Do not hide failures. If a check cannot run, mark the report as blocked or partial instead of claiming success.
