# Issue: SVG Diagram Enhancements — String Labels and Fret Numbers

**GitHub Issue:** https://github.com/metal-gogo/guitar-kb/issues/59  
**Roadmap batch:** Pre-Expansion Fixes  
**Priority:** P0  
**Must be done before:** coverage expansion (issues 022+), so all diagrams benefit

---

## Summary

SVG chord diagrams are missing two key visual elements:

1. **String name labels** — E A D G B E (low to high) displayed below or above
   the nut so readers immediately know which string each column represents.
2. **Fret number labels** — the starting fret number displayed beside the
   diagram (e.g., `5`, `6`, `7`, `8` for a barre chord starting at fret 5),
   so that the diagram is self-explanatory without needing the surrounding text.

## Why

Without string labels, a reader must already know that standard tuning is
EADGBE. Without fret numbers, a barre-chord diagram is ambiguous — the player
doesn't know where on the neck to position it. Both omissions make diagrams
harder to read for humans and harder to interpret programmatically.

## Scope

### String labels

- Add string name labels (`E`, `A`, `D`, `G`, `B`, `E`) to the generated SVG.
- Display below the bottom of the diagram (below the last fret row) or
  above the nut — choose the position that is most readable at compact sizes.
- Labels should be centered under/over each string column.
- The label set should be derived from the tuning stored on the chord record,
  not hard-coded, so non-standard tunings work correctly in future.
- For MVP (standard tuning), the label order from low to high: E A D G B E.
  In a left-to-right diagram (string 6 leftmost), the display order is:
  E A D G B E (left → right).

### Fret number labels

- When `base_fret` (or equivalent) > 1, display the fret number beside the
  diagram (left or right edge).
- For a diagram showing frets 5–8 with `base_fret = 5`, display `5` at the
  top fret row and optionally `8` at the bottom row, or just display `5fr`
  (choose a clear convention and document it).
- When `base_fret = 1` (open position), no fret number label is needed (the
  nut line already implies position 1).

### Implementation

- Update `src/build/svg/generateSvg.ts` to render both additions.
- Update SVG snapshot tests in `test/unit/svg.test.ts` to include string
  labels and fret labels in expected output.
- Ensure deterministic output is not broken (labels must not introduce
  unstable positioning or IDs).
- Verify diagram dimensions are adjusted to accommodate labels without
  clipping existing content.

## Acceptance Criteria

- Every generated SVG for standard-tuning chords includes `E A D G B E`
  string labels in the correct column order.
- Every generated SVG for chords with `base_fret > 1` includes a visible
  fret number label.
- Open-position diagrams (`base_fret = 1`) do not show a redundant `1fr`
  label (or consistently show if chosen — document the convention).
- SVG snapshot tests are updated and pass.
- `npm run build` produces diagrams with both new label types.
- Determinism test (`test/unit/determinism.test.ts`) passes unchanged.

## Validation Steps

```bash
npm run build
npm test -- test/unit/svg.test.ts
npm test -- test/unit/determinism.test.ts
# Visually inspect a generated diagram:
open docs/diagrams/chord__C__maj__v2__guitar-chord-org.svg  # barre chord at fret 8
open docs/diagrams/chord__C__maj__v1__guitar-chord-org.svg  # open chord
```

## Follow-ups

- Add left-hand/right-hand mirror mode for the SVG generator in a later issue.
- Add finger number labels inside fret dots (issue is separate from position labels).
- Review label font size and accessibility once issue 019 (SVG accessibility
  baseline) is complete.
