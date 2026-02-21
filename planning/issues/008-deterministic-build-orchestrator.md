# Issue: Deterministic Build Orchestrator

## Summary
Create build pipeline that deterministically transforms normalized data into JSONL and docs artifacts.

## Acceptance Criteria
- `npm run build` reproducible with fixed cache inputs
- Stable sorting and formatting of output files
- `data/chords.jsonl` generated
- Build command exits non-zero on validation failures
