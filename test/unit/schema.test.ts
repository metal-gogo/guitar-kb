import { describe, expect, it } from "vitest";
import { validateChordRecords } from "../../src/validate/schema.js";

describe("validateChordRecords", () => {
  it("accepts schema-compliant records", async () => {
    await expect(validateChordRecords([
      {
        id: "chord:C:maj",
        root: "C",
        quality: "maj",
        formula: ["1", "3", "5"],
        pitch_classes: ["C", "E", "G"],
        voicings: [{ id: "v1", frets: [null, 3, 2, 0, 1, 0], base_fret: 1 }],
        source_refs: [{ source: "unit", url: "https://example.com" }]
      }
    ])).resolves.toBeUndefined();
  });
});
