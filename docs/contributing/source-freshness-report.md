# Source Freshness Report

The source freshness report summarizes cache age under `data/sources/` and flags
targets older than a configured threshold.

## Command

```bash
npm run source-freshness
```

## Defaults

- Max age threshold: `30` days (`--max-age-days`)
- Cache base directory: `data/sources` (`--cache-base`)
- Reference timestamp (`as-of`): current UTC time (`--as-of`)

## Deterministic CI Usage

For deterministic output across repeated runs, pin `--as-of`:

```bash
npm run source-freshness -- --as-of 2026-02-27T00:00:00.000Z --max-age-days 30
```

## CI Policy

CI runs the following cache-health checks on every PR:

- `npm run audit-cache`
- `npm run source-freshness -- --as-of 2026-02-27T00:00:00.000Z --max-age-days 30`

Policy behavior:

- **Fail** when cache audit finds missing or corrupt cache entries.
- **Warn only** when source freshness reports stale entries (non-blocking).

CI stores deterministic text artifacts in `.artifacts/` and uploads them as
the `cache-health` artifact bundle:

- `.artifacts/cache-audit.txt`
- `.artifacts/source-freshness.txt`

## Output Shape

The report prints:

- one `TOTAL` line with expected/present/missing/stale counts
- one `SOURCE ...` line per source (sorted by source id)
- a `STALE_TARGETS <n>` section sorted by source, fetched timestamp, then slug

Each stale target includes:

- cache path (`<source>/<slug>.html`)
- fetched timestamp (from file mtime)
- calculated age in days
