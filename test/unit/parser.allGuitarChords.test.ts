import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseAllGuitarChords } from "../../src/ingest/parsers/allGuitarChords.js";

describe("parseAllGuitarChords", () => {
  it("extracts factual chord data", () => {
    const html = readFileSync("test/fixtures/sources/all-guitar-chords/cmaj7.html", "utf8");
    const parsed = parseAllGuitarChords(html, "https://www.all-guitar-chords.com/chords/cmaj7");

    expect(parsed.root).toBe("C");
    expect(parsed.quality_raw).toBe("M7");
    expect(parsed.formula).toEqual(["1", "3", "5", "7"]);
    expect(parsed.pitch_classes).toEqual(["C", "E", "G", "B"]);
    expect(parsed.voicings[0]?.frets).toEqual([null, 3, 2, 0, 0, 0]);
  });
});
