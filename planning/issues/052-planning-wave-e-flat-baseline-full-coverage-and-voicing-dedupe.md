# Issue: Planning Wave E — Flat-Baseline Coverage, Source-Priority Ingest, and Voicing Dedupe

## Triage Labels

- `status/backlog`
- `priority/p0`
- `area/ci-test`

## Summary

Seed the next execution wave to move the project from legacy MVP-era assumptions
to full chord coverage operations with:

- flat-baseline canonical roots
- full `12 roots × 10 qualities` ingestion by default
- deterministic source-priority ingest (`all-guitar-chords` first, then `guitar-chord-org`)
- cross-source voicing deduplication with merged provenance
- stable voicing IDs (`v1`, `v2`, ...)
- deploy-safe ingest/cache policies
- terminology and governance cleanup (`variation` → `voicing`, remove active `MVP` wording)

This wave includes 18 implementation-ready child issues (`053`–`070`).

## Planning Scope

- Define and enforce a flat-baseline canonical root policy while preserving sharp
  lookups and display behavior.
- Keep enharmonic intelligence explicit so `C#` and `Db` resolve to the same
  canonical chord record.
- Ingest all configured roots and qualities as the default working matrix.
- Merge duplicate voicings across sources instead of duplicating records.
- Reindex voicings deterministically as `v1..vN` after deduplication.
- Add deploy-time strategy for when ingest must run vs when cached artifacts are
  sufficient.
- Align AGENTS/prompts/docs terminology and remove active `MVP` framing without
  weakening legal/provenance constraints.
- Add dependency-security hardening (audit, remediation, and CI policy).
- Add site-linked legal pages (privacy notice and license).
- Improve SVG clarity so every diagram clearly communicates playable frets.
- Evaluate AGENTS effectiveness and tighten its scope based on observed workflow outcomes.
- Migrate diagram output path structure from flat filenames to hierarchical paths.
- Fix sharp-note URL path encoding compatibility for hosted static site delivery.

## Linked References

- ADR-0001: `planning/decisions/0001-canonical-id-and-enharmonics.md`
- ADR-0004: `planning/decisions/0004-artifact-versioning-policy.md`
- ADR-0006: `planning/decisions/0006-next-planning-wave-and-triage.md`
- Seeding prompt: `planning/prompts/planning-stage-issue-seeding.md`
- Maintenance prompt: `planning/prompts/autonomous-maintenance.md`

## Child Issues

- [053](./053-flat-baseline-canonical-root-policy.md) — define flat-baseline canonical root policy and migration notes
- [054](./054-schema-and-model-for-enharmonic-display-aliases.md) — update schema/model contracts for canonical root + enharmonic display aliases
- [055](./055-full-matrix-ingest-targets-12-roots-10-qualities.md) — default ingest matrix as `12 roots × 10 qualities`
- [056](./056-source-precedence-all-guitar-chords-then-guitar-chord-org.md) — source priority and deterministic merge ordering
- [057](./057-cross-source-voicing-deduplication-and-provenance-merge.md) — dedupe voicings and merge provenance notes
- [058](./058-deterministic-voicing-id-sequencing-v1-vn.md) — reindex voicing IDs to deterministic `v1..vN`
- [059](./059-site-flat-sharp-notation-toggle-and-alias-routing.md) — website flat/sharp display toggle and enharmonic alias routing
- [060](./060-ingest-modes-full-and-by-chord.md) — explicit ingest modes (full matrix and chord-targeted)
- [061](./061-cache-completeness-manifest-and-deploy-ingest-policy.md) — cache completeness manifest and deploy ingest policy
- [062](./062-regression-suite-for-dedupe-precedence-and-enharmonic-routing.md) — regression coverage for new ingest/normalize/site behavior
- [063](./063-governance-and-terminology-cleanup-remove-mvp.md) — AGENTS/prompts/docs cleanup and terminology alignment
- [064](./064-dependency-vulnerability-audit-and-remediation-policy.md) — dependency vulnerability audit and remediation workflow
- [065](./065-privacy-notice-page-and-site-linking.md) — privacy notice page and footer/header linking in generated site
- [066](./066-license-document-and-site-linking.md) — repository license file and generated-site license link
- [067](./067-svg-fret-annotations-and-default-base-fret-clarity.md) — SVG fret annotation completeness and default base-fret clarity
- [068](./068-agents-md-effectiveness-review-and-scope-refactor.md) — AGENTS.md effectiveness evaluation and scope refactor plan
- [069](./069-hierarchical-diagram-paths-root-quality-voicing.md) — hierarchical diagram directory layout migration
- [070](./070-sharp-url-path-encoding-hosting-compatibility.md) — hosted sharp-note URL path encoding compatibility fix

