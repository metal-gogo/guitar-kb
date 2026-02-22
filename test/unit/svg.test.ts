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

  it("renders muted and open string markers from voicing data", () => {
    const svg = generateChordSvg({
      id: "chord:C:maj7:v1",
      frets: [null, 3, 2, 0, 0, 0],
      base_fret: 1,
    });

    expect(svg).toContain(">X<");
    expect(svg).toContain(">O<");
  });
});
