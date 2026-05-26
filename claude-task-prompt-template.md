# Claude Code Task Template

Use this template when creating a new `claude-stage*-prompt.md` file.

## Required First Step

Before coding, read and follow:

- `CLAUDE.md`
- `claude-skills/self-review/SKILL.md`
- `claude-skills/self-review/references/report-template.md`

Use the enhanced self-review protocol:

- Run `git status --short` before editing.
- Run the baseline verifier before editing when provided.
- Make focused changes only.
- Run the final verifier after editing.
- If verification fails, make at most two focused repair attempts.
- Always write one structured report under `claude-reports/`, whether verification passes or fails.
- Do not commit code unless the user explicitly asks.

## Task

Task name:

Working directory:

Baseline verifier:

Final verifier:

Files to read first:

- 

## Requirements

- 

## Strictly Forbidden

- Do not read or print `.env`.
- Do not use `npx prisma`.
- Do not modify Word requirement documents.
- Do not delete or move unrelated files.
- Do not run `git reset`, `git checkout`, or rewrite Git history.
- Do not implement customer ordering, dispatch, payment, wallet, distribution, or dispute voting unless the task explicitly says so.
- Do not commit code.

## Verification

Run:

```powershell
<final verifier command>
```

If verification fails, follow `claude-skills/self-review/SKILL.md`: make at most two focused repair attempts, rerun verification after each attempt, then write the required report.

## Final Response

Report:

1. What changed.
2. Which file groups changed.
3. Final verifier result.
4. Self-review report path.
5. Manual test gaps or deferred items.
