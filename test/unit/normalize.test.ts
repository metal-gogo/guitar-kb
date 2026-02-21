import { describe, expect, it } from "vitest";
import { normalizeQuality, normalizeRecords } from "../../src/ingest/normalize/normalize.js";
import type { RawChordRecord } from "../../src/types/model.js";

describe("normalizeQuality", () => {
  it("maps canonical aliases", () => {
    expect(normalizeQuality("major")).toBe("maj");
    expect(normalizeQuality("m")).toBe("min");
    expect(normalizeQuality("M7")).toBe("maj7");
    expect(normalizeQuality("7")).toBe("7");
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
});
