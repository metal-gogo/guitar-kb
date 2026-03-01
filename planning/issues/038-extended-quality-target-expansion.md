# Issue: Extended-Quality Target Expansion

## Triage Labels

- `status/in-progress`
- `priority/p0`
- `area/ingest`

**Depends on**: #037 — align target generation with the explicit coverage matrix

## Summary

Expand ingest targets beyond core qualities so the pipeline can fetch and parse
the full defined quality set (`maj`, `min`, `7`, `maj7`, `min7`, `dim`,
`dim7`, `aug`, `sus2`, `sus4`) across all configured roots.

## Scope

- Extend target generation in `src/config.ts` with deterministic mappings for
  extended qualities per source.
- Ensure no defined quality in the matrix is omitted from target generation.
- Preserve canonical ID format (`chord:<ROOT>:<QUALITY>`) and deterministic
  target ordering.
- Add unit tests for target count, URL formatting, and ordering stability.
- Keep core-quality behavior unchanged for existing targets.

## Acceptance Criteria

- [x] Ingest target generation includes all defined qualities with correct URLs/slugs.
- [x] Existing core targets remain byte-stable (no regressions in current URLs).
- [x] `npm run ingest -- --dry-run` lists extended-quality targets deterministically.
- [x] `npm test -- test/unit/pipeline.test.ts test/unit/sourceRegistry.test.ts` exits `0`.
- [ ] All Copilot inline review comments addressed
- [ ] `require-copilot-review` CI check green before merge

## Validation Steps

```bash
npm run ingest -- --dry-run
npm test -- test/unit/pipeline.test.ts test/unit/sourceRegistry.test.ts
```

Expected outcome:
- Both commands exit `0`.
- Dry-run output includes extended-quality chord IDs in deterministic order.

## Execution Notes

- 2026-03-01: Implemented on branch `feat/38-extended-quality-target-expansion`.
- 2026-03-01: Dry-run now enumerates full defined-quality matrix targets; non-dry-run default remains core matrix to preserve offline stability until capability-gating issues land.
