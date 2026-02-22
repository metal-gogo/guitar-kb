# Decision 0004: Artifact Versioning Policy (Commit vs Generated Outputs)

**Date:** 2026-02-22  
**Status:** Accepted

---

## Context

Running `npm run ingest`, `npm run build`, or `npm run validate` generates several files under `data/` and `docs/`. Without a documented policy those files appear as untracked noise in `git status`, and it is ambiguous whether they should be committed.

The repository also caches raw HTML under `data/sources/` to enable reproducible, offline builds.

---

## Decision

### Committed to git

| Path | Reason |
|---|---|
| `data/sources/**/*.html` | Source cache — enables deterministic, offline ingest; must be committed so CI and contributors parse identical inputs |
| `chords.schema.json` | Schema definition — part of the codebase, not a build output |

### Excluded from git (`.gitignore`)

| Path | Reason |
|---|---|
| `data/generated/` | Intermediate normalised JSON (`chords.normalized.json`) — fully reproducible by re-running `npm run ingest` + build pipeline; committing it would create unnecessary diff noise |
| `data/chords.jsonl` | Primary machine-consumable output — generated deterministically by `npm run build`; treated as a build artifact, not a source file |
| `docs/chords/` | Generated Markdown chord pages — rebuilt on every `npm run build` run |
| `docs/diagrams/` | Generated SVG chord diagrams — rebuilt on every `npm run build` run |

---

## Rationale

**Keep source cache committed.** The source HTML is the raw input to the parser pipeline. Caching it guarantees that two `npm run build` runs on the same commit produce identical intermediate outputs, which is a core goal of the deterministic-build requirement in `AGENTS.md §3.1`. Without the cache, builds would depend on live network responses, breaking determinism.

**Exclude generated outputs from git.** `data/chords.jsonl` and `docs/` are fully deterministic products of the committed source cache and build scripts. Committing them would:
- Create large, noisy diffs on every chord or template change
- Risk committed outputs drifting from the build scripts (stale outputs)
- Make PRs harder to review (hundreds of lines of generated content)

Reviewers and consumers can always regenerate outputs locally with:

```bash
npm run build
```

CI already runs `npm run build && npm run validate` to confirm outputs are valid on every PR.

---

## Policy Enforcement

`.gitignore` excludes:
```
data/generated/
data/chords.jsonl
docs/chords/
docs/diagrams/
```

---

## Consequences

- Running `npm run build` locally will NOT produce untracked files that show up in `git status`.
- Generated outputs are never committed to `main`.
- CI validates the build is reproducible on every PR via `npm run build && npm run validate`.
- If the list of generated paths changes, this ADR and `.gitignore` must be updated together.
