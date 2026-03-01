import { describe, expect, it } from "vitest";
import type { ChordQuality, ChordRecord } from "../../src/types/model.js";
import { QUALITY_ORDER } from "../../src/config.js";
import { buildRootQualityCoverageReport } from "../../src/validate/coverage.js";
import {
  buildCoverageGateDefaultAllowlist,
  evaluateCoverageGate,
  parseCanonicalIdList,
  resolveCoverageGatePolicy,
} from "../../src/validate/coverageGate.js";
import { COVERAGE_MATRIX_CONTRACT } from "../../src/validate/coverageContract.js";

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

describe("coverage gate policy", () => {
  it("builds a deterministic transitional default allowlist", () => {
    const allowlist = buildCoverageGateDefaultAllowlist();

    expect(allowlist.length).toBe(COVERAGE_MATRIX_CONTRACT.roots.length * 6);
    expect(allowlist[0]).toBe("chord:C:min7");
    expect(allowlist[allowlist.length - 1]).toBe("chord:B:sus4");
  });

  it("parses CSV allowlist entries with sorting and deduplication", () => {
    expect(parseCanonicalIdList(" chord:C:dim ,chord:C:dim,chord:C:min7 ")).toEqual([
      "chord:C:dim",
      "chord:C:min7",
    ]);
  });

  it("uses allowlist mode by default and includes env allowlist entries", () => {
    const policy = resolveCoverageGatePolicy({
      requireFullMatrix: false,
      envAllowlist: "chord:C:maj",
    });

    expect(policy.mode).toBe("allowlist");
    expect(policy.requireFullMatrix).toBe(false);
    expect(policy.allowlistedMissingCanonicalIds).toContain("chord:C:min7");
    expect(policy.allowlistedMissingCanonicalIds).toContain("chord:C:maj");
  });

  it("uses full-matrix mode with an empty allowlist when strict is enabled", () => {
    const policy = resolveCoverageGatePolicy({ requireFullMatrix: true });

    expect(policy.mode).toBe("full-matrix");
    expect(policy.requireFullMatrix).toBe(true);
    expect(policy.allowlistedMissingCanonicalIds).toEqual([]);
  });
});

describe("evaluateCoverageGate", () => {
  it("passes when all missing IDs are allowlisted", () => {
    const coverage = buildRootQualityCoverageReport(
      [
        chord("chord:C:maj"),
        chord("chord:C:min"),
        chord("chord:C:7"),
        chord("chord:C:maj7"),
      ],
      { roots: ["C"], qualities: QUALITY_ORDER },
    );
    const policy = resolveCoverageGatePolicy({ requireFullMatrix: false });
    const result = evaluateCoverageGate(coverage, policy);

    expect(result.pass).toBe(true);
    expect(result.allowedMissingCanonicalIds).toEqual([
      "chord:C:min7",
      "chord:C:dim",
      "chord:C:dim7",
      "chord:C:aug",
      "chord:C:sus2",
      "chord:C:sus4",
    ]);
    expect(result.blockedMissingCanonicalIds).toEqual([]);
  });

  it("fails in strict full-matrix mode when any coverage gaps remain", () => {
    const coverage = buildRootQualityCoverageReport(
      [
        chord("chord:C:maj"),
        chord("chord:C:min"),
        chord("chord:C:7"),
        chord("chord:C:maj7"),
      ],
      { roots: ["C"], qualities: QUALITY_ORDER },
    );
    const policy = resolveCoverageGatePolicy({ requireFullMatrix: true });
    const result = evaluateCoverageGate(coverage, policy);

    expect(result.pass).toBe(false);
    expect(result.allowedMissingCanonicalIds).toEqual([]);
    expect(result.blockedMissingCanonicalIds).toEqual([
      "chord:C:min7",
      "chord:C:dim",
      "chord:C:dim7",
      "chord:C:aug",
      "chord:C:sus2",
      "chord:C:sus4",
    ]);
  });

  it("fails in allowlist mode when a non-allowlisted core quality is missing", () => {
    const coverage = buildRootQualityCoverageReport(
      [chord("chord:C:maj")],
      { roots: ["C"], qualities: ["maj", "min"] },
    );
    const policy = resolveCoverageGatePolicy({ requireFullMatrix: false });
    const result = evaluateCoverageGate(coverage, policy);

    expect(result.pass).toBe(false);
    expect(result.allowedMissingCanonicalIds).toEqual([]);
    expect(result.blockedMissingCanonicalIds).toEqual(["chord:C:min"]);
  });
});
