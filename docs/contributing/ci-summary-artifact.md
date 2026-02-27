# CI Run Summary Artifact

Every CI run (on PRs and pushes to `main`) uploads a `ci-summary` artifact containing a
deterministic Markdown file that reports pass/fail for each pipeline step.

---

## Viewing the Artifact

1. Open the failing workflow run on GitHub Actions.
2. Scroll to the **Artifacts** section at the bottom of the run page.
3. Download `ci-summary`.
4. Open `ci-summary.md` — it will show which steps passed and which failed,
   plus remediation hints for any failures.

The same content is also appended to the **Job Summary** tab in the workflow run UI,
so you can read it directly in the browser without downloading anything.

---

## Artifact Retention

Artifacts are retained for **7 days** and then deleted automatically by GitHub.

---

## Summary Format

```markdown
# CI Run Summary

| Step     | Status   |
|----------|----------|
| lint     | ✅ success |
| test     | ✅ success |
| ingest   | ✅ success |
| build    | ✅ success |
| validate | ✅ success |
```

On failure, a **Remediation Hints** section is appended:

```markdown
## Remediation Hints

- **test failed**: run `npm test` locally; check for regressions in parsers,
  normalization, or SVG output.
- **validate failed**: run `npm run validate` locally; check `chords.schema.json`
  compliance and provenance.
```

---

## Remediation Quick Reference

| Failing step | Local command | Common causes |
|---|---|---|
| `lint` | `npm run lint` | TypeScript type errors, ESLint violations |
| `test` | `npm test` | Parser, normalization, SVG, or schema regressions |
| `ingest` | `npm run ingest` | Missing cached HTML; run `npm run audit-cache` to diagnose |
| `build` | `npm run build` | Docs or SVG generator errors |
| `validate` | `npm run validate` | Schema violations, missing `source_refs` provenance |

---

## Determinism

The summary content is deterministic: identical pipeline outcomes always produce
identical `ci-summary.md` output. The artifact name is always `ci-summary`.

---

## See Also

- [CONTRIBUTING.md — CI Checks](../../CONTRIBUTING.md#ci-checks)
- [Parser Fixture Index and Minimization Guide](parser-fixtures.md)
- [Adding a New Chord Source](adding-a-source.md)
