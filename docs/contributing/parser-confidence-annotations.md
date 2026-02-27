# Parser Confidence Annotations

Parser confidence annotations are generated during ingest parsing for each raw
source record and can be optionally included in normalized output for debugging.

## Confidence Levels

- `high`
  - root present
  - quality present
  - formula present
  - pitch classes present
  - at least one voicing present
  - all parsed voicings have complete structural attributes
- `medium`
  - same structural requirements as `high`, but one or more voicings required
    parser fallbacks for missing attributes
- `low`
  - one or more core structural checks failed (for example, missing formula,
    missing pitch classes, or no voicings)

## Debugging Usage

By default, normalized outputs do **not** include confidence metadata to avoid
schema changes in standard outputs.

To include confidence annotations in `data/generated/chords.normalized.json`:

```bash
npm run ingest -- --include-parser-confidence
```

This flag is intended for debugging and source-quality triage workflows.
