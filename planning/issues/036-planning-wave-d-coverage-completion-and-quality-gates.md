# Issue: Planning Wave D — Coverage Completion and Quality Gates

## Triage Labels

- `status/backlog`
- `priority/p0`
- `area/ci-test`

## Summary

Seed the next execution wave to close the current root-quality coverage gap,
complete all defined qualities (not just major-family coverage), enforce full
voicing completeness, and generate a navigable website from build outputs.

This wave includes 15 implementation-ready child issues (`037`–`051`) with
explicit ordering and dependencies.

## Planning Scope

- Expand ingest/normalize support from core qualities (`maj`, `min`, `7`, `maj7`)
  to full defined quality coverage already modeled in validation (`min7`, `dim`,
  `dim7`, `aug`, `sus2`, `sus4`) across all configured roots.
- Prioritize full defined-quality matrix completion before lower-priority polish.
- Ensure all statically available voicings are ingested per chord across
  all defined qualities.
- Keep deterministic build outputs and schema/provenance guarantees unchanged.
- Move key diagnostics into CI signals:
  - root-quality coverage policy
  - cache freshness/cache integrity
  - parser confidence reporting
- Improve docs discoverability with a generated coverage dashboard and a
  navigable generated website.

## Linked References

- ADR-0001: `planning/decisions/0001-canonical-id-and-enharmonics.md`
- ADR-0004: `planning/decisions/0004-artifact-versioning-policy.md`
- ADR-0006: `planning/decisions/0006-next-planning-wave-and-triage.md`
- Seeding prompt: `planning/prompts/planning-stage-issue-seeding.md`

## Child Issues

- [037](./037-coverage-matrix-contract-and-threshold-policy.md) — coverage matrix contract and threshold policy
- [038](./038-extended-quality-target-expansion.md) — extended-quality ingest target expansion
- [039](./039-source-capability-map-and-unsupported-target-reporting.md) — source capability map and unsupported-target reporting
- [040](./040-extended-quality-parser-fixtures.md) — extended-quality parser fixtures
- [041](./041-parser-extended-quality-extraction.md) — parser extraction for extended qualities
- [042](./042-normalization-quality-alias-hardening.md) — normalization quality alias hardening
- [043](./043-cli-filter-engine-generalization.md) — CLI/build filter generalization beyond MVP-only target assumptions
- [044](./044-coverage-gate-enforcement-in-validate-and-ci.md) — coverage gate enforcement in validate + CI
- [045](./045-ci-freshness-and-cache-audit-automation.md) — scheduled freshness/cache audit automation
- [046](./046-docs-coverage-dashboard-generation.md) — generated docs coverage dashboard
- [047](./047-parser-confidence-reporting-pipeline.md) — parser confidence reporting pipeline
- [048](./048-fixture-cache-parity-checks.md) — fixture/cache parity checks
- [049](./049-full-voicing-coverage-across-defined-quality-matrix.md) — full voicing coverage across defined-quality matrix
- [050](./050-generated-website-and-navigation.md) — generated website and navigation
- [051](./051-website-publishing-pipeline.md) — website publishing pipeline

## Execution Order

1. `037` → `038` → `039` → `040` → `041` → `042` → `049`
2. `044` (after `042` and `049`)
3. `043` and `048` (parallel-safe after `038`)
4. `045` and `047` (parallel-safe after parser/ingest baselines are stable)
5. `046` (after `044`)
6. `050` (after `046` and `049`)
7. `051` (after `050`)

## Feedback Checkpoint (Mandatory Before Locking Priorities)

Please answer these before active execution starts:

- What tasks are not working as expected so far?
- Which issues should be adjusted (scope, acceptance criteria, priority, or area label)?
- Do you want any tasks split into smaller issues or merged to reduce overhead?
- What should be the top 3 priorities for the next execution cycle?
- Are there any dependency chains I should reconsider?
- Are there issues that should be marked `status/blocked` on a known upstream dependency?

## Feedback Iteration Plan

After feedback:

1. Re-triage impacted issues (`priority/*`, `area/*`, `status/*`) without leaving unlabeled gaps.
2. Split/merge tasks where requested while preserving one-PR-per-issue execution.
3. Add or adjust `Depends on` / `Suggested after` lines to keep ordering acyclic.
4. Create follow-up issue drafts for newly surfaced work with full triage labels.

## Acceptance Criteria

- 15 child issues exist and each has `Summary`, `Scope`, `Acceptance Criteria`,
  and `Validation Steps`.
- Every seeded issue includes exactly:
  - one `status/*` label (`status/backlog` on creation),
  - one `priority/*` label,
  - one `area/*` label.
- Dependency notation is explicit where hard/soft ordering is required.

## Validation Steps

```bash
ls planning/issues/03{6,7,8,9}-*.md planning/issues/04{0,1,2,3,4,5,6,7,8,9}-*.md planning/issues/05{0,1}-*.md
rg -n "status/backlog|priority/p[0-3]|area/" planning/issues/03*.md planning/issues/04*.md planning/issues/05*.md
```

Expected outcome:
- Both commands exit `0`.
- 16 files (`036` parent + `037`–`051` children) are present with triage labels.
