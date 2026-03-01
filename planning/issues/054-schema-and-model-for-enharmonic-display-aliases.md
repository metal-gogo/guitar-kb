# Issue: Schema and Model Contracts for Canonical Root + Enharmonic Display Aliases

## Triage Labels

- `status/backlog`
- `priority/p1`
- `area/data-model`

**Depends on**: #053 — canonical root policy must be explicit before schema/model updates

## Summary

Align `chords.schema.json` and TypeScript model contracts to flat-baseline
canonical roots with explicit enharmonic display aliases and lookup metadata.

## Scope

- Update schema fields and validation contracts to represent:
  - flat-baseline canonical root storage
  - sharp/flat display alias metadata
  - enharmonic lookup resolution data needed by docs/site
- Update `src/types/model.ts` and related guards to match schema updates.
- Update schema snapshots and contract tests for representative records.
- Ensure backward-incompatible schema changes are documented.

## Acceptance Criteria

- [ ] `chords.schema.json` validates records with canonical flat roots and enharmonic display aliases.
- [ ] Model types and guards are in sync with schema changes.
- [ ] Schema snapshot tests are updated with deterministic expected records.
- [ ] `npm test -- test/unit/schemaSnapshot.test.ts test/unit/modelGuards.test.ts` exits `0`.
- [ ] `npm run validate` exits `0` with no schema errors.
- [ ] All Copilot inline review comments addressed
- [ ] `require-copilot-review` CI check green before merge

## Validation Steps

```bash
npm test -- test/unit/schemaSnapshot.test.ts test/unit/modelGuards.test.ts
npm run validate
```

Expected outcome:
- Both commands exit `0`.
- Schema/model contracts are deterministic and enforce flat-baseline + alias metadata.

