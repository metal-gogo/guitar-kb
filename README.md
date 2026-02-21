# Guitar Chord Knowledge Base (GCKB)

A deterministic guitar chord reference pipeline designed for:

- 🎸 Humans (clean Markdown pages + generated diagrams)
- 🤖 LLMs (normalized JSONL + stable canonical IDs + provenance)

Primary scope (MVP): chord references.  
Future scope: techniques, theory, progressions.

---

## 🚀 Quickstart

### Requirements

- Node 20+
- npm 9+
- (optional) GitHub CLI (`gh`) for automated issue creation

---

### Install

```bash
npm install
```

### Run the full MVP pipeline

```bash
npm run ingest
npm run build
npm run validate
```

### Validate locally before PR

```bash
npm run lint
npm test
npm run ingest
npm run build
npm run validate
```

## Project commands

- `npm run ingest` — reads cached source HTML (or refreshes with `--refresh`) and normalizes chord entities
- `npm run build` — validates normalized entities, writes `data/chords.jsonl`, generates docs and SVG diagrams
- `npm run validate` — validates `data/chords.jsonl` against `chords.schema.json`
- `npm test` — parser, normalization, SVG, and schema tests
- `npm run lint` — strict TypeScript checks

## Determinism and legal boundaries

- Source caches are stored under `data/sources/<source>/<slug>.html`
- Builds are deterministic from cached HTML inputs
- Facts only are extracted (names, formulas, pitch classes, voicings, tuning)
- No source text blocks or source images are reused
- Every chord and voicing includes provenance references (`source_refs`)

## PR review gate (Copilot)

- Workflow: `.github/workflows/copilot-review.yml`
- Required status check: `Copilot Review / require-copilot-review`
- Copilot reviewer logins are configured in `.github/workflows/copilot-review.yml`

To enforce this for every PR, add `Copilot Review / require-copilot-review` as a required check in your GitHub branch protection (or ruleset) for `main`.

You can configure this with `gh` (requires admin permission on the repo):

```bash
cd /path/to/your/guitar-kb

OWNER="your-github-owner"
REPO="your-repo-name"

# Merge the Copilot check into existing required status checks for main
gh api repos/$OWNER/$REPO/branches/main/protection > /tmp/gkb-main-protection.json

jq '
	.required_status_checks.contexts =
		((.required_status_checks.contexts // []) + ["Copilot Review / require-copilot-review"] | unique)
	| {
			required_status_checks,
			enforce_admins,
			required_pull_request_reviews,
			restrictions,
			required_linear_history,
			allow_force_pushes,
			allow_deletions,
			block_creations,
			required_conversation_resolution,
			lock_branch,
			allow_fork_syncing
		}
' /tmp/gkb-main-protection.json > /tmp/gkb-main-protection-updated.json

gh api --method PUT repos/$OWNER/$REPO/branches/main/protection \
	--input /tmp/gkb-main-protection-updated.json

# Verify
gh api repos/$OWNER/$REPO/branches/main/protection \
	--jq '.required_status_checks.contexts'
```