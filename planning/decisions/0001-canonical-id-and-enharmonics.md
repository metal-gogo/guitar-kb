# ADR-0001: Canonical Chord IDs & Enharmonic Policy

**Status:** Accepted\
**Date:** 2026-02-21\
**Owner:** Guitar Chord Knowledge Base (GCKB)

------------------------------------------------------------------------

## Context

Chord reference sources may represent chords using:

-   Sharps (C#, F#)
-   Flats (Db, Gb)
-   Mixed enharmonics
-   Multiple alias symbols (Cmaj, CM, CΔ, etc.)
-   Inconsistent quality labels (M, maj, Major, min, m, etc.)

Without a strict normalization policy:

-   Canonical IDs become unstable
-   Data ingestion becomes inconsistent
-   Enharmonics may be silently merged or duplicated incorrectly
-   Deterministic builds become impossible
-   LLM consumption becomes unreliable

The system requires:

-   Stable canonical identifiers
-   Deterministic builds
-   Explicit alias tracking
-   No silent data loss
-   LLM-friendly normalization

------------------------------------------------------------------------

## Decision

### 1. Canonical Chord ID Format

All chords must use a stable canonical ID format:

    chord:<ROOT>:<QUALITY>

Examples:

    chord:C:maj
    chord:C:min
    chord:C:7
    chord:C:maj7
    chord:F#:dim
    chord:Db:maj7

Rules:

-   Prefix `chord:` is required
-   `<ROOT>` preserves musical spelling (C, C#, Db, etc.)
-   `<QUALITY>` is normalized (see Section 3)
-   Lowercase for quality
-   No spaces
-   No special symbols in the canonical ID

------------------------------------------------------------------------

### 2. Root Spelling Policy

We allow both sharp and flat roots as canonical.

We DO NOT globally convert all chords to sharps or flats.

Instead:

-   Preserve the spelling that reflects the chord identity
-   Treat enharmonic spellings as distinct canonical entities
-   Link enharmonic equivalents explicitly

Example:

    chord:C#:maj
    chord:Db:maj

These are separate canonical IDs.

Each must include:

``` json
{
  "enharmonic_equivalents": ["chord:Db:maj"]
}
```

------------------------------------------------------------------------

### 3. Quality Normalization Rules

All chord qualities must be normalized to canonical lowercase strings.

  Source Representation   Canonical
  ----------------------- -----------
  M                       maj
  Major                   maj
  maj                     maj
  Δ                       maj
  m                       min
  Minor                   min
  min                     min
  7                       7
  maj7                    maj7
  M7                      maj7
  Δ7                      maj7
  m7                      min7
  dim                     dim
  diminished              dim
  aug                     aug
  augmented               aug
  sus2                    sus2
  sus4                    sus4

Rules:

-   Canonical quality strings are lowercase
-   No spaces
-   No special characters
-   Aliases are preserved in `aliases[]`

Example:

``` json
{
  "id": "chord:C:maj",
  "aliases": ["C", "Cmaj", "CM", "CΔ"]
}
```

------------------------------------------------------------------------

### 4. Pitch Class Storage

Pitch classes must preserve theoretical spelling consistent with the
chord identity.

Example: Db major:

``` json
["Db", "F", "Ab"]
```

NOT:

``` json
["C#", "F", "G#"]
```

Rules:

-   Preserve diatonic spelling
-   Do not normalize to pitch-class integers in MVP
-   Avoid accidental respelling unless explicitly required

------------------------------------------------------------------------

### 5. Deterministic Sorting Rules

Chord records must be sorted:

1.  By root in musical order:

    C, C#, Db, D, D#, Eb, E, F, F#, Gb, G, G#, Ab, A, A#, Bb, B

2.  Then by quality in fixed internal order:

    maj min 7 maj7 min7 dim aug sus2 sus4 ...

Sorting must be:

-   Stable
-   Deterministic
-   Independent of ingestion order

------------------------------------------------------------------------

## Data Structure Requirements

Each chord must include at minimum:

``` json
{
  "id": "chord:C:maj",
  "root": "C",
  "quality": "maj",
  "aliases": [],
  "enharmonic_equivalents": [],
  "formula": ["1", "3", "5"],
  "pitch_classes": ["C", "E", "G"],
  "voicings": [],
  "source_refs": []
}
```

------------------------------------------------------------------------

## Consequences

### Pros

-   Stable canonical IDs
-   Deterministic builds
-   Explicit enharmonic modeling
-   LLM-friendly structure
-   Avoids theoretical corruption
-   Clear alias handling

### Cons

-   Some duplication across enharmonic equivalents
-   Requires explicit linking logic
-   Slightly more complex normalization

------------------------------------------------------------------------

## Definition of Compliance

This ADR is satisfied when:

-   Every chord has a canonical ID matching the defined format
-   Enharmonic equivalents are explicitly linked
-   Qualities are normalized
-   Pitch classes preserve correct theoretical spelling
-   JSON output validates against schema and sorting is deterministic
