# Issue: Deterministic Full-Pipeline Regression Gate

**GitHub Issue:** https://github.com/metal-gogo/guitar-kb/issues/28

## Summary
Add a regression test/check that runs the pipeline repeatedly on fixed inputs and verifies outputs are byte-stable.

## Why
Deterministic builds are a core project guarantee. Drift across identical runs breaks confidence and reproducibility.

## Scope
- Run build twice on same cached inputs.
- Compare generated JSONL and deterministic docs ordering.
- Fail on any output differences.
- Document deterministic sort keys and assumptions.

## Acceptance Criteria
- CI fails if outputs differ between identical runs.
- Determinism check is fast enough for PR workflow.
- Failure output is actionable.

## Validation Steps
```bash
npm test
npm run build
npm run build
npm run validate
```

## Follow-ups
- Extend deterministic check to expanded chord coverage later.
