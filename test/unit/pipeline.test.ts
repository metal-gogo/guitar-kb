import { describe, expect, it } from "vitest";
import { ingestNormalizedChords } from "../../src/ingest/pipeline.js";

describe("ingestNormalizedChords", () => {
  it("ingests the expanded core-quality set from cached sources", async () => {
    const chords = await ingestNormalizedChords({ refresh: false, delayMs: 0 });

    expect(chords.length).toBeGreaterThanOrEqual(48);

    const ids = new Set(chords.map((chord) => chord.id));
    const required = ["chord:C:maj", "chord:C:min", "chord:C:7", "chord:C:maj7"];
    for (const id of required) {
      expect(ids.has(id), `missing required canonical chord ${id}`).toBe(true);
    }

    const roots12 = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"] as const;
    const coreQualities = ["maj", "min", "7", "maj7"] as const;
    for (const root of roots12) {
      for (const quality of coreQualities) {
        expect(ids.has(`chord:${root}:${quality}`), `missing root-quality pair ${root}:${quality}`).toBe(true);
      }
    }
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
