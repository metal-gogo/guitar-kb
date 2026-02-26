import { describe, expect, it } from "vitest";
import { validateChordRecords } from "../../src/validate/schema.js";
import { checkProvenanceCoverage } from "../../src/validate/provenance.js";
import { ValidationError, ValidationErrorCode } from "../../src/validate/errors.js";
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

describe("ValidationError codes", () => {
  function validRecord(): ChordRecord {
    return {
      id: "chord:C:maj",
      root: "C",
      quality: "maj",
      aliases: ["C"],
      formula: ["1", "3", "5"],
      pitch_classes: ["C", "E", "G"],
      voicings: [{ id: "v1", frets: [null, 3, 2, 0, 1, 0], base_fret: 1, position: "open", source_refs: [{ source: "unit", url: "https://example.com/v1" }] }],
      source_refs: [{ source: "unit", url: "https://example.com" }],
    } as unknown as ChordRecord;
  }

  it("throws ValidationError with code SCHEMA_INVALID for a schema-level failure", async () => {
    const bad = { ...validRecord(), source_refs: [] } as unknown as ChordRecord;
    try {
      await validateChordRecords([bad]);
      throw new Error("Expected throw");
    } catch (e) {
      expect(e).toBeInstanceOf(ValidationError);
      expect((e as ValidationError).code).toBe(ValidationErrorCode.SCHEMA_INVALID);
    }
  });

  it("throws ValidationError with code VOICING_STRING_COUNT_MISMATCH", async () => {
    const bad = {
      ...validRecord(),
      tuning: ["A", "D", "G", "B", "E"],
      voicings: [{ id: "v1", frets: [null, 3, 2, 0, 1, 0], base_fret: 1, position: "open", source_refs: [{ source: "unit", url: "https://example.com/v1" }] }],
    } as unknown as ChordRecord;
    try {
      await validateChordRecords([bad]);
      throw new Error("Expected throw");
    } catch (e) {
      expect(e).toBeInstanceOf(ValidationError);
      expect((e as ValidationError).code).toBe(ValidationErrorCode.VOICING_STRING_COUNT_MISMATCH);
    }
  });

  it("throws ValidationError with code VOICING_INVALID_FRET_VALUE", async () => {
    const bad = {
      ...validRecord(),
      voicings: [{ id: "v1", frets: [null, 3, 2, 0, 1, "x"] as unknown as Array<number | null>, base_fret: 1, position: "open", source_refs: [{ source: "unit", url: "https://example.com/v1" }] }],
    } as unknown as ChordRecord;
    try {
      await validateChordRecords([bad]);
      throw new Error("Expected throw");
    } catch (e) {
      expect(e).toBeInstanceOf(ValidationError);
      expect((e as ValidationError).code).toBe(ValidationErrorCode.VOICING_INVALID_FRET_VALUE);
    }
  });

  it("throws ValidationError with code VOICING_FRET_OUT_OF_RANGE", async () => {
    const bad = {
      ...validRecord(),
      voicings: [{ id: "v1", frets: [null, 25, 2, 0, 1, 0], base_fret: 1, position: "open", source_refs: [{ source: "unit", url: "https://example.com/v1" }] }],
    } as unknown as ChordRecord;
    try {
      await validateChordRecords([bad]);
      throw new Error("Expected throw");
    } catch (e) {
      expect(e).toBeInstanceOf(ValidationError);
      expect((e as ValidationError).code).toBe(ValidationErrorCode.VOICING_FRET_OUT_OF_RANGE);
    }
  });

  it("throws ValidationError with code VOICING_ALL_STRINGS_MUTED", async () => {
    const bad = {
      ...validRecord(),
      voicings: [{ id: "v1", frets: [null, null, null, null, null, null], base_fret: 1, position: "unknown", source_refs: [{ source: "unit", url: "https://example.com/v1" }] }],
    } as unknown as ChordRecord;
    try {
      await validateChordRecords([bad]);
      throw new Error("Expected throw");
    } catch (e) {
      expect(e).toBeInstanceOf(ValidationError);
      expect((e as ValidationError).code).toBe(ValidationErrorCode.VOICING_ALL_STRINGS_MUTED);
    }
  });
});

