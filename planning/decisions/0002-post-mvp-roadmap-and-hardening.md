# ADR-0002: Post-MVP Roadmap & Hardening Plan

**Status:** Accepted\
**Date:** 2026-02-22\
**Owner:** Guitar Chord Knowledge Base (GCKB)

------------------------------------------------------------------------

## Context

The repository has completed the initial MVP path for:

- deterministic ingest/build/validate flow
- canonical IDs and enharmonic policy (ADR-0001)
- schema validation and core unit tests
- generated docs and SVG artifacts
- CI + governance checks

What is missing is a single, explicit next-step plan that keeps work focused
on reliability, maintainability, and contributor onboarding.

Current risks after MVP completion:

- onboarding friction due to incomplete/unclear README
- fragile parser behavior if upstream HTML changes
- potential output drift without full deterministic regression checks
- provenance gaps/regressions if not enforced end-to-end
- quality drift without a prioritized issue queue

The project now needs a formal roadmap for the next execution wave.

------------------------------------------------------------------------

## Decision

We adopt a post-MVP hardening roadmap with explicit priorities, ordering,
and issue-driven delivery.

### 1) Planning Model

- Continue issue-first delivery.
- Keep GitHub Issues as the operational source of truth.
- Mirror issue specs in `planning/issues/*.md` for durable, reviewable context.
- Track architectural policy in ADRs under `planning/decisions/*.md`.

### 2) Priority Framework

Use three priority bands:

- **P0 (must-have now):** documentation clarity, deterministic guarantees,
  provenance enforcement, MVP contract lock.
- **P1 (next):** parser resilience and normalization edge cases.
- **P2 (then):** docs/SVG quality gates and CI/release clarity polish.

### 3) Execution Sequence

Work must be completed in this order:

1. README overhaul (single source of truth for how system works)
2. deterministic full-pipeline regression gate
3. provenance completeness enforcement
4. MVP contract integration suite (C/Cm/C7/Cmaj7 + multiple voicings)
5. parser resilience expansion (per source)
6. normalization edge-case expansion
7. docs completeness + deterministic ordering checks
8. SVG determinism/accessibility baseline checks
9. CI required-check clarity + release readiness checklist
10. follow-up backlog preparation for post-MVP expansion

### 4) Governance Rules for This Phase

- one issue per branch
- small logical commits (Conventional Commits)
- run relevant tests before opening PR
- resolve review threads before merge
- keep deterministic output as a hard requirement

------------------------------------------------------------------------

## Definition of Done (Roadmap Batch)

This roadmap is complete when:

- README is rewritten and actionable for new contributors
- deterministic output is verified by regression tests
- provenance is guaranteed on every chord and voicing
- MVP chord contract is explicitly tested and enforced
- parser and normalization edge cases are covered by tests
- docs and SVG outputs have stability/completeness tests
- CI checks are unambiguous and consistently enforced
- 10 prioritized issues exist in GitHub and in `planning/issues`

------------------------------------------------------------------------

## Consequences

### Pros

- clear contributor onboarding and operating model
- reduced regression risk via deterministic and provenance gates
- better resilience to source-site HTML changes
- predictable issue queue aligned to MVP hardening goals

### Cons

- increased up-front test/documentation investment
- slightly slower feature expansion while hardening work is prioritized

------------------------------------------------------------------------

## Compliance

ADR-0002 is satisfied when the 10-issue hardening batch is created,
prioritized, and executed according to the sequence above, with each issue
having acceptance criteria and local validation steps.
