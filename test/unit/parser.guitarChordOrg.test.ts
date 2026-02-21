import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseGuitarChordOrg } from "../../src/ingest/parsers/guitarChordOrg.js";

describe("parseGuitarChordOrg", () => {
  it("extracts factual chord data", () => {
    const html = readFileSync("test/fixtures/sources/guitar-chord-org/c-major.html", "utf8");
    const parsed = parseGuitarChordOrg(html, "https://www.guitar-chord.org/c-major.html");

    expect(parsed.root).toBe("C");
    expect(parsed.quality_raw).toBe("major");
    expect(parsed.formula).toEqual(["1", "3", "5"]);
    expect(parsed.pitch_classes).toEqual(["C", "E", "G"]);
    expect(parsed.voicings[0]?.frets).toEqual([null, 3, 2, 0, 1, 0]);
  });
});
