# Issue: Source Expansion Scaffold — Typed Source Registry

**GitHub Issue:** https://github.com/metal-gogo/guitar-kb/issues/64  
**Roadmap batch:** Post-Hardening Expansion (ADR-0005)  
**Priority:** P1  
**Depends on:** issues 015–016 (parser resilience) complete

---

## Summary

Refactor the current ad-hoc source list into a typed source registry. Adding a
new source should require only registering an entry (name, base URL, parser
reference, slug pattern) without editing pipeline core logic.

## Why

The current pipeline couples source identity to the ingest loop via hard-coded
references. Adding a third source today requires editing the pipeline core,
which violates the open/closed principle and risks regressions on existing
sources. A typed registry isolates source-specific configuration from the
pipeline orchestration.

## Scope

- Define a `SourceRegistryEntry` type in `src/types/model.ts` (or a dedicated
  `src/types/sources.ts`):
  ```ts
  interface SourceRegistryEntry {
    id: string;           // e.g. "guitar-chord-org"
    displayName: string;
    baseUrl: string;
    cacheDir: string;     // path under data/sources/
    parse: ParserFn;      // existing parser function signature
  }
  ```
- Create `src/ingest/sourceRegistry.ts` exporting a typed `SOURCE_REGISTRY`
  array containing the two existing sources.
- Refactor `src/ingest/pipeline.ts` to iterate over `SOURCE_REGISTRY` instead
  of hard-coded source references.
- Add a test asserting that each registered source has a valid parser function
  and required fields.
- Add a dry-run fixture test simulating a hypothetical third source using a
  stub parser and fixture HTML.

## Acceptance Criteria

- Adding a new source requires only a new `SOURCE_REGISTRY` entry; no edits to
  `pipeline.ts` are needed.
- Existing ingest behavior is unchanged for the two current sources.
- Registry entry validation test passes.
- Dry-run stub test demonstrates the registry pattern works end-to-end.

## Validation Steps

```bash
npm test
npm run ingest
npm run build
npm run validate
```

## Follow-ups

- Use this registry in issue 029 (CLI ergonomic `--source` filter).
- Document the add-a-source guide in `CONTRIBUTING.md` after this merges.
