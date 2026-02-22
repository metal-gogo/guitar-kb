# Issue: README Overhaul & System Walkthrough

**GitHub Issue:** https://github.com/metal-gogo/guitar-kb/issues/27

## Summary
Rewrite `README.md` to clearly explain what the repository does end-to-end, including inputs, outputs, pipeline stages, and local validation commands.

## Why
Current onboarding and operational understanding are weaker than implementation quality. README should be the canonical contributor entrypoint.

## Scope
- Document repository purpose for humans and LLMs.
- Explain inputs: cached HTML, source mappings, config targets.
- Explain outputs: `data/chords.jsonl`, generated docs, generated SVGs.
- Document pipeline flow: ingest -> normalize -> generate -> validate.
- Add command reference and troubleshooting section.

## Acceptance Criteria
- New contributors can run full workflow using README only.
- README includes deterministic/provenance/legal guardrails.
- README commands match current `package.json` scripts.

## Validation Steps
```bash
npm run lint
npm test
npm run build
npm run validate
```

## Follow-ups
- Keep README updated whenever scripts or artifact paths change.
