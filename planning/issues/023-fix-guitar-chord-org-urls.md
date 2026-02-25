# Issue: Fix guitar-chord.org Source URLs

**Roadmap batch:** Pre-Expansion Fixes  
**Priority:** P0  
**Must be done before:** issue 022 (quality map expansion) and any coverage growth

---

## Summary

The ingest URL pattern for guitar-chord.org is incorrect. The current pattern
generates URLs in the form:

```
https://www.guitar-chord.org/c-major.html
```

The correct URL format is:

```
https://www.guitar-chord.org/c-maj.html
```

The quality slug differs: the site uses abbreviated quality names (`maj`, `min`,
`7`, `maj7`) rather than full English words (`major`, `minor`).

## Why

Incorrect provenance URLs violate `AGENTS.md §2.2`. A reader following a
`source_refs.url` link reaches a 404. This issue must be fixed before the
expansion batch adds more chords, otherwise every new record inherits the
wrong URL pattern.

## Scope

- Audit the quality → URL-slug mapping for guitar-chord.org. The pattern
  appears to be: `https://www.guitar-chord.org/<root>-<quality-slug>.html`
  where `<quality-slug>` uses abbreviated canonical forms, not full words.
  Confirm mapping for: maj, min, 7, maj7 (and any qualities added in issue 022).
  Expected examples:
  - C major → `c-maj.html`
  - C minor → `c-min.html`
  - C dominant 7 → `c-7.html`
  - C major 7 → `c-maj7.html`
- Update URL construction logic in the guitar-chord-org source config/parser
  (`src/config.ts` or `src/ingest/parsers/`) to use the corrected slug mapping.
- Re-fetch and update cached HTML fixtures under
  `data/sources/guitar-chord-org/` using the corrected URLs.
- Update parser snapshot tests in `test/unit/parser.guitarChordOrg.test.ts`
  to use the refreshed fixtures.
- Confirm all generated `source_refs` entries for guitar-chord-org records
  contain the corrected URLs after `npm run build`.
- Update `docs/chords/*.md` provenance sections to reflect corrected URLs.

## Acceptance Criteria

- All `source_refs` entries from `guitar-chord-org` source contain valid,
  accessible URLs matching the `https://www.guitar-chord.org/<root>-<slug>.html`
  pattern with abbreviated quality slugs.
- `npm run build && npm run validate` passes cleanly.
- Cached HTML fixtures are refreshed and committed.
- Parser tests pass against updated fixtures.
- No `*-major.html`, `*-minor.html`, or similar long-form quality URLs appear
  in generated outputs.

## Validation Steps

```bash
npm run ingest -- --source guitar-chord-org --refresh
npm run build
npm run validate
npm test -- test/unit/parser.guitarChordOrg.test.ts
# Spot-check URL in output:
grep "guitar-chord.org" data/chords.jsonl | head -5
```

## Follow-ups

- Add a URL format assertion to the parser test suite to catch future slug
  mapping regressions.
- Document the quality→slug mapping table in the source registry entry once
  issue 025 (source expansion scaffold) exposes per-source config.
