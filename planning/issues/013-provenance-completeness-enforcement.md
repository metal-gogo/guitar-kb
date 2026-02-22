# Issue: Provenance Completeness Enforcement

**GitHub Issue:** https://github.com/metal-gogo/guitar-kb/issues/29

## Summary
Guarantee that every chord and every voicing contains complete provenance metadata.

## Why
Provenance is required for legal boundaries, auditability, and trust in generated knowledge.

## Scope
- Enforce `source_refs` presence on chord records and voicings.
- Reject missing/empty `source` or `url` entries.
- Add explicit tests for negative cases.
- Update validation messaging for missing provenance.

## Acceptance Criteria
- `npm run validate` fails on missing provenance.
- Unit/integration tests cover chord-level and voicing-level provenance gaps.
- No generated record is accepted without provenance.

## Validation Steps
```bash
npm test
npm run validate
```

## Follow-ups
- Add optional `retrieved_at` policy once ingestion metadata expands.
