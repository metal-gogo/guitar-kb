# ADR-0008: AGENTS.md Effectiveness Review and Scope Refactor

**Status:** Accepted  
**Date:** 2026-03-01  
**Owner:** Guitar Chord Knowledge Base (GCKB)

---

## Context

Issue #237 requested an evidence-based review of how `AGENTS.md` works in
practice, what causes friction, and how to tighten it without weakening legal
and provenance safeguards.

The repository also has detailed workflow prompts in `planning/prompts/*`,
which overlap with parts of the old AGENTS policy.

## Findings

### What worked well

- Legal/copyright boundaries were explicit and practical.
- Provenance requirements were clear and enforceable.
- Determinism/schema/quality-gate expectations were high-signal.
- Branch and commit conventions were useful and consistently applicable.

### What did not work well

- AGENTS duplicated detailed execution workflow that already exists in prompt
  runbooks, creating maintenance overhead.
- The file mixed policy with procedural detail, making precedence ambiguous.
- Some wording was stale (`MVP`) and terminology was inconsistent
  (`variation` vs `voicing`).
- The large surface area increased the chance of conflicts with prompt-level
  instructions and contributor docs.

## Decision

Refactor `AGENTS.md` into a slimmer policy document that:

- keeps legal/provenance constraints explicit and non-negotiable
- preserves deterministic/data-contract/quality-gate requirements
- references prompt runbooks for detailed execution steps
- standardizes internal terminology to `voicing`
- removes stale active `MVP` framing from AGENTS policy text

## Consequences

Positive:

- lower instruction conflict risk between AGENTS and prompt runbooks
- clearer division between policy (`AGENTS.md`) and procedure (`planning/prompts`)
- easier maintenance of agent guidance over time

Tradeoff:

- contributors/agents must follow cross-references to get detailed procedures
  (intentional; this keeps AGENTS high-signal)

## Implementation Notes

- `AGENTS.md` was rewritten to policy-only scope.
- `README.md` cross-references were updated to point to prompt runbooks for
  step-by-step autonomous operation details.
- Legal/provenance constraints remained explicit in AGENTS and README.

## Follow-ups

- Issue #232 continues broader terminology/governance cleanup across remaining
  docs and historical references where `MVP` appears intentionally.
