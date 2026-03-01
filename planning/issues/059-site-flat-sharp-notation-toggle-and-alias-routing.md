# Issue: Site Flat/Sharp Notation Toggle and Alias Routing

## Triage Labels

- `status/backlog`
- `priority/p1`
- `area/docs-svg`

**Depends on**: #050 — generated site baseline must exist
**Depends on**: #054 — alias metadata must be available in normalized records
**Depends on**: #058 — final voicing IDs should be stable before site UX updates
**Suggested after**: #070 — sharp URL path encoding should be hosting-safe before alias UX expansion

## Summary

Add website support for notation display preference (flat vs sharp) while keeping
canonical chord storage flat-baseline and enharmonic-aware URL handling.

## Scope

- Add a site UI toggle to switch displayed roots between flat and sharp spelling.
- Keep canonical storage/pathing stable while mapping sharp aliases to canonical
  flat pages.
- Support direct navigation by sharp input (e.g., query parameter or route alias)
  and resolve to the canonical chord page.
- Ensure link generation and navigation remain deterministic.

## Acceptance Criteria

- [ ] Site defaults to flat display and can switch to sharp display without changing canonical IDs.
- [ ] Enharmonic alias input (`C#`, `D#`, `F#`, `G#`, `A#`) resolves to canonical flat pages.
- [ ] Index/chord navigation renders consistent links under both display modes.
- [ ] `npm run build` exits `0`.
- [ ] `npm run check-links` exits `0`.
- [ ] `npm test -- test/unit/links.test.ts test/unit/sitemap.test.ts` exits `0`.

## Validation Steps

```bash
npm run build
npm run check-links
npm test -- test/unit/links.test.ts test/unit/sitemap.test.ts
```

Expected outcome:
- All commands exit `0`.
- Site supports display toggling with deterministic alias routing.
