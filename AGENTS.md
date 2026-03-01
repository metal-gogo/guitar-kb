# agents.md — Agent Operating Rules (GCKB)

This file is the high-signal policy for autonomous work in this repository.
It is intentionally concise. Detailed runbooks belong in `planning/prompts/*`.

## 0) Mission

Build and maintain a deterministic Guitar Chord Knowledge Base (GCKB) that is
usable by:

- Humans (clear docs, diagrams, navigation)
- LLMs (structured data, stable IDs, chunkable pages, provenance)

Current delivery scope is chord reference coverage and hardening, including
ingest, normalization, docs/site generation, and validation.

## 1) Responsibility Model

Agents own work end to end:

- issue execution and implementation
- tests and validation
- documentation updates
- CI/readiness checks
- PR creation, review response, and merge readiness

When GitHub automation is unavailable, draft equivalent artifacts in:

- `planning/issues/*.md`
- `planning/prs/*.md`

Default behavior when blocked:

- choose a reasonable default
- document the decision in `planning/decisions/*.md`
- open a follow-up issue for alternatives

## 2) Legal & Content Safety Rules (Non-negotiable)

### 2.1 Copyright boundaries

- Do not copy/paste large source-site text blocks.
- Do not reuse external source images/diagrams.
- You may extract factual chord data:
  - chord names, aliases, formulas, note spellings
  - tunings
  - voicing frets/fingers
- Published prose in this repo must be original writing.

### 2.2 Provenance required

Every chord and voicing must keep `source_refs` with:

- `source` (identifier)
- `url` (source page)
- optional `retrieved_at` (ISO timestamp)
- optional `note` (for example: `voicing v2`, `duplicate-voicing`)

## 3) Engineering Constraints

### 3.1 Determinism

- `npm run build` must be repeatable from the same inputs.
- Source HTML cache in `data/sources/` is the deterministic ingest input.
- Sorting and ID assignment must be stable.

### 3.2 Data contracts

- Canonical chord IDs follow `chord:<ROOT>:<QUALITY>`.
- Canonical root policy and enharmonic behavior must follow ADRs.
- Keep machine outputs schema-valid (`chords.schema.json`) at all times.
- Use the term `voicing` consistently in active internal guidance.

### 3.3 Separation of concerns

- `src/` implementation
- `data/` cache + generated machine artifacts
- `docs/` generated human docs + diagrams
- `planning/` issues, PR drafts, prompts, decisions

## 4) Workflow and Gates

Use the prompt runbooks for detailed execution procedures:

- autonomous maintenance: `planning/prompts/autonomous-maintenance.md`
- planning seeding: `planning/prompts/planning-stage-issue-seeding.md`

Git and PR policy:

- never push directly to `main`
- branch names: `feat/*`, `fix/*`, `chore/*`
- Conventional Commits
- keep commits logically scoped (avoid mega-commits)

Required local quality gates before merge:

- `npm run preflight` (runs `audit:ci -> lint -> test -> build -> validate`)

Expected project commands:

- `npm run ingest`
- `npm run build`
- `npm run validate`
- `npm test`
- `npm run lint`
- `npm run preflight`

## 5) Keep This File Thin

`AGENTS.md` is policy, not a long procedural manual. If detailed,
step-by-step instructions are needed, place them in:

- `planning/prompts/*` (execution workflows)
- `docs/contributing/*` (contributor guidance)
- `planning/decisions/*` (durable architecture/governance decisions)