describe("checkProvenanceCoverage", () => {
  function makeRecord(overrides: Partial<ChordRecord> = {}): ChordRecord {
    return {
      id: "chord:C:maj",
      root: "C",
      quality: "maj",
      aliases: ["C"],
      formula: ["1", "3", "5"],
      pitch_classes: ["C", "E", "G"],
      voicings: [
        {
          id: "v-cmaj-1",
          frets: [null, 3, 2, 0, 1, 0],
          base_fret: 1,
          source_refs: [{ source: "unit", url: "https://example.com/v1" }],
        },
      ],
      source_refs: [{ source: "unit", url: "https://example.com" }],
      ...overrides,
    } as ChordRecord;
  }

  it("passes when all provenance fields are present and non-empty", () => {
    expect(() => checkProvenanceCoverage([makeRecord()])).not.toThrow();
  });

  it("throws PROVENANCE_MISSING for empty chord-level source_refs", () => {
    const bad = makeRecord({ source_refs: [] });
    expect(() => checkProvenanceCoverage([bad])).toThrow(ValidationError);
    try {
      checkProvenanceCoverage([bad]);
    } catch (e) {
      expect(e).toBeInstanceOf(ValidationError);
      expect((e as ValidationError).code).toBe(ValidationErrorCode.PROVENANCE_MISSING);
      expect((e as ValidationError).message).toContain("chord:C:maj");
      expect((e as ValidationError).message).toContain("source_refs is empty");
    }
  });

  it("includes chord ID and path in the error message for missing source field", () => {
    const bad = makeRecord({
      source_refs: [{ source: "", url: "https://example.com" }],
    });
    try {
      checkProvenanceCoverage([bad]);
      throw new Error("Expected throw");
    } catch (e) {
      expect(e).toBeInstanceOf(ValidationError);
      expect((e as ValidationError).code).toBe(ValidationErrorCode.PROVENANCE_MISSING);
      expect((e as ValidationError).message).toContain("chord:C:maj › source_refs[0].source is empty");
    }
  });

  it("includes chord ID and path in the error message for missing url field", () => {
    const bad = makeRecord({
      source_refs: [{ source: "unit", url: "" }],
    });
    try {
      checkProvenanceCoverage([bad]);
      throw new Error("Expected throw");
    } catch (e) {
      expect(e).toBeInstanceOf(ValidationError);
      expect((e as ValidationError).code).toBe(ValidationErrorCode.PROVENANCE_MISSING);
      expect((e as ValidationError).message).toContain("chord:C:maj › source_refs[0].url is empty");
    }
  });

  it("throws PROVENANCE_MISSING for empty voicing-level source_refs", () => {
    const bad = makeRecord({
      voicings: [
        {
          id: "v-cmaj-1",
          frets: [null, 3, 2, 0, 1, 0],
          base_fret: 1,
          source_refs: [],
        },
      ],
    });
    try {
      checkProvenanceCoverage([bad]);
      throw new Error("Expected throw");
    } catch (e) {
      expect(e).toBeInstanceOf(ValidationError);
      expect((e as ValidationError).code).toBe(ValidationErrorCode.PROVENANCE_MISSING);
      expect((e as ValidationError).message).toContain("voicing v-cmaj-1");
      expect((e as ValidationError).message).toContain("source_refs is empty");
    }
  });

  it("throws PROVENANCE_MISSING when voicing source_ref has empty source", () => {
    const bad = makeRecord({
      voicings: [
        {
          id: "v-cmaj-1",
          frets: [null, 3, 2, 0, 1, 0],
          base_fret: 1,
          source_refs: [{ source: "  ", url: "https://example.com/v1" }],
        },
      ],
    });
    try {
      checkProvenanceCoverage([bad]);
      throw new Error("Expected throw");
    } catch (e) {
      expect(e).toBeInstanceOf(ValidationError);
      expect((e as ValidationError).code).toBe(ValidationErrorCode.PROVENANCE_MISSING);
      expect((e as ValidationError).message).toContain("voicing v-cmaj-1 › source_refs[0].source is empty");
    }
  });

  it("passes across multiple valid records without throwing", () => {
    const records = [
      makeRecord(),
      makeRecord({ id: "chord:D:maj", source_refs: [{ source: "other", url: "https://other.com" }] }),
    ] as ChordRecord[];
    expect(() => checkProvenanceCoverage(records)).not.toThrow();
  });
});
