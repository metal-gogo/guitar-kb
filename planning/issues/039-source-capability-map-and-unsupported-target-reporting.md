# Issue: Source Capability Map and Unsupported-Target Reporting

## Triage Labels

- `status/backlog`
- `priority/p0`
- `area/ingest`

**Depends on**: #038 — extended targets require explicit per-source support metadata

## Summary

Introduce per-source capability declarations so ingest can distinguish between
"missing due to parser/data bug" and "not supported by source", while treating
defined-quality coverage gaps as explicit backlog failures rather than silent skips.

## Scope

- Add source capability metadata (supported qualities/roots) to the source registry.
- Update ingest dry-run and runtime logs to report unsupported targets
  with deterministic reason codes and gap counts.
- Add strict mode behavior that fails ingest when required defined-quality
  matrix targets are unresolved.
- Support an explicit, documented temporary allowlist for known upstream gaps.
- Add tests for capability filtering and stable skip reporting.

## Acceptance Criteria

- [ ] Each source entry declares support metadata used during target selection.
- [ ] Ingest reports unsupported targets as `SKIP_UNSUPPORTED` with deterministic ordering.
- [ ] In strict mode, unresolved defined-quality gaps fail with a clear summary.
- [ ] Any temporary allowlisted gap is surfaced in output and remains deterministic.
- [ ] `npm run ingest -- --dry-run --source guitar-chord-org` exits `0` and includes skip diagnostics.
- [ ] `env INGEST_STRICT_CAPABILITIES=1 npm run ingest -- --dry-run` exits non-zero when unresolved required gaps remain.
- [ ] `npm test -- test/unit/pipeline.test.ts` exits `0`.
- [ ] All Copilot inline review comments addressed
- [ ] `require-copilot-review` CI check green before merge

## Validation Steps

```bash
npm run ingest -- --dry-run --source guitar-chord-org
env INGEST_STRICT_CAPABILITIES=1 npm run ingest -- --dry-run
npm test -- test/unit/pipeline.test.ts
```

Expected outcome:
- First and third commands exit `0`.
- Strict-mode command exits non-zero if required matrix gaps exist.
- Dry-run includes processed/skipped counts, unsupported-target reason lines, and gap summary.
