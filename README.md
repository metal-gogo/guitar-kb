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

- Source target config in `src/config.ts` (`FULL_MATRIX_TARGETS`, `CORE_MATRIX_TARGETS`)
- Cached source HTML in `data/sources/<source>/<slug>.html`
- Canonical ID and normalization policy in `planning/decisions/0001-canonical-id-and-enharmonics.md`
- Flat-baseline canonical root policy in `planning/decisions/0007-flat-baseline-canonical-root-policy.md`
- Contributor reference for root mapping in `docs/contributing/root-spelling-policy.md`
- Schema constraints in `chords.schema.json`

### Generated artifacts

- `data/generated/chords.normalized.json` (intermediate normalized records)
- `data/chords.jsonl` (primary machine-consumable output)
- `docs/chords/*.md` (per-chord documentation)
- `docs/diagrams/*.svg` (generated voicing diagrams)
- `site/index.html` + `site/chords/*.html` (generated static website)
- `site/diagrams/*.svg` (website diagram assets)

### Artifact versioning policy

Source cache (`data/sources/**/*.html`) is **committed** to enable deterministic, offline builds.

All generated outputs (`data/generated/`, `data/chords.jsonl`, `docs/chords/`, `docs/diagrams/`, `site/`) are **excluded from git** via `.gitignore`. They are fully reproducible by running `npm run build`. Committing generated outputs would create noisy diffs and risk stale artifacts drifting from the build scripts.

Full policy: [`planning/decisions/0004-artifact-versioning-policy.md`](planning/decisions/0004-artifact-versioning-policy.md)

## License

This repository is distributed under the ISC License. See
[`LICENSE`](LICENSE) for full terms.

Usage expectations:

- Generated repository content is original project output.
- Source-site prose and source diagrams are not copied into this repository.
- Ingested chord labels, formulas, note spellings, and voicing frets are used
  as factual data with provenance metadata.

## Repository map

- `src/cli/*` – command entrypoints (`ingest`, `build`, `validate`)
- `src/ingest/fetch/*` – cache-aware fetch logic (with user agent and retry behavior)
- `src/ingest/parsers/*` – source-specific parsers (`guitar-chord-org`, `all-guitar-chords`)
- `src/ingest/normalize/*` – canonical record normalization
- `src/build/output/*` – JSONL output writer
- `src/build/docs/*` – Markdown generation
- `src/build/site/*` – static website generation
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

Explicit mode commands:

- Full matrix ingest:

```bash
npm run ingest -- --mode full
```

- Chord-targeted ingest by canonical ID:

```bash
npm run ingest -- --mode chord --chord-id chord:Db:maj7
```

- Chord-targeted ingest by root + quality (sharp input normalizes to flat canonical ID):

```bash
npm run ingest -- --mode chord --root C# --quality maj7
```

- Optional source-restricted chord ingest:

```bash
npm run ingest -- --mode chord --chord-id chord:Db:maj7 --source guitar-chord-org
```

Default merge precedence is deterministic and source-agnostic:
- `all-guitar-chords` is processed first for each chord target.
- `guitar-chord-org` is processed second; both sources are ingested when available, with deterministic merge behavior for overlaps.

To refresh remote source pages while ingesting:

```bash
npm run ingest -- --refresh
```

To include parser confidence annotations for debugging:

```bash
npm run ingest -- --include-parser-confidence
```

To filter ingest to a specific extended-quality chord target:

```bash
npm run ingest -- --chord c-dim7
```

Compatibility:

- Legacy `--chord` remains supported and infers chord-targeted mode when `--mode` is omitted.

Capability diagnostics:

- In dry-run mode, ingest prints deterministic `SKIP_UNSUPPORTED` lines when a
  target is outside a source's declared capability metadata.
- Gap summary lines are printed as:
  - `GAP_UNRESOLVED ...` for required matrix IDs with no supporting source
  - `GAP_ALLOWLISTED ...` for temporarily allowlisted unsupported gaps

Strict capability mode:

```bash
env INGEST_STRICT_CAPABILITIES=1 npm run ingest -- --dry-run
```

This exits non-zero if unresolved required gaps remain.

Temporary allowlist override (comma-separated canonical IDs):

```bash
env INGEST_STRICT_CAPABILITIES=1 \
  INGEST_CAPABILITY_ALLOWLIST=chord:C:min7,chord:D:aug \
  npm run ingest -- --dry-run
```

### Build outputs

```bash
npm run build
```

Build behavior:

- loads `data/generated/chords.normalized.json` if present
- otherwise generates normalized records via ingest pipeline
- in full build mode (no `--chord`/`--source` filters), enforces cache completeness
  policy before build/deploy:
  - writes `data/generated/cache-completeness.manifest.json`
  - skips ingest when cache is complete and normalized artifacts already exist
  - fails fast with missing/corrupt cache target details when completeness fails
