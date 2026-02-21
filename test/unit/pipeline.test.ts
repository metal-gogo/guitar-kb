import { describe, expect, it } from "vitest";
import { ingestNormalizedChords } from "../../src/ingest/pipeline.js";

describe("ingestNormalizedChords", () => {
  it("ingests the MVP chord set from cached sources", async () => {
    const chords = await ingestNormalizedChords({ refresh: false, delayMs: 0 });

    expect(chords).toHaveLength(4);
    expect(chords.map((chord) => chord.id)).toEqual([
      "chord:C:maj",
      "chord:C:min",
      "chord:C:7",
      "chord:C:maj7",
    ]);
  });

  it("produces provenance for each chord and voicing", async () => {
    const chords = await ingestNormalizedChords({ refresh: false, delayMs: 0 });

    for (const chord of chords) {
      expect(chord.source_refs.length).toBeGreaterThan(0);
      for (const voicing of chord.voicings) {
        expect(voicing.source_refs?.length ?? 0).toBeGreaterThan(0);
      }
    }
  });
});
