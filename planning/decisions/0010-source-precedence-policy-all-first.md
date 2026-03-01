# ADR-0010: Source Precedence Policy (all-guitar-chords First)

**Status:** Accepted  
**Date:** 2026-03-01  
**Owner:** Guitar Chord Knowledge Base (GCKB)

## Context

Issue #225 requires deterministic merge precedence between the two active sources
when both provide a page for the same chord target.

Without explicit precedence, voicing provenance and ordering can drift based on
input iteration order.

## Decision

Adopt a fixed precedence order for ingest target selection and execution:

1. `all-guitar-chords`
2. `guitar-chord-org`

Implementation requirements:

- Target selection is sorted deterministically by canonical chord ID, then by
  source precedence, then by stable tie-breakers.
- Missing high-priority pages (`HTTP 404`) do not fail ingest; lower-priority
  sources are still processed when available.
- Source registry order mirrors precedence order to avoid ambiguity.

## Consequences

Positive:

- merge behavior is deterministic across runs
- fallback behavior stays resilient for sparse source coverage
- provenance reflects explicit policy instead of incidental iteration order

Tradeoff:

- existing tests that depended on previous source ordering must be updated

## Validation

- `npm test -- test/unit/pipelineIdempotency.test.ts test/unit/cache.test.ts`
- `npm run ingest -- --dry-run`
