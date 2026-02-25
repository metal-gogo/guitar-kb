# ADR-0005: Post-Hardening Expansion Strategy

**Status:** Accepted  
**Date:** 2026-02-24  
**Owner:** Guitar Chord Knowledge Base (GCKB)

---

## Context

The MVP hardening batch (issues 011–020) delivers:

- rewritten README with full workflow documentation
- deterministic full-pipeline regression gate
- provenance completeness enforcement
- MVP contract integration suite (C, Cm, C7, Cmaj7)
- parser resilience for both source parsers (guitar-chord.org, all-guitar-chords)
- normalization edge-case coverage
- docs generator completeness and ordering
- SVG determinism and accessibility baseline
- CI check clarity and release-readiness checklist

With those foundations in place, the next wave must expand the system from a
narrowly scoped 4-chord MVP into a scalable, multi-quality, multi-root chord
knowledge base — while keeping the same deterministic, provenance-enforced
build contract.

---

## Decision

We adopt a post-hardening expansion strategy organized into four themes:

### Theme 1: Chord Coverage Expansion

Grow from 4 chords (C/Cm/C7/Cmaj7) to a full first-layer coverage of:

- **Quality breadth first:** add min7, dim7, aug, sus2, sus4 to the
  normalization quality map and build pipeline before scaling to all roots.
- **Root breadth second:** extend ingestion and normalization to all 12
  chromatic roots (C, C#/Db, D, D#/Eb, E, F, F#/Gb, G, G#/Ab, A, A#/Bb, B)
  for the core qualities.
- Keep ADR-0001 canonical ID scheme and enharmonic policy intact.
- Do not add new chord qualities without first expanding the quality normalization
  map to cover them.

### Theme 2: LLM and Human Discoverability

Improve how humans and LLMs consume the outputs:

- **Chord index page:** generate a navigable top-level index (Markdown) listing
  all chords by root and quality with links to individual pages.
- **LLM JSONL chunk quality:** ensure each JSONL record is self-contained enough
  to serve as a retrieval chunk without requiring additional context lookups.
- **Voicing position metadata:** enrich voicing records with `position` (open,
  barre, upper) and validate fret ranges are physically consistent.

### Theme 3: Source and Ingestion Scalability

Prepare the ingestion system to support additional sources cleanly:

- **Source registry pattern:** replace the ad-hoc source list with a typed
  source registry that allows registering a new source without touching the
  pipeline core.
- **CLI ergonomics:** add partial refresh (by chord or source), dry-run mode,
  and better filter flags to the CLI so agents can ingest efficiently at scale.

### Theme 4: Contributor and Developer Experience

Reduce onboarding friction for contributors and autonomous agents:

- **Devcontainer support:** add a `.devcontainer/` configuration so the project
  can be developed and tested in a consistent containerized environment.
- **Docsite navigation:** generate cross-linked chord pages and a root/quality
  index to make the docs tree browsable without a build tool or custom reader.

---

## Execution Sequence

Work in this order (each item is one issue):

1. Quality map expansion — min7, dim7, aug, sus2, sus4
2. Full root coverage — all 12 roots × core qualities (ingest + normalize)
3. Chord index page — navigable Markdown listing all chords
4. Source expansion scaffold — typed source registry pattern
5. LLM JSONL chunk quality — self-contained retrieval records
6. Voicing position metadata — open/barre/position fields + guards
7. Voicing validation guards — fret range, string count, consistency checks
8. CLI ergonomics — partial refresh, dry-run, chord filter flags
9. Docsite navigation index — cross-links + index page
10. Developer experience — devcontainer + expanded onboarding guide

---

## Governance Rules for This Phase

- One issue per branch (`feat/<issue>-short-desc`).
- Run `npm run lint && npm test && npm run build && npm run validate` before opening a PR.
- Any new chord quality MUST be added to the quality normalization map (ADR-0001) and
  covered by tests before being included in generated outputs.
- Any new source MUST be registered via the source registry pattern once it exists.
- Provenance (`source_refs`) is required on every chord and voicing — no exceptions.
- Canonical ID scheme from ADR-0001 remains unchanged.
- Generated outputs remain excluded from git (ADR-0004).

---

## Definition of Done (Expansion Batch)

This roadmap batch is complete when:

- Quality map covers: maj, min, 7, maj7, min7, dim7, aug, sus2, sus4 — with tests.
- Full 12-root × core-quality chord set is ingested, normalized, and validated.
- A chord index Markdown page is generated with deterministic ordering.
- Source registry pattern is in place; adding a source requires no core pipeline edits.
- Each JSONL record is self-contained enough for retrieval without cross-record lookups.
- Voicings include `position` metadata (open/barre/upper); fret ranges pass validation.
- CLI supports `--chord`, `--source`, and `--dry-run` flags.
- Docsite has a nav index page and cross-links between chord pages.
- Devcontainer enables a clean environment install and full build in one step.
- All 10 issues are closed with CI passing.

---

## Consequences

### Pros

- Expands chord coverage from 4 to the full first-layer library without breaking
  existing contracts.
- Improves LLM retrieval quality through self-contained records.
- Reduces contributor onboarding friction significantly.
- Prepares ingestion to scale to additional sources without pipeline rewrites.

### Cons

- Full 12-root coverage multiplies the fixture volume significantly; fixture
  management policy may need review.
- LLM chunk quality goals require subjective judgement calls; initial heuristics
  may need iteration.
- Devcontainer adds a maintenance surface for container base image updates.

---

## Compliance

ADR-0005 is satisfied when the 10-issue expansion batch (issues 022–031) is
created, executed in sequence, and all definition-of-done criteria above pass
on a clean `main` checkout.
