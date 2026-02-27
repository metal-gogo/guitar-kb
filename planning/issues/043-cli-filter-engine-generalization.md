# Issue: CLI Filter Engine Generalization

## Triage Labels

- `status/backlog`
- `priority/p2`
- `area/ingest`

**Depends on**: #038 — extended targets expand valid `--chord` match space
**Depends on**: #042 — normalized IDs/qualities must be stable for filter matching

## Summary

Generalize ingest/build filtering so `--chord` and related matching logic are
not constrained by MVP-only target assumptions.

## Scope

- Remove MVP-only matching assumptions in build filtering (`MVP_TARGETS`-based
  slug lookup path).
- Match canonical IDs and deterministic slug patterns across the expanded matrix.
- Keep existing `--source`, `--chord`, and `--dry-run` semantics intact.
- Update CLI help text/examples and `README.md` command examples accordingly.

## Acceptance Criteria

- [ ] `--chord` matching works for extended-quality canonical IDs.
- [ ] Build/ingest filters no longer depend on MVP-only target subsets.
- [ ] CLI help and README examples reflect expanded quality coverage.
- [ ] `npm test -- test/unit/cliOptions.test.ts test/unit/buildCli.test.ts` exits `0`.
- [ ] `npm run build -- --dry-run --chord chord:C:dim7` exits `0` when the chord exists in normalized input.
- [ ] All Copilot inline review comments addressed
- [ ] `require-copilot-review` CI check green before merge

## Validation Steps

```bash
npm test -- test/unit/cliOptions.test.ts test/unit/buildCli.test.ts
npm run build -- --dry-run --chord chord:C:dim7
```

Expected outcome:
- Both commands exit `0`.
- Filter behavior is deterministic and supports non-core qualities.
