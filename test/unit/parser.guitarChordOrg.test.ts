import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseGuitarChordOrg } from "../../src/ingest/parsers/guitarChordOrg.js";

const readFixture = (slug: string): string =>
  readFileSync(`test/fixtures/sources/guitar-chord-org/${slug}.html`, "utf8");

const URL_BY_SLUG = {
  "c-major": "https://www.guitar-chord.org/c-maj.html",
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
        qualityRaw: string;
        formula: string[];
        pitchClasses: string[];
      }> = [
        {
          slug: "c-major",
          qualityRaw: "major",
          formula: ["1", "3", "5"],
          pitchClasses: ["C", "E", "G"],
          expectedVoicings: 3,
        },
        {
          slug: "c-minor",
          qualityRaw: "minor",
          formula: ["1", "b3", "5"],
          pitchClasses: ["C", "Eb", "G"],
          expectedVoicings: 3,
        },
        {
          slug: "c7",
          qualityRaw: "7",
          formula: ["1", "3", "5", "b7"],
          pitchClasses: ["C", "E", "G", "Bb"],
          expectedVoicings: 3,
        },
        {
          slug: "cmaj7",
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

        expect(parsed.root).toBe("C");
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
