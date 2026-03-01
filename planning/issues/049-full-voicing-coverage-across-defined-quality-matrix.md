# Issue: Full Voicing Coverage Across Defined-Quality Matrix

## Triage Labels

- `status/in-progress`
- `priority/p0`
- `area/ingest`

**Depends on**: #041 — parser quality extraction baseline must be in place
**Depends on**: #042 — normalization must stabilize canonical IDs/aliases first

## Summary

Ensure ingest captures all statically available voicings for each chord across
all defined qualities, with deterministic ordering and no parser-side truncation.

## Scope

- Audit both source parsers for voicing truncation logic and remove hard caps.
- Add deterministic voicing count assertions for representative chord-quality
  targets across both sources.
- Ensure voicing IDs/order are deterministic and stable across repeated runs.
- Preserve provenance for every voicing record (`source_refs` at voicing level).
- Document voicing completeness expectations in contributor docs.

## Acceptance Criteria

- [x] No parser-imposed voicing cap remains for defined-quality targets.
- [x] Representative regression tests assert complete voicing extraction against fixtures.
- [x] Repeated ingest/build runs produce stable voicing counts and ordering.
- [x] `npm test -- test/unit/parser.guitarChordOrg.test.ts test/unit/parser.allGuitarChords.test.ts test/unit/pipelineIdempotency.test.ts` exits `0`.
- [x] `npm run ingest && npm run build && npm run validate` exits `0`.
- [ ] All Copilot inline review comments addressed
- [ ] `require-copilot-review` CI check green before merge

## Validation Steps

```bash
npm test -- test/unit/parser.guitarChordOrg.test.ts test/unit/parser.allGuitarChords.test.ts test/unit/pipelineIdempotency.test.ts
npm run ingest && npm run build && npm run validate
```

Expected outcome:
- Both commands exit `0`.
- Ingest/build output shows deterministic voicing completeness with no truncation regressions.

## Execution Notes

- 2026-03-01: Implemented on branch `feat/49-full-voicing-coverage` with all local quality gates passing.
- 2026-03-01: `gh pr create` could not reach `api.github.com`; PR draft captured in `planning/prs/049-full-voicing-coverage.md`.
