# Docs Changelog Snapshot

`docs-changelog` compares generated docs outputs against a saved baseline and
prints a compact, deterministic summary of added/changed/removed files.

## Command

```bash
npm run docs-changelog
```

Default inputs:

- docs root: `docs`
- baseline file: `data/generated/docs-changelog-baseline.json`

## Typical Usage

1. Build docs:

```bash
npm run build
```

2. Initialize or refresh the baseline:

```bash
npm run docs-changelog -- --write-baseline
```

3. Compare future builds against that baseline:

```bash
npm run build
npm run docs-changelog
```

## Determinism

Output ordering is stable and deterministic:

- file paths are sorted lexicographically
- sections are always emitted in `ADDED`, `CHANGED`, `REMOVED` order
- baseline JSON uses sorted keys

## CI-Friendly Outputs

Write report files for artifacts:

```bash
npm run docs-changelog -- --out .artifacts/docs-changelog.txt --json .artifacts/docs-changelog.json
```
