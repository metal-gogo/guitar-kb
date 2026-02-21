# agents.md — Agent Operating Rules (GCKB)

This repo is built and maintained by autonomous coding agents. These rules define how agents should plan, implement, test, document, and collaborate.

## 0) Mission

Build a **Guitar Chord Knowledge Base (GCKB)** that is consumable by:
- **Humans** (clean docs, diagrams, navigation)
- **LLMs** (structured data, stable IDs, chunkable pages, provenance)

Primary scope (MVP): **chord references**. Techniques/theory can be added later.

## 1) Ownership & End-to-End Responsibility

Agents own the full build cycle:
- Planning and breakdown into GitHub issues
- Implementation
- Tests and validation
- Documentation
- CI configuration
- Small, logical commits
- PR descriptions with clear validation steps

If GitHub automation isn’t available, agents must still generate:
- Issue titles + bodies (in `/planning/issues/*.md`)
- PR titles + descriptions (in `/planning/prs/*.md`)
- `gh` CLI commands (optional)

## 2) Legal & Content Safety Rules (Non-negotiable)

### 2.1 Copyright boundaries
- **Do not copy/paste large blocks of text** from source sites.
- **Do not reuse source images/diagrams** (including chord box images).
- You MAY extract **facts**:
  - chord names, aliases, interval formulas/steps, note spellings
  - tunings
  - voicing data expressed as frets/fingers (where possible)
- All published text must be **original writing** or **structured factual data**.

### 2.2 Provenance required
Every chord/voicing MUST carry `source_refs` with:
- `source` (identifier)
- `url` (page URL)
- optional `retrieved_at` (ISO date/time)
- optional `note` (e.g., "variation 2")

## 3) Repository Principles

### 3.1 Deterministic builds
- Running `npm run build` twice on the same inputs should produce identical outputs.
- Cache raw HTML in `/data/sources/*` so parsing can be offline and reproducible.
- Prefer stable sorting for all generated lists (by root, quality, ID, etc.).

### 3.2 Minimal dependencies
- Keep dependencies lean.
- Favor TypeScript + small utilities over heavy frameworks unless justified.

### 3.3 Clear separation of concerns
- `/src` — core implementation
- `/data` — generated outputs and raw caches
- `/docs` — human-facing Markdown + generated diagrams
- `/planning` — issue/PR drafts if GitHub access isn’t available

## 4) Data Model Rules

### 4.1 Canonical chord IDs
- Every chord entity MUST have a stable canonical ID.
- Use a predictable scheme like `chord:<ROOT>:<QUALITY>` (e.g., `chord:C:maj7`).
- Preserve display aliases (e.g., `Cmaj`, `CΔ`) as `aliases[]`.

### 4.2 Normalization & enharmonics
- Choose a default spelling policy (e.g., prefer sharps or prefer flats) and document it.
- Track enharmonic equivalents as `root_aliases[]` or `aliases[]`.
- Never silently discard information—normalize but retain original where helpful.

### 4.3 Schema validation
- Define a schema (JSON Schema and/or Zod).
- CI MUST validate generated JSONL against the schema.
- Prefer explicit enums for common fields (`quality`, `difficulty`, `tags`).

## 5) Ingestion Rules

### 5.1 Respect the sources
- Be gentle: cache requests, avoid hammering.
- Implement rate limiting (even simple delays) and retries with backoff.
- Use a clear user agent string identifying the project.

### 5.2 Parsing strategy
- Store raw HTML in `/data/sources/<source>/<path>.html`.
- Parsers should operate on cached HTML by default.
- Support a `--refresh` mode to re-fetch.

### 5.3 No brittle scraping
- Prefer parsing stable DOM features (ids/classes/labels) where possible.
- Unit-test parsers against saved HTML fixtures.

## 6) Documentation Rules (Human + LLM)

### 6.1 Docs must be original
- Summaries and descriptions must be newly written.
- Avoid paraphrasing too closely; keep it short and factual.

### 6.2 Page structure (recommended)
Each chord Markdown page should have:
- Title + canonical ID
- Aliases/symbols
- Formula/steps
- Notes (pitch classes)
- Voicings (each with generated SVG)
- Provenance block (links to sources)

### 6.3 LLM-consumable outputs
- Produce `/data/chords.jsonl` as the primary machine-consumable artifact.
- Keep fields consistent across records.
- Ensure each voicing is self-contained enough to be a retrieval chunk.

## 7) Coding Standards

### 7.1 TypeScript strictness
- Use `strict: true`.
- Avoid `any` unless justified (and documented).

### 7.2 Error handling
- Fail loudly on schema violations.
- Parsers should return structured errors with enough context to debug.

### 7.3 Logging
- Use minimal structured logs (source, chord id, counts).
- No noisy logs in tests.

## 8) Testing Rules

### 8.1 Required tests
- Parser unit tests (per source)
- Normalization tests (canonical ID, alias behavior)
- Snapshot tests for a small set of chords (stable output)
- Diagram generator tests (basic SVG sanity)

### 8.2 Test data management
- Store fixtures under `/test/fixtures/...`.
- Fixtures should include the cached HTML used by parsers.

## 9) CI Rules

CI must run on every PR:
- `npm run lint`
- `npm run test`
- `npm run build`
- `npm run validate` (schema validation)

CI must fail if:
- generated outputs are invalid
- formatting/lint issues exist
- tests fail

## 10) Git Workflow Rules

### 10.1 Issues first
Work should be tracked by GitHub issues.
If GitHub access is unavailable:
- Write issues in `/planning/issues/<slug>.md`
- Include acceptance criteria and validation steps

### 10.2 Branch naming
- `feat/<issue>-short-desc`
- `fix/<issue>-short-desc`
- `chore/<issue>-short-desc`

### 10.3 Commit style
Use Conventional Commits:
- `feat: ...`
- `fix: ...`
- `test: ...`
- `docs: ...`
- `chore: ...`
- `refactor: ...`

### 10.4 Granularity
Prefer small, logical commits:
- add schema
- add parser scaffolding
- parse one chord page
- normalize output
- add docs generation
- add svg generator
- add CI workflow

No “mega commits”.

### 10.5 PR description
Every PR must include:
- What changed + why
- How to validate locally (exact commands)
- Any known limitations and follow-up issues

## 11) Default Commands (expected)

Repo should support:
- `npm run ingest`  
- `npm run build`  
- `npm run validate`  
- `npm test`  
- `npm run lint`  

If a command is added/changed, update README.

## 12) When blocked

Agents should NOT ask clarifying questions unless truly blocking.
Instead:
- choose a reasonable default
- document it in README or `/planning/decisions/*.md`
- open a follow-up issue for alternatives

## 13) Definition of Done (MVP)

MVP is done when:
- At least a small subset of chords (e.g., C major/minor/7/maj7 + a few voicings) is ingested deterministically.
- `/data/chords.jsonl` validates against the schema.
- `/docs/chords/...` pages exist and include generated SVG diagrams.
- CI passes on a clean checkout.
- Provenance is present for every chord/voicing.