import { describe, expect, it } from "vitest";
import { generateChordSvg } from "../../src/build/svg/generateSvg.js";

/** Count non-overlapping occurrences of a substring in a string. */
function countOccurrences(haystack: string, needle: string): number {
  let count = 0;
  let pos = 0;
  while ((pos = haystack.indexOf(needle, pos)) !== -1) {
    count++;
    pos += needle.length;
  }
  return count;
}

describe("generateChordSvg", () => {
  describe("structural invariants", () => {
    it("returns valid SVG root element with namespace and viewBox", () => {
      const svg = generateChordSvg({
        id: "chord:C:maj:v1",
        frets: [null, 3, 2, 0, 1, 0],
        base_fret: 1,
      });
      expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"');
      expect(svg).toContain('viewBox="0 0 180 248"');
    });

    it("includes XML declaration", () => {
      const svg = generateChordSvg({
        id: "chord:C:maj:v1",
        frets: [null, 3, 2, 0, 1, 0],
        base_fret: 1,
      });
      expect(svg).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    });

    it("includes a background rect", () => {
      const svg = generateChordSvg({
        id: "chord:C:maj:v1",
        frets: [null, 3, 2, 0, 1, 0],
        base_fret: 1,
      });
      expect(svg).toContain("<rect");
      expect(svg).toContain('fill="white"');
    });

    it("renders exactly 6 string lines (vertical)", () => {
      const svg = generateChordSvg({
        id: "chord:C:maj:v1",
        frets: [null, 3, 2, 0, 1, 0],
        base_fret: 1,
      });
      // Each vertical line has x1=x2 at one of the 6 string positions
      const verticalLines = [...svg.matchAll(/x1="\d+" y1="40" x2="\d+" y2="200"/g)];
      expect(verticalLines).toHaveLength(6);
    });

    it("renders exactly 6 fret lines (horizontal)", () => {
      const svg = generateChordSvg({
        id: "chord:C:maj:v1",
        frets: [null, 3, 2, 0, 1, 0],
        base_fret: 1,
      });
      const horizontalLines = [...svg.matchAll(/x1="20" y1="\d+" x2="160" y2="\d+"/g)];
      expect(horizontalLines).toHaveLength(6);
    });

    it("returns basic svg markup", () => {
      const svg = generateChordSvg({
        id: "chord:C:maj:v1",
        frets: [null, 3, 2, 0, 1, 0],
        base_fret: 1,
      });
      expect(svg).toContain("<svg");
      expect(svg).toContain("<circle");
      expect(svg).toContain('aria-label="chord:C:maj:v1"');
    });
  });

  describe("accessibility baseline", () => {
    it("has role='img' on the svg element", () => {
      const svg = generateChordSvg({
        id: "chord:C:maj:v1",
        frets: [null, 3, 2, 0, 1, 0],
        base_fret: 1,
      });
      expect(svg).toContain('role="img"');
    });

    it("aria-label contains the voicing id", () => {
      const id = "chord:Bb:min7:v3";
      const svg = generateChordSvg({
        id,
        frets: [6, 8, 8, 6, 6, 6],
        base_fret: 6,
      });
      expect(svg).toContain(`aria-label="${id}"`);
    });

    it("different voicing ids produce different aria-labels", () => {
      const svg1 = generateChordSvg({ id: "chord:C:maj:v1", frets: [null, 3, 2, 0, 1, 0], base_fret: 1 });
      const svg2 = generateChordSvg({ id: "chord:G:7:v1", frets: [3, 2, 0, 0, 0, 1], base_fret: 1 });
      const label1 = svg1.match(/aria-label="([^"]+)"/)?.[1];
      const label2 = svg2.match(/aria-label="([^"]+)"/)?.[1];
      expect(label1).not.toBe(label2);
    });
  });

  describe("fret dot rendering", () => {
    it("renders muted and open string markers from voicing data", () => {
      const svg = generateChordSvg({
        id: "chord:C:maj7:v1",
        frets: [null, 3, 2, 0, 0, 0],
        base_fret: 1,
      });
      expect(svg).toContain(">X<");
      expect(svg).toContain(">O<");
    });

    it("renders no dot for open strings (fret=0)", () => {
      const svg = generateChordSvg({
        id: "v1",
        frets: [0, 0, 0, 0, 0, 0],
        base_fret: 1,
      });
      expect(svg).not.toContain("<circle");
    });

    it("renders no dot for muted strings (fret=null)", () => {
      const svg = generateChordSvg({
        id: "v1",
        frets: [null, null, null, null, null, null],
        base_fret: 1,
      });
      expect(svg).not.toContain("<circle");
    });

    it("renders one dot per fretted (non-zero, non-null) string", () => {
      const svg = generateChordSvg({
        id: "chord:C:maj:v1",
        frets: [null, 3, 2, 0, 1, 0],
        base_fret: 1,
      });
      // 3 fretted strings: frets[1]=3, frets[2]=2, frets[4]=1
      expect(countOccurrences(svg, "<circle")).toBe(3);
    });
  });

  describe("labels", () => {
    it("renders standard tuning string labels in left-to-right order", () => {
      const svg = generateChordSvg({
        id: "chord:C:maj:v1",
        frets: [null, 3, 2, 0, 1, 0],
        base_fret: 1,
      });

      expect(svg).toContain('>E<');
      expect(svg).toContain('>A<');
      expect(svg).toContain('>D<');
      expect(svg).toContain('>G<');
      expect(svg).toContain('>B<');
      expect(countOccurrences(svg, '>E<')).toBe(2);

      const eIndex = svg.indexOf('>E<');
      const aIndex = svg.indexOf('>A<');
      const dIndex = svg.indexOf('>D<');
      const gIndex = svg.indexOf('>G<');
      const bIndex = svg.indexOf('>B<');

      expect(eIndex).toBeGreaterThanOrEqual(0);
      expect(aIndex).toBeGreaterThanOrEqual(0);
      expect(dIndex).toBeGreaterThanOrEqual(0);
      expect(gIndex).toBeGreaterThanOrEqual(0);
      expect(bIndex).toBeGreaterThanOrEqual(0);

      expect(eIndex).toBeLessThan(aIndex);
      expect(aIndex).toBeLessThan(dIndex);
      expect(dIndex).toBeLessThan(gIndex);
      expect(gIndex).toBeLessThan(bIndex);
    });

    it("uses provided tuning labels when passed", () => {
      const svg = generateChordSvg(
        {
          id: "chord:C:maj:v1",
          frets: [null, 3, 2, 0, 1, 0],
          base_fret: 1,
        },
        ["D", "A", "D", "G", "A", "D"],
      );

      expect(countOccurrences(svg, '>D<')).toBe(3);
      expect(countOccurrences(svg, '>A<')).toBe(2);
      expect(svg).toContain('>G<');
    });

    it("renders base fret label when base_fret > 1", () => {
      const svg = generateChordSvg({
        id: "chord:C:maj:v2",
        frets: [8, 10, 10, 9, 8, 8],
        base_fret: 8,
      });

      expect(svg).toContain('>8fr<');
    });

    it("does not render redundant base fret label when base_fret is 1", () => {
      const svg = generateChordSvg({
        id: "chord:C:maj:v1",
        frets: [null, 3, 2, 0, 1, 0],
        base_fret: 1,
      });

      expect(svg).not.toContain('>1fr<');
    });
  });

  describe("determinism", () => {
    it("is deterministic for the same voicing input", () => {
      const voicing = {
        id: "chord:C:7:v1",
        frets: [null, 3, 2, 3, 1, 0] as Array<number | null>,
        base_fret: 1,
      };
      const first = generateChordSvg(voicing);
      const second = generateChordSvg(voicing);
      expect(first).toBe(second);
    });

    it("produces different output for different voicing frets", () => {
      const svg1 = generateChordSvg({ id: "v1", frets: [null, 3, 2, 0, 1, 0], base_fret: 1 });
      const svg2 = generateChordSvg({ id: "v1", frets: [null, 3, 2, 0, 2, 0], base_fret: 1 });
      expect(svg1).not.toBe(svg2);
    });

    it("repeated calls produce identical byte-for-byte output", () => {
      const voicing = {
        id: "chord:Cmaj7:v1",
        frets: [null, 3, 2, 0, 0, 0] as Array<number | null>,
        base_fret: 1,
      };
      const outputs = Array.from({ length: 5 }, () => generateChordSvg(voicing));
      const allSame = outputs.every((o) => o === outputs[0]);
      expect(allSame).toBe(true);
    });
  });
});
