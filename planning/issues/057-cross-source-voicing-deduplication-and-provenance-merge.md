# Issue: Cross-Source Voicing Deduplication and Provenance Merge

## Triage Labels

- `status/backlog`
- `priority/p0`
- `area/normalize`

**Depends on**: #054 — schema/model fields for provenance and aliases must be finalized
**Depends on**: #056 — source merge order must be deterministic before dedupe semantics

## Summary

When ingesting additional sources, avoid duplicate voicings by fingerprinting and
deduplicating equivalent voicing shapes, then merging provenance references.

## Scope

- Define a deterministic voicing fingerprint (frets + fingers + base fret + tuning policy).
- Deduplicate voicings per canonical chord record during normalization merge.
- Merge `source_refs` when a duplicate voicing is encountered.
- Add a deterministic `source_refs.note` convention to indicate additional source references.
- Keep provenance completeness guarantees for every final voicing.

## Acceptance Criteria

- [ ] Duplicate voicing shapes are stored once per canonical chord record.
- [ ] Duplicate detections append provenance references instead of creating new voicing entries.
- [ ] Provenance note format for duplicate-source references is documented and tested.
- [ ] Deterministic dedupe behavior is proven via repeated ingest runs.
- [ ] `npm test -- test/unit/normalize.test.ts test/unit/pipelineIdempotency.test.ts` exits `0`.
- [ ] `npm run ingest && npm run build && npm run validate` exits `0`.
- [ ] All Copilot inline review comments addressed
- [ ] `require-copilot-review` CI check green before merge

## Validation Steps

```bash
npm test -- test/unit/normalize.test.ts test/unit/pipelineIdempotency.test.ts
npm run ingest && npm run build && npm run validate
```

Expected outcome:
- Commands exit `0`.
- Duplicate voicings are merged with complete provenance.

