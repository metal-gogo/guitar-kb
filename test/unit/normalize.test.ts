import { describe, expect, it } from "vitest";
import { derivePosition, normalizeQuality, normalizeRecords } from "../../src/ingest/normalize/normalize.js";
import type { RawChordRecord } from "../../src/types/model.js";

describe("normalizeQuality", () => {
  it("maps canonical aliases", () => {
    expect(normalizeQuality("major")).toBe("maj");
    expect(normalizeQuality("m")).toBe("min");
    expect(normalizeQuality("M7")).toBe("maj7");
    expect(normalizeQuality("7")).toBe("7");
  });

  it("maps all quality alias variants in the QUALITY_MAP", () => {
    // major variants
    expect(normalizeQuality("maj")).toBe("maj");
    expect(normalizeQuality("M")).toBe("maj");
    expect(normalizeQuality("Δ")).toBe("maj");
    expect(normalizeQuality("")).toBe("maj");

    // minor variants
    expect(normalizeQuality("min")).toBe("min");
    expect(normalizeQuality("minor")).toBe("min");

    // maj7 variants
    expect(normalizeQuality("maj7")).toBe("maj7");
    expect(normalizeQuality("major7")).toBe("maj7");
    expect(normalizeQuality("Δ7")).toBe("maj7");

    // min7 variants
    expect(normalizeQuality("m7")).toBe("min7");
    expect(normalizeQuality("min7")).toBe("min7");
    expect(normalizeQuality("minor7")).toBe("min7");
    expect(normalizeQuality("-7")).toBe("min7");

    // dim variants
    expect(normalizeQuality("dim")).toBe("dim");
    expect(normalizeQuality("diminished")).toBe("dim");
    expect(normalizeQuality("m7b5")).toBe("dim");
    expect(normalizeQuality("°")).toBe("dim");
    expect(normalizeQuality("o")).toBe("dim");

    // dim7 variants
    expect(normalizeQuality("dim7")).toBe("dim7");
    expect(normalizeQuality("diminished7")).toBe("dim7");
    expect(normalizeQuality("°7")).toBe("dim7");
    expect(normalizeQuality("o7")).toBe("dim7");

    // aug variants
    expect(normalizeQuality("aug")).toBe("aug");
    expect(normalizeQuality("augmented")).toBe("aug");
    expect(normalizeQuality("+")).toBe("aug");

    // sus variants
    expect(normalizeQuality("sus2")).toBe("sus2");
    expect(normalizeQuality("suspended2")).toBe("sus2");
    expect(normalizeQuality("sus4")).toBe("sus4");
    expect(normalizeQuality("suspended4")).toBe("sus4");
    expect(normalizeQuality("sus")).toBe("sus4");
  });

  it("rejects unsupported aliases", () => {
    expect(() => normalizeQuality("major ninth")).toThrow("Unsupported chord quality");
    expect(() => normalizeQuality("unknown")).toThrow("Unsupported chord quality");
    expect(() => normalizeQuality("maj13")).toThrow("Unsupported chord quality");
  });
});

