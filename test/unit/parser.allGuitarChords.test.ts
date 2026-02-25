import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseAllGuitarChords } from "../../src/ingest/parsers/allGuitarChords.js";

const readFixture = (slug: string): string =>
  readFileSync(`test/fixtures/sources/all-guitar-chords/${slug}.html`, "utf8");

const URL_BY_SLUG: Record<string, string> = {
  "a-major": "https://all-guitar-chords.com/chords/index/a/major",
  "c-major": "https://all-guitar-chords.com/chords/index/c/major",
  "c-minor": "https://all-guitar-chords.com/chords/index/c/minor",
  c7: "https://all-guitar-chords.com/chords/index/c/dominant-7th",
  cmaj7: "https://all-guitar-chords.com/chords/index/c/major-7th",
};

const BASE_URL = URL_BY_SLUG["c-major"];

describe("parseAllGuitarChords", () => {
  describe("happy path – MVP chord fixtures", () => {
    const cases = [
      {
        slug: "a-major",
        root: "A",
        qualityRaw: "maj",
        formula: ["1", "3", "5"],
        pitchClasses: ["A", "C#", "E"],
        expectedVoicings: 3,
      },
      {
        slug: "c-major",
        root: "C",
        qualityRaw: "maj",
        formula: ["1", "3", "5"],
        pitchClasses: ["C", "E", "G"],
        expectedVoicings: 3,
      },
      {
        slug: "c-minor",
        root: "C",
        qualityRaw: "min",
        formula: ["1", "b3", "5"],
        pitchClasses: ["C", "Eb", "G"],
        expectedVoicings: 3,
      },
      {
        slug: "c7",
        root: "C",
        qualityRaw: "7",
        formula: ["1", "3", "5", "b7"],
        pitchClasses: ["C", "E", "G", "Bb"],
        expectedVoicings: 3,
      },
      {
        slug: "cmaj7",
        root: "C",
        qualityRaw: "M7",
        formula: ["1", "3", "5", "7"],
        pitchClasses: ["C", "E", "G", "B"],
        expectedVoicings: 3,
      },
    ] as const;

    it.each(cases)("extracts factual MVP chord data from fixture $slug", (testCase) => {
      const url = URL_BY_SLUG[testCase.slug];
      const html = readFixture(testCase.slug);
      const parsed = parseAllGuitarChords(html, url);

      expect(parsed.root).toBe(testCase.root);
      expect(parsed.quality_raw).toBe(testCase.qualityRaw);
      expect(parsed.formula).toEqual(testCase.formula);
      expect(parsed.pitch_classes).toEqual(testCase.pitchClasses);
      expect(parsed.voicings.length).toBe(testCase.expectedVoicings);
      expect(parsed.voicings[0]?.source_refs?.[0]).toEqual({ source: "all-guitar-chords", url });
    });

    it("extracts A major voicing frets and base-fret values in source order", () => {
      const url = URL_BY_SLUG["a-major"];
      const html = readFixture("a-major");
      const parsed = parseAllGuitarChords(html, url);

      expect(parsed.voicings.map((voicing) => voicing.frets)).toEqual([
        [null, 0, 2, 2, 2, 0],
        [null, null, 2, 2, 2, 5],
        [5, 7, 7, 6, 5, 5],
      ]);
      expect(parsed.voicings.map((voicing) => voicing.base_fret)).toEqual([1, 2, 5]);
      expect(parsed.voicings.map((voicing) => voicing.id)).toEqual([
        "variation-1",
        "variation-2",
        "variation-3",
      ]);
    });
  });

  describe("resilience – degraded HTML", () => {
    it("throws a structured error when section[data-root] is absent", () => {
      const html = readFixture("no-section-root");
      expect(() => parseAllGuitarChords(html, BASE_URL)).toThrowError(
        /all-guitar-chords parser failed/i,
      );
    });

    it("returns empty arrays when optional sections are absent", () => {
      const html = readFixture("missing-sections");
      const parsed = parseAllGuitarChords(html, BASE_URL);

      expect(parsed.root).toBe("C");
      expect(parsed.quality_raw).toBe("maj");
      expect(parsed.formula).toEqual([]);
      expect(parsed.pitch_classes).toEqual([]);
      expect(parsed.aliases).toEqual([]);
      expect(parsed.voicings).toEqual([]);
    });

    it("falls back to safe defaults for voicings with missing attributes", () => {
      const html = readFixture("partial-voicing-attrs");
      const parsed = parseAllGuitarChords(html, BASE_URL);

      expect(parsed.voicings).toHaveLength(2);

      // sparse voicing – missing data-base-fret, data-frets, data-fingers
      const sparse = parsed.voicings[0];
      expect(sparse.id).toBe("sparse");
      expect(sparse.base_fret).toBe(1);
      expect(sparse.frets).toEqual([null, null, null, null, null, null]);
      expect(sparse.fingers).toEqual([0, 0, 0, 0, 0, 0]);

      // full voicing – all attributes present
      const full = parsed.voicings[1];
      expect(full.id).toBe("full");
      expect(full.base_fret).toBe(3);
      expect(full.frets).toEqual([null, 3, 5, 5, 5, 3]);
      expect(full.fingers).toEqual([0, 1, 3, 3, 3, 1]);
    });

    it("produces deterministic output on repeated parses of the same fixture", () => {
      const html = readFixture("cmaj7");
      const url = URL_BY_SLUG.cmaj7;
      const a = parseAllGuitarChords(html, url);
      const b = parseAllGuitarChords(html, url);
      expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    });
  });
});
