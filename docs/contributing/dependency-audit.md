# Dependency Audit Workflow

Use this workflow to keep dependency risk low and apply a consistent audit gate
across local development and CI.

## Local commands

```bash
npm run audit:deps
```

CI-equivalent threshold check (fails on high/critical findings):

```bash
npm run audit:ci
```

## Remediation policy

- If `npm run audit:ci` fails and a safe upgrade exists, update dependencies and
  lockfile, then rerun quality gates.
- If no safe upgrade is currently available, document a temporary risk
  acceptance in the relevant issue/PR with:
  - affected package(s)
  - advisory link(s)
  - impact scope
  - planned follow-up issue/date

## CI behavior

- CI runs the high/critical gate via
  `npm run audit:ci -- --json > .artifacts/npm-audit.json`.
- The JSON audit output from this command is uploaded as the
  `dependency-audit` artifact (`.artifacts/npm-audit.json`).
