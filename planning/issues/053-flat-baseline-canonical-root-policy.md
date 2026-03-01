# Issue: Flat-Baseline Canonical Root Policy

## Triage Labels

- `status/backlog`
- `priority/p0`
- `area/normalize`

## Summary

Define and document a flat-baseline canonical root policy so the data model uses
one canonical spelling per pitch class while still supporting sharp aliases for
lookup and display.

## Scope

- Update canonical root policy to use this baseline order:
  - `C, Db, D, Eb, E, F, Gb, G, Ab, A, Bb, B`
- Define deterministic sharp-to-flat alias mappings:
  - `C#→Db`, `D#→Eb`, `F#→Gb`, `G#→Ab`, `A#→Bb`
- Document that user-facing lookup can accept either spelling, while canonical
  storage remains flat-baseline.
- Add migration notes for existing `chord:<sharp>:<quality>` canonical IDs.
- Keep legal/provenance requirements unchanged.

## Acceptance Criteria

- [ ] Policy is documented in a new or updated ADR with explicit root set and alias mapping table.
- [ ] Migration impact on existing canonical IDs is documented with deterministic conversion rules.
- [ ] `README.md` and contributor docs reference the same root policy text (no contradictions).
- [ ] `npm run lint` exits `0`.

## Validation Steps

```bash
npm run lint
rg -n "flat-baseline|C#|Db|canonical root" README.md planning/decisions
```

Expected outcome:
- Commands exit `0`.
- Root policy and mapping are documented consistently.
