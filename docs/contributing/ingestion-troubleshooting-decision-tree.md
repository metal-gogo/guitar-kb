# Ingestion Troubleshooting Decision Tree

Use this when `npm run ingest` fails or when cache state looks inconsistent.
Commands below are verified against current CLI flags.

## Decision Tree

1. Start with a dry-run target check:

```bash
npm run ingest -- --dry-run
```

2. Did dry-run fail with `Unknown source` or `No ingest targets matched filters`?
   - Yes: this is a **filter/config branch**.
     - Run `npm run ingest -- --help` and verify `--source` and `--chord` values.
     - Re-run with a known source:

```bash
npm run ingest -- --source guitar-chord-org --dry-run
```

   - No: continue.

3. Audit cache integrity:

```bash
npm run audit-cache
```

4. Did `audit-cache` report `missing` or `corrupt` entries?
   - Yes: this is a **cache branch**.
     - Refresh only affected source(s):

```bash
npm run ingest -- --source guitar-chord-org --refresh
npm run ingest -- --source all-guitar-chords --refresh
```

     - For a targeted refresh, constrain by source and chord:

```bash
npm run ingest -- --source guitar-chord-org --chord chord:C:maj --refresh
```

     - Re-run `npm run audit-cache` and confirm zero missing/corrupt entries.
   - No: continue.

5. Run ingest normally:

```bash
npm run ingest
```

6. Does ingest fail with parser-style errors (for example `<source> parser failed for <url>`)?
   - Yes: this is a **parser branch**.
     - Run parser-focused tests:

```bash
npm test -- test/unit/parser.guitarChordOrg.test.ts
npm test -- test/unit/parser.allGuitarChords.test.ts
```

     - If tests fail, update parser logic to match current fixture/source DOM.
     - If tests pass but ingest still fails, refresh the failing source page and retry:

```bash
npm run ingest -- --source guitar-chord-org --refresh
```

   - No: continue.

7. Run refresh mode to force network fetch:

```bash
npm run ingest -- --refresh
```

8. Does refresh fail with HTTP/network errors (`HTTP 4xx/5xx`, fetch failure, retry logs)?
   - Yes: this is a **network branch**.
     - Verify connectivity and source availability by re-running a single source:

```bash
npm run ingest -- --source guitar-chord-org --refresh
```

     - If one source is down, continue work from cache (no `--refresh`) and open a follow-up issue documenting the source outage.
     - After source recovery, re-run full refresh and then `npm run audit-cache`.
   - No: ingest path is healthy.

## Post-Fix Verification

After remediating any branch, run the full gate:

```bash
npm run lint
npm test
npm run build
npm run validate
```
