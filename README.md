# Guitar Chord Knowledge Base (GCKB)

A deterministic guitar chord reference pipeline designed for:

- 🎸 Humans (clean Markdown pages + generated diagrams)
- 🤖 LLMs (normalized JSONL + stable canonical IDs + provenance)

Primary scope (MVP): chord references.  
Future scope: techniques, theory, progressions.

---

## 🚀 Quickstart

### Requirements

- Node 20+
- npm 9+
- (optional) GitHub CLI (`gh`) for automated issue creation

---

### Install

```bash
npm install
```

### Run the full MVP pipeline

```bash
npm run ingest
npm run build
npm run validate
```

### Validate locally before PR

```bash
npm run lint
npm test
npm run ingest
npm run build
npm run validate
```

## Project commands

- `npm run ingest` — reads cached source HTML (or refreshes with `--refresh`) and normalizes chord entities
- `npm run build` — validates normalized entities, writes `data/chords.jsonl`, generates docs and SVG diagrams
- `npm run validate` — validates `data/chords.jsonl` against `chords.schema.json`
- `npm test` — parser, normalization, SVG, and schema tests
- `npm run lint` — strict TypeScript checks

## Determinism and legal boundaries

- Source caches are stored under `data/sources/<source>/<slug>.html`
- Builds are deterministic from cached HTML inputs
- Facts only are extracted (names, formulas, pitch classes, voicings, tuning)
- No source text blocks or source images are reused
- Every chord and voicing includes provenance references (`source_refs`)