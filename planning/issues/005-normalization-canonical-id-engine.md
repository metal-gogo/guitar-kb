# Issue: Normalization & Canonical ID Engine

## Summary
Normalize raw parser output into canonical chord entities matching ADR-0001.

## Acceptance Criteria
- Canonical IDs: `chord:<ROOT>:<QUALITY>`
- Quality aliases normalized (maj/min/7/maj7/etc.)
- Enharmonic equivalents linked explicitly
- Deterministic sort order implemented
- Tests for alias handling and enharmonic linkage
