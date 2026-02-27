# Issue: CI Freshness and Cache Audit Automation

## Triage Labels

- `status/backlog`
- `priority/p2`
- `area/ci-test`

**Suggested after**: #039 — source capability/skip semantics improve freshness triage signal quality

## Summary

Automate source cache health checks in CI so stale/corrupt caches are detected
without relying on manual local runs.

## Scope

- Add CI workflow coverage for:
  - `npm run audit-cache`
  - `npm run source-freshness -- --as-of <pinned-iso>`
- Upload cache audit and freshness outputs as CI artifacts.
- Define fail/warn behavior:
  - fail on missing/corrupt cache entries
  - warn (non-fail) on stale entries by default
- Document policy in `docs/contributing/source-freshness-report.md`.

## Acceptance Criteria

- [ ] CI runs cache audit and source freshness checks on PRs.
- [ ] CI artifacts include deterministic freshness/audit outputs.
- [ ] Missing/corrupt cache causes CI failure; stale age threshold remains configurable.
- [ ] `npm run audit-cache` exits `0` on healthy cache state.
- [ ] `npm run source-freshness -- --as-of 2026-02-27T00:00:00.000Z --max-age-days 30` exits `0`.
- [ ] All Copilot inline review comments addressed
- [ ] `require-copilot-review` CI check green before merge

## Validation Steps

```bash
npm run audit-cache
npm run source-freshness -- --as-of 2026-02-27T00:00:00.000Z --max-age-days 30
```

Expected outcome:
- Both commands exit `0`.
- Outputs are deterministic for the pinned `--as-of` timestamp.
