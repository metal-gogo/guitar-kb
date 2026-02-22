# Issue: Normalization Edge Cases & Canonical ID Stability

**GitHub Issue:** https://github.com/metal-gogo/guitar-kb/issues/33

## Summary
Expand normalization tests for enharmonics, alias retention, and canonical ID stability under equivalent input forms.

## Why
Normalization integrity is central to deterministic artifacts and reliable retrieval.

## Scope
- Add cases for quality alias variants and root enharmonics.
- Assert canonical ID stability across equivalent representations.
- Assert aliases are retained without silent data loss.
- Confirm deterministic ordering post-normalization.

## Acceptance Criteria
- Added tests cover key edge-case matrix.
- Canonical IDs remain stable and compliant with ADR-0001.
- No alias information is unintentionally dropped.

## Validation Steps
```bash
npm test -- --run test/unit/normalize.test.ts
npm run validate
```

## Follow-ups
- Extend quality map once new chord qualities are introduced.
