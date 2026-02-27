# PR Draft: Developer Experience — Devcontainer and Onboarding

## Title

`feat: add devcontainer config and onboarding guide`

## Linked Issue

- https://github.com/metal-gogo/guitar-kb/issues/70

## What Changed

1. Added `.devcontainer/devcontainer.json` with:
   - `mcr.microsoft.com/devcontainers/javascript-node:20`
   - `postCreateCommand: npm install`
   - `postStartCommand: npm test`
   - no forwarded ports
   - recommended VS Code extensions (`prettier`, `eslint`, `copilot`)
2. Added `test/unit/devcontainer.test.ts` so CI verifies the devcontainer
   contract (image, startup commands, no ports, extension set).
3. Reworked `CONTRIBUTING.md` into a step-by-step onboarding workflow with:
   - prerequisites
   - first-time setup
   - development workflow
   - testing guidance
   - new source integration pointer (issue 029 pattern)
   - PR process (branch naming, commit style, Copilot gate expectations)
   - governance/ADR guidance

## Why

This closes the contributor bootstrap gap by making environment setup explicit
and reproducible for both humans and autonomous agents.

## Validation Run

```bash
npm run lint
npm test
npm run build
npm run validate
```

All commands passed locally on branch `feat/70-developer-experience`.

## Known Limitations / Follow-ups

- GitHub CLI auth is currently invalid in this environment, so this PR is
  captured as a local draft under `planning/prs/` instead of being opened via
  `gh pr create`.
