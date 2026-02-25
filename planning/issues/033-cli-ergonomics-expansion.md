# Issue: CLI Ergonomics Expansion — Partial Refresh and Dry-Run

**Roadmap batch:** Post-Hardening Expansion (ADR-0005)  
**Priority:** P2  
**Depends on:** issue 025 (source registry), issue 022–023 (expanded coverage)

---

## Summary

Add `--chord <id>`, `--source <name>`, and `--dry-run` flags to the ingest and
build CLI commands. These flags enable targeted re-ingestion of a single chord
or source, and a dry-run mode that logs what would be processed without writing
outputs.

## Why

With 100+ chords across two sources, a full `npm run ingest` pass on every
change is slow and wasteful. Partial refresh flags allow agent-driven workflows
to re-ingest only what changed. Dry-run mode enables safe inspection before
committing writes.

## Scope

### `--chord <id>` flag

- Accepts a canonical chord ID (e.g., `chord:D:min`) or a slug pattern
  (e.g., `d-minor`).
- Limits ingest/build to the matching chord across all registered sources.
- Errors clearly if the chord ID doesn't match any ingest target.

### `--source <name>` flag

- Accepts a source registry ID (e.g., `guitar-chord-org`).
- Limits ingest/build to targets from the specified source.
- Uses the typed source registry from issue 025.

### `--dry-run` flag

- Logs what would be fetched or written without executing writes.
- Exits with code 0 if the operation would succeed; non-zero if validation
  issues are detected.

### Implementation notes

- Add flag parsing to `src/cli/ingest.ts` and `src/cli/build.ts`.
- Pass filter context through the pipeline via a `PipelineOptions` type.
- No behavioral changes when no flags are passed (full pipeline runs as today).

## Acceptance Criteria

- `npm run ingest -- --chord chord:D:min` only fetches/parses D minor targets.
- `npm run ingest -- --source guitar-chord-org` only runs that source's parser.
- `npm run ingest -- --dry-run` logs targets but writes no files.
- Full ingest with no flags is unchanged.
- Tests cover flag parsing and filter propagation using stubs.

## Validation Steps

```bash
npm run ingest -- --dry-run
npm run ingest -- --chord chord:C:maj
npm run ingest -- --source guitar-chord-org
npm test
```

## Follow-ups

- Add `--quality <quality>` filter flag for ingest targeting by quality.
- Add progress output (processed/total count) to ingest for long runs.
