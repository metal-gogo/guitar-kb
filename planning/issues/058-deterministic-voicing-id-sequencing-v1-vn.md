# Issue: Deterministic Voicing ID Sequencing (`v1..vN`)

## Triage Labels

- `status/backlog`
- `priority/p1`
- `area/normalize`

**Depends on**: #057 — dedupe behavior must settle final voicing set before ID sequencing

## Summary

Reindex voicings per canonical chord using a deterministic sequence (`v1`, `v2`,
`v3`, ...), removing source-specific suffixes from stable voicing IDs.

## Scope

- Define deterministic sort key for final voicing ordering before ID assignment.
- Assign IDs as contiguous `v1..vN` with no gaps.
- Remove source-specific suffixes from voicing IDs in outputs.
- Ensure docs/SVG/site generation still reference the new voicing IDs correctly.
- Add regression tests for ID stability across repeated runs.

## Acceptance Criteria

- [ ] Every chord record emits voicing IDs in contiguous `v1..vN` order.
- [ ] ID assignment is deterministic across repeated ingest/build runs.
- [ ] Existing docs/SVG/site generation works with source-agnostic voicing IDs.
- [ ] `npm test -- test/unit/pipelineIdempotency.test.ts test/unit/determinism.test.ts test/unit/svg.test.ts` exits `0`.
- [ ] `npm run build && npm run validate` exits `0`.
- [ ] All Copilot inline review comments addressed
- [ ] `require-copilot-review` CI check green before merge

## Validation Steps

```bash
npm test -- test/unit/pipelineIdempotency.test.ts test/unit/determinism.test.ts test/unit/svg.test.ts
npm run build && npm run validate
```

Expected outcome:
- Commands exit `0`.
- Voicing IDs are deterministic, source-agnostic, and contiguous.

