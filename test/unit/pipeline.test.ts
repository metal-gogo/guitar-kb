import { describe, expect, it } from "vitest";
import { ROOT_ORDER } from "../../src/config.js";
import { ingestNormalizedChords } from "../../src/ingest/pipeline.js";

describe("ingestNormalizedChords", () => {
  it("ingests the expanded core-quality set from cached sources", async () => {
    const chords = await ingestNormalizedChords({ refresh: false, delayMs: 0 });

    expect(chords.length).toBeGreaterThanOrEqual(68);

    const ids = new Set(chords.map((chord) => chord.id));
    const required = ["chord:C:maj", "chord:C:min", "chord:C:7", "chord:C:maj7"];
    for (const id of required) {
      expect(ids.has(id), `missing required canonical chord ${id}`).toBe(true);
    }

    const coreQualities = ["maj", "min", "7", "maj7"] as const;
    for (const root of ROOT_ORDER) {
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
