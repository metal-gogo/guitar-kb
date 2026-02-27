## Summary

<!-- What changed and why. Reference the issue: "Closes #<N>." -->

Closes #

## Changes

<!-- Bullet list of meaningful changes (files added/modified, behavior changed). -->

-

## Local Validation Evidence

Run the full suite before opening this PR and paste the results below.

```bash
npm run lint && npm test && npm run build && npm run validate
```

<details>
<summary>Output</summary>

```
# paste output here
```

</details>

## CI Expectations

<!-- Confirm which CI checks are expected to pass. -->

- [ ] `build` — lint + test + ingest + build + validate
- [ ] `require-copilot-review` — Copilot bot has reviewed (or `copilot-review/override` label applied with justification)

## Copilot Review

<!-- After CI passes, Copilot will post an automated review. -->

- [ ] All Copilot inline comments addressed (or explicitly replied to with justification)

## Checklist

- [ ] New tests added for any new behavior (parsers, normalization, SVG, docs)
- [ ] `chords.schema.json` updated if the data model changed
- [ ] `README.md` updated if a new CLI command or workflow step was added
- [ ] `source_refs` provenance present in any new chord/voicing records
- [ ] No copied source prose or reused external images
- [ ] Branch will be deleted after merge
