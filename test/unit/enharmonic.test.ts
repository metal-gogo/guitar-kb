import { describe, expect, it } from "vitest";
import { buildEnharmonicReport, formatEnharmonicReport } from "../../src/validate/enharmonic.js";
import type { ChordRecord } from "../../src/types/model.js";

function makeRecord(id: string, enharmonics: string[] = []): ChordRecord {
  return {
    id,
    root: id.split(":")[1]!,
    quality: id.split(":")[2] as ChordRecord["quality"],
    aliases: [],
    formula: [],
    pitch_classes: [],
    enharmonic_equivalents: enharmonics,
    voicings: [],
    source_refs: [],
  };
}

describe("buildEnharmonicReport", () => {
  it("returns empty pairs and no asymmetries for records without enharmonics", () => {
    const records = [makeRecord("chord:C:maj"), makeRecord("chord:D:maj")];
    const report = buildEnharmonicReport(records);
    expect(report.pairs).toEqual([]);
    expect(report.asymmetries).toEqual([]);
    expect(report.totalRecords).toBe(2);
    expect(report.recordsWithEnharmonics).toBe(0);
  });

  it("detects a symmetric pair", () => {
    const records = [
      makeRecord("chord:C#:maj", ["chord:Db:maj"]),
      makeRecord("chord:Db:maj", ["chord:C#:maj"]),
    ];
    const report = buildEnharmonicReport(records);
    expect(report.pairs).toHaveLength(1);
    expect(report.pairs[0]).toEqual({ a: "chord:C#:maj", b: "chord:Db:maj" });
    expect(report.asymmetries).toHaveLength(0);
    expect(report.recordsWithEnharmonics).toBe(2);
  });

  it("does not duplicate symmetric pairs", () => {
    // Both sides refer to each other — should produce exactly one pair
    const records = [
      makeRecord("chord:C#:maj", ["chord:Db:maj"]),
      makeRecord("chord:Db:maj", ["chord:C#:maj"]),
    ];
    const report = buildEnharmonicReport(records);
    expect(report.pairs).toHaveLength(1);
  });

  it("flags asymmetry when the counterpart does not reciprocate", () => {
    const records = [
      makeRecord("chord:C#:maj", ["chord:Db:maj"]),
      makeRecord("chord:Db:maj", []), // does NOT list C#:maj
    ];
    const report = buildEnharmonicReport(records);
    expect(report.pairs).toHaveLength(0);
    expect(report.asymmetries).toHaveLength(1);
    expect(report.asymmetries[0]!.from).toBe("chord:C#:maj");
    expect(report.asymmetries[0]!.to).toBe("chord:Db:maj");
  });

  it("flags asymmetry when the target record does not exist", () => {
    const records = [
      makeRecord("chord:C#:maj", ["chord:Db:maj"]),
      // chord:Db:maj is not in records
    ];
    const report = buildEnharmonicReport(records);
    expect(report.asymmetries).toHaveLength(1);
    expect(report.asymmetries[0]!.reason).toMatch(/does not exist in the record set/);
  });

  it("sorts pairs and asymmetries deterministically", () => {
    const records = [
      makeRecord("chord:G#:min", ["chord:Ab:min"]),
      makeRecord("chord:Ab:min", ["chord:G#:min"]),
      makeRecord("chord:C#:maj", ["chord:Db:maj"]),
      makeRecord("chord:Db:maj", ["chord:C#:maj"]),
    ];
    const report = buildEnharmonicReport(records);
    // Pairs are keyed by alphabetic sort of [a,b]; verify stable ordering
    expect(report.pairs).toHaveLength(2);
    const ids = report.pairs.map((p) => p.a);
    expect([...ids].sort()).toEqual(ids); // already sorted
  });

  it("produces identical output for repeated calls (determinism)", () => {
    const records = [
      makeRecord("chord:C#:maj", ["chord:Db:maj"]),
      makeRecord("chord:Db:maj", ["chord:C#:maj"]),
    ];
    expect(buildEnharmonicReport([...records])).toEqual(buildEnharmonicReport([...records]));
  });
});

describe("formatEnharmonicReport", () => {
  it("produces a markdown table with pairs", () => {
    const records = [
      makeRecord("chord:C#:maj", ["chord:Db:maj"]),
      makeRecord("chord:Db:maj", ["chord:C#:maj"]),
    ];
    const md = formatEnharmonicReport(buildEnharmonicReport(records));
    expect(md).toContain("# Enharmonic Equivalence Report");
    expect(md).toContain("chord:C#:maj");
    expect(md).toContain("chord:Db:maj");
    expect(md).toContain("_No asymmetries detected._");
  });

  it("shows asymmetry table when asymmetries exist", () => {
    const records = [makeRecord("chord:C#:maj", ["chord:Db:maj"])];
    const md = formatEnharmonicReport(buildEnharmonicReport(records));
    expect(md).toContain("Asymmetries");
    expect(md).toContain("chord:C#:maj");
  });

  it("shows empty pair message when no pairs exist", () => {
    const md = formatEnharmonicReport(buildEnharmonicReport([]));
    expect(md).toContain("_No symmetric pairs found._");
  });
});
