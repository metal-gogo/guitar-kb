# Issue: Voicing Position Metadata — Open / Barre / Upper

**GitHub Issue:** https://github.com/metal-gogo/guitar-kb/issues/66  
**Roadmap batch:** Post-Hardening Expansion (ADR-0005)  
**Priority:** P1  
**Depends on:** issue 026 (quality map), issue 032 (voicing validation guards)

---

## Summary

Add a `position` field to voicing records classifying each voicing as `open`,
`barre`, `upper`, or `unknown`. Derive `position` heuristically from fret data
during normalization and update the schema to accept the new field.

## Why

Position metadata helps guitar players filter voicings by type (e.g., "show me
only open chord voicings") and helps LLMs answer questions about playability and
difficulty. Without position labels the voicing set is undifferentiated.

## Scope

- Add `position` to the `Voicing` type in `src/types/model.ts`:
  ```ts
  type VoicingPosition = "open" | "barre" | "upper" | "unknown";
  interface Voicing {
    // ...existing fields
    position: VoicingPosition;
  }
  ```
- Implement `derivePosition(frets: (number | null)[]): VoicingPosition` in
  `src/ingest/normalize/`:
  - `open` — contains at least one open string (fret = 0) AND no fret > 5
  - `barre` — lowest fret ≥ 1 AND at least 4 strings fretted at the same fret
  - `upper` — lowest non-muted fret ≥ 5 AND is not classified as barre
  - `unknown` — otherwise
- Apply `derivePosition` in the normalization pipeline.
- Update `chords.schema.json` to add `position` as a required voicing field
  with enum `["open","barre","upper","unknown"]`.
- Add unit tests covering all four position heuristic branches.
- Add model guard for `VoicingPosition` in `src/types/guards.ts`.

## Acceptance Criteria

- Every voicing record carries a `position` field.
- `npm run validate` enforces `position` as required.
- Position heuristic tests cover open, barre, upper, and unknown cases.
- Model guard correctly narrows `VoicingPosition` union.
- No regression on MVP chord tests.

## Validation Steps

```bash
npm test -- test/unit/normalize.test.ts
npm run build
npm run validate
npm test
```

## Follow-ups

- Expose `position` as a CLI filter flag (issue 033).
- Add a `difficulty` heuristic derived from position + fret spread in a future issue.
