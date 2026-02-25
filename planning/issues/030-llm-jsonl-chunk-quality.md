# Issue: LLM JSONL Chunk Quality — Self-Contained Records

**GitHub Issue:** https://github.com/metal-gogo/guitar-kb/issues/65  
**Roadmap batch:** Post-Hardening Expansion (ADR-0005)  
**Priority:** P1  
**Depends on:** issue 023 (full root coverage)

---

## Summary

Audit `data/chords.jsonl` records for LLM retrieval self-containment. Each
record must carry enough contextual information to be understood by an LLM
retrieval system without requiring additional lookups. Update the JSONL writer
and schema where fields are missing or ambiguous.

## Why

GCKB's stated mission includes LLM-consumable outputs. A retrieval system that
surfaces a JSONL chunk needs to understand what chord it is, what it sounds
like (formula + notes), and where it came from — without needing to cross-reference
other records. Currently some records may be underspecified (missing formula,
sparse aliases, or no tuning context).

## Scope

- Define a self-containment checklist per record:
  - `id` — canonical chord ID
  - `root`, `quality` — always present
  - `aliases` — at least the common short name (e.g., `["Cm"]` for `chord:C:min`)
  - `formula` — interval formula (e.g., `["1","b3","5"]`)
  - `pitch_classes` — note spellings (e.g., `["C","Eb","G"]`)
  - `voicings` — at least one voicing with `frets` and `source_refs`
  - `source_refs` — at least one provenance entry on the chord itself
- Audit every generated record against this checklist.
- Update `src/ingest/normalize/` to populate missing fields where derivable.
- Add validation assertions in `src/validate/schema.ts` for the new required fields.
- Update `chords.schema.json` to enforce the checklist as required fields.
- Add tests asserting no record fails the self-containment checklist.

## Acceptance Criteria

- `npm run validate` fails if any record is missing a checklist field.
- Tests assert checklist compliance for all generated records.
- No record requires a cross-record lookup to understand its identity.
- `formula` and `pitch_classes` are non-empty for all records.

## Validation Steps

```bash
npm run build
npm run validate
npm test -- test/unit/schema.test.ts
```

## Follow-ups

- Add an LLM evaluation harness (retrieval ping-pong test) in a future ADR.
- Consider adding a `description` free-text field generated from formula + notes
  for even richer LLM context.
