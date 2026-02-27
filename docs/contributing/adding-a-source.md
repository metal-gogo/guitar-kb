# Adding a New Chord Source

This checklist walks through every step required to integrate a new chord data provider
into the GCKB ingest pipeline.

---

## Prerequisites

- The source URL is stable and publicly accessible.
- You have reviewed the [legal and content safety rules](../../AGENTS.md#2-legal--content-safety-rules-non-negotiable):
  - Only factual data (chord names, fret values, notes) may be extracted.
  - Source HTML must be cached in `data/sources/<source-id>/`; **do not commit raw
    HTML to git** (add it to `.gitignore` if needed).
  - Every voicing record must carry `source_refs` with a `source` identifier and the
    page URL.

---

## Step-by-Step Checklist

### 1. Choose a source ID

- [ ] Pick a short, lowercase, hyphenated identifier, e.g. `my-chord-source`.
- [ ] The ID must be unique across `SOURCE_REGISTRY` in
  [`src/ingest/sourceRegistry.ts`](../../src/ingest/sourceRegistry.ts).
- [ ] Add the new ID to the `source` union type in
  [`src/types/model.ts`](../../src/types/model.ts) — see the `IngestTarget.source`
  field.

### 2. Add the source to `config.ts`

In [`src/config.ts`](../../src/config.ts):

- [ ] Add `"<your-source-id>"` to the `IngestTarget["source"]` union.
- [ ] Add entries to `MVP_TARGETS` (or a parallel targets array) for each
  chord / root combination you want to ingest.  Each entry must include:
  ```ts
  {
    source: "<your-source-id>",
    chordId: "chord:<ROOT>:<QUALITY>",  // e.g. "chord:C:maj"
    slug:    "<root>-<quality>",         // used as the cache filename
    url:     "https://...",              // exact page URL to fetch
  }
  ```

### 3. Cache the source HTML

Run the fetcher to populate `data/sources/<your-source-id>/`:

```bash
npm run ingest -- --source <your-source-id> --refresh
```

The fetcher rates-limits requests automatically. Verify the cache directory was
populated:

```bash
npm run audit-cache
```

Expect `ok` for every entry paired with your new source.

### 4. Write the parser

Create `src/ingest/parsers/<camelCaseSourceId>.ts`:

```ts
import { load } from "cheerio";
import type { RawChordRecord, RawVoicing } from "../../types/model.js";

/**
 * Parses a cached HTML page from <your source display name>.
 * @param html - Raw HTML string from the cached page.
 * @param url  - Canonical page URL (used in source_refs provenance).
 */
export function parse<CamelCaseSourceId>(html: string, url: string): RawChordRecord {
  const $ = load(html);

  // --- locate the root chord container ---
  const chord = $("<your-selector>").first();
  if (!chord.length) {
    throw new Error(`<your-source-id> parser failed for ${url}`);
  }

  const root       = chord.attr("data-root") ?? "";
  const qualityRaw = chord.attr("data-quality") ?? "";
  const symbol     = chord.attr("data-symbol") ?? `${root}${qualityRaw}`;

  // Extract formula, pitch classes, aliases as string arrays.
  const formula      = chord.find("<formula-selector>").map((_i, el) => $(el).text().trim()).get();
  const pitchClasses = chord.find("<notes-selector>").map((_i, el) => $(el).text().trim()).get();
  const aliases      = chord.find("<aliases-selector>").map((_i, el) => $(el).text().trim()).get();

  // Extract voicings — each MUST include source_refs.
  const voicings: RawVoicing[] = chord.find("<voicing-selector>").map((_i, el) => {
    const node = $(el);
    return {
      id:        node.attr("data-id") ?? "unknown",
      base_fret: Number.parseInt(node.attr("data-base-fret") ?? "1", 10),
      frets:     parseVoicingList(node.attr("data-frets") ?? ""),
      fingers:   parseVoicingList(node.attr("data-fingers") ?? ""),
      source_refs: [{ source: "<your-source-id>", url }],  // provenance required
    };
  }).get();

  return { source: "<your-source-id>", url, symbol, root, quality_raw: qualityRaw,
           aliases, formula, pitch_classes: pitchClasses, voicings };
}
```

Parser requirements:

- [ ] Returns a `RawChordRecord` (see [`src/types/model.ts`](../../src/types/model.ts)).
- [ ] Throws a descriptive `Error` if the expected DOM structure is absent.
- [ ] Every `RawVoicing` includes `source_refs` with `{ source, url }`.
- [ ] No side effects — parser is a pure function of `(html, url)`.

### 5. Register the parser in `sourceRegistry.ts`

In [`src/ingest/sourceRegistry.ts`](../../src/ingest/sourceRegistry.ts):

```ts
import { parse<CamelCaseSourceId> } from "./parsers/<camelCaseSourceId>.js";

export const SOURCE_REGISTRY: ReadonlyArray<SourceRegistryEntry> = [
  // ... existing entries ...
  {
    id:          "<your-source-id>",
    displayName: "<Human Readable Name>",
    baseUrl:     "https://...",
    cacheDir:    "<your-source-id>",
    parse:       parse<CamelCaseSourceId>,
  },
];
```

- [ ] `id` matches exactly what you used in `config.ts` and the parser.
- [ ] `cacheDir` is a path-safe string — no slashes.

### 6. Add test fixtures and parser unit tests

- [ ] Save a **minimal** cached HTML page to
  `test/fixtures/sources/<your-source-id>/<root>-<quality>.html`.
  Follow the [Parser Fixture Index and Minimization Guide](parser-fixtures.md).
- [ ] Add a test file `test/unit/parser.<camelCaseSourceId>.test.ts` that:
  - Loads the fixture HTML.
  - Calls your parser with a representative URL.
  - Asserts `root`, `quality_raw`, `symbol`, non-empty `voicings`, and that every
    voicing has a `source_refs` entry.
  - Covers the "missing container" error path.

### 7. Run the full validation suite

```bash
npm run lint
npm test
npm run build
npm run validate
```

All four commands must pass with no errors before opening a PR.

### 8. Open a PR

- [ ] Branch name: `feat/<issue>-<source-id>-parser`
- [ ] PR description must include:
  - Which source was added and why.
  - Sample of parsed output (abridged JSONL record or assertion output).
  - `npm run lint && npm test && npm run build && npm run validate` output (or
    "all pass").
  - Any known edge cases or follow-up issues.

---

## Checklist Summary

| # | Step | File(s) affected |
|---|------|-----------------|
| 1 | Choose source ID, add to `source` union | `src/types/model.ts` |
| 2 | Add targets to `config.ts` | `src/config.ts` |
| 3 | Cache HTML via `npm run ingest --refresh` | `data/sources/<id>/` |
| 4 | Write parser returning `RawChordRecord` with provenance | `src/ingest/parsers/<id>.ts` |
| 5 | Register in `SOURCE_REGISTRY` | `src/ingest/sourceRegistry.ts` |
| 6 | Add fixture HTML + unit test | `test/fixtures/sources/<id>/`, `test/unit/parser.<id>.test.ts` |
| 7 | `lint && test && build && validate` | — |
| 8 | Open PR with validation evidence | — |

---

## See Also

- [Parser Fixture Index and Minimization Guide](parser-fixtures.md)
- [AGENTS.md — Legal & Content Safety Rules](../../AGENTS.md#2-legal--content-safety-rules-non-negotiable)
- [CONTRIBUTING.md — PR Process](../../CONTRIBUTING.md#pr-process)
