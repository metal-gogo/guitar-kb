import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseAllGuitarChords } from "../../src/ingest/parsers/allGuitarChords.js";

describe("parseAllGuitarChords", () => {
  it("extracts factual MVP chord data from cached fixtures", () => {
    const cases = [
      {
        slug: "c-major",
        qualityRaw: "maj",
        formula: ["1", "3", "5"],
        pitchClasses: ["C", "E", "G"],
      },
      {
        slug: "c-minor",
        qualityRaw: "min",
        formula: ["1", "b3", "5"],
        pitchClasses: ["C", "Eb", "G"],
      },
      {
        slug: "c7",
        qualityRaw: "7",
        formula: ["1", "3", "5", "b7"],
        pitchClasses: ["C", "E", "G", "Bb"],
      },
      {
        slug: "cmaj7",
        qualityRaw: "M7",
        formula: ["1", "3", "5", "7"],
        pitchClasses: ["C", "E", "G", "B"],
      },
    ];

    for (const testCase of cases) {
      const fixturePath = `test/fixtures/sources/all-guitar-chords/${testCase.slug}.html`;
      const url = `https://www.all-guitar-chords.com/chords/${testCase.slug}`;
      const html = readFileSync(fixturePath, "utf8");
      const parsed = parseAllGuitarChords(html, url);

      expect(parsed.root).toBe("C");
      expect(parsed.quality_raw).toBe(testCase.qualityRaw);
      expect(parsed.formula).toEqual(testCase.formula);
      expect(parsed.pitch_classes).toEqual(testCase.pitchClasses);
      expect(parsed.voicings.length).toBeGreaterThan(0);
      expect(parsed.voicings[0]?.source_refs?.[0]).toEqual({ source: "all-guitar-chords", url });
    }
  });
});
