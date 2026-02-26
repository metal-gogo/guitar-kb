import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseGuitarChordOrg } from "../../src/ingest/parsers/guitarChordOrg.js";

const readFixture = (slug: string): string =>
  readFileSync(`test/fixtures/sources/guitar-chord-org/${slug}.html`, "utf8");

const URL_BY_SLUG = {
  "a-major": "https://www.guitar-chord.org/a-maj.html",
  "b-major": "https://www.guitar-chord.org/b-maj.html",
  "c-major": "https://www.guitar-chord.org/c-maj.html",
  "g-major": "https://www.guitar-chord.org/g-maj.html",
  "c-sharp-major": "https://www.guitar-chord.org/c-sharp-maj.html",
  "d-major": "https://www.guitar-chord.org/d-maj.html",
  "e-major": "https://www.guitar-chord.org/e-maj.html",
  "f-major": "https://www.guitar-chord.org/f-maj.html",
  "d-sharp-major": "https://www.guitar-chord.org/d-sharp-maj.html",
  "f-sharp-major": "https://www.guitar-chord.org/f-sharp-maj.html",
  "c-minor": "https://www.guitar-chord.org/c-min.html",
  c7: "https://www.guitar-chord.org/c-7.html",
  cmaj7: "https://www.guitar-chord.org/c-maj7.html",
} as const;

type MvpSlug = keyof typeof URL_BY_SLUG;

const BASE_URL = URL_BY_SLUG["c-major"];

