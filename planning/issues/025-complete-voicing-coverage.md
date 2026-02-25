# Issue: Complete Voicing Coverage — Ingest All Variations Per Chord

**GitHub Issue:** https://github.com/metal-gogo/guitar-kb/issues/60  
**Roadmap batch:** Pre-Expansion Fixes  
**Priority:** P0  
**Depends on:** issues 022–024 (URL fixes + SVG labels) complete  
**Must be done before:** issue 026 (quality map expansion) and any coverage growth

---

## Summary

The current ingest pipeline captures only a small subset of voicings per chord
page. For example, `https://all-guitar-chords.com/chords/index/c/m7` shows
9 variations, but the system stores only 4. This pattern likely affects all
parsed chords across both sources.

All voicing variations available on a source page must be ingested, normalized,
and included in generated outputs.

## Why

A chord knowledge base with incomplete voicings is misleading — it implies
coverage that doesn't exist. Players looking for specific voicing types (open,
barre, upper register) may not find them if the parser only captures the first
N entries. This gap must be closed before expanding to new roots and qualities,
otherwise the problem multiplies.

## Scope

### Diagnosis

- Audit the current parsers (`src/ingest/parsers/`) to understand where voicing
  count is being limited — possibilities include:
  - a hard-coded voicing limit (e.g., `slice(0, 4)`)
  - a CSS/DOM selector that only matches a primary voicing block
  - pagination or tab structure on the source page not being traversed
- Check both parsers: `guitarChordOrg` and `allGuitarChords`.
- Document the actual voicing count available per MVP chord page vs. what is
  currently captured (create a count table in this issue or a comment).

### Fix

- Remove or raise any hard-coded voicing limits in the parsers.
- Ensure the DOM selector covers all voicing entries on the page (including
  those in secondary tabs, expandable sections, or paginated lists if applicable).
- If a source page uses JavaScript-rendered content that isn't present in
  the cached HTML, document the limitation and capture as many
  statically-available voicings as possible.
- Re-fetch and update cached HTML fixtures under `data/sources/` with pages
  that contain the full voicing set (use `--refresh`).
- Update parser snapshot tests to assert the expected voicing count against
  the refreshed fixtures.

### Validation

- After the fix, `npm run build` should produce voicing counts that match (or
  closely match) the count shown on each source page.
- Add a voicing coverage assertion in `test/unit/mvpSuite.test.ts` (or a new
  `coverageSuite.test.ts`) that enforces minimum voicing counts per MVP chord
  (e.g., ≥ 6 voicings for C major across both sources combined).

## Acceptance Criteria

- All voicings visible in the static HTML of each source page are ingested for
  the MVP chord set (C, Cm, C7, Cmaj7).
- Voicing count for C min7 from all-guitar-chords is ≥ 9 (matching the page).
- Parser tests assert expected voicing counts against refreshed fixtures.
- `npm run build && npm run validate` passes with the expanded voicing set.
- No regression on canonical IDs, provenance, or schema validation.

## Validation Steps

```bash
npm run ingest -- --refresh
npm run build
npm run validate
npm test -- test/unit/parser.allGuitarChords.test.ts
npm test -- test/unit/parser.guitarChordOrg.test.ts
npm test -- test/unit/mvpSuite.test.ts
# Check voicing count in output:
node -e "const l=require('fs').readFileSync('data/chords.jsonl','utf8').split('\n').filter(Boolean).map(JSON.parse); l.forEach(c=>console.log(c.id, c.voicings.length))"
```

## Follow-ups

- Once all roots are expanded (issue 027), apply the same voicing-completeness
  check to all new chord pages.
- Consider adding a voicing-count sanity check to `npm run validate` so future
  parser regressions are caught immediately.
