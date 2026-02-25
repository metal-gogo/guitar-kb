import { describe, expect, it } from "vitest";
import { chordIndexMarkdown, chordMarkdown } from "../../src/build/docs/generateDocs.js";
import type { ChordRecord } from "../../src/types/model.js";

function buildChord(overrides: Partial<ChordRecord> = {}): ChordRecord {
  const base: ChordRecord = {
    id: "chord:C:maj",
    root: "C",
    quality: "maj",
    aliases: ["C", "Cmaj"],
    enharmonic_equivalents: [],
    formula: ["1", "3", "5"],
    pitch_classes: ["C", "E", "G"],
    tuning: ["E", "A", "D", "G", "B", "E"],
    voicings: [
      { id: "chord:C:maj:v1", frets: [null, 3, 2, 0, 1, 0], base_fret: 1 },
      { id: "chord:C:maj:v2", frets: [3, 3, 5, 5, 5, 3], base_fret: 3 },
    ],
    source_refs: [{ source: "unit", url: "https://example.com/chord" }],
    notes: { summary: "C major summary." },
  };

  return {
    ...base,
    ...overrides,
    id: overrides.id ?? base.id,
    root: overrides.root ?? base.root,
    quality: overrides.quality ?? base.quality,
    formula: overrides.formula ?? base.formula,
    pitch_classes: overrides.pitch_classes ?? base.pitch_classes,
    voicings: overrides.voicings ?? base.voicings,
    source_refs: overrides.source_refs ?? base.source_refs,
  };
}

function renderChord(
  chordOverrides: Partial<ChordRecord> = {},
  allChords?: ChordRecord[],
): string {
  const chord = buildChord(chordOverrides);
  return chordMarkdown(chord, allChords ?? [chord]);
}

function extractMarkdownLinks(markdown: string): string[] {
  const matches = markdown.match(/\[[^\]]+\]\(([^)]+)\)/g) ?? [];
  return matches
    .map((match) => {
      const capture = /\[[^\]]+\]\(([^)]+)\)/.exec(match);
      return capture?.[1];
    })
    .filter((value): value is string => Boolean(value));
}

