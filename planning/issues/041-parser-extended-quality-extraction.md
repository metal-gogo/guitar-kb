# Issue: Parser Extended-Quality Extraction

## Triage Labels

- `status/backlog`
- `priority/p0`
- `area/ingest`

**Depends on**: #039 — capability metadata defines expected parser coverage
**Depends on**: #040 — fixtures provide deterministic parser test inputs

## Summary

Upgrade both source parsers to reliably extract extended-quality chord records
and voicings while preserving deterministic output and provenance fields.

## Scope

- Extend `parseGuitarChordOrg` and `parseAllGuitarChords` quality extraction for
  `min7`, `dim`, `dim7`, `aug`, `sus2`, and `sus4`.
- Keep voicing extraction complete and stable for each parsed chord page with
  no quality-specific truncation.
- Improve parser error context with source id + target URL + quality token.
- Preserve `source_refs` on every emitted chord and voicing.

## Acceptance Criteria

- [ ] Both parsers emit normalized-ready records for supported extended-quality targets.
- [ ] Parser output covers all defined qualities present in configured sources.
- [ ] Parser errors include structured context for debugging failures.
- [ ] No regressions on existing core-quality parser tests.
- [ ] `npm test -- test/unit/parser.guitarChordOrg.test.ts test/unit/parser.allGuitarChords.test.ts test/unit/parser.invariants.test.ts` exits `0`.
- [ ] `npm run ingest -- --dry-run --chord chord:C:min7` exits `0`.
- [ ] All Copilot inline review comments addressed
- [ ] `require-copilot-review` CI check green before merge

## Validation Steps

```bash
npm test -- test/unit/parser.guitarChordOrg.test.ts test/unit/parser.allGuitarChords.test.ts test/unit/parser.invariants.test.ts
npm run ingest -- --dry-run --chord chord:C:min7
```

Expected outcome:
- Both commands exit `0`.
- Dry-run no longer treats supported extended-quality targets as parser failures.
