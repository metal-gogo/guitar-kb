# Issue: Voicing Validation Guards — Fret Range and String Count

**GitHub Issue:** https://github.com/metal-gogo/guitar-kb/issues/67  
**Roadmap batch:** Post-Hardening Expansion (ADR-0005)  
**Priority:** P1  
**Depends on:** issue 023 (full root coverage)

---

## Summary

Add validation rules that check voicing fret values are within playable range,
string counts match the tuning, and muted strings are represented consistently.
Fail loudly on out-of-range data so bad voicings never reach generated outputs.

## Why

Upstream sources occasionally contain malformed voicing data (frets outside
0–24, wrong string count, inconsistent mute representation). Without explicit
guards, invalid voicings silently enter `chords.jsonl` and confuse downstream
consumers. Hard failures during build are preferable to silent corruption.

## Scope

- Add voicing validation logic to `src/validate/schema.ts` (or a dedicated
  `src/validate/voicing.ts`):
  - Fret value in range: each fret must be `null` (muted/omitted) or
    an integer in `[0, 24]`.
  - String count must equal the tuning's string count. Default tuning is
    standard 6-string; the validator must read tuning from the chord record.
  - Mute representation: muted strings must consistently use `null`; no
    sentinel values like `-1` or `"x"` should pass validation.
  - At least one string must be non-muted per voicing.
- Integrate voicing guards into the existing `npm run validate` pipeline.
- Add unit tests for each guard rule (in-range, out-of-range, wrong count,
  mute consistency, all-muted rejection).
- Ensure schema validation errors include the chord ID and voicing index for
  actionable debug output.

## Acceptance Criteria

- `npm run validate` fails with a clear message when a voicing has an
  out-of-range fret, wrong string count, or inconsistent mute representation.
- Validation error output includes chord ID and voicing index.
- All current MVP chord voicings pass the new guards without changes.
- Unit tests cover all guard rules.

## Validation Steps

```bash
npm test -- test/unit/schema.test.ts
npm run build
npm run validate
npm test
```

## Follow-ups

- Extend guards for finger position overlap in a later issue.
- Use guards in issue 027 (voicing position metadata) to reject garbage input
  before position derivation.
