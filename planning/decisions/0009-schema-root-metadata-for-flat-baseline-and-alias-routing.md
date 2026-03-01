# ADR-0009: Schema Root Metadata for Flat Baseline and Alias Routing

**Status:** Accepted  
**Date:** 2026-03-01  
**Owner:** Guitar Chord Knowledge Base (GCKB)

---

## Context

Issue #223 requires explicit schema/model contracts for:

- flat-baseline canonical root storage metadata
- sharp/flat display alias metadata
- lookup-oriented enharmonic root routing data for docs/site consumers

The repository already stores canonical IDs and roots as currently ingested, so
introducing these contracts must not break existing records while migration of
canonical ID policy continues in follow-up work.

## Decision

Add non-breaking root metadata fields to the chord contract:

- `canonical_root`: flat-baseline canonical root (`C, Db, D, Eb, E, F, Gb, G, Ab, A, Bb, B`)
- `root_aliases`: deterministic lookup aliases (flat first; sharp alias second when present)
- `root_display`: display aliases for notation toggles (`flat` required, `sharp` optional)

Implementation details:

- `chords.schema.json` now defines and validates these fields (including
  `flatRoot` enum in `$defs`).
- `src/types/model.ts` and `src/types/guards.ts` include matching contracts and
  flat-baseline helper guards.
- `normalizeRecords()` now emits the metadata deterministically for every chord.

## Consequences

Positive:

- consumers can resolve sharp/flat spellings without guessing
- flat-baseline canonical root policy is explicit in machine-readable data
- schema snapshots now lock metadata shape to prevent regressions

Tradeoff:

- additional fields increase record surface area; downstream consumers should
  tolerate them

## Compatibility Notes

- This ADR intentionally uses additive schema changes only (no required-field
  break in existing external payloads).
- future migration work may tighten canonical ID/root constraints once the full
  flat-baseline canonicalization rollout is complete.
