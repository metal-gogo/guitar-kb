# Flaky Test Summary Artifact

CI uploads a `flaky-test-summary` artifact on every run.
It is generated from Vitest JSON output and highlights non-pass test signatures and per-file instability counts.

---

## Artifact Contents

The artifact contains:

- `flaky-test-summary.md` (human-readable report)
- `flaky-test-summary.json` (machine-readable summary)

The summary is deterministic for identical input test results.

---

## How To Read It

### Top Unstable Tests

The `Top Unstable Tests` section ranks assertion signatures by non-pass count.
A signature is keyed by:

- test file path
- full test name

Higher non-pass counts indicate repeated instability signals in the run.

### Non-pass Assertions By File

This table aggregates non-pass assertion counts per test file.
Use it to quickly identify where instability is concentrated.

---

## Triage Workflow

1. Open the failing/suspicious CI run.
2. Download `flaky-test-summary`.
3. Check top unstable signatures.
4. Prioritize files with highest non-pass counts.
5. Re-run locally:

```bash
npm test -- --reporter=default --reporter=json --outputFile=.artifacts/vitest-results.json
npm run ci:flaky-summary -- --input .artifacts/vitest-results.json
```

6. Inspect `.artifacts/flaky-test-summary.md` and `.artifacts/flaky-test-summary.json`.

---

## Notes

- A fully green test run will show no unstable signatures.
- The artifact is diagnostic only; it does not replace unit/integration debugging.
