# PR Draft: test: guard against voicing truncation across parser and pipeline flows

## Branch

- `feat/49-full-voicing-coverage`

## Base

- `main`

## Summary

- Adds new multi-voicing (`>3`) regression fixtures for both sources:
  - `test/fixtures/sources/.../c-major-many-voicings.html`
  - `data/sources/.../c-major-many-voicings.html`
- Adds parser tests to ensure all voicings are extracted (no truncation), with
  source-order and voicing-level provenance assertions.
- Extends parser invariant coverage to include the new multi-voicing fixture.
- Hardens pipeline idempotency tests to assert:
  - stable voicing ordering across repeated runs
  - stable voicing ordering across refresh/non-refresh runs
  - expected merged voicing count (`chord:C:maj` has 10 voicings from two
    five-voicing source records)
- Documents voicing completeness expectations in
  `docs/contributing/parser-fixtures.md`.
- Marks planning issue `049` as `status/in-progress` and checks validated
  acceptance items.

## Why

Issue `049` requires removing/guarding against parser-side voicing caps and
proving deterministic voicing completeness across repeated ingest/build flows.

## Validation Run

```bash
npm test -- test/unit/parser.guitarChordOrg.test.ts test/unit/parser.allGuitarChords.test.ts test/unit/pipelineIdempotency.test.ts
npm run lint
npm test
npm run build
npm run validate
```

## Known Limitations

- Validation still reports expected matrix coverage gaps for currently missing
  extended qualities (existing baseline behavior), but exits successfully.

## GitHub Command

```bash
gh pr create \
  --base main \
  --head feat/49-full-voicing-coverage \
  --title "test: guard against voicing truncation across parser and pipeline flows" \
  --body-file planning/prs/049-full-voicing-coverage.md
```
