# Issue: Data Model & Validation Layer

## Summary
Define strict TypeScript data models and validation boundaries for canonical chord entities in the Guitar Chord Knowledge Base (GCKB), aligned with `chords.schema.json` and ADR-0001.

## Why
A stable data model is required before ingestion, normalization, and docs generation to ensure deterministic output and schema-compliant records.

## Scope
- Create strict TypeScript interfaces for chord entities, voicings, and source references.
- Add canonical quality enums/constants and helper guards.
- Implement JSONL schema validation command (`npm run validate`) using the repository schema.
- Add deterministic sorting helpers for roots and qualities.
- Add unit tests for model guards and sorting behavior.

## Acceptance Criteria
- TypeScript strict mode passes with no `any` in core model paths.
- Validation command checks every JSONL line against `chords.schema.json`.
- Deterministic sort order matches ADR-0001.
- Tests cover:
  - canonical ID format acceptance/rejection
  - quality normalization mapping
  - deterministic root+quality ordering
- Documentation updated with model assumptions and command usage.

## Validation Steps
```bash
npm run lint
npm test
npm run validate
```

## Follow-ups
- Add source parsers for both websites.
- Add docs + SVG generation pipeline.
