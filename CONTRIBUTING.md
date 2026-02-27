# Contributing to Guitar Chord Knowledge Base

This guide is for both humans and autonomous agents contributing to GCKB.
Follow it from top to bottom for a deterministic setup and a merge-ready PR.

## 1. Prerequisites

- Node.js 20+
- npm 9+
- Git
- Optional but recommended: VS Code with Dev Containers

You can either use your local runtime or the included devcontainer.

### Devcontainer quick start

The repository includes `.devcontainer/devcontainer.json` with:

- Base image: `mcr.microsoft.com/devcontainers/javascript-node:20`
- `postCreateCommand`: `npm install`
- `postStartCommand`: `npm test`
- No forwarded ports (MVP has no running server)

Open the repo in a devcontainer and it should be ready without manual bootstrap.

## 2. First-Time Setup

```bash
git clone git@github.com:metal-gogo/guitar-kb.git
cd guitar-kb
npm install
npm test
```

If `npm test` passes, continue with the normal workflow.

## 3. Development Workflow

Use the ingest -> build -> validate loop while developing parser/model changes:

```bash
npm run ingest
npm run build
npm run validate
```

Use these helpers when needed:

- `npm run audit-cache` to check cached HTML fixture health
- `npm run check-links` to verify generated markdown/doc links
- `npm run pr-ready` to run a full pre-PR readiness pass

Before opening a PR, run the required quality gate sequence:

```bash
npm run lint && npm test && npm run build && npm run validate
```

CI also verifies a clean-state setup path (`npm ci && npm test`) and the
devcontainer config is covered by unit tests (`test/unit/devcontainer.test.ts`).

## 4. Running Tests

- Run full suite: `npm test`
- Run a single file with Vitest args: `npm test -- test/unit/docs.test.ts`
- Lint/type-check: `npm run lint`

Fixture guidance:

- Keep parser fixtures in `test/fixtures/...`
- Minimize fixtures to the smallest HTML that still reproduces behavior
- Document fixture intent and constraints in
  [Parser Fixture Index and Minimization Guide](docs/contributing/parser-fixtures.md)

## 5. Adding a New Chord Source

Follow the typed source registry pattern and checklist in
[Adding a New Chord Source](docs/contributing/adding-a-source.md).

This workstream is tracked in roadmap issue 029:

- `planning/issues/029-source-expansion-scaffold.md`

Expected implementation shape:

1. Add source metadata + parser module
2. Cache source HTML under `data/sources/<source>/...`
3. Add parser tests with fixtures
4. Ensure normalized output remains deterministic and schema-valid

## 6. Opening a PR

### Branch naming

| Type | Pattern | Example |
|---|---|---|
| Feature | `feat/<issue>-short-desc` | `feat/34-docs-generator-completeness` |
| Fix | `fix/<issue>-short-desc` | `fix/27-normalize-flat-roots` |
| Chore | `chore/<issue>-short-desc` | `chore/36-ci-clarity` |

Never push directly to `main`.

### Commit style

Use [Conventional Commits](https://www.conventionalcommits.org/):

```text
feat: ...
fix: ...
test: ...
docs: ...
chore: ...
refactor: ...
```

### PR checklist

1. Open or link the tracking issue.
2. Keep commits small and logically scoped.
3. Include PR description with:
   - what changed and why
   - exact local validation commands
   - known limitations/follow-up items
4. Ensure CI is green:
   - `build` (lint + test + ingest + build + validate)
   - `require-copilot-review`
5. Address every Copilot inline comment before merge.

Copilot review gate note:

- `require-copilot-review` appears twice because it runs on both
  `pull_request_target` and `workflow_run` after CI.
- Both checks must pass unless override label `copilot-review/override`
  is intentionally applied by a maintainer with justification.

## 7. Governance and ADRs

Design decisions and process rules live here:

- `planning/decisions/*.md` for architecture decisions
- `planning/issues/*.md` for scoped implementation work
- `planning/prompts/*.md` for autonomous execution prompts

When proposing a substantial change:

1. Write/update an issue with scope and acceptance criteria.
2. Add or amend an ADR when the decision affects long-term architecture.
3. Link the ADR/issue in your PR description.
