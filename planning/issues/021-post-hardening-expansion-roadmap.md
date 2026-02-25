# Issue: Post-Hardening Expansion Roadmap

## Summary

Define and schedule the next action items for the post-hardening expansion
phase of GCKB. This issue tracks the batch as a whole; each numbered item
below is a standalone deliverable.

The batch is split into two groups:
- **Pre-expansion fixes (022–025):** correctness bugs that must be resolved
  before the knowledge base grows — wrong source URLs, missing SVG diagram
  labels, and incomplete voicing coverage.
- **Expansion action items (026–035):** new coverage, infrastructure, and
  developer experience work defined in ADR-0005.

Strategic context: [`planning/decisions/0005-post-hardening-expansion-strategy.md`](../decisions/0005-post-hardening-expansion-strategy.md)

---

## Background

The MVP hardening batch (issues 011–020) is complete. The system now has:

- deterministic, provenance-enforced build contract
- CI gates and release-readiness checks
- parser resilience for both sources
- normalization edge-case coverage
- docs and SVG quality gates

The next wave expands chord coverage, improves human/LLM discoverability,
makes ingestion scalable to N sources, and reduces contributor friction.

---

## Action Items

### Pre-Expansion Fixes (do first)

| # | Title | Theme | Priority |
|---|-------|-------|----------|
| [022](#022) | Fix all-guitar-chords.com Source URLs | Data correctness | P0 |
| [023](#023) | Fix guitar-chord.org Source URLs | Data correctness | P0 |
| [024](#024) | SVG Diagram: String Labels and Fret Numbers | Diagram quality | P0 |
| [025](#025) | Complete Voicing Coverage | Data completeness | P0 |

### Expansion Action Items

| # | Title | Theme | Priority |
|---|-------|-------|----------|
| [026](#026) | Quality Map Expansion | Chord coverage | P0 |
| [027](#027) | Full Root Coverage | Chord coverage | P0 |
| [028](#028) | Chord Index Page Generation | Discoverability | P1 |
| [029](#029) | Source Expansion Scaffold | Ingestion scalability | P1 |
| [030](#030) | LLM JSONL Chunk Quality | Discoverability | P1 |
| [031](#031) | Voicing Position Metadata | Chord coverage | P1 |
| [032](#032) | Voicing Validation Guards | Chord coverage | P1 |
| [033](#033) | CLI Ergonomics Expansion | Ingestion scalability | P2 |
| [034](#034) | Docsite Navigation Index | Discoverability | P2 |
| [035](#035) | Developer Experience | Contributor experience | P2 |

---

## Synopses

### Pre-Expansion Fixes

#### 022

**Fix all-guitar-chords.com Source URLs**

The ingest URL pattern for all-guitar-chords.com is wrong. Current pattern
produces URLs like `https://www.all-guitar-chords.com/chords/c-major`; the
correct format is `https://all-guitar-chords.com/chords/index/c/major`.
Update URL construction in the source config/parser, refresh cached fixtures,
and verify provenance `url` fields match the corrected format.

#### 023

**Fix guitar-chord.org Source URLs**

The ingest URL pattern for guitar-chord.org is wrong. Current pattern produces
URLs like `https://www.guitar-chord.org/c-major.html`; the correct format is
`https://www.guitar-chord.org/c-maj.html`. Update URL construction, refresh
cached fixtures, and verify provenance `url` fields in generated records.

#### 024

**SVG Diagram Enhancements — String Labels and Fret Numbers**

SVG chord diagrams are missing two key visual elements: string name labels
(E A D G B E, low to high) below or above the nut, and fret number labels on
the left or right side of the diagram (e.g., 5 6 7 8 for a barre chord at
fret 5). Add both to the SVG generator and update snapshot tests.

#### 025

**Complete Voicing Coverage**

The parser currently captures only a subset of voicings per chord page. For
example, all-guitar-chords.com shows 9 variations for C min7 but the system
stores only 4. Audit and fix voicing limits in both parsers so all statically
available variations are ingested, normalized, and included in outputs.

---

### Expansion Action Items

#### 026

**Quality Map Expansion — min7, dim7, aug, sus2, sus4**

Extend the normalization quality map (ADR-0001) to cover the next-tier chord
qualities: min7, dim7 (and dim), aug, sus2, sus4. Add normalization tests for
all new quality aliases and confirm canonical IDs remain stable.

#### 027

**Full Root Coverage — All 12 Roots × Core Qualities**

Extend ingest targets in `src/config.ts` to all 12 chromatic roots. Add
cached HTML fixtures and normalization/output tests for the expanded set.
Validate deterministic sort order per ADR-0001 §5.

#### 028

**Chord Index Page Generation**

Add a build step that generates a top-level `docs/index.md` listing all chord
pages in deterministic root/quality order with links to individual chord pages.
Add tests ensuring the index matches the set of generated chord pages.

#### 029

**Source Expansion Scaffold — Typed Source Registry**

Refactor the source list into a typed source registry. Registering a new
source should require only adding an entry to the registry without editing
pipeline core code. Document the pattern and add a dry-run fixture test for
a hypothetical third source.

#### 030

**LLM JSONL Chunk Quality — Self-Contained Records**

Audit `data/chords.jsonl` records for retrieval self-containment. Each record
should include enough context (chord name, aliases, formula, notes, tuning) to
be understood without additional lookups. Add validation assertions and update
the JSONL writer if fields are missing.

#### 031

**Voicing Position Metadata — Open / Barre / Upper**

Add a `position` field to voicing records (values: `open`, `barre`, `upper`,
`unknown`). Derive position heuristically from fret data during normalization.
Add tests for heuristic and ensure schema accepts the new field.

#### 032

**Voicing Validation Guards — Fret Range and String Count**

Add validation rules checking that voicing fret values are within playable
range (0–24), that string counts match the tuning, and that muted strings are
represented consistently. Fail loudly on out-of-range data.

#### 033

**CLI Ergonomics Expansion — Partial Refresh and Dry-Run**

Add `--chord <id>`, `--source <name>`, and `--dry-run` flags to the ingest and
build CLI commands. Dry-run logs what would be fetched/built without writing
outputs. Partial filters limit processing to the specified chord or source.

#### 034

**Docsite Navigation Index — Cross-Links and Index Page**

Extend the docs generator to:
- emit cross-links between chord pages (e.g., related chords, enharmonic link)
- generate a root-grouped index page (`docs/index.md`) linking all chord pages
- add tests for cross-link generation and index determinism

#### 035

**Developer Experience — Devcontainer and Onboarding Guide**

Add `.devcontainer/devcontainer.json` (Node 20 base image, npm install on
create, `npm test` verify command). Expand `CONTRIBUTING.md` with a
step-by-step contributor flow (setup → ingest → test → PR). Verify a clean
devcontainer build runs `npm run build && npm run validate` successfully.

---

## Execution Order

Work MUST proceed in this sequence to respect dependencies:

```
022 → 023 → 024 → 025   (pre-expansion fixes — do before any coverage growth)
                   ↓
                026 → 027 → 032   (coverage foundation)
                               ↓
                             028 → 030 → 034   (discoverability layer)
                029 → 033              (ingestion infra — parallel-safe after 022–025)
                031                    (voicing metadata — after 026/027)
                035                    (DX — can go anytime after 025)
```

Strict sequencing:
1. **022/023** — source URL bugs poison provenance on every record; fix first
2. **024** — SVG labels improve all existing diagrams; fix before coverage grows
3. **025** — voicing completeness must be right before expanding to new roots/qualities
4. 026 — quality map must exist before 027 expands roots
5. 027 — full coverage before testing at scale
6. 032 — validation guards before docs go wide
7. 029 — source registry before new sources are added
8. 031 — position metadata after voicing guards are in place
9. 028/030/034 — discoverability after coverage is stable
10. 033 — CLI ergonomics can land anytime after 026–027
11. 035 — DX polish, last or parallel

---

## Acceptance Criteria

- All action items (022–035) are created in `planning/issues/`.
- Each item has acceptance criteria, validation steps, and follow-up notes.
- ADR-0005 is linked from this issue and accepted.
- Pre-expansion fixes (022–025) are resolved before expansion items begin.
- Action items are triaged and prioritized in the issue tracker.

## Validation Steps

```bash
# After completing the entire batch:
npm run lint
npm test
npm run build
npm run validate
```

## Follow-ups

- Once full 12-root × expanded-quality coverage is stable, open a new planning
  issue for chord theory content (scales, intervals, inversions).
- Review fixture management policy once fixture volume grows significantly.
- Track LLM retrieval quality with an evaluation harness in a follow-up ADR.
