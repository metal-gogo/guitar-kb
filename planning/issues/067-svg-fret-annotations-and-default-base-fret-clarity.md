# Issue: SVG Fret Annotations and Default Base-Fret Clarity

## Triage Labels

- `status/backlog`
- `priority/p0`
- `area/docs-svg`

**Depends on**: #058 — stable voicing IDs simplify deterministic SVG regression expectations

## Summary

Improve SVG chord diagram clarity so each voicing explicitly communicates fret
positions and playable layout, including clear default handling for base fret 1.

## Scope

- Audit current SVG output for missing/ambiguous fret indicators.
- Update diagram rendering to make fret placement explicit for all voicings
  (including when base fret is 1).
- Ensure diagrams consistently communicate which frets are played on each string.
- Keep accessibility semantics (`aria-label`, readable labels) intact.
- Add regression tests for representative open and high-position voicings.

## Acceptance Criteria

- [ ] SVG diagrams show unambiguous fret-position information for all generated voicings.
- [ ] Base-fret handling is explicit and deterministic (defaulting to fret 1 when not offset).
- [ ] Existing open/muted indicators remain correct (`O`/`X` semantics preserved).
- [ ] Accessibility tests continue passing.
- [ ] `npm test -- test/unit/svg.test.ts test/unit/a11y.test.ts` exits `0`.
- [ ] `npm run build` exits `0`.

## Validation Steps

```bash
npm test -- test/unit/svg.test.ts test/unit/a11y.test.ts
npm run build
```

Expected outcome:
- Commands exit `0`.
- Generated diagrams consistently express playable frets and base-fret context.

