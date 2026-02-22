# Issue: MVP Contract Integration Suite

**GitHub Issue:** https://github.com/metal-gogo/guitar-kb/issues/30

## Summary
Add explicit integration tests that lock MVP coverage requirements for C major/minor/7/maj7 and required voicing counts.

## Why
MVP completion criteria should be executable and continuously enforced, not just documented.

## Scope
- Assert canonical IDs for C, Cm, C7, Cmaj7 are present.
- Assert minimum voicing count per MVP chord.
- Validate generated records against schema contract.
- Surface readable failure messages for missing MVP entities.

## Acceptance Criteria
- Test fails if any MVP chord disappears.
- Test fails if voicing count drops below agreed minimum.
- Suite runs in CI for every PR.

## Validation Steps
```bash
npm test
npm run build
npm run validate
```

## Follow-ups
- Extend contract suite when scope expands beyond MVP.
