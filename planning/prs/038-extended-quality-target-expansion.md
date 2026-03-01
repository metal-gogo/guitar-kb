# PR Draft: feat: expand ingest target generation for defined qualities

## Branch

- `feat/38-extended-quality-target-expansion`

## Base

- `main`

## Summary

- Adds deterministic full-matrix ingest target generation for all defined
  qualities in `QUALITY_ORDER`:
  - `maj`, `min`, `7`, `maj7`, `min7`, `dim`, `dim7`, `aug`, `sus2`, `sus4`
- Preserves existing core-target list byte stability for non-dry-run defaults.
- Routes `ingest --dry-run` through full-matrix targets so extended-quality
  URL/slug expansion is visible deterministically.
- Adds pipeline tests to lock:
  - dry-run target selection behavior
  - core-target byte stability vs previous target set
- Updates planning issue `038` status/checklist with execution notes.

## Why

Issue `038` requires deterministic target expansion and stable URL formatting
for defined qualities without regressing current core-target behavior.

## Validation Run

```bash
npm run ingest -- --dry-run
npm test -- test/unit/pipeline.test.ts test/unit/sourceRegistry.test.ts
npm run lint
npm test
npm run build
npm run validate
```

## Notes

- Non-dry-run ingest remains core-target by default for now to preserve
  deterministic offline behavior until capability/unsupported-target handling
  issues are merged.

## GitHub Command

```bash
gh pr create \
  --base main \
  --head feat/38-extended-quality-target-expansion \
  --title "feat: expand ingest target generation for defined qualities" \
  --body-file planning/prs/038-extended-quality-target-expansion.md
```
