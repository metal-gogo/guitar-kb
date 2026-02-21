import { describe, expect, it } from "vitest";
import { generateChordSvg } from "../../src/build/svg/generateSvg.js";

describe("generateChordSvg", () => {
  it("returns basic svg markup", () => {
    const svg = generateChordSvg({
      id: "chord:C:maj:v1",
      frets: [null, 3, 2, 0, 1, 0],
      base_fret: 1
    });

    expect(svg).toContain("<svg");
    expect(svg).toContain("<circle");
    expect(svg).toContain("aria-label=\"chord:C:maj:v1\"");
  });
});
