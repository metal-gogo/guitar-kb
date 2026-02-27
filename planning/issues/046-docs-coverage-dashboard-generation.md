# Issue: Docs Coverage Dashboard Generation

## Triage Labels

- `status/backlog`
- `priority/p2`
- `area/docs-svg`

**Depends on**: #044 — consumes coverage gate/report output

## Summary

Generate a deterministic Markdown coverage dashboard under `docs/` so humans
can quickly inspect matrix progress, missing qualities, and severity totals.

## Scope

- Add a docs generator step that emits `docs/coverage.md` from coverage report data.
- Include:
  - current coverage percent and observed/expected counts
  - missing severity counts
  - deterministic missing-ID table (or bounded list with deterministic truncation)
- Link coverage dashboard from `docs/index.md`.
- Add docs generator tests for deterministic output.

## Acceptance Criteria

- [ ] `docs/coverage.md` is generated deterministically on `npm run build`.
- [ ] Coverage dashboard is linked from `docs/index.md`.
- [ ] Tests assert stable dashboard content and ordering.
- [ ] `npm test -- test/unit/docs.test.ts test/unit/sitemap.test.ts` exits `0`.
- [ ] `npm run build` exits `0` and writes `docs/coverage.md`.

## Validation Steps

```bash
npm test -- test/unit/docs.test.ts test/unit/sitemap.test.ts
npm run build
```

Expected outcome:
- Both commands exit `0`.
- Generated `docs/coverage.md` reflects deterministic coverage summary content.
