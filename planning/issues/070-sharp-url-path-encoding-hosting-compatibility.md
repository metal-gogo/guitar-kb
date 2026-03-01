# Issue: Sharp URL Path Encoding Compatibility for Hosted Site

## Triage Labels

- `status/backlog`
- `priority/p0`
- `area/docs-svg`

**Depends on**: #050 — generated site/chord page output pipeline must exist

## Summary

Fix sharp-note chord page URL behavior on static hosting (GitHub Pages 404 on
encoded sharp paths such as `.../chord__G%23__maj.html`) by adopting a
hosting-safe path encoding strategy for generated chord and diagram filenames.

## Scope

- Reproduce and document the current hosted failure case for sharp chord URLs.
- Define a path encoding scheme that avoids reserved URL ambiguity for `#`.
- Update docs/site/sitemap path generation helpers to use the new safe encoding.
- Regenerate and validate all internal links that reference sharp chord pages or
  sharp voicing diagram assets.
- Add regression tests that lock hosted-compatible sharp path behavior.

## Acceptance Criteria

- [ ] Sharp chord pages do not 404 on hosted static site URLs due to path encoding.
- [ ] Generated chord/documentation links use deterministic, hosting-safe sharp notation.
- [ ] Generated diagram links for sharp-root chords resolve correctly.
- [ ] Link checker/tests cover at least one sharp chord page and one sharp diagram link.
- [ ] `npm run build` exits `0`.
- [ ] `npm run check-links` exits `0`.
- [ ] `npm test -- test/unit/docs.test.ts test/unit/sitemap.test.ts test/unit/links.test.ts` exits `0`.

## Validation Steps

```bash
npm run build
npm run check-links
npm test -- test/unit/docs.test.ts test/unit/sitemap.test.ts test/unit/links.test.ts
```

Expected outcome:
- All commands exit `0`.
- Sharp-root URLs and links are hosting-compatible and deterministic.
