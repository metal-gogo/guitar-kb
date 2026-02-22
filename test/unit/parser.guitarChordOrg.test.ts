import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseGuitarChordOrg } from "../../src/ingest/parsers/guitarChordOrg.js";

describe("parseGuitarChordOrg", () => {
  it("extracts factual MVP chord data from cached fixtures", () => {
    const cases = [
      {
        slug: "c-major",
        qualityRaw: "major",
        formula: ["1", "3", "5"],
        pitchClasses: ["C", "E", "G"],
      },
      {
        slug: "c-minor",
        qualityRaw: "minor",
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
        qualityRaw: "maj7",
        formula: ["1", "3", "5", "7"],
        pitchClasses: ["C", "E", "G", "B"],
      },
    ];

    for (const testCase of cases) {
      const fixturePath = `test/fixtures/sources/guitar-chord-org/${testCase.slug}.html`;
      const url = `https://www.guitar-chord.org/${testCase.slug}.html`;
      const html = readFileSync(fixturePath, "utf8");
      const parsed = parseGuitarChordOrg(html, url);

      expect(parsed.root).toBe("C");
      expect(parsed.quality_raw).toBe(testCase.qualityRaw);
      expect(parsed.formula).toEqual(testCase.formula);
      expect(parsed.pitch_classes).toEqual(testCase.pitchClasses);
      expect(parsed.voicings.length).toBeGreaterThan(0);
      expect(parsed.voicings[0]?.source_refs?.[0]).toEqual({ source: "guitar-chord-org", url });

      if (testCase.slug === "c-major") {
        const firstVoicing = parsed.voicings[0];
        expect(firstVoicing?.frets).toEqual([null, 3, 2, 0, 1, 0]);
        expect(firstVoicing?.base_fret).toBe(1);
        expect(firstVoicing?.fingers).toEqual([0, 3, 2, 0, 1, 0]);
      }
    }
  });
});