describe("parseGuitarChordOrg", () => {
  describe("happy path – MVP chord fixtures", () => {
    it("extracts factual MVP chord data from cached fixtures", () => {
      const cases: Array<{
        slug: MvpSlug;
        root: string;
        qualityRaw: string;
        formula: string[];
        pitchClasses: string[];
        expectedVoicings: number;
      }> = [
        {
          slug: "a-major",
          root: "A",
          qualityRaw: "major",
          formula: ["1", "3", "5"],
          pitchClasses: ["A", "C#", "E"],
          expectedVoicings: 3,
        },
        {
          slug: "b-major",
          root: "B",
          qualityRaw: "major",
          formula: ["1", "3", "5"],
          pitchClasses: ["B", "D#", "F#"],
          expectedVoicings: 3,
        },
        {
          slug: "c-major",
          root: "C",
          qualityRaw: "major",
          formula: ["1", "3", "5"],
          pitchClasses: ["C", "E", "G"],
          expectedVoicings: 3,
        },
        {
          slug: "d-major",
          root: "D",
          qualityRaw: "major",
          formula: ["1", "3", "5"],
          pitchClasses: ["D", "F#", "A"],
          expectedVoicings: 3,
        },
        {
          slug: "c-minor",
          root: "C",
          qualityRaw: "minor",
          formula: ["1", "b3", "5"],
          pitchClasses: ["C", "Eb", "G"],
          expectedVoicings: 3,
        },
        {
          slug: "e-major",
          root: "E",
          qualityRaw: "major",
          formula: ["1", "3", "5"],
          pitchClasses: ["E", "G#", "B"],
          expectedVoicings: 3,
        },
        {
          slug: "f-major",
          root: "F",
          qualityRaw: "major",
          formula: ["1", "3", "5"],
          pitchClasses: ["F", "A", "C"],
          expectedVoicings: 3,
        },
        {
          slug: "g-major",
          root: "G",
          qualityRaw: "major",
          formula: ["1", "3", "5"],
          pitchClasses: ["G", "B", "D"],
          expectedVoicings: 3,
        },
        {
          slug: "c-sharp-major",
          root: "C#",
          qualityRaw: "major",
          formula: ["1", "3", "5"],
          pitchClasses: ["C#", "F", "G#"],
          expectedVoicings: 3,
        },
        {
          slug: "d-sharp-major",
          root: "D#",
          qualityRaw: "major",
          formula: ["1", "3", "5"],
          pitchClasses: ["D#", "G", "A#"],
          expectedVoicings: 3,
        },
        {
          slug: "f-sharp-major",
          root: "F#",
          qualityRaw: "major",
          formula: ["1", "3", "5"],
          pitchClasses: ["F#", "A#", "C#"],
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
          qualityRaw: "maj7",
          formula: ["1", "3", "5", "7"],
          pitchClasses: ["C", "E", "G", "B"],
          expectedVoicings: 3,
        },
      ];

      for (const testCase of cases) {
        const url = URL_BY_SLUG[testCase.slug];
        expect(url).toBeDefined();
        const html = readFixture(testCase.slug);
        const parsed = parseGuitarChordOrg(html, url);

        expect(parsed.root).toBe(testCase.root);
        expect(parsed.quality_raw).toBe(testCase.qualityRaw);
        expect(parsed.formula).toEqual(testCase.formula);
        expect(parsed.pitch_classes).toEqual(testCase.pitchClasses);
        expect(parsed.voicings.length).toBe(testCase.expectedVoicings);
        expect(parsed.voicings[0]?.source_refs?.[0]).toEqual({ source: "guitar-chord-org", url });

        if (testCase.slug === "c-major") {
          const firstVoicing = parsed.voicings[0];
          expect(firstVoicing?.frets).toEqual([null, 3, 2, 0, 1, 0]);
          expect(firstVoicing?.base_fret).toBe(1);
          expect(firstVoicing?.fingers).toEqual([0, 3, 2, 0, 1, 0]);
        }
      }
    });

    it("extracts A major voicing frets and base-fret values in source order", () => {
      const url = URL_BY_SLUG["a-major"];
      const html = readFixture("a-major");
      const parsed = parseGuitarChordOrg(html, url);

      expect(parsed.voicings.map((voicing) => voicing.frets)).toEqual([
        [null, 0, 2, 2, 2, 0],
        [5, 7, 7, 6, 5, 5],
        [null, null, 2, 2, 2, 5],
      ]);
      expect(parsed.voicings.map((voicing) => voicing.base_fret)).toEqual([1, 5, 2]);
      expect(parsed.voicings.map((voicing) => voicing.id)).toEqual([
        "open",
        "barre-5",
        "high-voicing",
      ]);
    });

    it("extracts B major voicing frets and base-fret values in source order", () => {
      const url = URL_BY_SLUG["b-major"];
      const html = readFixture("b-major");
      const parsed = parseGuitarChordOrg(html, url);

      expect(parsed.voicings.map((voicing) => voicing.frets)).toEqual([
        [null, 2, 4, 4, 4, 2],
        [null, null, 4, 4, 4, 7],
        [7, 9, 9, 8, 7, 7],
      ]);
      expect(parsed.voicings.map((voicing) => voicing.base_fret)).toEqual([2, 4, 7]);
      expect(parsed.voicings.map((voicing) => voicing.id)).toEqual([
        "barre-2",
        "high-variation",
        "barre-7",
      ]);
    });

    it("extracts C major voicing frets and base-fret values in source order", () => {
      const url = URL_BY_SLUG["c-major"];
      const html = readFixture("c-major");
      const parsed = parseGuitarChordOrg(html, url);

      expect(parsed.voicings.map((voicing) => voicing.frets)).toEqual([
        [null, 3, 2, 0, 1, 0],
        [8, 10, 10, 9, 8, 8],
        [null, 3, 5, 5, 5, 3],
      ]);
      expect(parsed.voicings.map((voicing) => voicing.base_fret)).toEqual([1, 8, 3]);
      expect(parsed.voicings.map((voicing) => voicing.id)).toEqual([
        "open",
        "barre-8",
        "shape-3",
      ]);
    });

    it("extracts D major voicing frets and base-fret values in source order", () => {
      const url = URL_BY_SLUG["d-major"];
      const html = readFixture("d-major");
      const parsed = parseGuitarChordOrg(html, url);

      expect(parsed.voicings.map((voicing) => voicing.frets)).toEqual([
        [null, null, 0, 2, 3, 2],
        [null, 5, 4, 2, 3, 2],
        [null, 5, 7, 7, 7, 5],
      ]);
      expect(parsed.voicings.map((voicing) => voicing.base_fret)).toEqual([1, 2, 5]);
      expect(parsed.voicings.map((voicing) => voicing.id)).toEqual([
        "open",
        "variation-2",
        "variation-3",
      ]);
    });

    it("extracts E major voicing frets and base-fret values in source order", () => {
      const url = URL_BY_SLUG["e-major"];
      const html = readFixture("e-major");
      const parsed = parseGuitarChordOrg(html, url);

      expect(parsed.voicings.map((voicing) => voicing.frets)).toEqual([
        [0, 2, 2, 1, 0, 0],
        [null, 7, 9, 9, 9, 7],
        [12, 14, 14, 13, 12, 12],
      ]);
      expect(parsed.voicings.map((voicing) => voicing.base_fret)).toEqual([1, 7, 12]);
      expect(parsed.voicings.map((voicing) => voicing.id)).toEqual([
        "open",
        "barre-7",
        "barre-12",
      ]);
    });

    it("extracts F major voicing frets and base-fret values in source order", () => {
      const url = URL_BY_SLUG["f-major"];
      const html = readFixture("f-major");
      const parsed = parseGuitarChordOrg(html, url);

      expect(parsed.voicings.map((voicing) => voicing.frets)).toEqual([
        [1, 3, 3, 2, 1, 1],
        [null, 8, 10, 10, 10, 8],
        [null, null, 3, 2, 1, 1],
      ]);
      expect(parsed.voicings.map((voicing) => voicing.base_fret)).toEqual([1, 8, 1]);
      expect(parsed.voicings.map((voicing) => voicing.id)).toEqual([
        "barre-1",
        "barre-8",
        "triad",
      ]);
    });

    it("extracts G major voicing frets and base-fret values in source order", () => {
      const url = URL_BY_SLUG["g-major"];
      const html = readFixture("g-major");
      const parsed = parseGuitarChordOrg(html, url);

      expect(parsed.voicings.map((voicing) => voicing.frets)).toEqual([
        [3, 2, 0, 0, 0, 3],
        [3, 5, 5, 4, 3, 3],
        [null, 10, 12, 12, 12, 10],
      ]);
      expect(parsed.voicings.map((voicing) => voicing.base_fret)).toEqual([1, 3, 10]);
      expect(parsed.voicings.map((voicing) => voicing.id)).toEqual([
        "open",
        "barre-3",
        "barre-10",
      ]);
    });
    it("extracts C# major voicing frets and base-fret values in source order", () => {
      const url = URL_BY_SLUG["c-sharp-major"];
      const html = readFixture("c-sharp-major");
      const parsed = parseGuitarChordOrg(html, url);

      expect(parsed.voicings.map((voicing) => voicing.frets)).toEqual([
        [null, 4, 6, 6, 6, 4],
        [9, 11, 11, 10, 9, 9],
        [null, null, 6, 6, 6, 4],
      ]);
      expect(parsed.voicings.map((voicing) => voicing.base_fret)).toEqual([4, 9, 4]);
      expect(parsed.voicings.map((voicing) => voicing.id)).toEqual([
        "barre-4",
        "barre-9",
        "triad",
      ]);
    });

    it("extracts F# major voicing frets and base-fret values in source order", () => {
      const url = URL_BY_SLUG["f-sharp-major"];
      const html = readFixture("f-sharp-major");
      const parsed = parseGuitarChordOrg(html, url);

      expect(parsed.voicings.map((voicing) => voicing.frets)).toEqual([
        [2, 4, 4, 3, 2, 2],
        [null, 9, 11, 11, 11, 9],
        [null, null, 4, 3, 2, 2],
      ]);
      expect(parsed.voicings.map((voicing) => voicing.base_fret)).toEqual([2, 9, 2]);
      expect(parsed.voicings.map((voicing) => voicing.id)).toEqual([
        "barre-2",
        "barre-9",
        "triad",
      ]);
    });

    it("extracts D# major voicing frets and base-fret values in source order", () => {
      const url = URL_BY_SLUG["d-sharp-major"];
      const html = readFixture("d-sharp-major");
      const parsed = parseGuitarChordOrg(html, url);

      expect(parsed.voicings.map((voicing) => voicing.frets)).toEqual([
        [null, 6, 8, 8, 8, 6],
        [11, 13, 13, 12, 11, 11],
        [null, null, 8, 8, 8, 6],
      ]);
      expect(parsed.voicings.map((voicing) => voicing.base_fret)).toEqual([6, 11, 6]);
      expect(parsed.voicings.map((voicing) => voicing.id)).toEqual([
        "barre-6",
        "barre-11",
        "triad",
      ]);
    });
  });

  describe("resilience – degraded HTML", () => {
    it("throws a structured error when [data-chord-root] is absent", () => {
      const html = readFixture("no-chord-root");
      expect(() => parseGuitarChordOrg(html, BASE_URL)).toThrowError(
        /guitar-chord-org parser failed/i,
      );
    });

    it("returns empty arrays when optional sections are absent", () => {
      const html = readFixture("missing-sections");
      const parsed = parseGuitarChordOrg(html, BASE_URL);

      expect(parsed.root).toBe("C");
      expect(parsed.quality_raw).toBe("major");
      expect(parsed.formula).toEqual([]);
      expect(parsed.pitch_classes).toEqual([]);
      expect(parsed.aliases).toEqual([]);
      expect(parsed.voicings).toEqual([]);
    });

    it("falls back to safe defaults for voicings with missing attributes", () => {
      const html = readFixture("partial-voicing-attrs");
      const parsed = parseGuitarChordOrg(html, BASE_URL);

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
      expect(full.base_fret).toBe(2);
      expect(full.frets).toEqual([null, 1, 2, 3, null, null]);
      expect(full.fingers).toEqual([0, 1, 2, 3, 0, 0]);
    });

    it("produces deterministic output on repeated parses of the same fixture", () => {
      const html = readFixture("c-major");
      const url = URL_BY_SLUG["c-major"];
      const a = parseGuitarChordOrg(html, url);
      const b = parseGuitarChordOrg(html, url);
      expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    });
  });
});
