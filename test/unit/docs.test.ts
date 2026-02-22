import { describe, expect, it } from "vitest";
import { chordMarkdown } from "../../src/build/docs/generateDocs.js";
import type { ChordRecord } from "../../src/types/model.js";

function buildChord(voicingIds: string[]): ChordRecord {
  return {
    id: "chord:C:maj",
    root: "C",
    quality: "maj",
    aliases: ["C", "Cmaj"],
    enharmonic_equivalents: [],
    formula: ["1", "3", "5"],
    pitch_classes: ["C", "E", "G"],
    voicings: voicingIds.map((id, index) => ({
      id,
      frets: [null, 3, 2, 0, 1, 0],
      base_fret: index + 1,
    })),
    source_refs: [{ source: "unit", url: "https://example.com/chord" }],
    notes: { summary: "C major summary." },
  };
}

describe("chordMarkdown", () => {
  it("includes diagram references for each voicing", () => {
    const markdown = chordMarkdown(buildChord(["chord:C:maj:v2", "chord:C:maj:v1"]));

    expect(markdown).toContain("diagram: ../diagrams/chord__C__maj__v1.svg");
    expect(markdown).toContain("diagram: ../diagrams/chord__C__maj__v2.svg");
  });

  it("renders voicings in stable id order", () => {
    const markdown = chordMarkdown(buildChord(["chord:C:maj:v2", "chord:C:maj:v1"]));

    const v1Index = markdown.indexOf("chord:C:maj:v1");
    const v2Index = markdown.indexOf("chord:C:maj:v2");
    expect(v1Index).toBeGreaterThan(-1);
    expect(v2Index).toBeGreaterThan(-1);
    expect(v1Index).toBeLessThan(v2Index);
  });
});
