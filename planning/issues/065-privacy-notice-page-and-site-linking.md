# Issue: Privacy Notice Page and Site Linking

## Triage Labels

- `status/backlog`
- `priority/p0`
- `area/docs-svg`

**Depends on**: #050 — generated site structure must exist before legal-page linking

## Summary

Add a privacy notice page for the generated static site, explicitly stating
current no-collection behavior, and link it from the main site navigation/footer.

## Scope

- Create a privacy notice document/page included in generated site outputs.
- State current behavior clearly: static site, no user-account system, no
  intentional user data collection by default build output.
- Link privacy notice from site index and chord pages.
- Keep wording factual, concise, and aligned with current implementation.
- Add link checks/tests to prevent regressions.

## Acceptance Criteria

- [ ] A privacy notice page exists in generated site output.
- [ ] Site index and chord detail pages link to the privacy notice.
- [ ] Privacy text is aligned with current static-site behavior and avoids overclaiming.
- [ ] `npm run build` exits `0`.
- [ ] `npm run check-links` exits `0`.
- [ ] `npm test -- test/unit/links.test.ts` exits `0`.

## Validation Steps

```bash
npm run build
npm run check-links
npm test -- test/unit/links.test.ts
```

Expected outcome:
- All commands exit `0`.
- Privacy notice is reachable from generated pages.

