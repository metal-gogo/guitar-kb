# Issue: AGENTS.md Effectiveness Review and Scope Refactor

## Triage Labels

- `status/backlog`
- `priority/p0`
- `area/ci-test`

## Summary

Evaluate how `AGENTS.md` is currently used in practice, identify what helps vs
what causes friction/conflict, and refactor it to a tighter, high-signal policy.

## Scope

- Review recent planning/execution cycles for instruction conflicts, redundancy,
  and low-signal sections in `AGENTS.md`.
- Produce an evidence-based assessment:
  - what works well
  - what does not work well
  - what should be reduced, split, or moved elsewhere
- Propose and implement a slimmer AGENTS structure with references to dedicated
  docs/prompts for details.
- Ensure legal/copyright/provenance requirements remain explicit and unchanged.

## Acceptance Criteria

- [ ] A written evaluation artifact exists (decision note or planning document) with concrete findings.
- [ ] `AGENTS.md` is refactored to reduce scope creep and instruction conflicts.
- [ ] Legal and provenance constraints remain present and clearly non-negotiable.
- [ ] Cross-reference alignment is updated for README/planning prompts where needed.
- [ ] `npm run lint` exits `0`.
- [ ] `rg -n \"Mission|Legal|Provenance|MVP|voicing|variation\" AGENTS.md planning/prompts README.md` output is reviewed and expected.

## Validation Steps

```bash
npm run lint
rg -n "Mission|Legal|Provenance|MVP|voicing|variation" AGENTS.md planning/prompts README.md
```

Expected outcome:
- Lint exits `0`.
- AGENTS guidance is tighter, non-conflicting, and still preserves legal safeguards.

