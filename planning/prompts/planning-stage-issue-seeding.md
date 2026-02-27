# Planning Stage Issue Seeding Prompt

Use this prompt to generate the next roadmap wave (one parent planning issue plus 10–20 child execution issues) with consistent triage.

> **Revision history**
> - v1 — initial seeding wave (MVP foundation)
> - v2 (current) — lessons from P0/P1 completion wave; adds label policy,
>   dependency notation, execution ordering, `status/blocked` handling, and
>   Copilot review integration guidance

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

------------------------------------------------------------
LABEL POLICY
------------------------------------------------------------

Status labels follow a strict lifecycle:

  status/backlog → status/in-progress → (closed)
                         ↓ (if blocked)
                   status/blocked

Rules:
- Every new issue MUST start with `status/backlog`.
- When work begins, swap `status/backlog` for `status/in-progress`.
- If work is blocked (e.g., waiting on another issue, external dependency,
  or credentials), swap `status/in-progress` for `status/blocked` and
  leave a comment on the issue describing the blocker.
- When the blocker resolves, swap back to `status/in-progress`.
- Closed issues must have no `status/*` label (GitHub removes them on close).
- Never leave a label change silent — always leave a comment when changing
  from `backlog` to `in-progress`, or adding `status/blocked`.

Priority labels:
- `priority/p0` — immediate correctness or security blocker.
- `priority/p1` — foundational reliability/determinism work.
- `priority/p2` — medium-priority feature and quality improvement.
- `priority/p3` — lower-priority polish.
- Treat direct user feedback as `priority/p0` by default unless the user
  explicitly states a different priority.

Area labels — choose exactly one:
- `area/ingest`      — ingest, parsers, caching, fetch pipeline
- `area/normalize`   — normalization, canonical IDs, enharmonics
- `area/data-model`  — schema, type models, model contracts
- `area/docs-svg`    — docs generation, SVG diagrams, site structure
- `area/ci-test`     — tests, CI pipelines, release gates, tooling

------------------------------------------------------------
DEPENDENCY NOTATION
------------------------------------------------------------

When one issue must precede another, write explicit dependency lines in the
issue body:

  **Depends on**: #<N> — <short reason>

Or for soft ordering preference (not a hard block):

  **Suggested after**: #<N> — <short reason>

Rules:
- Only use "Depends on" for genuine hard blockers (the PR cannot be
  meaningfully implemented or tested without the upstream issue being merged).
- List one dependency per line.
- Use ascending issue numbers in dependency chains where possible to keep
  the execution graph acyclic.
- When generating a wave with interdependencies, sort proposed issues so that
  upstream items have lower numbers.

------------------------------------------------------------
EXECUTION ORDERING GUIDANCE
------------------------------------------------------------

Autonomous execution will process issues in this order:

  P0 → P1 → P2 → P3 (absolute priority)
  Within same priority: oldest created_at, then ascending issue number

When designing a wave:
- Seed foundational/blocking issues at lower numbers (they will execute first).
- Seed dependent issues at higher numbers (they execute after blockers).
- Do NOT artificially inflate a priority just to force ordering — use
  dependency notation instead.
- Issues that can be implemented in parallel (no ordering dependency) should
  use the same priority and similar creation date.

------------------------------------------------------------
COPILOT REVIEW INTEGRATION
------------------------------------------------------------

Issues that change the following require Copilot review awareness:
- Source parsers or the parser interface
- Normalization / canonical ID logic
- Schema fields (`chords.schema.json`)
- CI workflow files (`.github/workflows/`)
- Any output consumed by the `validate` script

For these, add to the Acceptance Criteria:

  - [ ] All Copilot inline review comments addressed
  - [ ] `require-copilot-review` CI check green before merge

For docs-only or chore issues with no runtime impact, this can be omitted
but must still pass CI.

------------------------------------------------------------
ISSUE-WRITING RULES
------------------------------------------------------------

- Keep each issue independently executable in one PR when possible.
- Avoid mega-issues; split by vertical slice and measurable acceptance criteria.
- Include determinism and schema validity expectations where applicable.
- Require provenance preservation (`source_refs`) where ingestion/model changes
  are involved.
- Every Acceptance Criteria section must include:
    - At least one local validation command (`npm run ...`)
    - Expected outcome (e.g., "exits 0", "all tests pass", "no schema errors")
- For new CLI commands or new npm scripts, include a README update requirement.

------------------------------------------------------------
DO NOT
------------------------------------------------------------

- Leave any created issue without all three triage labels
  (`status/backlog`, `priority/*`, `area/*`)
- Generate tasks with vague acceptance criteria ("works correctly", "looks good")
- Include direct commits to main
- Create issues for work already implemented and tested in main
- Use `status/blocked` on a newly seeded issue (it should start as `status/backlog`)

------------------------------------------------------------
FEEDBACK PROMPT TEMPLATE
------------------------------------------------------------

Use after initial seeding before locking final priorities:

- "What tasks are not working as expected so far?"
- "Which issues should be adjusted (scope, acceptance criteria, priority, or area label)?"
- "Do you want any tasks split into smaller issues or merged to reduce overhead?"
- "What should be the top 3 priorities for the next execution cycle?"
- "Are there any dependency chains I should reconsider?"
- "Are there issues that should be marked `status/blocked` on a known upstream dependency?"
```