describe("normalizeRecords", () => {
  it("builds deterministic canonical IDs and merged records", () => {
    const raw: RawChordRecord[] = [
      {
        source: "source-a",
        url: "https://example.com/cmaj",
        symbol: "C",
        root: "C",
        quality_raw: "major",
        aliases: ["C", "Cmaj"],
        formula: ["1", "3", "5"],
        pitch_classes: ["C", "E", "G"],
        voicings: [{ id: "v1", frets: [null, 3, 2, 0, 1, 0], base_fret: 1 }]
      }
    ];

    const normalized = normalizeRecords(raw);
    expect(normalized).toHaveLength(1);
    expect(normalized[0]?.id).toBe("chord:C:maj");
    expect(normalized[0]?.source_refs[0]?.source).toBe("source-a");
  });

  it("sorts records deterministically by root and quality", () => {
    const raw: RawChordRecord[] = [
      {
        source: "source-a",
        url: "https://example.com/c7",
        symbol: "C7",
        root: "C",
        quality_raw: "7",
        aliases: ["C7"],
        formula: ["1", "3", "5", "b7"],
        pitch_classes: ["C", "E", "G", "Bb"],
        voicings: [{ id: "v1", frets: [null, 3, 2, 3, 1, 0], base_fret: 1 }]
      },
      {
        source: "source-a",
        url: "https://example.com/cmaj",
        symbol: "C",
        root: "C",
        quality_raw: "major",
        aliases: ["C"],
        formula: ["1", "3", "5"],
        pitch_classes: ["C", "E", "G"],
        voicings: [{ id: "v1", frets: [null, 3, 2, 0, 1, 0], base_fret: 1 }]
      }
    ];

    const normalized = normalizeRecords(raw);
    expect(normalized.map((item) => item.id)).toEqual(["chord:C:maj", "chord:C:7"]);
  });

  it("sorts deterministically across root order", () => {
    const raw: RawChordRecord[] = [
      {
        source: "source-a",
        url: "https://example.com/dbmaj",
        symbol: "Db",
        root: "Db",
        quality_raw: "major",
        aliases: ["Db"],
        formula: ["1", "3", "5"],
        pitch_classes: ["Db", "F", "Ab"],
        voicings: [{ id: "v1", frets: [null, 4, 6, 6, 6, 4], base_fret: 4 }]
      },
      {
        source: "source-a",
        url: "https://example.com/csharpmaj",
        symbol: "C#",
        root: "C#",
        quality_raw: "major",
        aliases: ["C#"],
        formula: ["1", "3", "5"],
        pitch_classes: ["C#", "E#", "G#"],
        voicings: [{ id: "v1", frets: [null, 4, 6, 6, 6, 4], base_fret: 4 }]
      },
      {
        source: "source-a",
        url: "https://example.com/cmaj",
        symbol: "C",
        root: "C",
        quality_raw: "major",
        aliases: ["C"],
        formula: ["1", "3", "5"],
        pitch_classes: ["C", "E", "G"],
        voicings: [{ id: "v1", frets: [null, 3, 2, 0, 1, 0], base_fret: 1 }]
      }
    ];

    const normalized = normalizeRecords(raw);
    expect(normalized.map((item) => item.id)).toEqual(["chord:C:maj", "chord:C#:maj", "chord:Db:maj"]);
  });

  it("links enharmonic equivalents explicitly", () => {
    const raw: RawChordRecord[] = [
      {
        source: "source-a",
        url: "https://example.com/c-sharp-major",
        symbol: "C#",
        root: "C#",
        quality_raw: "major",
        aliases: ["C#", "C#maj"],
        formula: ["1", "3", "5"],
        pitch_classes: ["C#", "E#", "G#"],
        voicings: [{ id: "v1", frets: [null, 4, 6, 6, 6, 4], base_fret: 4 }]
      }
    ];

    const normalized = normalizeRecords(raw);
    expect(normalized).toHaveLength(1);
    expect(normalized[0]?.enharmonic_equivalents).toEqual(["chord:Db:maj"]);
  });

  it("merges aliases and source refs deterministically for the same canonical chord", () => {
    const raw: RawChordRecord[] = [
      {
        source: "source-a",
        url: "https://example.com/c-major-a",
        symbol: "C",
        root: "C",
        quality_raw: "major",
        aliases: ["C", "Cmaj"],
        formula: ["1", "3", "5"],
        pitch_classes: ["C", "E", "G"],
        voicings: [{ id: "v1", frets: [null, 3, 2, 0, 1, 0], base_fret: 1 }]
      },
      {
        source: "source-b",
        url: "https://example.com/c-major-b",
        symbol: "CM",
        root: "C",
        quality_raw: "M",
        aliases: ["CM", "C"],
        formula: ["1", "3", "5"],
        pitch_classes: ["C", "E", "G"],
        voicings: [{ id: "v2", frets: [3, 3, 5, 5, 5, 3], base_fret: 3 }]
      }
    ];

    const normalized = normalizeRecords(raw);
    expect(normalized).toHaveLength(1);
    expect(normalized[0]?.id).toBe("chord:C:maj");
    expect(normalized[0]?.aliases).toEqual(["C", "Cmaj", "CM"]);
    expect(normalized[0]?.source_refs.map((ref) => ref.source)).toEqual(["source-a", "source-b"]);
    expect(normalized[0]?.voicings.map((voicing) => voicing.id)).toEqual([
      "chord:C:maj:v1:source-a",
      "chord:C:maj:v2:source-b",
    ]);
  });

  it("produces the same canonical ID for equivalent quality alias inputs", () => {
    const qualityVariants = ["major", "maj", "M", "Δ", ""];
    const ids = qualityVariants.map((quality_raw) => {
      const records = normalizeRecords([
        {
          source: "source-a",
          url: "https://example.com/c",
          symbol: "C",
          root: "C",
          quality_raw,
          aliases: [],
          formula: ["1", "3", "5"],
          pitch_classes: ["C", "E", "G"],
          voicings: [{ id: "v1", frets: [null, 3, 2, 0, 1, 0], base_fret: 1 }]
        }
      ]);
      expect(records).toHaveLength(1);
      return records[0].id;
    });
    expect(new Set(ids).size).toBe(1);
    expect(ids[0]).toBe("chord:C:maj");
  });

  it("links enharmonic equivalents for all supported enharmonic root pairs", () => {
    const pairs: Array<[string, string, string]> = [
      ["C#", "Db", "chord:Db:maj"],
      ["Db", "C#", "chord:C#:maj"],
      ["D#", "Eb", "chord:Eb:maj"],
      ["Eb", "D#", "chord:D#:maj"],
      ["F#", "Gb", "chord:Gb:maj"],
      ["Gb", "F#", "chord:F#:maj"],
      ["G#", "Ab", "chord:Ab:maj"],
      ["Ab", "G#", "chord:G#:maj"],
      ["A#", "Bb", "chord:Bb:maj"],
      ["Bb", "A#", "chord:A#:maj"],
    ];

    for (const [root, , expectedEquivalent] of pairs) {
      const slug = root.replace(/#/g, "sharp").replace(/b$/, "flat").toLowerCase();
      const records = normalizeRecords([
        {
          source: "source-a",
          url: `https://example.com/${slug}-major`,
          symbol: root,
          root,
          quality_raw: "major",
          aliases: [],
          formula: ["1", "3", "5"],
          pitch_classes: [],
          voicings: [{ id: "v1", frets: [null, null, null, null, null, null], base_fret: 1 }]
        }
      ]);
      expect(records).toHaveLength(1);
      expect(records[0].enharmonic_equivalents, `expected enharmonic for ${root}`).toContain(expectedEquivalent);
    }
  });

  it("deduplicates aliases within a single source record", () => {
    const records = normalizeRecords([
      {
        source: "source-a",
        url: "https://example.com/c",
        symbol: "C",
        root: "C",
        quality_raw: "major",
        aliases: ["C", "Cmaj", "C", "Cmaj", "CM"],
        formula: ["1", "3", "5"],
        pitch_classes: ["C", "E", "G"],
        voicings: [{ id: "v1", frets: [null, 3, 2, 0, 1, 0], base_fret: 1 }]
      }
    ]);
    expect(records[0]?.aliases).toEqual(["C", "Cmaj", "CM"]);
  });

  it("produces identical output for identical inputs (determinism)", () => {
    const raw: RawChordRecord[] = [
      {
        source: "source-a",
        url: "https://example.com/c-major",
        symbol: "C",
        root: "C",
        quality_raw: "major",
        aliases: ["C", "Cmaj"],
        formula: ["1", "3", "5"],
        pitch_classes: ["C", "E", "G"],
        voicings: [{ id: "v1", frets: [null, 3, 2, 0, 1, 0], base_fret: 1 }]
      }
    ];
    const a = normalizeRecords(raw);
    const b = normalizeRecords(raw);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it("derives open position when voicing includes open strings and no high frets", () => {
    expect(derivePosition([null, 3, 2, 0, 1, 0])).toBe("open");
  });

  it("derives barre position when four or more strings share the same lowest fret", () => {
    expect(derivePosition([3, 3, 5, 5, 3, 3])).toBe("barre");
  });

  it("derives upper position when lowest played fret is high and not barre", () => {
    expect(derivePosition([null, 7, 9, 9, 8, null])).toBe("upper");
  });

  it("does not classify open-string high-fret shapes as upper", () => {
    expect(derivePosition([0, 7, 9, 9, 8, 0])).toBe("unknown");
  });

  it("does not classify repeated non-lowest fret shapes as barre", () => {
    expect(derivePosition([1, 3, 3, 3, 3, 5])).toBe("unknown");
  });

  it("derives unknown position when heuristics do not match", () => {
    expect(derivePosition([null, 3, 5, 5, 4, null])).toBe("unknown");
  });

  it("assigns derived position on normalized voicings", () => {
    const raw: RawChordRecord[] = [
      {
        source: "source-a",
        url: "https://example.com/c-major",
        symbol: "C",
        root: "C",
        quality_raw: "major",
        aliases: ["C"],
        formula: ["1", "3", "5"],
        pitch_classes: ["C", "E", "G"],
        voicings: [{ id: "v1", frets: [null, 3, 2, 0, 1, 0], base_fret: 1 }]
      }
    ];

    const normalized = normalizeRecords(raw);
    expect(normalized[0]?.voicings[0]?.position).toBe("open");
  });
});
