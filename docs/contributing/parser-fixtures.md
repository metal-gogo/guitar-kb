# Parser Fixture Index and Minimization Guide

This document describes the test fixtures used by GCKB parser unit tests: what
they contain, where they live, how to create a minimal fixture, and what rules
govern them.

---

## What are parser fixtures?

Parser fixtures are **minimal HTML fragments** saved under
`test/fixtures/sources/<source-id>/`. Each file represents a page (or partial
page) as it would be returned by the upstream source, stripped of everything
that is not needed to exercise the parser under test.

Fixtures are read directly by parser unit tests via `fs.readFileSync` (or
the `getCachedHtml` cache layer in integration tests). They must never be
fetched from the network at test time.

---

## Fixture directory layout

```
test/fixtures/sources/
├── all-guitar-chords/          # Fixtures for the All Guitar Chords parser
│   ├── c-major.html            # Happy-path single-chord page
│   ├── c-minor.html
│   ├── c7.html
│   ├── cmaj7.html
│   ├── a-major.html            # Additional roots – parser coverage
│   ├── a-sharp-major.html      # Sharp-root encoding
│   ├── b-major.html
│   ├── c-sharp-major.html
│   ├── d-major.html
│   ├── d-sharp-major.html
│   ├── e-major.html
│   ├── f-major.html
│   ├── f-sharp-major.html
│   ├── g-major.html
│   ├── g-sharp-major.html
│   ├── missing-sections.html   # Error: structural sections absent
│   ├── no-section-root.html    # Error: root attribute missing from section
│   └── partial-voicing-attrs.html  # Error/edge: incomplete voicing attributes
└── guitar-chord-org/           # Fixtures for the Guitar Chord Org parser
    ├── c-major.html            # Happy-path single-chord page
    ├── c-minor.html
    ├── c7.html
    ├── cmaj7.html
    ├── a-major.html
    ├── a-sharp-major.html
    ├── b-major.html
    ├── c-sharp-major.html
    ├── d-major.html
    ├── d-sharp-major.html
    ├── e-major.html
    ├── f-major.html
    ├── f-sharp-major.html
    ├── g-major.html
    ├── g-sharp-major.html
    ├── missing-sections.html   # Error: article element present but sections empty
    ├── no-chord-root.html      # Error: article-level root attribute missing
    └── partial-voicing-attrs.html  # Error/edge: voicing element with missing attrs
```

---

## Minimization strategy

Fixtures must be as small as possible while still exercising the exact DOM
features the parser depends on. The goal is twofold:

1. **Robustness** — fixtures describe behaviour, not page layout. A site
   redesign that changes surrounding markup should not break tests.
2. **Legibility** — a reviewer can read a fixture and immediately understand
   what the parser must handle.

### Rules for minimal fixtures

| Rule | Rationale |
|------|-----------|
| Include only the elements the parser reads | Navigation, headers, footers, ads, scripts, and stylesheets must be stripped. |
| Preserve data attributes and class names exactly | The parser targets specific attributes (`data-chord-root`, `data-frets`, etc.) and CSS classes (`formula`, `pitch-classes`, `voicing`). |
| Keep the minimum number of voicings needed | Two voicings suffice for most tests; include a third only if the test logic needs it. |
| Do not include real user data or PII | Fixtures are synthetic re-encodings of publicly observable structure. |
| Encode the failure mode explicitly in error fixtures | The comment or stub element in an error fixture must make the missing/broken feature obvious (e.g., `<!-- voicings intentionally omitted -->`). |

### Example: minimal happy-path fixture (guitar-chord-org)

```html
<article data-chord-root="C" data-quality="major" data-symbol="C">
  <ul class="formula"><li>1</li><li>3</li><li>5</li></ul>
  <ul class="pitch-classes"><li>C</li><li>E</li><li>G</li></ul>
  <div class="aliases"><span>C</span><span>Cmaj</span><span>CM</span></div>
  <div class="voicing" data-id="open" data-base-fret="1"
       data-frets="x,3,2,0,1,0" data-fingers="0,3,2,0,1,0"></div>
  <div class="voicing" data-id="barre-8" data-base-fret="8"
       data-frets="8,10,10,9,8,8" data-fingers="1,3,4,2,1,1"></div>
</article>
```

### Example: error fixture (guitar-chord-org, missing sections)

```html
<article data-chord-root="C" data-quality="major" data-symbol="C">
  <!-- formula, pitch-classes, aliases, and voicings intentionally omitted -->
</article>
```

---

## When to add a new fixture

Add a fixture when **any** of these is true:

- You are adding a new parser and need at least one happy-path file plus one
  error case.
- You discovered a real-world page structure that causes incorrect parsing
  (regression fixture).
- You are adding a test for a new edge case: enharmonic root encoding,
  unusual voicing count, partial attributes, etc.

### Do not add a fixture when:

- The test can be driven with an in-line string literal (no disk I/O needed).
- The fixture would be identical to an existing one (reuse it instead).
- The fixture captures upstream markup that is under copyright and cannot be
  reproduced as factual structure.

---

## Adding a fixture: step-by-step

1. **Identify the minimal structure** the parser needs for the scenario.
2. **Create the file** under `test/fixtures/sources/<source-id>/<slug>.html`
   using a descriptive kebab-case `slug` that matches the chord or scenario
   (`c-major.html`, `missing-voicings.html`).
3. **Strip all surrounding markup** — keep only the elements listed in the
   parser specification.
4. **Write a comment** at the top of error/edge-case fixtures explaining why
   the structure deviates from the happy path.
5. **Reference the fixture in a test** — every fixture must have at least one
   test that reads it.
6. **Run the full test suite** and confirm nothing broke:
   ```bash
   npm test
   ```

---

## Fixture naming conventions

| Kind | Naming pattern | Example |
|------|----------------|---------|
| Happy-path chord | `<root>-<quality>.html` | `c-sharp-major.html` |
| Alternate quality | `<root><quality>.html` | `cmaj7.html`, `c7.html` |
| Error / missing element | `<descriptor>.html` | `missing-sections.html` |
| Error / absent attribute | `no-<attribute>.html` | `no-chord-root.html` |
| Partial / incomplete data | `partial-<attribute>.html` | `partial-voicing-attrs.html` |

---

## Copyright and legal

Fixtures must be **originally written** to reflect the factual structure of
the source's HTML (element types, attribute names, class names). Do not copy
actual page content from the source sites. The structure you encode must be
limited to the schema facts the parser relies on (attribute names and class
names as observable APIs), not the surrounding prose, images, or layout.

See [AGENTS.md](../../AGENTS.md) §2 for the full legal and provenance policy.