## Execution Order

1. `053` → `054` → `055` → `056` → `057` → `058`
2. `060` (after `055`)
3. `061` (after `055` and `060`)
4. `070` (after `050`; unblock hosted sharp-path reliability)
5. `059` (after `054`, `058`, `050`, and preferably `070`)
6. `067` (after `058`)
7. `069` (after `058` and `067`)
8. `062` (after `057`, `058`, `059`, `061`, and `069`)
9. `064` (parallel-safe with core ingest/normalize track; independent hardening stream)
10. `065` and `066` (after `050`; parallel-safe with data pipeline tasks)
11. `068` (parallel-safe, can start early)
12. `063` (after `068`; apply governance cleanup after AGENTS evaluation)

## Feedback Checkpoint (Mandatory)

Applied feedback in this seed:

- Use `voicing` terminology instead of `variation`.
- Prioritize full chord ingestion by root and quality.
- Prefer flat-baseline canonical notation with sharp display capability.
- Treat enharmonic spellings as equivalent lookups in the site UX.
- Prioritize `all-guitar-chords` before `guitar-chord-org`.
- Deduplicate repeated voicings and merge provenance references.
- Evaluate deploy-time ingest strategy and support both full and chord-targeted ingest.
- Remove active `MVP` framing from current guidance/docs while preserving legal rules.
- Verify dependencies and reduce vulnerabilities where possible.
- Add a privacy notice for the static site and link it from generated pages.
- Add a license document and link it from generated pages.
- Ensure SVG diagrams explicitly communicate fret placement, including base-fret defaults.
- Evaluate AGENTS.md usage effectiveness and decide what to reduce vs improve.
- Evaluate migration from flat diagram filenames to hierarchical root/quality/voicing paths.
- Track sharp-note hosted URL 404 behavior as a dedicated issue.

Please confirm/revise:

- What tasks are not working as expected so far?
- Which issues should be adjusted (scope, acceptance criteria, priority, or area label)?
- Do you want any tasks split into smaller issues or merged to reduce overhead?
- What should be the top 3 priorities for the next execution cycle?
- Are there any dependency chains I should reconsider?
- Are there issues that should be marked `status/blocked` on a known upstream dependency?

## Feedback Iteration Plan

After feedback:

1. Re-triage impacted issues (`priority/*`, `area/*`, `status/*`) without unlabeled states.
2. Split/merge tasks as requested while keeping one-PR-per-issue execution.
3. Adjust `Depends on`/`Suggested after` links to preserve acyclic ordering.
4. Add follow-up issues with full triage labels if new gaps appear.

## Acceptance Criteria

- 18 child issues exist and each contains `Summary`, `Scope`, `Acceptance Criteria`,
  and `Validation Steps`.
- Every seeded issue includes exactly:
  - one `status/*` label (`status/backlog` on creation),
  - one `priority/*` label,
  - one `area/*` label.
- Hard dependencies are documented with explicit `Depends on` lines.
- Scope reflects flat-baseline notation, full quality ingestion, voicing dedupe,
  deploy ingest policy, and governance cleanup.

## Validation Steps

```bash
ls planning/issues/05{2,3,4,5,6,7,8,9}-*.md planning/issues/06{0,1,2,3,4,5,6,7,8,9}-*.md planning/issues/070-*.md
rg -n "status/backlog|priority/p[0-3]|area/" planning/issues/05*.md planning/issues/06*.md planning/issues/070-*.md
```

Expected outcome:
- Both commands exit `0`.
- `052` parent and `053`–`070` children exist with complete triage labels.
