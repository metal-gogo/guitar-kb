# Issue: Quality Map Expansion — min7, dim7, aug, sus2, sus4

**Roadmap batch:** Post-Hardening Expansion (ADR-0005)  
**Priority:** P0  
**Depends on:** issues 015–020 complete

---

## Summary

Extend the normalization quality map to cover the next tier of chord qualities:
`min7`, `dim` (alias), `dim7`, `aug`, `sus2`, and `sus4`. This is the foundation
for expanding chord coverage beyond the MVP 4-chord set.

## Why

The current quality map (ADR-0001) deliberately limits scope to `maj`, `min`, `7`,
and `maj7`. That constraint must be lifted to support a real chord library. Quality
mapping must exist before root coverage can be expanded (issue 023), since the
normalization engine would otherwise emit unknown-quality errors on valid inputs.

## Scope

- Add quality aliases and canonical strings to the normalization map in
  `src/ingest/normalize/`.
- Add quality map entries for:
  - `min7` — aliases: `m7`, `minor7`, `-7`
  - `dim` — aliases: `diminished`, `°`, `o`
  - `dim7` — aliases: `diminished7`, `°7`, `o7`
  - `aug` — aliases: `augmented`, `+`, `aug`
  - `sus2` — aliases: `suspended2`, `sus2`
  - `sus4` — aliases: `suspended4`, `sus4`, `sus`
- Update `chords.schema.json` enum if `quality` field is enumerated.
- Add unit tests covering all new canonical qualities and their common aliases.
- Confirm canonical IDs follow ADR-0001 (`chord:<ROOT>:<QUALITY>`) for new qualities.
- Confirm no existing chord records are broken by the map expansion.

## Acceptance Criteria

- `normalize.test.ts` covers all 6 new qualities with at least 2 alias variants each.
- Schema accepts all new canonical quality strings.
- Existing MVP chord tests (`mvpSuite.test.ts`) continue to pass unchanged.
- No quality alias silently drops through to an `unknown` bucket.

## Validation Steps

```bash
npm test -- test/unit/normalize.test.ts
npm run build
npm run validate
npm test
```

## Follow-ups

- Extend quality map further (e.g., `add9`, `6`, `9`, `11`, `13`) in a later issue.
- Update ADR-0001 quality table with new entries once this issue merges.
