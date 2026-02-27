import { describe, expect, it } from "vitest";
import { buildRootQualityCoverageReport } from "../../src/validate/coverage.js";
import type { ChordQuality, ChordRecord } from "../../src/types/model.js";

function chord(id: string): ChordRecord {
  const [, root, quality] = id.split(":");
  return {
    id,
    root: root ?? "C",
    quality: (quality as ChordQuality) ?? "maj",
    aliases: [],
    formula: ["1", "3", "5"],
    pitch_classes: ["C", "E", "G"],
    tuning: ["E", "A", "D", "G", "B", "E"],
    voicings: [{ id: `${id}:v1:test`, frets: [null, 3, 2, 0, 1, 0], base_fret: 1 }],
    source_refs: [{ source: "unit", url: "https://example.com" }],
  };
}

describe("buildRootQualityCoverageReport", () => {
  const roots = ["C", "D"] as const;
  const qualities = ["maj", "min"] as const;

  it("reports complete coverage when all expected pairs are present", () => {
    const records = [
      chord("chord:C:maj"),
      chord("chord:C:min"),
      chord("chord:D:maj"),
      chord("chord:D:min"),
    ];
    const report = buildRootQualityCoverageReport(records, { roots, qualities });

    expect(report.expectedCombinations).toBe(4);
    expect(report.observedCombinations).toBe(4);
    expect(report.coveragePercent).toBe(100);
    expect(report.missingCanonicalIds).toEqual([]);
    expect(report.missingTagged).toEqual([]);
    expect(report.missingSeverityCounts).toEqual({
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
    });
    expect(report.unexpectedCanonicalIds).toEqual([]);
  });

  it("lists missing canonical IDs in deterministic root/quality order", () => {
    const records = [
      chord("chord:C:maj"),
      chord("chord:D:min"),
    ];
    const report = buildRootQualityCoverageReport(records, { roots, qualities });

    expect(report.expectedCombinations).toBe(4);
    expect(report.observedCombinations).toBe(2);
    expect(report.missingCanonicalIds).toEqual(["chord:C:min", "chord:D:maj"]);
    expect(report.missingTagged.map((entry) => entry.canonicalId)).toEqual(["chord:C:min", "chord:D:maj"]);
    expect(report.missingTagged.every((entry) => entry.severity === "critical")).toBe(true);
    expect(report.missingSeverityCounts).toEqual({
      critical: 2,
      high: 0,
      medium: 0,
      low: 0,
    });
  });

  it("deduplicates observed canonical IDs", () => {
    const records = [
      chord("chord:C:maj"),
      chord("chord:C:maj"),
      chord("chord:C:min"),
    ];
    const report = buildRootQualityCoverageReport(records, { roots: ["C"], qualities });

    expect(report.expectedCombinations).toBe(2);
    expect(report.observedCombinations).toBe(2);
    expect(report.missingCanonicalIds).toEqual([]);
  });

  it("reports unexpected canonical IDs outside the expected matrix", () => {
    const records = [
      chord("chord:C:maj"),
      chord("chord:E:maj"),
      chord("chord:C:7"),
    ];
    const report = buildRootQualityCoverageReport(records, { roots: ["C"], qualities: ["maj"] });

    expect(report.expectedCombinations).toBe(1);
    expect(report.observedCombinations).toBe(1);
    expect(report.unexpectedCanonicalIds).toEqual(["chord:C:7", "chord:E:maj"]);
  });

  it("classifies missing IDs into deterministic severity buckets", () => {
    const report = buildRootQualityCoverageReport([], {
      roots: ["C"],
      qualities: ["maj", "min7", "dim", "sus2"],
    });

    expect(report.missingCanonicalIds).toEqual([
      "chord:C:maj",
      "chord:C:min7",
      "chord:C:dim",
      "chord:C:sus2",
    ]);
    expect(report.missingTagged).toEqual([
      {
        canonicalId: "chord:C:maj",
        severity: "critical",
        tags: ["severity:critical", "quality:maj"],
      },
      {
        canonicalId: "chord:C:min7",
        severity: "high",
        tags: ["severity:high", "quality:min7"],
      },
      {
        canonicalId: "chord:C:dim",
        severity: "medium",
        tags: ["severity:medium", "quality:dim"],
      },
      {
        canonicalId: "chord:C:sus2",
        severity: "low",
        tags: ["severity:low", "quality:sus2"],
      },
    ]);
    expect(report.missingSeverityCounts).toEqual({
      critical: 1,
      high: 1,
      medium: 1,
      low: 1,
    });
  });
});
