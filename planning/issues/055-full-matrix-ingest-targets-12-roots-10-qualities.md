# Issue: Full-Matrix Ingest Targets (12 Roots × 10 Qualities)

## Triage Labels

- `status/backlog`
- `priority/p0`
- `area/ingest`

**Depends on**: #053 — canonical root baseline must be defined first
**Depends on**: #054 — schema/model contract must accept the new root policy

## Summary

Switch ingest defaults from legacy MVP-style subsets to full production matrix
coverage: all canonical roots and all defined chord qualities.

## Scope

- Replace default ingest target selection with full canonical matrix:
  - roots: `C, Db, D, Eb, E, F, Gb, G, Ab, A, Bb, B`
  - qualities: `maj, min, 7, maj7, min7, dim, dim7, aug, sus2, sus4`
- Keep deterministic ordering in target generation and output.
- Update coverage contract expectations and diagnostics for the full matrix.
- Rename/remove legacy config terms that still imply MVP-only behavior.

## Acceptance Criteria

- [ ] Default `npm run ingest` selects full matrix targets without requiring `--dry-run`.
- [ ] Coverage expectations in validate are aligned to `12 × 10` canonical combinations.
- [ ] Output ordering remains deterministic across repeated runs.
- [ ] `npm run ingest -- --dry-run` exits `0` and reports deterministic full-matrix selection.
- [ ] `npm run ingest && npm run validate` exits `0`.
- [ ] All Copilot inline review comments addressed
- [ ] `require-copilot-review` CI check green before merge

## Validation Steps

```bash
npm run ingest -- --dry-run
npm run ingest && npm run validate
```

Expected outcome:
- Commands exit `0`.
- Full canonical matrix is selected and validated deterministically.

