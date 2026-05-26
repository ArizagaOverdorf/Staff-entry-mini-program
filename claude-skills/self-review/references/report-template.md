# Claude Self-Review Report

## Status

Status: `PASSED | FAILED_AFTER_TWO_REPAIRS | UNVERIFIED_ENV_BLOCKED | PARTIAL_NEEDS_CODEX_REVIEW`

Task slug:

Task summary:

Report time:

## Scope

Requested change:

Explicit non-goals:

Pre-existing dirty files before editing:

## Files Changed

Server:

Admin:

Miniapp:

Database/migrations:

Scripts/verifiers:

Docs/prompts:

Other:

## Commands Run

| Command | Purpose | Result |
| --- | --- | --- |
| `git status --short` | Pre-check |  |
|  |  |  |

## Baseline Verification

Baseline command:

Baseline result:

Notes:

## Final Verification

Final command:

Final result:

Key output summary:

## Repair Attempts

Attempt 1:

- Trigger:
- Fix:
- Result:

Attempt 2:

- Trigger:
- Fix:
- Result:

## Database And Migration Notes

Schema changed: `yes | no`

Migration added: `yes | no`

Migration name:

Seed/demo data changed: `yes | no`

## Manual Test Notes

Admin:

Miniapp:

Server/API:

Not manually verified:

## Residual Risks

- 

## Codex Review Checklist

- Confirm diff matches requested scope.
- Confirm no `.env` or secrets were read or committed.
- Confirm no out-of-scope modules were implemented.
- Confirm verifier result is credible.
- Confirm any manual test gaps are acceptable before commit.
