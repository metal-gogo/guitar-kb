# Issue: License Document and Site Linking

## Triage Labels

- `status/backlog`
- `priority/p0`
- `area/docs-svg`

**Depends on**: #050 — generated site structure must exist before legal-page linking

## Summary

Add a repository license document and expose a link to license information from
the generated site.

## Scope

- Add a root `LICENSE` file with the selected project license text.
- Ensure package metadata/docs are aligned with the chosen license.
- Add a generated site link to license information (local page and/or repository file link).
- Document license location in `README.md`.

## Acceptance Criteria

- [ ] `LICENSE` exists at repository root with approved project license text.
- [ ] `README.md` references license location and usage expectations.
- [ ] Generated site includes a visible license link from index and chord pages.
- [ ] `npm run build` exits `0`.
- [ ] `npm run check-links` exits `0`.
- [ ] `npm run lint` exits `0`.

## Validation Steps

```bash
npm run build
npm run check-links
npm run lint
```

Expected outcome:
- All commands exit `0`.
- License is present and discoverable from docs/site.

