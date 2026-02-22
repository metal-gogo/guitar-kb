# Issue: Parser Resilience Expansion (guitar-chord.org)

**GitHub Issue:** https://github.com/metal-gogo/guitar-kb/issues/31

## Summary
Harden the `guitarChordOrg` parser against HTML layout variations and partial/missing nodes using fixture-driven tests.

## Why
Upstream site changes are a high regression risk for scraping-based ingestion.

## Scope
- Add fixture variants representing realistic HTML drift.
- Test parser behavior for missing optional sections.
- Ensure structured parser errors instead of crashes.
- Verify deterministic output shape on degraded inputs.

## Acceptance Criteria
- Parser test matrix includes success + degraded fixture scenarios.
- No unhandled exceptions for fixture variants.
- Parsed output remains schema-compatible where data exists.

## Validation Steps
```bash
npm test -- test/unit/parser.guitarChordOrg.test.ts
npm run validate
```

## Follow-ups
- Add fixture update policy for future source-site drift.
