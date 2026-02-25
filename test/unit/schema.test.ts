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
        aliases: ["C"],
        formula: ["1", "3", "5"],
        pitch_classes: ["C", "E", "G"],
        voicings: [{ id: "v1", frets: [null, 3, 2, 0, 1, 0], base_fret: 1, position: "open", source_refs: [{ source: "unit", url: "https://example.com/v1" }] }],
        source_refs: [{ source: "unit", url: "https://example.com" }]
      }
    ])).resolves.toBeUndefined();
  });

  it("rejects records missing chord-level source_refs", async () => {
    const invalid = {
      id: "chord:C:maj",
      root: "C",
      quality: "maj",
      aliases: ["C"],
      formula: ["1", "3", "5"],
      pitch_classes: ["C", "E", "G"],
      voicings: [{ id: "v1", frets: [null, 3, 2, 0, 1, 0], base_fret: 1, position: "open", source_refs: [{ source: "unit", url: "https://example.com/v1" }] }],
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
      aliases: ["C"],
      formula: ["1", "3", "5"],
      pitch_classes: ["C", "E", "G"],
      voicings: [{ id: "v1", frets: [null, 3, 2, 0, 1, 0], base_fret: 1, position: "open" }],
      source_refs: [{ source: "unit", url: "https://example.com" }]
    } as unknown as ChordRecord;

    await expect(validateChordRecords([
      invalid
    ])).rejects.toThrow(/Schema validation failed/);
  });

  it("rejects voicings with empty source_refs array", async () => {
    const invalid = {
      id: "chord:C:maj",
      root: "C",
      quality: "maj",
      aliases: ["C"],
      formula: ["1", "3", "5"],
      pitch_classes: ["C", "E", "G"],
      voicings: [{ id: "v1", frets: [null, 3, 2, 0, 1, 0], base_fret: 1, position: "open", source_refs: [] }],
      source_refs: [{ source: "unit", url: "https://example.com" }]
    } as unknown as ChordRecord;

    await expect(validateChordRecords([
      invalid
    ])).rejects.toThrow(/Schema validation failed/);
  });

  it("rejects source_refs with empty source string", async () => {
    const invalid = {
      id: "chord:C:maj",
      root: "C",
      quality: "maj",
      aliases: ["C"],
      formula: ["1", "3", "5"],
      pitch_classes: ["C", "E", "G"],
      voicings: [{ id: "v1", frets: [null, 3, 2, 0, 1, 0], base_fret: 1, position: "open", source_refs: [{ source: "", url: "https://example.com/v1" }] }],
      source_refs: [{ source: "unit", url: "https://example.com" }]
    } as unknown as ChordRecord;

    await expect(validateChordRecords([
      invalid
    ])).rejects.toThrow(/Schema validation failed/);
  });

  it("rejects source_refs with empty url string", async () => {
    const invalid = {
      id: "chord:C:maj",
      root: "C",
      quality: "maj",
      aliases: ["C"],
      formula: ["1", "3", "5"],
      pitch_classes: ["C", "E", "G"],
      voicings: [{ id: "v1", frets: [null, 3, 2, 0, 1, 0], base_fret: 1, position: "open", source_refs: [{ source: "unit", url: "" }] }],
      source_refs: [{ source: "unit", url: "https://example.com" }]
    } as unknown as ChordRecord;

    await expect(validateChordRecords([
      invalid
    ])).rejects.toThrow(/Schema validation failed/);
  });

  it("rejects records missing aliases", async () => {
    const invalid = {
      id: "chord:C:maj",
      root: "C",
      quality: "maj",
      formula: ["1", "3", "5"],
      pitch_classes: ["C", "E", "G"],
      voicings: [{ id: "v1", frets: [null, 3, 2, 0, 1, 0], base_fret: 1, position: "open", source_refs: [{ source: "unit", url: "https://example.com/v1" }] }],
      source_refs: [{ source: "unit", url: "https://example.com" }]
    } as unknown as ChordRecord;

    await expect(validateChordRecords([invalid])).rejects.toThrow(/Schema validation failed/);
  });

  it("rejects records with empty formula", async () => {
    const invalid = {
      id: "chord:C:maj",
      root: "C",
      quality: "maj",
      aliases: ["C"],
      formula: [],
      pitch_classes: ["C", "E", "G"],
      voicings: [{ id: "v1", frets: [null, 3, 2, 0, 1, 0], base_fret: 1, position: "open", source_refs: [{ source: "unit", url: "https://example.com/v1" }] }],
      source_refs: [{ source: "unit", url: "https://example.com" }]
    } as unknown as ChordRecord;

    await expect(validateChordRecords([invalid])).rejects.toThrow(/Schema validation failed/);
  });

  it("rejects records with empty pitch_classes", async () => {
    const invalid = {
      id: "chord:C:maj",
      root: "C",
      quality: "maj",
      aliases: ["C"],
      formula: ["1", "3", "5"],
      pitch_classes: [],
      voicings: [{ id: "v1", frets: [null, 3, 2, 0, 1, 0], base_fret: 1, position: "open", source_refs: [{ source: "unit", url: "https://example.com/v1" }] }],
      source_refs: [{ source: "unit", url: "https://example.com" }]
    } as unknown as ChordRecord;

    await expect(validateChordRecords([invalid])).rejects.toThrow(/Schema validation failed/);
  });

  it("rejects voicings with out-of-range fret values", async () => {
    const invalid = {
      id: "chord:C:maj",
      root: "C",
      quality: "maj",
      aliases: ["C"],
      formula: ["1", "3", "5"],
      pitch_classes: ["C", "E", "G"],
      voicings: [{ id: "v1", frets: [null, 25, 2, 0, 1, 0], base_fret: 1, position: "open", source_refs: [{ source: "unit", url: "https://example.com/v1" }] }],
      source_refs: [{ source: "unit", url: "https://example.com" }]
    } as unknown as ChordRecord;

    await expect(validateChordRecords([invalid])).rejects.toThrow(/voicing\[0\]/);
  });

  it("rejects voicings with wrong string count for tuning", async () => {
    const invalid = {
      id: "chord:C:maj",
      root: "C",
      quality: "maj",
      aliases: ["C"],
      formula: ["1", "3", "5"],
      pitch_classes: ["C", "E", "G"],
      tuning: ["A", "D", "G", "B", "E"],
      voicings: [{ id: "v1", frets: [null, 3, 2, 0, 1, 0], base_fret: 1, position: "open", source_refs: [{ source: "unit", url: "https://example.com/v1" }] }],
      source_refs: [{ source: "unit", url: "https://example.com" }]
    } as unknown as ChordRecord;

    await expect(validateChordRecords([invalid])).rejects.toThrow(/expected 5 strings/);
  });

  it("rejects voicings with inconsistent mute sentinel values", async () => {
    const invalid = {
      id: "chord:C:maj",
      root: "C",
      quality: "maj",
      aliases: ["C"],
      formula: ["1", "3", "5"],
      pitch_classes: ["C", "E", "G"],
      voicings: [{ id: "v1", frets: [null, 3, 2, 0, 1, "x"] as unknown as Array<number | null>, base_fret: 1, position: "open", source_refs: [{ source: "unit", url: "https://example.com/v1" }] }],
      source_refs: [{ source: "unit", url: "https://example.com" }]
    } as unknown as ChordRecord;

    await expect(validateChordRecords([invalid])).rejects.toThrow(/non-integer fret value/);
  });

  it("rejects all-muted voicings", async () => {
    const invalid = {
      id: "chord:C:maj",
      root: "C",
      quality: "maj",
      aliases: ["C"],
      formula: ["1", "3", "5"],
      pitch_classes: ["C", "E", "G"],
      voicings: [{ id: "v1", frets: [null, null, null, null, null, null], base_fret: 1, position: "unknown", source_refs: [{ source: "unit", url: "https://example.com/v1" }] }],
      source_refs: [{ source: "unit", url: "https://example.com" }]
    } as unknown as ChordRecord;

    await expect(validateChordRecords([invalid])).rejects.toThrow(/all strings are muted/);
  });

  it("defers structurally invalid voicings to Ajv schema errors", async () => {
    const invalid = {
      id: "chord:C:maj",
      root: "C",
      quality: "maj",
      aliases: ["C"],
      formula: ["1", "3", "5"],
      pitch_classes: ["C", "E", "G"],
      voicings: null,
      source_refs: [{ source: "unit", url: "https://example.com" }]
    } as unknown as ChordRecord;

    await expect(validateChordRecords([invalid])).rejects.toThrow(/Schema validation failed/);
  });
});
