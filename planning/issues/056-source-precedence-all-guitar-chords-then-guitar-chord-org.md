# Issue: Source Precedence — all-guitar-chords First, Then guitar-chord-org

## Triage Labels

- `status/backlog`
- `priority/p1`
- `area/ingest`

**Depends on**: #055 — target matrix and default ingest selection must be stable first

## Summary

Enforce deterministic source priority during ingest: parse and merge
`all-guitar-chords` first, then `guitar-chord-org`, while preserving fallback
behavior when source pages are missing.

## Scope

- Add explicit source priority policy in pipeline and docs.
- Ensure merge order is deterministic and independent from URL iteration order.
- Preserve resilience: if the higher-priority source lacks a chord/quality page,
  fall back to available lower-priority source data.
- Add tests asserting source order and fallback behavior.

## Acceptance Criteria

- [ ] Pipeline enforces `all-guitar-chords` as the first merge source.
- [ ] Missing-page fallback still yields valid records when a lower-priority source has data.
- [ ] Source merge order is deterministic across repeated runs.
- [ ] `npm test -- test/unit/pipelineIdempotency.test.ts test/unit/cache.test.ts` exits `0`.
- [ ] `npm run ingest -- --dry-run` exits `0`.

## Validation Steps

```bash
npm test -- test/unit/pipelineIdempotency.test.ts test/unit/cache.test.ts
npm run ingest -- --dry-run
```

Expected outcome:
- Commands exit `0`.
- Merge behavior follows source priority with deterministic fallback.

