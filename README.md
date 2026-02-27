# Guitar Chord Knowledge Base (GCKB)

GCKB is a deterministic pipeline that transforms cached chord source pages into:

- Human-facing Markdown pages with generated chord diagrams
- LLM-friendly normalized JSONL with stable canonical IDs and provenance

Primary scope (MVP): chord references (C, Cm, C7, Cmaj7) from two sources.

## What this repository does

End-to-end pipeline:

1. Ingest source HTML from local cache (or refresh from source URLs)
2. Parse source-specific chord/voicing data
3. Normalize to canonical records (stable IDs and ordering)
4. Generate machine and human artifacts (`data/chords.jsonl`, docs, SVGs)
5. Validate all output against `chords.schema.json`

## Inputs and outputs

### Inputs

- Source target config in `src/config.ts` (`MVP_TARGETS`)
- Cached source HTML in `data/sources/<source>/<slug>.html`
- Normalization and canonical ID policy in `planning/decisions/0001-canonical-id-and-enharmonics.md`
- Schema constraints in `chords.schema.json`

### Generated artifacts

- `data/generated/chords.normalized.json` (intermediate normalized records)
- `data/chords.jsonl` (primary machine-consumable output)
- `docs/chords/*.md` (per-chord documentation)
- `docs/diagrams/*.svg` (generated voicing diagrams)

### Artifact versioning policy

Source cache (`data/sources/**/*.html`) is **committed** to enable deterministic, offline builds.

All generated outputs (`data/generated/`, `data/chords.jsonl`, `docs/chords/`, `docs/diagrams/`) are **excluded from git** via `.gitignore`. They are fully reproducible by running `npm run build`. Committing generated outputs would create noisy diffs and risk stale artifacts drifting from the build scripts.

Full policy: [`planning/decisions/0004-artifact-versioning-policy.md`](planning/decisions/0004-artifact-versioning-policy.md)

## Repository map

- `src/cli/*` – command entrypoints (`ingest`, `build`, `validate`)
- `src/ingest/fetch/*` – cache-aware fetch logic (with user agent and retry behavior)
- `src/ingest/parsers/*` – source-specific parsers (`guitar-chord-org`, `all-guitar-chords`)
- `src/ingest/normalize/*` – canonical record normalization
- `src/build/output/*` – JSONL output writer
- `src/build/docs/*` – Markdown generation
- `src/build/svg/*` – SVG diagram generation
- `src/validate/*` – schema validation
- `src/types/*` – core data model and guards
- `src/utils/*` – filesystem and deterministic sorting helpers
- `test/fixtures/*` – cached parser fixtures
- `test/unit/*` – parser/normalize/svg/schema/model tests
- `planning/decisions/*` – ADRs and architectural decisions
- `planning/issues/*` – issue drafts and delivery planning

## Command reference

### Requirements

- Node 20+
- npm 9+

### Install

```bash
npm install
```

### Ingest normalized records

```bash
npm run ingest
```

Writes `data/generated/chords.normalized.json`.

To refresh remote source pages while ingesting:

```bash
npm run ingest -- --refresh
```

To include parser confidence annotations for debugging:

```bash
npm run ingest -- --include-parser-confidence
```

### Build outputs

```bash
npm run build
```

Build behavior:

- loads `data/generated/chords.normalized.json` if present
- otherwise generates normalized records via ingest pipeline
- sorts records deterministically
- validates records
- regenerates JSONL/docs/SVG artifacts

### Validate output schema

```bash
npm run validate
```

Validates every `data/chords.jsonl` record against `chords.schema.json`.

### Report source cache freshness

```bash
npm run source-freshness
```

Reports per-source cache freshness from `data/sources/` using file mtimes.
Default stale threshold is `30` days.

For reproducible output in CI logs, pin an explicit `as-of` timestamp:

```bash
npm run source-freshness -- --as-of 2026-02-27T00:00:00.000Z --max-age-days 30
```

### Snapshot generated docs changes

```bash
npm run docs-changelog
```

Compares generated docs outputs against a baseline snapshot and reports
deterministic `added/changed/removed` file lists.

To update the baseline after an intentional docs regeneration:

```bash
npm run docs-changelog -- --write-baseline
```

### Lint and tests

```bash
npm run lint
npm test
```

### Release gate (pre-merge verification)

Run all quality gates in a single command:

```bash
npm run preflight
```

This runs `lint → test → build → validate` in sequence and fails fast on the
first error. `build` includes the ingest pipeline if
`data/generated/chords.normalized.json` is absent.

To include a full source refresh before the gate:

```bash
npm run ingest && npm run preflight
```

## Typical local workflows

### Full clean local verification (recommended before PR)

```bash
npm run preflight
```

For a full source refresh first:

```bash
npm run ingest && npm run preflight
```

### Fast artifact refresh during development

```bash
npm run build
npm run validate
```

## Determinism and data integrity

Determinism is enforced through:

- stable canonical IDs (`chord:<ROOT>:<QUALITY>`)
- fixed root and quality sort order (`src/config.ts`, `src/utils/sort.ts`)
- cached HTML inputs under `data/sources/*`
- deterministic build regeneration of docs and diagrams

Data integrity is enforced through:

- schema validation (`src/validate/schema.ts` + `chords.schema.json`)
- strict model guards and tests
- provenance fields (`source_refs`) at chord and voicing levels

## Legal and provenance boundaries

This project extracts facts, not copyrighted presentation.

- Allowed: chord names, aliases, formulas, note spellings, tunings, voicing metadata
- Not allowed: copied source prose, reused external diagrams/images
- Required: provenance references for each chord/voicing (`source`, `url`, optional `retrieved_at`/`note`)

See `AGENTS.md` for full operating policy.

## CI and review gates

PRs are expected to pass the full quality gate. Run locally before pushing:

```bash
npm run preflight
```

Individual steps:

- `npm run lint`
- `npm test`
- `npm run build`
- `npm run validate`

Copilot review gate:

- workflow: `.github/workflows/copilot-review.yml`
- required check context: `Copilot Review / require-copilot-review`
- ruleset-triggered Copilot review requests are enforced by the workflow

## Troubleshooting

- **Missing `data/chords.jsonl`**: run `npm run build` first.
- **Schema validation failure**: inspect failing record shape against `chords.schema.json`.
- **Parser regressions**: verify source fixtures in `test/fixtures/sources/*` and run parser unit tests.
- **Unexpected artifact differences**: rebuild from cached inputs and compare sorted outputs.

## Project status

MVP scope is implemented; current focus is post-MVP hardening:

- documentation clarity
- stronger determinism/provenance regression guards
- parser resilience and normalization edge cases
- CI and release-readiness polish
