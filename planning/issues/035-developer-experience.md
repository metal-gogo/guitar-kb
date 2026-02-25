# Issue: Developer Experience — Devcontainer and Onboarding Guide

**GitHub Issue:** https://github.com/metal-gogo/guitar-kb/issues/70  
**Roadmap batch:** Post-Hardening Expansion (ADR-0005)  
**Priority:** P2  
**Can land anytime after issue 025**

---

## Summary

Add a `.devcontainer/` configuration (Node 20 base, npm install on create,
verify pass with `npm test`) and expand `CONTRIBUTING.md` with a step-by-step
contributor/agent onboarding guide covering the full workflow from clone to PR.

## Why

New contributors and autonomous agents currently must infer the setup sequence
from the README. A devcontainer eliminates environment drift (Node version,
global npm deps) and provides a reproducible development environment in one
click. An expanded `CONTRIBUTING.md` reduces the time from "cloned the repo"
to "first green build" to under 5 minutes.

## Scope

### Devcontainer

- Add `.devcontainer/devcontainer.json`:
  - Base image: `mcr.microsoft.com/devcontainers/javascript-node:20`
  - `postCreateCommand`: `npm install`
  - `postStartCommand`: `npm test` (sanity verify)
  - Forward no ports (no server in MVP scope)
  - Recommended VS Code extensions:
    - `esbenp.prettier-vscode`
    - `dbaeumer.vscode-eslint`
    - `GitHub.copilot`
- Verify `.devcontainer/` config enables a clean `npm run build && npm run validate`
  from a fresh container without additional manual steps.

### CONTRIBUTING.md expansion

Expand `CONTRIBUTING.md` with the following sections:
1. **Prerequisites** — Node 20+, npm 9+, or devcontainer
2. **First-time setup** — clone, `npm install`, verify with `npm test`
3. **Development workflow** — ingest → build → validate cycle with exact commands
4. **Running tests** — `npm test`, filter flags, fixture management
5. **Adding a new chord source** — pointer to source registry pattern (issue 029)
6. **Opening a PR** — branch naming, commit style, validation checklist,
   Copilot review gate explanation
7. **Governance and ADRs** — where decisions live, how to propose a change

### Testing

- Add a simple CI-verifiable test (shell script or npm script) that confirms
  the devcontainer `postCreateCommand` succeeds in the CI environment.
- Alternatively, add a note to the CI workflow to verify `npm ci && npm test`
  from a clean state (already covered by CI but documented explicitly).

## Acceptance Criteria

- `.devcontainer/devcontainer.json` is present and valid.
- Opening the repo in a devcontainer results in a working environment with
  `npm test` passing without manual intervention.
- `CONTRIBUTING.md` covers all 7 sections listed above with actionable steps.
- A new contributor or agent can go from clone to green build in < 5 minutes
  following only `CONTRIBUTING.md`.

## Validation Steps

```bash
# Locally — open in devcontainer and run:
npm install
npm test
npm run build
npm run validate
```

## Follow-ups

- Add a `docker-compose.yml` if a local server for serving docs is added later.
- Extend devcontainer with GitHub CLI pre-auth for agent-driven PR workflows.
