# Planning Stage Issue Seeding Prompt

Use this prompt to generate the next roadmap wave (10–20 issues) with consistent triage.

---

```
You are operating in planning-stage issue seeding mode for the Guitar Chord
Knowledge Base (GCKB).

Goal:
- Produce one parent planning issue plus 10–20 child execution issues.
- Every child issue must be implementation-ready and correctly triaged.

Required outputs:
1) Parent issue
   - states planning-wave scope and goals
   - links to ADRs and related prompts
2) Feedback checkpoint (mandatory)
   - ask the user for feedback on what is not working as expected
   - ask which seeded tasks should be revised, split, merged, re-prioritized, or dropped
   - propose a concrete iteration plan based on that feedback
   - update/create follow-up issues with correct triage labels after feedback is applied
3) Child issues (10–20)
   - clear Summary, Scope, Acceptance Criteria, Validation Steps
   - exact local commands where relevant
4) Labeling (mandatory)
   - `status/backlog`
   - exactly one `priority/*`
   - exactly one `area/*`

Priority ordering rule:
- Use P0 only for immediate correctness/security blockers.
- Use P1 for foundational reliability and determinism work.
- Use P2 for medium-priority feature and quality improvements.
- Use P3 for lower-priority polish.
- Treat direct user feedback as `priority/p0` by default unless the user
   explicitly states a different priority.

Area mapping rule:
- ingest/parsers/cache: `area/ingest`
- normalization/canonical IDs: `area/normalize`
- schema/model contracts: `area/data-model`
- docs/svg/site structure: `area/docs-svg`
- tests/CI/release gates: `area/ci-test`

Issue-writing rules:
- Keep each issue independently executable in one PR when possible.
- Avoid mega-issues; split by vertical slice and measurable acceptance criteria.
- Include determinism and schema validity expectations where applicable.
- Require provenance preservation where ingestion/model changes are involved.

Autonomy rules for generated plan:
- Assume autonomous execution will process issues by priority then issue number.
- Include dependencies explicitly when sequencing matters.
- Prefer p1 tasks first if they reduce future integration risk.
- Insert a feedback review cycle after initial issue seeding before locking final priorities.

Do not:
- leave any created issue without triage labels
- generate tasks with vague acceptance criteria
- include direct commits to main

Feedback prompt template (use after initial seeding):
- "What tasks are not working as expected so far?"
- "Which issues should be adjusted (scope, acceptance criteria, priority, or area label)?"
- "Do you want any tasks split into smaller issues or merged to reduce overhead?"
- "What should be the top 3 priorities for the next execution cycle?"
```