- sorts records deterministically
- validates records
- regenerates JSONL/docs/SVG/static-site artifacts

Local website preview:

```bash
python3 -m http.server --directory site 4173
```

Then open: `http://localhost:4173`

To dry-run build output selection for an extended-quality canonical chord ID:

```bash
npm run build -- --dry-run --chord chord:C:dim7
```

### Validate output schema

```bash
npm run validate
```

Validates every `data/chords.jsonl` record against `chords.schema.json`.

Validation also enforces the root-quality coverage gate and writes a
deterministic machine-readable artifact:

- `data/coverage-report.json`

Coverage gate modes:

- default (`allowlist`): requires full matrix coverage except explicit temporary
  allowlist entries
- strict (`full-matrix`): requires zero missing matrix entries

Environment variables:

- `VALIDATE_REQUIRE_FULL_MATRIX=1` - enable strict full-matrix mode
- `VALIDATE_COVERAGE_ALLOWLIST=chord:C:min7,chord:D:min7` - add temporary
  comma-separated allowlist entries in default mode

Coverage policy behavior:

- Validation uses an explicit contract (`coverage-matrix/v1`) for
  root-quality expectations.
- The contract order is deterministic and matches configured matrix order in
  code (roots + qualities).
- `npm run validate` prints matrix metadata before coverage summaries:
  - `matrix_version=...`
  - `expected_roots=...`
  - `expected_qualities=...`
- Missing combinations are reported with deterministic severity tags per
  quality (`critical`, `high`, `medium`, `low`).

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

### Dependency audit

```bash
npm run audit:deps
```

CI enforcement command (fails on high/critical findings):

```bash
npm run audit:ci
```

Workflow details: [`docs/contributing/dependency-audit.md`](docs/contributing/dependency-audit.md).

### Release gate (pre-merge verification)

Run all quality gates in a single command:

```bash
npm run preflight
```

This runs `audit:ci → lint → test → build → validate` in sequence and fails
fast on the first error. `build` includes the ingest pipeline if
`data/generated/chords.normalized.json` is absent.

To include a full source refresh before the gate:

```bash
npm run ingest:full-refresh && npm run preflight
```

Routine deploy-friendly flow:

```bash
npm run audit-cache
npm run preflight
```

`npm run audit-cache` writes a deterministic cache completeness report to
`data/generated/cache-completeness.manifest.json`.

## Typical local workflows

### Full clean local verification (recommended before PR)

```bash
npm run preflight
```

For a full source refresh first:

```bash
npm run ingest:full-refresh && npm run preflight
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

See `AGENTS.md` for high-signal repository policy and
`planning/prompts/autonomous-maintenance.md` for the detailed autonomous
execution runbook.

## CI and review gates

PRs are expected to pass the full quality gate. Run locally before pushing:

```bash
npm run preflight
```

Individual steps:

- `npm run audit:ci`
- `npm run lint`
- `npm test`
- `npm run build`
- `npm run validate`

Copilot review gate:

- workflow: `.github/workflows/copilot-review.yml`
- required check context: `Copilot Review / require-copilot-review`
- ruleset-triggered Copilot review requests are enforced by the workflow

CI artifacts include:

- `ci-summary`
- `dependency-audit` (`.artifacts/npm-audit.json` from `npm run audit:ci -- --json > .artifacts/npm-audit.json`)
- `flaky-test-summary`
- `docs-changelog-snapshot`
- `coverage-report` (`data/coverage-report.json` from `npm run validate`)
- `site-bundle` (deterministic `site.tar` archive with static website output)

Website publishing workflow:

- PRs: CI runs dedicated `website` job (`build` + `check-links`) and uploads
  `site-bundle` for preview/debug.
- `main` pushes: CI uploads `site/` to GitHub Pages and deploys to:
  `https://metal-gogo.github.io/guitar-kb/`
- Publish always runs after the full build/test gate because `website` depends
  on successful `build` job completion.

## Troubleshooting

- **Missing `data/chords.jsonl`**: run `npm run build` first.
- **Schema validation failure**: inspect failing record shape against `chords.schema.json`.
- **Parser regressions**: verify source fixtures in `test/fixtures/sources/*` and run parser unit tests.
- **Unexpected artifact differences**: rebuild from cached inputs and compare sorted outputs.
- **Ingest failures or cache inconsistencies**: follow the [Ingestion Troubleshooting Decision Tree](docs/contributing/ingestion-troubleshooting-decision-tree.md).

## Project status

MVP scope is implemented; current focus is post-MVP hardening:

- documentation clarity
- stronger determinism/provenance regression guards
- parser resilience and normalization edge cases
- CI and release-readiness polish
