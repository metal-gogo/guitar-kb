import { describe, expect, it } from "vitest";
import { chordMarkdown } from "../../src/build/docs/generateDocs.js";
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

