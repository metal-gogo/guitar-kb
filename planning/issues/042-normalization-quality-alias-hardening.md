# Issue: Normalization Quality Alias Hardening

## Triage Labels

- `status/backlog`
- `priority/p0`
- `area/normalize`

**Depends on**: #041 — parser output must carry extended-quality symbols to normalize

## Summary

Harden normalization so extended-quality aliases and symbols map consistently to
canonical quality enums and stable canonical IDs.

## Scope

- Extend quality alias/symbol mapping in normalization for extended qualities.
- Preserve canonical ID stability (`chord:<ROOT>:<QUALITY>`) across alias inputs.
- Retain useful source aliases in `aliases[]` without losing canonical mapping.
- Add normalization and enharmonic tests for new aliases/symbols.

## Acceptance Criteria

- [ ] Extended-quality aliases normalize to the expected canonical `quality` values.
- [ ] All defined qualities are normalization-reachable from source alias variants.
- [ ] Canonical IDs are stable regardless of source alias format.
- [ ] Existing core-quality normalization snapshots remain stable unless explicitly updated.
- [ ] `npm test -- test/unit/normalize.test.ts test/unit/enharmonic.test.ts` exits `0`.
- [ ] `npm run ingest` exits `0` with no normalization errors.
- [ ] All Copilot inline review comments addressed
- [ ] `require-copilot-review` CI check green before merge

## Validation Steps

```bash
npm test -- test/unit/normalize.test.ts test/unit/enharmonic.test.ts
npm run ingest
```

Expected outcome:
- Both commands exit `0`.
- Normalized output contains extended-quality canonical IDs with stable alias handling.
