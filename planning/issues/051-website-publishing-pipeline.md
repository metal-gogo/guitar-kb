# Issue: Website Publishing Pipeline

## Triage Labels

- `status/backlog`
- `priority/p2`
- `area/ci-test`

**Depends on**: #050 — generated website output must exist before publish automation

## Summary

Add CI automation to publish the generated website artifact so the chord site
is accessible without local build steps.

## Scope

- Add/update workflow(s) to build the static website from a clean checkout.
- Publish site artifacts (for PR preview and/or main-branch deployment target).
- Enforce link checks before publishing.
- Upload published site bundle as an artifact for debugging reproducibility.
- Document publish workflow and expected URL/path in `README.md`.

## Acceptance Criteria

- [ ] CI builds the generated website in a dedicated job.
- [ ] Publish pipeline runs only after successful build/test/link checks.
- [ ] Site artifact is uploaded deterministically on each run.
- [ ] Deployment/publish behavior is documented for contributors.
- [ ] `npm run build && npm run check-links` exits `0` locally.
- [ ] All Copilot inline review comments addressed
- [ ] `require-copilot-review` CI check green before merge

## Validation Steps

```bash
npm run build && npm run check-links
npm run lint
npm test
```

Expected outcome:
- All commands exit `0`.
- CI workflow changes support deterministic site publish behavior.
