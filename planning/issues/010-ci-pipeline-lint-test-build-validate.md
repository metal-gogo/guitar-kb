# Issue: CI Pipeline (lint + test + build + validate)

## Summary
Configure CI to run lint, tests, build, and schema validation on every pull request.

## Acceptance Criteria
- GitHub Actions workflow runs Node 20
- Steps: `npm ci`, `npm run lint`, `npm test`, `npm run build`, `npm run validate`
- Workflow fails on any step failure
- README includes local validation sequence
