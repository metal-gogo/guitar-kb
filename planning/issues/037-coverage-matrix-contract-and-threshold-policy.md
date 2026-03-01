# Issue: Coverage Matrix Contract and Threshold Policy

## Triage Labels

- `status/in-progress`
- `priority/p0`
- `area/data-model`

## Summary

Define and implement a stable root-quality coverage contract so `validate` can
enforce full defined-quality matrix coverage against an explicit matrix
definition rather than implicit defaults.

## Scope

- Add a versioned coverage matrix contract in code (roots, qualities, severity
  mapping, and deterministic sort order).
- Mark all currently defined qualities in `QUALITY_ORDER` as in-scope matrix
  members for completeness accounting.
- Emit matrix metadata in `npm run validate` output (`matrix_version`,
  `expected_roots`, `expected_qualities`).
- Add tests for contract stability and ordering.
- Document the policy in `README.md` under validation/coverage behavior.

## Acceptance Criteria

- [x] Coverage report includes explicit matrix metadata and stable ordering.
- [x] Contract tests fail on accidental matrix drift.
- [x] Matrix definition includes all defined qualities (`maj`, `min`, `7`,
  `maj7`, `min7`, `dim`, `dim7`, `aug`, `sus2`, `sus4`).
- [x] `npm run validate` exits `0` and prints matrix metadata on a healthy build.
- [x] `npm test -- test/unit/coverage.test.ts` exits `0` and covers the new contract behavior.
- [ ] All Copilot inline review comments addressed
- [ ] `require-copilot-review` CI check green before merge

## Validation Steps

```bash
npm test -- test/unit/coverage.test.ts
npm run validate
```

Expected outcome:
- Both commands exit `0`.
- `validate` output includes deterministic matrix metadata fields.

## Execution Notes

- 2026-03-01: Implemented on branch `feat/37-coverage-matrix-contract` with local validation passing.
