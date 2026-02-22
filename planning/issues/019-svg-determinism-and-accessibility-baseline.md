# Issue: SVG Determinism & Accessibility Baseline

**GitHub Issue:** https://github.com/metal-gogo/guitar-kb/issues/35

## Summary
Strengthen SVG generation tests for deterministic output and establish minimal accessibility metadata expectations.

## Why
SVG diagrams are core outputs; unstable rendering or inaccessible markup reduces quality and trust.

## Scope
- Add deterministic snapshot assertions for representative voicings.
- Validate structural invariants (fret markers, strings, labels).
- Define baseline accessibility requirements (e.g., title/desc policy).
- Ensure generated SVG remains lightweight and reproducible.

## Acceptance Criteria
- Repeated generation produces stable SVG output for fixed inputs.
- Tests catch structural SVG regressions.
- Accessibility baseline policy is documented and enforced.

## Validation Steps
```bash
npm test -- --run test/unit/svg.test.ts
npm run build
```

## Follow-ups
- Expand accessibility policy if diagrams become interactive.
