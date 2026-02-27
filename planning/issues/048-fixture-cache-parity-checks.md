# Issue: Fixture-Cache Parity Checks

## Triage Labels

- `status/backlog`
- `priority/p1`
- `area/ingest`

**Depends on**: #038 — parity rules must reflect expanded target matrix

## Summary

Add automated parity checks to detect drift between ingest targets, cached
source HTML under `data/sources/`, and parser fixtures under `test/fixtures/`.

## Scope

- Add parity validation logic for:
  - target slug existence in cache directories
  - expected fixture presence for parser-covered scenarios
  - deterministic missing/extra listing for diagnostics
- Add unit tests and fixture/cache parity snapshots for a representative subset.
- Document parity expectations in `docs/contributing/parser-fixtures.md`.

## Acceptance Criteria

- [ ] Parity checks detect missing/extra cache or fixture entries deterministically.
- [ ] Test suite includes parity assertions for representative targets.
- [ ] `npm test -- test/unit/cache.test.ts test/unit/parser.invariants.test.ts` exits `0`.
- [ ] `npm run lint` exits `0`.

## Validation Steps

```bash
npm test -- test/unit/cache.test.ts test/unit/parser.invariants.test.ts
npm run lint
```

Expected outcome:
- Both commands exit `0`.
- Parity diagnostics are deterministic and actionable when drift occurs.
