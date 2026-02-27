# Issue: Parser Confidence Reporting Pipeline

## Triage Labels

- `status/backlog`
- `priority/p2`
- `area/ci-test`

**Depends on**: #041 — confidence reporting depends on reliable extended-quality parser output

## Summary

Operationalize parser confidence annotations into a deterministic summary report
for CI and source quality triage.

## Scope

- Add confidence aggregation (`high` / `medium` / `low`) by source and quality.
- Emit a machine-readable report artifact in `data/generated/` during ingest when
  parser confidence is included.
- Add tests covering aggregation and deterministic ordering.
- Document confidence report usage in `docs/contributing/parser-confidence-annotations.md`.

## Acceptance Criteria

- [ ] Confidence report generation is deterministic and source/quality grouped.
- [ ] Report is emitted when running ingest with confidence enabled.
- [ ] Tests validate report aggregation and ordering.
- [ ] `npm test -- test/unit/pipeline.test.ts test/unit/freshnessReport.test.ts` exits `0`.
- [ ] `npm run ingest -- --include-parser-confidence` exits `0` and writes confidence report output.
- [ ] All Copilot inline review comments addressed
- [ ] `require-copilot-review` CI check green before merge

## Validation Steps

```bash
npm test -- test/unit/pipeline.test.ts test/unit/freshnessReport.test.ts
npm run ingest -- --include-parser-confidence
```

Expected outcome:
- Both commands exit `0`.
- Ingest writes a deterministic confidence summary artifact for triage.
