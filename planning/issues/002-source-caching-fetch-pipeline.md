# Issue: Source Caching & Fetch Pipeline

## Summary
Implement deterministic raw HTML caching for source pages with optional refresh mode, rate limiting, and retries.

## Acceptance Criteria
- Raw HTML stored under `data/sources/<source>/<path>.html`
- Default mode reads cache first
- `--refresh` re-fetches from network with polite delays
- User-agent identifies GCKB project
- Tests cover cache hit/miss and path mapping
