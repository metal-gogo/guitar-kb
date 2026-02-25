# Issue: Full Root Coverage — All 12 Roots × Core Qualities

**GitHub Issue:** https://github.com/metal-gogo/guitar-kb/issues/62  
**Roadmap batch:** Post-Hardening Expansion (ADR-0005)  
**Priority:** P0  
**Depends on:** issue 026 (quality map expansion)

---

## Summary

Extend ingest targets (`MVP_TARGETS` in `src/config.ts`) to all 12 chromatic
roots — C, C#/Db, D, D#/Eb, E, F, F#/Gb, G, G#/Ab, A, A#/Bb, B — for the
core qualities: maj, min, 7, maj7 (and min7/dim/aug/sus2/sus4 once issue 026
is merged). Validate deterministic normalized output for the expanded set.

## Why

A chord knowledge base that covers only the root C is not a knowledge base —
it is a demo. Scaling to all 12 roots is the single most impactful coverage
expansion possible after fixing the quality map.

## Scope

- Update `src/config.ts` ingest target list to include all 12 roots × core
  qualities for both sources (`guitar-chord-org`, `all-guitar-chords`).
- Fetch and cache HTML fixtures under `data/sources/<source>/` for new targets.
- Verify parser output for a representative sample (e.g., D, F#, Bb) of the
  new targets using existing parser tests.
- Confirm normalization emits canonical IDs correctly for all roots, including
  enharmonic pairs (C#/Db, D#/Eb, F#/Gb, G#/Ab, A#/Bb).
- Assert deterministic sort order in normalized output (ADR-0001 §5 root order).
- Update `mvpSuite.test.ts` or add a parallel `coverageSuite.test.ts` asserting
  all 12 roots × 4 core qualities appear in `chords.jsonl`.

## Acceptance Criteria

- `npm run build && npm run validate` succeeds with ≥48 chord records
  (12 roots × 4 qualities = 48; more if both sources contribute variants).
- Canonical IDs follow `chord:<ROOT>:<QUALITY>` for all 12 roots.
- Enharmonic pairs are distinct records with cross-references per ADR-0001 §2.
- Sort order in `chords.jsonl` matches ADR-0001 §5 root/quality ordering.
- At least one voicing per chord carries a valid `source_refs` entry.

## Validation Steps

```bash
npm run ingest
npm run build
npm run validate
npm test
```

## Follow-ups

- Add extended quality coverage (min7, dim, aug, sus2, sus4) once the quality
  map (issue 026) is in place — this issue can then be re-run with updated targets.
- Review fixture volume management policy as fixture count grows.
