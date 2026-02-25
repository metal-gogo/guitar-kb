# Issue: Fix all-guitar-chords.com Source URLs

**GitHub Issue:** https://github.com/metal-gogo/guitar-kb/issues/57  
**Roadmap batch:** Pre-Expansion Fixes  
**Priority:** P0  
**Must be done before:** issue 026 (quality map expansion) and any coverage growth

---

## Summary

The ingest URL pattern for all-guitar-chords.com is incorrect. The current
pattern generates URLs in the form:

```
https://www.all-guitar-chords.com/chords/c-major
```

The correct URL format is:

```
https://all-guitar-chords.com/chords/index/c/major
```

This means:
- The `www.` subdomain is wrong — the site serves without it.
- The path structure is wrong — chords use `/chords/index/<root>/<quality>`,
  not `/chords/<root>-<quality>`.

All `source_refs` URLs in generated records, cached HTML filenames, and ingest
config are affected.

## Why

Incorrect provenance URLs violate the data integrity requirement in `AGENTS.md §2.2`.
A reader or validator following a `source_refs.url` link gets a 404 or wrong page.
This bug will propagate to every new chord added in the expansion batch if not
fixed first.

## Scope

- Update URL construction logic in the all-guitar-chords source config/parser
  (`src/config.ts` or `src/ingest/parsers/`) to produce:
  `https://all-guitar-chords.com/chords/index/<root>/<quality>`
- Determine the correct root and quality slug format:
  - root: lowercase, e.g., `c`, `f-sharp`, `b-flat`
  - quality: lowercase, e.g., `major`, `minor`, `dominant-7th`, `major-7th`
  - Verify exact slug conventions against the live site.
- Re-fetch and update cached HTML fixtures under `data/sources/all-guitar-chords/`
  using the corrected URLs.
- Update parser snapshot tests in `test/unit/parser.allGuitarChords.test.ts`
  to use the refreshed fixtures.
- Confirm that all generated `source_refs` entries for all-guitar-chords records
  contain the corrected URLs after `npm run build`.
- Update `docs/chords/*.md` provenance sections to reflect corrected URLs.

## Acceptance Criteria

- All `source_refs` entries from `all-guitar-chords` source contain valid,
  accessible URLs in the `https://all-guitar-chords.com/chords/index/*` format.
- `npm run build && npm run validate` passes cleanly.
- Cached HTML fixtures are refreshed and committed.
- Parser tests pass against updated fixtures.
- No `www.all-guitar-chords.com` URLs appear in generated outputs.

## Validation Steps

```bash
npm run ingest -- --source all-guitar-chords --refresh
npm run build
npm run validate
npm test -- test/unit/parser.allGuitarChords.test.ts
# Spot-check URL in output:
grep "all-guitar-chords" data/chords.jsonl | head -5
```

## Follow-ups

- Add a URL format test in the parser test suite to assert output URLs match
  a known-correct pattern, catching future regressions.
- Once the source registry (issue 025) exists, URL pattern should be declared
  per-source in the registry entry.
