import { describe, expect, it } from "vitest";
import { filterBuildChords } from "../../src/cli/build.js";
import type { ChordRecord } from "../../src/types/model.js";

function chord(overrides: Partial<ChordRecord>): ChordRecord {
  return {
    id: "chord:C:maj",
    root: "C",
    quality: "maj",
    aliases: ["C"],
    formula: ["1", "3", "5"],
    pitch_classes: ["C", "E", "G"],
    voicings: [{ id: "v1", frets: [null, 3, 2, 0, 1, 0], base_fret: 1, source_refs: [{ source: "unit", url: "https://example.com/v1" }] }],
    source_refs: [{ source: "guitar-chord-org", url: "https://example.com/c" }],
    ...overrides,
  };
}

describe("filterBuildChords", () => {
  it("supports slug-style chord filtering via MVP target mapping", () => {
    const chords: ChordRecord[] = [
      chord({ id: "chord:D:min", root: "D", quality: "min" }),
      chord({ id: "chord:C:maj", root: "C", quality: "maj" }),
    ];

    const filtered = filterBuildChords(chords, { chord: "d-minor", source: undefined, dryRun: false });
    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.id).toBe("chord:D:min");
  });

  it("throws a clear error for unknown source id", () => {
    const chords: ChordRecord[] = [chord({})];

    expect(() => filterBuildChords(chords, { source: "guitarr-chord-org", chord: undefined, dryRun: false }))
      .toThrow("Unknown source: guitarr-chord-org");
  });
});
