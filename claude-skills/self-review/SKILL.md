# Claude Self-Review Skill

Use this skill for every project coding task before reporting completion.

## Goal

Make Claude Code verify its own work before Codex reviews it. If the work cannot be verified after one repair attempt, leave a concise failure report in `claude-reports/` so Codex can review faster.

## Workflow

1. Inspect current state:
   - Run `git status --short`.
   - Identify the task-specific prompt and verification script.
   - Do not edit unrelated files.

2. Run the baseline check before editing when available:
   - Prefer the task-specific previous-stage verifier, for example `.\verify-stage4-1.cmd`.
   - If the baseline cannot run, record the reason in the final report.

3. Implement the requested change:
   - Keep the scope narrow.
   - Preserve existing product boundaries.
   - Do not read `.env`.
   - Do not use `npx prisma`; use `.\apps\server\node_modules\.bin\prisma.CMD`.
   - Do not run `git reset`, `git checkout`, or rewrite history.

4. Verify after editing:
   - Run the task-specific verifier, for example `.\verify-stage4-2.cmd`.
   - Also run build/type checks if the verifier does not cover them.

5. If verification fails:
   - Read the error.
   - Make one focused repair pass.
   - Rerun the same verifier.

6. If verification still fails:
   - Stop broad editing.
   - Write a Markdown report to:

     `claude-reports/YYYYMMDD-HHMM-<task-slug>-self-review.md`

   - Include:
     - task name
     - files changed
     - commands run
     - verification result
     - key error output, summarized
     - suspected cause
     - recommended next fix
   - Tell the user the report path.

## Success Report Format

When verification passes, report:

1. What changed.
2. Files changed.
3. Migration name, if any.
4. Verification command and result.
5. Manual test notes.
6. Deferred items.

