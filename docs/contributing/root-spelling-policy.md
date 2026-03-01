# Root Spelling Policy (Contributor Reference)

Canonical root storage is flat-baseline. Use this order:

`C, Db, D, Eb, E, F, Gb, G, Ab, A, Bb, B`

Sharp spellings are accepted as aliases and map deterministically:

- `C# -> Db`
- `D# -> Eb`
- `F# -> Gb`
- `G# -> Ab`
- `A# -> Bb`

Non-aliased roots (`C, D, E, F, G, A, B`) remain unchanged.

## Canonical ID mapping

Apply this deterministic rule to IDs:

`chord:<ROOT>:<QUALITY> -> chord:<MAP(ROOT)>:<QUALITY>`

Examples:

- `chord:C#:maj -> chord:Db:maj`
- `chord:G#:min -> chord:Ab:min`
- `chord:A:7 -> chord:A:7`

## Notes for contributors

- Parsers may encounter sharp or flat source spellings.
- Normalized output must emit flat-baseline canonical roots.
- UI/lookup may accept sharps, but URLs and IDs should resolve to canonical roots.

Policy source: `planning/decisions/0007-flat-baseline-canonical-root-policy.md`.
