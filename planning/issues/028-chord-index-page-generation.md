# Issue: Chord Index Page Generation

**Roadmap batch:** Post-Hardening Expansion (ADR-0005)  
**Priority:** P1  
**Depends on:** issue 023 (full root coverage)

---

## Summary

Add a build step that generates `docs/index.md` — a top-level navigable
index listing all chord pages grouped by root, sorted in deterministic
root/quality order per ADR-0001 §5.

## Why

With 40–100+ chord pages, the `docs/chords/` directory is not browsable
without an index. Both human readers and LLM retrieval pipelines benefit from a
structured entry point that maps available chord IDs to individual pages.

## Scope

- Add an index generation step to `src/build/docs/generateDocs.ts` (or a
  dedicated `generateIndex.ts` module).
- Output path: `docs/index.md` (treated as a generated file per ADR-0004).
- Index structure:
  - H1 title: "Chord Index"
  - Grouped by root in ADR-0001 §5 sort order
  - Each root group lists available qualities as Markdown links to chord pages
  - Include chord alias(es) and formula in parens for quick reference
- Add `docs/index.md` to `.gitignore` (generated output).
- Add tests in `docs.test.ts` asserting:
  - index file is generated
  - all chord pages appearing in `docs/chords/` have a link in the index
  - index ordering is stable across identical builds

## Acceptance Criteria

- `npm run build` produces `docs/index.md`.
- Index contains one link per chord page, grouped by root, in deterministic order.
- Test fails if a chord page exists but is missing from the index.
- Repeated builds produce identical `docs/index.md` content for identical inputs.

## Validation Steps

```bash
npm run build
cat docs/index.md
npm test -- test/unit/docs.test.ts
```

## Follow-ups

- Add a quality-grouped view (all maj chords, all min chords, etc.) as an
  alternative index layout in a later issue.
- Add a "related chords" section to individual pages (issue 030).
