# PR Draft: feat: add explicit coverage matrix contract metadata

## Branch

- `feat/37-coverage-matrix-contract`

## Base

- `main`

## Summary

- Adds explicit versioned coverage matrix contract in code
  (`coverage-matrix/v1`) with deterministic root/quality ordering and quality
  severity mapping.
- Extends coverage report model to include matrix metadata:
  - `matrixVersion`
  - `expectedRoots`
  - `expectedQualities`
- Updates `npm run validate` output to emit machine-readable metadata lines:
  - `matrix_version=...`
  - `expected_roots=...`
  - `expected_qualities=...`
- Adds contract-drift assertions in `test/unit/coverage.test.ts` for
  deterministic ordering and quality set stability.
- Documents coverage contract behavior in `README.md`.
- Updates local planning issue `037` status/checklist.

## Why

Issue `037` requires an explicit, stable coverage matrix contract that is
reported deterministically instead of relying on implicit defaults.

## Validation Run

```bash
npm test -- test/unit/coverage.test.ts
npm run validate
npm run lint
npm test
npm run build
npm run validate
```

## Notes

- Current missing-quality coverage gaps are expected baseline behavior and
  unchanged by this PR; this change formalizes/report metadata only.

## GitHub Command

```bash
gh pr create \
  --base main \
  --head feat/37-coverage-matrix-contract \
  --title "feat: add explicit coverage matrix contract metadata" \
  --body-file planning/prs/037-coverage-matrix-contract-and-threshold-policy.md
```