describe("chordMarkdown", () => {
  describe("required sections", () => {
    it("includes a root + quality heading", () => {
      const md = renderChord();
      expect(md).toMatch(/^# C maj/m);
    });

    it("includes canonical ID", () => {
      const md = renderChord();
      expect(md).toContain("Canonical ID: chord:C:maj");
    });

    it("includes aliases", () => {
      const md = renderChord();
      expect(md).toContain("Aliases: C, Cmaj");
    });

    it("falls back to 'none' for empty aliases", () => {
      const md = renderChord({ aliases: [] });
      expect(md).toContain("Aliases: none");
    });

    it("includes formula", () => {
      const md = renderChord();
      expect(md).toContain("Formula: 1-3-5");
    });

    it("includes pitch classes", () => {
      const md = renderChord();
      expect(md).toContain("Pitch classes: C, E, G");
    });

    it("includes a Summary section with chord notes", () => {
      const md = renderChord();
      expect(md).toContain("## Summary");
      expect(md).toContain("C major summary.");
    });

    it("falls back to default summary when notes are absent", () => {
      const md = renderChord({ notes: undefined });
      expect(md).toContain("## Summary");
      expect(md).toContain("Chord reference generated from factual source data.");
    });

    it("includes a Voicings section header", () => {
      const md = renderChord();
      expect(md).toContain("## Voicings");
    });

    it("includes a Provenance section with source URLs", () => {
      const md = renderChord();
      expect(md).toContain("## Provenance");
      expect(md).toContain("- unit: https://example.com/chord");
    });

    it("includes a Navigation section with a back-to-index link", () => {
      const md = renderChord();
      expect(md).toContain("## Navigation");
      expect(md).toContain("[← Chord Index](../index.md)");
    });
  });

  describe("voicing rendering", () => {
    it("includes diagram references for each voicing", () => {
      const md = renderChord({
        voicings: [
          { id: "chord:C:maj:v2", frets: [null, 3, 2, 0, 1, 0], base_fret: 1 },
          { id: "chord:C:maj:v1", frets: [null, 3, 2, 0, 1, 0], base_fret: 1 },
        ],
      });
      expect(md).toContain("diagram: ../diagrams/chord__C__maj__v1.svg");
      expect(md).toContain("diagram: ../diagrams/chord__C__maj__v2.svg");
    });

    it("renders voicings in stable id order", () => {
      const md = renderChord({
        voicings: [
          { id: "chord:C:maj:v2", frets: [null, 3, 2, 0, 1, 0], base_fret: 1 },
          { id: "chord:C:maj:v1", frets: [null, 3, 2, 0, 1, 0], base_fret: 1 },
        ],
      });
      const v1Index = md.indexOf("chord:C:maj:v1");
      const v2Index = md.indexOf("chord:C:maj:v2");
      expect(v1Index).toBeGreaterThan(-1);
      expect(v2Index).toBeGreaterThan(-1);
      expect(v1Index).toBeLessThan(v2Index);
    });

    it("renders frets with 'x' for null/muted strings", () => {
      const md = renderChord({
        voicings: [{ id: "v1", frets: [null, 3, 2, 0, 1, 0], base_fret: 1 }],
      });
      expect(md).toContain("frets x/3/2/0/1/0");
    });

    it("renders base fret in voicing line", () => {
      const md = renderChord({
        voicings: [{ id: "v1", frets: [null, 3, 2, 0, 1, 0], base_fret: 5 }],
      });
      expect(md).toContain("base fret 5");
    });

    it("renders empty voicings without error", () => {
      const md = renderChord({ voicings: [] });
      expect(md).toContain("## Voicings");
    });
  });

  describe("determinism", () => {
    it("produces identical output on repeated calls for the same chord", () => {
      const chord = buildChord();
      expect(chordMarkdown(chord, [chord])).toBe(chordMarkdown(chord, [chord]));
    });

    it("produces identical output regardless of input voicing order", () => {
      const fwd = buildChord({
        voicings: [
          { id: "chord:C:maj:v1", frets: [null, 3, 2, 0, 1, 0], base_fret: 1 },
          { id: "chord:C:maj:v2", frets: [3, 3, 5, 5, 5, 3], base_fret: 3 },
        ],
      });
      const rev = buildChord({
        voicings: [
          { id: "chord:C:maj:v2", frets: [3, 3, 5, 5, 5, 3], base_fret: 3 },
          { id: "chord:C:maj:v1", frets: [null, 3, 2, 0, 1, 0], base_fret: 1 },
        ],
      });
      expect(chordMarkdown(fwd, [fwd])).toBe(chordMarkdown(rev, [rev]));
    });
  });

  describe("navigation links", () => {
    it("renders bidirectional enharmonic links when either side declares the relationship", () => {
      const cSharp = buildChord({
        id: "chord:C#:maj",
        root: "C#",
        quality: "maj",
        enharmonic_equivalents: ["chord:Db:maj"],
      });
      const dFlat = buildChord({
        id: "chord:Db:maj",
        root: "Db",
        quality: "maj",
        enharmonic_equivalents: [],
      });
      const allChords = [cSharp, dFlat];

      const cSharpMd = chordMarkdown(cSharp, allChords);
      const dFlatMd = chordMarkdown(dFlat, allChords);

      expect(cSharpMd).toContain("[Db maj](./chord__Db__maj.md)");
      expect(dFlatMd).toContain("[C# maj](./chord__C%23__maj.md)");
    });

    it("renders related quality links for same-root different-quality chords", () => {
      const cMaj = buildChord({ id: "chord:C:maj", root: "C", quality: "maj" });
      const cMin = buildChord({ id: "chord:C:min", root: "C", quality: "min" });
      const c7 = buildChord({ id: "chord:C:7", root: "C", quality: "7" });
      const dMaj = buildChord({ id: "chord:D:maj", root: "D", quality: "maj" });
      const allChords = [cMaj, cMin, c7, dMaj];

      const cMajMd = chordMarkdown(cMaj, allChords);
      expect(cMajMd).toContain("[C min](./chord__C__min.md)");
      expect(cMajMd).toContain("[C 7](./chord__C__7.md)");
      expect(cMajMd).not.toContain("[D maj](./chord__D__maj.md)");
    });

    it("keeps navigation output deterministic for identical inputs", () => {
      const cMaj = buildChord({ id: "chord:C:maj", root: "C", quality: "maj" });
      const c7 = buildChord({ id: "chord:C:7", root: "C", quality: "7" });
      const cMin = buildChord({ id: "chord:C:min", root: "C", quality: "min" });
      const allChords = [cMaj, c7, cMin];

      const first = chordMarkdown(cMaj, allChords);
      const second = chordMarkdown(cMaj, allChords);
      expect(first).toBe(second);
    });
  });
});

describe("chordIndexMarkdown", () => {
  it("includes the Chord Index heading", () => {
    const md = chordIndexMarkdown([buildChord()]);
    expect(md).toContain("# Chord Index");
  });

  it("contains one link entry per chord page", () => {
    const chords = [
      buildChord({ id: "chord:C:maj", root: "C", quality: "maj" }),
      buildChord({ id: "chord:C:min", root: "C", quality: "min", aliases: ["Cm"], formula: ["1", "b3", "5"] }),
      buildChord({ id: "chord:D:maj7", root: "D", quality: "maj7", aliases: ["Dmaj7"], formula: ["1", "3", "5", "7"] }),
    ];

    const md = chordIndexMarkdown(chords);

    expect(md).toContain("[maj](./chords/chord__C__maj.md)");
    expect(md).toContain("[min](./chords/chord__C__min.md)");
    expect(md).toContain("[maj7](./chords/chord__D__maj7.md)");
  });

  it("groups entries by root and keeps deterministic root/quality ordering", () => {
    const chords = [
      buildChord({ id: "chord:Db:maj", root: "Db", quality: "maj", aliases: ["Db"], formula: ["1", "3", "5"] }),
      buildChord({ id: "chord:C#:maj", root: "C#", quality: "maj", aliases: ["C#"], formula: ["1", "3", "5"] }),
      buildChord({ id: "chord:C:min", root: "C", quality: "min", aliases: ["Cm"], formula: ["1", "b3", "5"] }),
      buildChord({ id: "chord:C:maj", root: "C", quality: "maj", aliases: ["C"], formula: ["1", "3", "5"] }),
    ];

    const md = chordIndexMarkdown(chords);

    const cGroup = md.indexOf("## C");
    const csGroup = md.indexOf("## C#");
    const dbGroup = md.indexOf("## Db");
    expect(cGroup).toBeGreaterThan(-1);
    expect(csGroup).toBeGreaterThan(-1);
    expect(dbGroup).toBeGreaterThan(-1);
    expect(cGroup).toBeLessThan(csGroup);
    expect(csGroup).toBeLessThan(dbGroup);

    const cMaj = md.indexOf("[maj](./chords/chord__C__maj.md)");
    const cMin = md.indexOf("[min](./chords/chord__C__min.md)");
    expect(cMaj).toBeGreaterThan(-1);
    expect(cMin).toBeGreaterThan(-1);
    expect(cMaj).toBeLessThan(cMin);
  });

  it("includes aliases and formula for quick reference", () => {
    const md = chordIndexMarkdown([
      buildChord({
        id: "chord:C:7",
        root: "C",
        quality: "7",
        aliases: ["C7", "Cdom7"],
        formula: ["1", "3", "5", "b7"],
      }),
    ]);

    expect(md).toContain("aliases: C7, Cdom7; formula: 1-3-5-b7");
  });

  it("is stable across repeated builds for identical inputs", () => {
    const chords = [
      buildChord({ id: "chord:C:maj", root: "C", quality: "maj" }),
      buildChord({ id: "chord:C:min", root: "C", quality: "min", aliases: ["Cm"], formula: ["1", "b3", "5"] }),
      buildChord({ id: "chord:D:7", root: "D", quality: "7", aliases: ["D7"], formula: ["1", "3", "5", "b7"] }),
    ];

    const first = chordIndexMarkdown(chords);
    const second = chordIndexMarkdown(chords);
    expect(first).toBe(second);
  });

  it("does not emit broken relative links for index and chord navigation pages", () => {
    const chords = [
      buildChord({ id: "chord:C:maj", root: "C", quality: "maj", enharmonic_equivalents: ["chord:Db:maj"] }),
      buildChord({ id: "chord:C:min", root: "C", quality: "min" }),
      buildChord({ id: "chord:Db:maj", root: "Db", quality: "maj", enharmonic_equivalents: [] }),
    ];

    const indexMd = chordIndexMarkdown(chords);
    const generatedPages = new Set([
      "./index.md",
      ...chords.map((chord) => `./chords/${chord.id.replace(/:/g, "__").replace(/#/g, "%23")}.md`),
    ]);

    for (const link of extractMarkdownLinks(indexMd)) {
      expect(generatedPages.has(link)).toBe(true);
    }

    for (const chord of chords) {
      const pageMd = chordMarkdown(chord, chords);
      for (const link of extractMarkdownLinks(pageMd)) {
        const normalized = link.startsWith("../")
          ? `./${link.slice(3)}`
          : (link.startsWith("./") ? `./chords/${link.slice(2)}` : link);
        if (normalized.startsWith("./diagrams/")) {
          continue;
        }
        expect(generatedPages.has(normalized)).toBe(true);
      }
    }
  });
});

