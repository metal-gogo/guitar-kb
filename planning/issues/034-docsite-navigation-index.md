# Issue: Docsite Navigation Index — Cross-Links and Index Page

**GitHub Issue:** https://github.com/metal-gogo/guitar-kb/issues/69  
**Roadmap batch:** Post-Hardening Expansion (ADR-0005)  
**Priority:** P2  
**Depends on:** issue 028 (chord index page), issue 031 (voicing position metadata)

---

## Summary

Extend the docs generator to:
1. Emit cross-links on individual chord pages (enharmonic equivalents, related
   quality variants, and a "back to index" link).
2. Generate a root-grouped `docs/index.md` with quality sub-listings and
   brief formula summaries per chord.
3. Add regression tests for cross-link generation and index determinism.

## Why

Issue 028 generates a flat index. This issue upgrades it to a navigable
docsite with cross-links, making `docs/` genuinely useful as a browsable
reference without a static site generator or external reader. LLMs following
linked context also benefit from explicit enharmonic and quality-variant links.

## Scope

### Cross-links on chord pages

Each chord page (`docs/chords/<id>.md`) should gain a navigation footer
containing:
- **Back to index:** `[← Chord Index](../index.md)`
- **Enharmonic equivalents:** links to enharmonic canonical IDs where present
  (e.g., C# maj ↔ Db maj)
- **Related qualities:** links to same-root different-quality chords present
  in the generated set (e.g., from `chord:C:maj` → `chord:C:min`,
  `chord:C:7`, `chord:C:maj7`)

### Index page upgrade

Upgrade `docs/index.md` (from issue 024) to:
- Group by root with H2 headings
- List qualities under each root with alias and formula in parens
- Include relative link to each chord page

### Tests

- Assert cross-link footer is present on every chord page.
- Assert enharmonic links are bidirectional (if A links to B, B links to A).
- Assert index deterministic ordering across identical builds.
- Assert no broken relative links (destination file must exist).

## Acceptance Criteria

- Every chord page has a navigation footer with back-link and related quality links.
- Enharmonic cross-links are bidirectional and valid.
- Index page groups by root and includes formula summary.
- Tests catch missing or broken links before merge.
- Repeated `npm run build` produces identical cross-link content.

## Validation Steps

```bash
npm run build
npm test -- test/unit/docs.test.ts
# spot check a page:
cat docs/chords/chord__C__maj.md
```

## Follow-ups

- Add a quality-grouped index view (all maj chords, all min chords) in a later issue.
- Consider generating a JSON site-map for LLM navigation in a future ADR.
