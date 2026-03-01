# Issue: Hierarchical Diagram Paths (`docs/diagrams/<ROOT>/<QUALITY>/<VOICING>.svg`)

## Triage Labels

- `status/backlog`
- `priority/p0`
- `area/docs-svg`

**Depends on**: #058 — voicing IDs must be source-agnostic (`v1..vN`) first
**Depends on**: #067 — diagram clarity updates should land before path migration snapshots

## Summary

Migrate generated diagram file structure from flat encoded filenames to
hierarchical paths, e.g.:

- `docs/diagrams/chord__Ab__7__v1.svg` → `docs/diagrams/Ab/7/v1.svg`
- `docs/diagrams/chord__Bb__maj__v2.svg` → `docs/diagrams/Bb/maj/v2.svg`

## Scope

- Update path-generation helpers for docs/site/sitemap outputs.
- Update build writers to create nested diagram directories.
- Update Markdown/site link generation to use new paths.
- Update link checks/tests/snapshots for hierarchical diagram paths.
- Preserve deterministic ordering and path normalization rules.

## Acceptance Criteria

- [ ] Build emits diagram assets under `docs/diagrams/<root>/<quality>/<voicing>.svg`.
- [ ] Site emits diagram assets under `site/diagrams/<root>/<quality>/<voicing>.svg` (or deterministic equivalent policy).
- [ ] Generated docs, site pages, and sitemap reference new paths correctly.
- [ ] No broken diagram links remain after migration.
- [ ] `npm run build` exits `0`.
- [ ] `npm run check-links` exits `0`.
- [ ] `npm test -- test/unit/sitemap.test.ts test/unit/links.test.ts test/unit/drift.test.ts` exits `0`.

## Validation Steps

```bash
npm run build
npm run check-links
npm test -- test/unit/sitemap.test.ts test/unit/links.test.ts test/unit/drift.test.ts
```

Expected outcome:
- All commands exit `0`.
- Diagram links resolve against deterministic hierarchical paths.
