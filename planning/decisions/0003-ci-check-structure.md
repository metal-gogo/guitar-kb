# Decision 0003: CI Check Structure and Copilot Review Gate

**Date:** 2026-02-22  
**Status:** Accepted

---

## Context

The repository uses two required CI checks on every PR:

1. `build` — runs lint, test, build, and validate via `ci.yml`
2. `require-copilot-review` — gates merge on a Copilot bot review via `copilot-review.yml`

The `copilot-review.yml` workflow is triggered by both `pull_request_target` and `workflow_run` (after `CI` completes). This causes GitHub to display the `require-copilot-review` check twice in the PR status panel.

---

## Decision

Keep both triggers on `copilot-review.yml`:

- **`pull_request_target`** ensures the check gate appears immediately when a PR is opened or updated, blocking merge from the start.
- **`workflow_run` (after `CI`)** ensures the check re-runs after the CI build completes, capturing any Copilot review that arrived during the CI run. Without this trigger, a Copilot review submitted after the last push would not cause the check to re-evaluate.

The apparent duplicate in the PR checks panel is a cosmetic side-effect of two trigger sources sharing the same job name. Both runs must pass.

---

## Alternatives Considered

### Single `pull_request_target` trigger only

Rejected. If Copilot reviews after the last push but before merge, and no further PR events occur, the check would never re-run to pick up the review. Merging would be blocked indefinitely (requiring a no-op push or label override to ungate).

### Single `workflow_run` trigger only

Rejected. The check would not appear in the PR panel until CI completes, giving no early signal and potentially allowing premature merge attempts for repos with auto-merge configured.

### `pull_request_review` trigger

Investigated. GitHub does not support `pull_request_target` with review events in the same workflow directive. A separate workflow would be needed, increasing complexity without clear benefit over the current approach.

### `concurrency` cancel-in-progress

Considered to suppress the visual duplicate. Rejected because both runs are short-lived and typically complete at different times. Cancellation would only help if both triggered simultaneously, which is rare. The benefit does not outweigh the risk of accidentally cancelling a meaningful check result.

---

## Consequences

- PRs will always show `require-copilot-review` twice in the checks panel. This is documented in `CONTRIBUTING.md` to prevent confusion.
- The `copilot-review/override` label can bypass the check when Copilot is unavailable.
- Workflow token permissions are read-only (`contents: read`, `pull-requests: read`) to follow least-privilege principles.
