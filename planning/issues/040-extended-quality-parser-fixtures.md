# Issue: Extended-Quality Parser Fixtures

## Triage Labels

- `status/backlog`
- `priority/p0`
- `area/ingest`

**Depends on**: #038 — fixture set must match expanded target/quality matrix
**Suggested after**: #039 — align fixtures to capability reporting semantics

## Summary

Add minimal parser fixtures for extended-quality pages and targeted failure
cases so parser behavior is testable offline for the expanded chord set.

## Scope

- Add original (non-copied) minimal HTML fixtures for new quality cases in:
  - `test/fixtures/sources/guitar-chord-org/`
  - `test/fixtures/sources/all-guitar-chords/`
- Ensure fixture coverage includes every defined non-core quality (`min7`,
  `dim`, `dim7`, `aug`, `sus2`, `sus4`) per source.
- Add edge fixtures for malformed/partial extended-quality markup.
- Add representative high-variation fixtures to validate full voicing capture.
- Update parser tests to consume the new fixtures.
- Update `docs/contributing/parser-fixtures.md` fixture inventory.

## Acceptance Criteria

- [ ] Fixture set includes at least one happy-path sample per new quality per source.
- [ ] Fixture set includes explicit edge/failure fixtures for extended qualities.
- [ ] Fixture set includes at least one multi-voicing fixture per source to verify non-truncated parsing.
- [ ] Parser unit tests reference every newly added fixture.
- [ ] `npm test -- test/unit/parser.guitarChordOrg.test.ts test/unit/parser.allGuitarChords.test.ts` exits `0`.

## Validation Steps

```bash
npm test -- test/unit/parser.guitarChordOrg.test.ts test/unit/parser.allGuitarChords.test.ts
```

Expected outcome:
- Command exits `0`.
- New fixtures are covered by parser tests with deterministic assertions.
