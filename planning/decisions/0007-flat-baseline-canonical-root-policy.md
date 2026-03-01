# ADR-0007: Flat-Baseline Canonical Root Policy

**Status:** Accepted  
**Date:** 2026-03-01  
**Owner:** Guitar Chord Knowledge Base (GCKB)

---

## Context

Root spelling currently permits both sharp and flat canonical IDs. That
increases duplicate entities (`chord:C#:maj` and `chord:Db:maj`) and makes
lookup/routing rules harder to keep deterministic across docs/site/build
outputs.

Wave E requires a single canonical root spelling policy while preserving:

- user-facing sharp lookup support
- explicit enharmonic awareness
- deterministic IDs and ordering
- zero provenance loss

---

## Decision

### 1. Canonical root baseline

Canonical root storage uses this fixed flat-baseline order:

`C, Db, D, Eb, E, F, Gb, G, Ab, A, Bb, B`

Canonical IDs remain:

`chord:<ROOT>:<QUALITY>`

with `<ROOT>` taken from the baseline set above.

### 2. Sharp alias mapping

Sharp spellings are accepted as lookup/display aliases and map deterministically:

| Sharp alias | Canonical root |
|---|---|
| `C#` | `Db` |
| `D#` | `Eb` |
| `F#` | `Gb` |
| `G#` | `Ab` |
| `A#` | `Bb` |

Non-aliased roots (`C, D, E, F, G, A, B`) map to themselves.

### 3. Deterministic migration rule

For existing IDs, migration is deterministic:

`chord:<ROOT>:<QUALITY>` → `chord:<MAP(ROOT)>:<QUALITY>`

where `MAP(ROOT)` applies the table above and leaves other roots unchanged.

Examples:

- `chord:C#:maj` → `chord:Db:maj`
- `chord:F#:min7` → `chord:Gb:min7`
- `chord:A:maj7` → `chord:A:maj7` (unchanged)

### 4. Lookup and display behavior

- Input lookup accepts either spelling (`C#` or `Db`).
- Storage and canonical links use flat-baseline IDs.
- UI may present sharps, but URLs/IDs resolve to canonical flat-baseline IDs.

### 5. Provenance and legal safety

This ADR does not change copyright/provenance policy:

- factual extraction only
- original writing for docs
- `source_refs` required on chord and voicing data

---

## Consequences

### Pros

- One canonical entity per pitch class
- Simpler deterministic ordering/routing
- Cleaner docs/site URL generation
- Retains sharp-friendly lookup UX

### Cons

- Requires migration handling for previously sharp-canonical IDs
- Requires alias-aware routing in generated site/UI

---

## Supersession note

ADR-0001 remains valid for canonical ID format and quality normalization.
Its root-spelling section is superseded by this ADR.

---

## Definition of Compliance

ADR-0007 is satisfied when:

1. Canonical roots are emitted only from the flat-baseline set.
2. Sharp aliases resolve deterministically to flat canonical roots.
3. Migration mapping for existing sharp IDs is documented and reproducible.
4. README and contributor docs reference this same policy.
