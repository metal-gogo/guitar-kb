# Issue: Extended-Quality Target Expansion

## Triage Labels

- `status/backlog`
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

- [ ] Ingest target generation includes all defined qualities with correct URLs/slugs.
- [ ] Existing core targets remain byte-stable (no regressions in current URLs).
- [ ] `npm run ingest -- --dry-run` lists extended-quality targets deterministically.
- [ ] `npm test -- test/unit/pipeline.test.ts test/unit/sourceRegistry.test.ts` exits `0`.
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
