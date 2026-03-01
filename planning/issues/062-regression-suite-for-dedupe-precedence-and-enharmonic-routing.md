# Issue: Regression Suite for Dedupe, Source Precedence, and Enharmonic Routing

## Triage Labels

- `status/backlog`
- `priority/p1`
- `area/ci-test`

**Depends on**: #057 — dedupe behavior must exist before regression locking
**Depends on**: #058 — voicing ID policy must be final before snapshot expectations
**Depends on**: #059 — site alias routing/toggle behavior must be implemented
**Depends on**: #061 — deploy ingest policy checks must be available

## Summary

Add durable tests and snapshots to lock new behavior around source priority,
voicing dedupe/ID sequencing, enharmonic routing, and deploy-time cache policy.

## Scope

- Expand normalization and pipeline tests for source-priority merge + dedupe.
- Add snapshot tests for representative chord records after dedupe and reindexing.
- Add site tests for flat/sharp display behavior and enharmonic alias resolution.
- Add CI-facing tests for cache completeness/deploy gating behavior.

## Acceptance Criteria

- [ ] Regression tests fail on source-order, dedupe, or voicing-ID regressions.
- [ ] Regression tests fail on enharmonic alias routing regressions in generated site outputs.
- [ ] Snapshot expectations are deterministic across repeated runs.
- [ ] `npm test` exits `0`.
- [ ] `npm run build && npm run validate` exits `0`.

## Validation Steps

```bash
npm test
npm run build && npm run validate
```

Expected outcome:
- Commands exit `0`.
- Core behavior from this wave is locked by regression coverage.

