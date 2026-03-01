# Issue: Governance and Terminology Cleanup (Remove Active MVP Wording)

## Triage Labels

- `status/backlog`
- `priority/p2`
- `area/docs-svg`

**Depends on**: #053 — policy direction should be fixed before wording cleanup
**Depends on**: #068 — AGENTS effectiveness findings should guide final governance edits

## Summary

Align AGENTS, prompts, and active contributor docs to current project scope:

- replace active `MVP` framing with current production scope language
- standardize on `voicing` terminology (not `variation`)
- keep legal and provenance requirements explicit and unchanged

## Scope

- Update `AGENTS.md`, `README.md`, and active planning prompts to remove stale
  MVP framing where it is not historical context.
- Replace `variation` wording with `voicing` in internal guidance and active docs
  (excluding raw source fixtures where external source attributes use `variation-*`).
- Ensure AGENTS and prompts are non-conflicting and limited to high-signal guidance.
- Preserve copyright/provenance constraints verbatim in spirit.

## Acceptance Criteria

- [ ] Active guidance docs consistently use `voicing` terminology.
- [ ] Active guidance docs remove stale MVP framing while preserving historical ADR references.
- [ ] AGENTS and planning prompts are checked for contradictory instructions and aligned.
- [ ] Legal/provenance rule sections remain present and explicit after cleanup.
- [ ] `npm run lint` exits `0`.
- [ ] `rg -n "\\bMVP\\b|variation" AGENTS.md README.md planning/prompts docs/contributing` output is reviewed and expected.

## Validation Steps

```bash
npm run lint
rg -n "\\bMVP\\b|variation" AGENTS.md README.md planning/prompts docs/contributing
```

Expected outcome:
- Lint exits `0`.
- Remaining `MVP`/`variation` mentions are intentional (historical ADRs or raw-source terminology references).
