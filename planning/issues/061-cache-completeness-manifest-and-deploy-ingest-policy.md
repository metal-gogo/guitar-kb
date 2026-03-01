# Issue: Cache Completeness Manifest and Deploy Ingest Policy

## Triage Labels

- `status/backlog`
- `priority/p1`
- `area/ci-test`

**Depends on**: #055 — full matrix coverage policy must be established
**Depends on**: #060 — ingest modes must exist for full and targeted refresh workflows

## Summary

Decide and enforce when deploy flows must run ingest vs when existing cached
artifacts are complete and can be reused.

## Scope

- Add a deterministic cache completeness manifest for root/quality/source coverage.
- Add deploy-time decision logic:
  - skip ingest when cache + normalized artifacts satisfy completeness checks
  - fail clearly when required cache coverage is missing
- Add explicit full-refresh command path for periodic complete re-ingest.
- Update CI workflow/docs to reflect new policy.

## Acceptance Criteria

- [ ] A deterministic manifest/report indicates cache completeness for required matrix targets.
- [ ] Build/deploy flow can skip ingest when completeness checks pass.
- [ ] Clear failure output identifies missing targets when completeness checks fail.
- [ ] README documents routine flow vs full-refresh flow.
- [ ] `npm run audit-cache` exits `0` on complete fixtures and non-zero on injected gaps.
- [ ] `npm run preflight` exits `0` with complete cache state.
- [ ] All Copilot inline review comments addressed
- [ ] `require-copilot-review` CI check green before merge

## Validation Steps

```bash
npm run audit-cache
npm run preflight
```

Expected outcome:
- Commands exit `0` on complete data.
- Deploy ingest policy is deterministic and enforceable.

