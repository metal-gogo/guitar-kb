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

describe("chordMarkdown", () => {
  describe("required sections", () => {
    it("includes a root + quality heading", () => {
      const md = chordMarkdown(buildChord());
      expect(md).toMatch(/^# C maj/m);
    });

    it("includes canonical ID", () => {
      const md = chordMarkdown(buildChord());
      expect(md).toContain("Canonical ID: chord:C:maj");
    });

    it("includes aliases", () => {
      const md = chordMarkdown(buildChord());
      expect(md).toContain("Aliases: C, Cmaj");
    });

    it("falls back to 'none' for empty aliases", () => {
      const md = chordMarkdown(buildChord({ aliases: [] }));
      expect(md).toContain("Aliases: none");
    });

    it("includes formula", () => {
      const md = chordMarkdown(buildChord());
      expect(md).toContain("Formula: 1-3-5");
    });

    it("includes pitch classes", () => {
      const md = chordMarkdown(buildChord());
      expect(md).toContain("Pitch classes: C, E, G");
    });

    it("includes a Summary section with chord notes", () => {
      const md = chordMarkdown(buildChord());
      expect(md).toContain("## Summary");
      expect(md).toContain("C major summary.");
    });

    it("falls back to default summary when notes are absent", () => {
      const md = chordMarkdown(buildChord({ notes: undefined }));
      expect(md).toContain("## Summary");
      expect(md).toContain("Chord reference generated from factual source data.");
    });

    it("includes a Voicings section header", () => {
      const md = chordMarkdown(buildChord());
      expect(md).toContain("## Voicings");
    });

    it("includes a Provenance section with source URLs", () => {
      const md = chordMarkdown(buildChord());
      expect(md).toContain("## Provenance");
      expect(md).toContain("- unit: https://example.com/chord");
    });
  });

  describe("voicing rendering", () => {
    it("includes diagram references for each voicing", () => {
      const md = chordMarkdown(buildChord({
        voicings: [
          { id: "chord:C:maj:v2", frets: [null, 3, 2, 0, 1, 0], base_fret: 1 },
          { id: "chord:C:maj:v1", frets: [null, 3, 2, 0, 1, 0], base_fret: 1 },
        ],
      }));
      expect(md).toContain("diagram: ../diagrams/chord__C__maj__v1.svg");
      expect(md).toContain("diagram: ../diagrams/chord__C__maj__v2.svg");
    });

    it("renders voicings in stable id order", () => {
      const md = chordMarkdown(buildChord({
        voicings: [
          { id: "chord:C:maj:v2", frets: [null, 3, 2, 0, 1, 0], base_fret: 1 },
          { id: "chord:C:maj:v1", frets: [null, 3, 2, 0, 1, 0], base_fret: 1 },
        ],
      }));
      const v1Index = md.indexOf("chord:C:maj:v1");
      const v2Index = md.indexOf("chord:C:maj:v2");
      expect(v1Index).toBeGreaterThan(-1);
      expect(v2Index).toBeGreaterThan(-1);
      expect(v1Index).toBeLessThan(v2Index);
    });

    it("renders frets with 'x' for null/muted strings", () => {
      const md = chordMarkdown(buildChord({
        voicings: [{ id: "v1", frets: [null, 3, 2, 0, 1, 0], base_fret: 1 }],
      }));
      expect(md).toContain("frets x/3/2/0/1/0");
    });

    it("renders base fret in voicing line", () => {
      const md = chordMarkdown(buildChord({
        voicings: [{ id: "v1", frets: [null, 3, 2, 0, 1, 0], base_fret: 5 }],
      }));
      expect(md).toContain("base fret 5");
    });

    it("renders empty voicings without error", () => {
      const md = chordMarkdown(buildChord({ voicings: [] }));
      expect(md).toContain("## Voicings");
    });
  });

  describe("determinism", () => {
    it("produces identical output on repeated calls for the same chord", () => {
      const chord = buildChord();
      expect(chordMarkdown(chord)).toBe(chordMarkdown(chord));
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
      expect(chordMarkdown(fwd)).toBe(chordMarkdown(rev));
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

    expect(md).toContain("[C maj](./chords/chord__C__maj.md)");
    expect(md).toContain("[C min](./chords/chord__C__min.md)");
    expect(md).toContain("[D maj7](./chords/chord__D__maj7.md)");
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

    const cMaj = md.indexOf("[C maj](./chords/chord__C__maj.md)");
    const cMin = md.indexOf("[C min](./chords/chord__C__min.md)");
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
});

