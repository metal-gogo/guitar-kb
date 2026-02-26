import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseAllGuitarChords } from "../../src/ingest/parsers/allGuitarChords.js";

const readFixture = (slug: string): string =>
  readFileSync(`test/fixtures/sources/all-guitar-chords/${slug}.html`, "utf8");

const URL_BY_SLUG: Record<string, string> = {
  "a-major": "https://www.all-guitar-chords.com/chords/index/a/major",
  "b-major": "https://www.all-guitar-chords.com/chords/index/b/major",
  "c-major": "https://www.all-guitar-chords.com/chords/index/c/major",
  "d-major": "https://www.all-guitar-chords.com/chords/index/d/major",
  "c-minor": "https://www.all-guitar-chords.com/chords/index/c/minor",
  c7: "https://www.all-guitar-chords.com/chords/index/c/dominant-7th",
  cmaj7: "https://www.all-guitar-chords.com/chords/index/c/major-7th",
  "e-major": "https://www.all-guitar-chords.com/chords/index/e/major",
  "f-major": "https://www.all-guitar-chords.com/chords/index/f/major",
  "g-major": "https://www.all-guitar-chords.com/chords/index/g/major",
  "c-sharp-major": "https://www.all-guitar-chords.com/chords/index/c-sharp/major",
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
        slug: "b-major",
        root: "B",
        qualityRaw: "maj",
        formula: ["1", "3", "5"],
        pitchClasses: ["B", "D#", "F#"],
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
        slug: "d-major",
        root: "D",
        qualityRaw: "maj",
        formula: ["1", "3", "5"],
        pitchClasses: ["D", "F#", "A"],
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
        slug: "e-major",
        root: "E",
        qualityRaw: "maj",
        formula: ["1", "3", "5"],
        pitchClasses: ["E", "G#", "B"],
        expectedVoicings: 3,
      },
      {
        slug: "f-major",
        root: "F",
        qualityRaw: "maj",
        formula: ["1", "3", "5"],
        pitchClasses: ["F", "A", "C"],
        expectedVoicings: 3,
      },
      {
        slug: "g-major",
        root: "G",
        qualityRaw: "maj",
        formula: ["1", "3", "5"],
        pitchClasses: ["G", "B", "D"],
        expectedVoicings: 3,
      },
      {
        slug: "c-sharp-major",
        root: "C#",
        qualityRaw: "maj",
        formula: ["1", "3", "5"],
        pitchClasses: ["C#", "F", "G#"],
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

    it("extracts B major voicing frets and base-fret values in source order", () => {
      const url = URL_BY_SLUG["b-major"];
      const html = readFixture("b-major");
      const parsed = parseAllGuitarChords(html, url);

      expect(parsed.voicings.map((voicing) => voicing.frets)).toEqual([
        [null, 2, 4, 4, 4, 2],
        [null, null, 4, 4, 4, 7],
        [7, 9, 9, 8, 7, 7],
      ]);
      expect(parsed.voicings.map((voicing) => voicing.base_fret)).toEqual([2, 4, 7]);
      expect(parsed.voicings.map((voicing) => voicing.id)).toEqual([
        "variation-1",
        "variation-2",
        "variation-3",
      ]);
    });


    it("extracts E major voicing frets and base-fret values in source order", () => {
      const url = URL_BY_SLUG["e-major"];
      const html = readFixture("e-major");
      const parsed = parseAllGuitarChords(html, url);

      expect(parsed.voicings.map((voicing) => voicing.frets)).toEqual([
        [0, 2, 2, 1, 0, 0],
        [null, 7, 9, 9, 9, 7],
        [12, 14, 14, 13, 12, 12],
      ]);
      expect(parsed.voicings.map((voicing) => voicing.base_fret)).toEqual([1, 7, 12]);
      expect(parsed.voicings.map((voicing) => voicing.id)).toEqual([
        "variation-1",
        "variation-2",
        "variation-3",
      ]);
    });
    it("extracts C major voicing frets and base-fret values in source order", () => {
      const url = URL_BY_SLUG["c-major"];
      const html = readFixture("c-major");
      const parsed = parseAllGuitarChords(html, url);

      expect(parsed.voicings.map((voicing) => voicing.frets)).toEqual([
        [null, 3, 2, 0, 1, 0],
        [3, 3, 5, 5, 5, 3],
        [8, 10, 10, 9, 8, 8],
      ]);
      expect(parsed.voicings.map((voicing) => voicing.base_fret)).toEqual([1, 3, 8]);
      expect(parsed.voicings.map((voicing) => voicing.id)).toEqual([
        "triad",
        "voicing-2",
        "voicing-3",
      ]);
    });

    it("extracts D major voicing frets and base-fret values in source order", () => {
      const url = URL_BY_SLUG["d-major"];
      const html = readFixture("d-major");
      const parsed = parseAllGuitarChords(html, url);

      expect(parsed.voicings.map((voicing) => voicing.frets)).toEqual([
        [null, null, 0, 2, 3, 2],
        [null, 5, 4, 2, 3, 2],
        [null, 5, 7, 7, 7, 5],
      ]);
      expect(parsed.voicings.map((voicing) => voicing.base_fret)).toEqual([1, 2, 5]);
      expect(parsed.voicings.map((voicing) => voicing.id)).toEqual([
        "variation-1",
        "variation-2",
        "variation-3",
      ]);
    });

    it("extracts F major voicing frets and base-fret values in source order", () => {
      const url = URL_BY_SLUG["f-major"];
      const html = readFixture("f-major");
      const parsed = parseAllGuitarChords(html, url);

      expect(parsed.voicings.map((voicing) => voicing.frets)).toEqual([
        [1, 3, 3, 2, 1, 1],
        [null, null, 3, 2, 1, 1],
        [null, 8, 10, 10, 10, 8],
      ]);
      expect(parsed.voicings.map((voicing) => voicing.base_fret)).toEqual([1, 1, 8]);
      expect(parsed.voicings.map((voicing) => voicing.id)).toEqual([
        "variation-1",
        "variation-2",
        "variation-3",
      ]);
    });

    it("extracts G major voicing frets and base-fret values in source order", () => {
      const url = URL_BY_SLUG["g-major"];
      const html = readFixture("g-major");
      const parsed = parseAllGuitarChords(html, url);

      expect(parsed.voicings.map((voicing) => voicing.frets)).toEqual([
        [3, 2, 0, 0, 0, 3],
        [3, 5, 5, 4, 3, 3],
        [null, 10, 12, 12, 12, 10],
      ]);
      expect(parsed.voicings.map((voicing) => voicing.base_fret)).toEqual([1, 3, 10]);
      expect(parsed.voicings.map((voicing) => voicing.id)).toEqual([
        "variation-1",
        "variation-2",
        "variation-3",
      ]);
    });

    it("extracts C# major voicing frets and base-fret values in source order", () => {
      const url = URL_BY_SLUG["c-sharp-major"];
      const html = readFixture("c-sharp-major");
      const parsed = parseAllGuitarChords(html, url);

      expect(parsed.voicings.map((voicing) => voicing.frets)).toEqual([
        [null, 4, 6, 6, 6, 4],
        [null, null, 6, 6, 6, 4],
        [9, 11, 11, 10, 9, 9],
      ]);
      expect(parsed.voicings.map((voicing) => voicing.base_fret)).toEqual([4, 4, 9]);
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
