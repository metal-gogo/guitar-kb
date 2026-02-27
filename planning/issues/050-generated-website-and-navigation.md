# Issue: Generated Website and Navigation

## Triage Labels

- `status/backlog`
- `priority/p2`
- `area/docs-svg`

**Depends on**: #046 — coverage dashboard and docs metadata should already be generated
**Depends on**: #049 — full voicing coverage should be available before site rendering

## Summary

Generate a navigable static website from build outputs so users can browse the
chord knowledge base by root, quality, and chord detail pages.

## Scope

- Add a site generation step that outputs static HTML/CSS assets from generated
  chord data and diagrams.
- Create:
  - site home/index page with root/quality navigation
  - per-chord pages with formula, notes, aliases, provenance, and embedded voicings
  - cross-links between related/enharmonic chords
- Ensure deterministic site output ordering and file naming.
- Add responsive layout support for desktop and mobile browsing.
- Add/update tests for site generation and link integrity.
- Update `README.md` with local preview instructions for the generated site.

## Acceptance Criteria

- [ ] `npm run build` generates a static website output directory with index and chord detail pages.
- [ ] Navigation links resolve correctly across index and chord pages.
- [ ] Website rendering includes voicing diagrams and provenance blocks.
- [ ] Site output is deterministic across repeated builds with identical inputs.
- [ ] `npm test -- test/unit/docs.test.ts test/unit/links.test.ts` exits `0`.
- [ ] `npm run check-links` exits `0`.

## Validation Steps

```bash
npm run build
npm test -- test/unit/docs.test.ts test/unit/links.test.ts
npm run check-links
```

Expected outcome:
- All commands exit `0`.
- Generated site is navigable and stable across repeated builds.
