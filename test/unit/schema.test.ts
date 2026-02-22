import { describe, expect, it } from "vitest";
import { validateChordRecords } from "../../src/validate/schema.js";
import type { ChordRecord } from "../../src/types/model.js";

describe("validateChordRecords", () => {
  it("accepts schema-compliant records", async () => {
    await expect(validateChordRecords([
      {
        id: "chord:C:maj",
        root: "C",
        quality: "maj",
        formula: ["1", "3", "5"],
        pitch_classes: ["C", "E", "G"],
        voicings: [{ id: "v1", frets: [null, 3, 2, 0, 1, 0], base_fret: 1, source_refs: [{ source: "unit", url: "https://example.com/v1" }] }],
        source_refs: [{ source: "unit", url: "https://example.com" }]
      }
    ])).resolves.toBeUndefined();
  });

  it("rejects records missing chord-level source_refs", async () => {
    const invalid = {
      id: "chord:C:maj",
      root: "C",
      quality: "maj",
      formula: ["1", "3", "5"],
      pitch_classes: ["C", "E", "G"],
      voicings: [{ id: "v1", frets: [null, 3, 2, 0, 1, 0], base_fret: 1, source_refs: [{ source: "unit", url: "https://example.com/v1" }] }],
      source_refs: []
    } as unknown as ChordRecord;

    await expect(validateChordRecords([
      invalid
    ])).rejects.toThrow(/Schema validation failed/);
  });

  it("rejects voicings missing source_refs", async () => {
    const invalid = {
      id: "chord:C:maj",
      root: "C",
      quality: "maj",
      formula: ["1", "3", "5"],
      pitch_classes: ["C", "E", "G"],
      voicings: [{ id: "v1", frets: [null, 3, 2, 0, 1, 0], base_fret: 1 }],
      source_refs: [{ source: "unit", url: "https://example.com" }]
    } as unknown as ChordRecord;

    await expect(validateChordRecords([
      invalid
    ])).rejects.toThrow(/Schema validation failed/);
  });
});
