# Issue: Parser Resilience Expansion (all-guitar-chords)

**GitHub Issue:** https://github.com/metal-gogo/guitar-kb/issues/32

## Summary
Harden the `allGuitarChords` parser with additional fixture coverage and fallback behavior assertions.

## Why
Parser robustness must survive minor DOM changes while preserving deterministic output.

## Scope
- Add multiple fixture variants (structure changes, missing labels, altered wrappers).
- Validate fallback extraction rules.
- Ensure parser returns predictable data or structured errors.
- Keep behavior deterministic across runs.

## Acceptance Criteria
- Expanded parser tests pass across fixture matrix.
- Failures are explicit and actionable.
- No nondeterministic parsing behavior introduced.

## Validation Steps
```bash
npm test -- --run test/unit/parser.allGuitarChords.test.ts
npm run validate
```

## Follow-ups
- Add parser drift monitoring hooks if source refresh cadence increases.
