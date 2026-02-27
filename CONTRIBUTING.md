# Contributing to Guitar Chord Knowledge Base

This document describes the development workflow, merge process, and release-readiness checklist for GCKB.

---

## Branch Naming

| Type | Pattern | Example |
|---|---|---|
| Feature | `feat/<issue>-short-desc` | `feat/34-docs-generator-completeness` |
| Fix | `fix/<issue>-short-desc` | `fix/27-normalize-flat-roots` |
| Chore | `chore/<issue>-short-desc` | `chore/36-ci-clarity` |

**Never push directly to `main`.**  All changes must go through a PR.

---

## Commit Style

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: ...       # New feature
fix: ...        # Bug fix
test: ...       # Test changes only
docs: ...       # Documentation only
chore: ...      # Config/build changes
refactor: ...   # Code restructure, no behavior change
```

### Scope

Include a scope when the change is file-area specific:

```
test(svg): add determinism assertions
fix(normalize): handle flat root edge case
```

---

## PR Process

1. Open an issue first; branch off `main`.
2. Make small, logical commits.
3. Open a PR with `--base main` and a description covering:
   - What changed and why
   - How to validate locally (exact commands)
   - Known limitations / follow-up issues
4. Wait for CI (`build`) and Copilot review (`require-copilot-review`) to pass.
5. Address Copilot inline comments; push fixes.
6. Squash and merge when both checks are green.
7. Delete the branch after merge.

---

## CI Checks

Every PR runs two required checks.

| Check | Workflow | Trigger | What it does |
|---|---|---|---|
| `build` | `ci.yml` | `pull_request`, `push main` | lint → test → ingest → build → validate |
| `require-copilot-review` | `copilot-review.yml` | `pull_request_target`, `workflow_run` (after CI) | Blocks merge until the Copilot bot has submitted a review |

### Why `require-copilot-review` appears twice in the PR checks panel

The `copilot-review.yml` workflow is triggered by two events:

1. **`pull_request_target`** — fires immediately when the PR is opened or updated, so the check appears early and blocks the merge gate right away.
2. **`workflow_run` (after `CI` completes)** — re-runs after CI finishes to capture Copilot reviews that arrived while CI was running.

Both runs use the same job name (`require-copilot-review`), which is why GitHub shows the check twice. Both must pass for the branch protection ruleset to allow merging. This is expected behavior; ignore the apparent duplication.

### Override

If Copilot is unavailable, a maintainer can apply the `copilot-review/override` label to bypass the check. Use sparingly and document the reason in the PR description.

---

## Release-Readiness Checklist

Before squash-merging any PR, verify:

### Automated (must be green)

- [ ] `build` check passes (lint + test + build + validate)
- [ ] `require-copilot-review` check passes (Copilot has reviewed)

### Manual

- [ ] All Copilot inline comments addressed or explicitly dismissed with a reply
- [ ] New tests added for new behavior (parsers, normalization, SVG, docs)
- [ ] `chords.schema.json` updated if the data model changed
- [ ] `README.md` updated if a new CLI command or workflow step was added
- [ ] `source_refs` provenance is present in any new chord/voicing records
- [ ] No copied source prose or reused external images
- [ ] Branch will be deleted after merge

### After merge

- [ ] Confirm issue auto-closed (or close manually)
- [ ] Remove `status/in-progress` label if still present
- [ ] Verify `main` CI passes on the squashed commit

---

## Local Validation Commands

```bash
npm run lint          # ESLint
npm test              # Vitest (all test files)
npm run build         # Full build: docs + SVG + JSONL
npm run validate      # Schema validation on generated JSONL
npm run ingest        # Re-parse cached HTML sources
npm run audit-cache   # Audit data/sources/ cache entries for missing/corrupt files
npm run source-freshness # Report per-source cache age and stale targets
```

Run all in sequence before opening a PR:

```bash
npm run lint && npm test && npm run build && npm run validate
```

---

## PR Readiness Auto-Check

Run before opening a PR to get a full pass/fail checklist:

```bash
npm run pr-ready
```

This command checks:

1. **Working tree is clean** — no uncommitted or unstaged changes
2. **Branch name matches convention** — must follow `feat|fix|chore|test|docs|refactor/<slug>`
3. **lint** — TypeScript compilation (no type errors)
4. **test** — full Vitest suite
5. **build** — docs + SVG + JSONL generation
6. **validate** — schema + provenance coverage on generated JSONL

All checks run even if earlier ones fail, so you see the full picture in one pass.
The command exits `0` when all pass, `1` when any fail.

**Example output (all passing):**

```
PR Readiness Check
==================
✓  working tree is clean
✓  branch name matches convention (feat/42-my-feature)
✓  lint
✓  test
✓  build
✓  validate

All checks passed. Ready to open a PR.
```
---

## Further Reading

- [Parser Fixture Index and Minimization Guide](docs/contributing/parser-fixtures.md) — fixture inventory, minimization rules, and how to add new fixtures
- [CI Run Summary Artifact](docs/contributing/ci-summary-artifact.md) — how to read and use the per-run diagnostic artifact uploaded by CI
- [Copilot Review Retrigger and Recovery Runbook](docs/contributing/copilot-review-runbook.md) — operational flow for pending/failed Copilot checks, retriggers, and merge gating
- [Source Freshness Report](docs/contributing/source-freshness-report.md) — stale cache detection by source with deterministic CI log output
- [Adding a New Chord Source](docs/contributing/adding-a-source.md) — step-by-step checklist for integrating a new provider into the ingest pipeline
