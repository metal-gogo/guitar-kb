# Copilot Review Instructions (Repository)

Use these instructions when reviewing pull requests in this repository.

## Review Priority

1. **Correctness and regressions first**
   - Flag behavior changes that break existing ingest/build/validate flows.
   - Prefer concrete, reproducible findings over style suggestions.

2. **Deterministic build requirements**
   - Ensure outputs are deterministic for identical inputs.
   - Flag nondeterministic ordering, unstable iteration, or timestamp-coupled output.

3. **Schema and data integrity**
   - Confirm generated chord records remain compatible with `chords.schema.json`.
   - Flag missing required fields, invalid enums, or malformed IDs.
   - Validate canonical ID stability and normalization behavior.

4. **Provenance and legal boundaries**
   - Ensure chord/voicing records preserve `source_refs` provenance.
   - Flag any copied source prose or external diagram/image reuse.

5. **Workflow and governance consistency**
   - Respect branch protection/ruleset requirements.
   - Avoid suggesting direct commits to `main`.
   - Prefer small, issue-scoped fixes and clear validation steps.

## Review Style

- Prioritize **high-signal comments** only (security, correctness, data integrity, determinism, CI reliability).
- Avoid low-value nits unless they hide a real defect.
- When possible, include exact file(s), failure mode, and a minimal fix direction.

## Test and Validation Expectations

When changes affect ingestion, normalization, docs generation, schema, or SVG output, verify that PR validation covers:

- `npm run lint`
- `npm test`
- `npm run build`
- `npm run validate`

If one is intentionally skipped, request explicit justification in the PR description.
