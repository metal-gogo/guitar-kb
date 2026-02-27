# ADR-0006: Next Planning Wave and Triage Protocol

**Status:** Accepted  
**Date:** 2026-02-25  
**Owner:** Guitar Chord Knowledge Base (GCKB)

---

## Context

The previous roadmap batch has been completed and merged, and the repository is
now at a stable baseline with deterministic ingest/build/validate workflows.

The next phase should:

1. Keep autonomous progress deterministic and review-safe.
2. Seed a new set of implementation-ready issues (10–20 tasks).
3. Enforce consistent triage labels so issue ordering is machine-friendly.
4. Add a reusable planning-stage prompt for future issue-seeding waves.

---

## Decision

We create a new planning wave with **12 tasks** and enforce these rules:

- Every newly created issue MUST include triage labels:
  - one `priority/*`
  - one `area/*`
  - `status/backlog`
- Planning waves are tracked by one parent issue plus child execution issues.
- Autonomous workflows must always:
  - answer every Copilot comment,
  - resolve every Copilot thread,
  - ensure Copilot checks retrigger on every push,
  - allow merge only when required checks are green and branch is up to date,
  - and treat PRs with completed Copilot review and no actionable comments as merge-safe.

---

## Seed Backlog (Wave 2026-02)

1. Release gate script for deterministic pre-merge verification.
2. CI check for deterministic docs and SVG regeneration drift.
3. Schema snapshot contract tests for representative chord records.
4. Normalization alias-collision detection and guardrails.
5. Ingest cache integrity audit command with checksum summary.
6. Parser fixture minimization strategy and fixture index docs.
7. Docs quality pass for generated markdown link consistency checks.
8. Validation error taxonomy (structured error codes/messages).
9. CLI UX polish for discoverable `--help` and usage examples.
10. Source registry contributor template for adding new providers.
11. PR template alignment with Copilot-required validation evidence.
12. Planning prompt iteration for next autonomous issue-seeding cycle.

### Issued Tracking IDs

- Parent planning issue: #84 (historical baseline; superseded)
- Child tasks:
  - #85 release gate script for pre-merge verification
  - #86 deterministic artifact drift check in CI
  - #87 schema snapshot contract suite for representative chords
  - #88 normalization alias-collision detection
  - #94 ingest cache integrity audit command
  - #95 parser fixture index and minimization guide
  - #96 docs link consistency validator
  - #97 structured validation error codes
  - #98 CLI help and usage examples for ingest/build
  - #99 source registry contributor template
  - #100 PR template validation evidence checklist
  - #101 planning prompt refresh for next seeding cycle

### Historical Status Update (2026-02-27)

Wave `#84` is retained as an audit trail of the original seed set, but it is no
longer the active planning parent. Later waves superseded it:

- Wave B parent: #102
- Wave C parent: #113
- Feedback correction wave parent: #124

Operationally, execution ordering is controlled by current open issues plus
their `priority/*` and `status/*` labels rather than by the historical parent
issue from this ADR.

---

## Triage Mapping Policy

- CI/testing infrastructure tasks → `area/ci-test`
- Ingestion/parsers/cache tasks → `area/ingest`
- Normalization/model tasks → `area/normalize` or `area/data-model`
- Docs/svg/site navigation tasks → `area/docs-svg`
- Priority defaults for this wave:
  - foundational reliability tasks: `priority/p1`
  - quality-of-life/documentation tasks: `priority/p2`

---

## Consequences

### Pros

- Maintains high-signal issue ordering for autonomous agents.
- Keeps merge safety rules explicit and reproducible.
- Reduces ambiguity during future planning phases.

### Cons

- Label discipline requires extra issue-creation effort.
- Planning overhead increases with each additional roadmap wave.

---

## Compliance

ADR-0006 is satisfied when:

1. A parent planning issue exists for this wave.
2. 10–20 child issues are created with correct triage labels.
3. The planning-stage prompt is committed under `planning/prompts/`.
4. `planning/prompts/autonomous-maintenance.md` reflects the updated workflow rules.
