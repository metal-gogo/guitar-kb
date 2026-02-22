# Issue: Docs Generator Completeness & Deterministic Ordering

**GitHub Issue:** https://github.com/metal-gogo/guitar-kb/issues/34

## Summary
Add quality gates for generated chord docs to ensure required sections and stable ordering.

## Why
Docs are a primary human-facing artifact and must remain complete and reproducible.

## Scope
- Assert required sections per chord page (ID, aliases, formula, notes, voicings, provenance).
- Assert deterministic ordering of voicings and references.
- Verify diagram links are generated consistently.
- Add regression tests for docs generation.

## Acceptance Criteria
- Docs tests fail if required sections are missing.
- Ordering is stable across identical builds.
- Link generation remains valid and deterministic.

## Validation Steps
```bash
npm test
npm run build
```

## Follow-ups
- Add docs index/navigation generation checks in later phase.
