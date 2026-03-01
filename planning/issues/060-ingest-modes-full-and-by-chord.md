# Issue: Ingest Modes — Full Matrix and Chord-Targeted

## Triage Labels

- `status/backlog`
- `priority/p1`
- `area/ingest`

**Depends on**: #055 — default full-matrix target semantics must be in place first

## Summary

Provide explicit ingest command modes for operational workflows:

- full matrix ingest
- chord-targeted ingest
- optional source-restricted chord ingest

## Scope

- Introduce explicit CLI mode semantics for ingest (without breaking existing flags).
- Support targeted chord ingest by canonical root + quality and by canonical chord ID.
- Ensure targeted ingest remains deterministic and schema-valid.
- Document usage and examples in `README.md`.

## Acceptance Criteria

- [ ] CLI supports explicit full-matrix and chord-targeted ingest behavior.
- [ ] Existing `--chord` filter remains supported or is migrated with clear compatibility messaging.
- [ ] README includes exact examples for full ingest and per-chord ingest.
- [ ] `npm run ingest -- --dry-run` exits `0`.
- [ ] `npm run ingest -- --chord chord:Db:maj7 --dry-run` exits `0`.
- [ ] `npm run lint && npm test` exits `0`.

## Validation Steps

```bash
npm run ingest -- --dry-run
npm run ingest -- --chord chord:Db:maj7 --dry-run
npm run lint && npm test
```

Expected outcome:
- Commands exit `0`.
- Ingest workflows support both full and chord-targeted operations deterministically.

