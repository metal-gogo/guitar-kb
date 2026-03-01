import type { ChordQuality, ChordRecord } from "../types/model.js";
import {
  COVERAGE_MATRIX_CONTRACT,
  type CoverageGapSeverity,
} from "./coverageContract.js";

export interface MissingCoverageGap {
  canonicalId: string;
  severity: CoverageGapSeverity;
  tags: string[];
}

export interface RootQualityCoverageReport {
  matrixVersion: string;
  expectedRoots: string[];
  expectedQualities: ChordQuality[];
  expectedCombinations: number;
  observedCombinations: number;
  coveragePercent: number;
  missingCanonicalIds: string[];
  missingTagged: MissingCoverageGap[];
  missingSeverityCounts: Record<CoverageGapSeverity, number>;
  unexpectedCanonicalIds: string[];
}

interface CoverageOptions {
  roots?: readonly string[];
  qualities?: readonly ChordQuality[];
  matrixVersion?: string;
}

function toChordId(root: string, quality: string): string {
  return `chord:${root}:${quality}`;
}

export function buildRootQualityCoverageReport(
  records: ChordRecord[],
  options: CoverageOptions = {},
): RootQualityCoverageReport {
  const roots = options.roots ?? COVERAGE_MATRIX_CONTRACT.roots;
  const qualities = options.qualities ?? COVERAGE_MATRIX_CONTRACT.qualities;
  const matrixVersion = options.matrixVersion ?? COVERAGE_MATRIX_CONTRACT.version;

  const expected = new Set<string>();
  for (const root of roots) {
    for (const quality of qualities) {
      expected.add(toChordId(root, quality));
    }
  }

  const observed = new Set(records.map((record) => record.id));

  const missingCanonicalIds: string[] = [];
  const missingTagged: MissingCoverageGap[] = [];
  const missingSeverityCounts: Record<CoverageGapSeverity, number> = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
  };
  for (const root of roots) {
    for (const quality of qualities) {
      const id = toChordId(root, quality);
      if (!observed.has(id)) {
        missingCanonicalIds.push(id);
        const severity = COVERAGE_MATRIX_CONTRACT.severityByQuality[quality];
        missingTagged.push({
          canonicalId: id,
          severity,
          tags: [`severity:${severity}`, `quality:${quality}`],
        });
        missingSeverityCounts[severity] += 1;
      }
    }
  }

  const unexpectedCanonicalIds = Array.from(observed)
    .filter((id) => !expected.has(id))
    .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));

  const expectedCombinations = expected.size;
  const observedCombinations = expectedCombinations - missingCanonicalIds.length;
  const coveragePercent = expectedCombinations === 0
    ? 100
    : Number(((observedCombinations / expectedCombinations) * 100).toFixed(2));

  return {
    matrixVersion,
    expectedRoots: [...roots],
    expectedQualities: [...qualities],
    expectedCombinations,
    observedCombinations,
    coveragePercent,
    missingCanonicalIds,
    missingTagged,
    missingSeverityCounts,
    unexpectedCanonicalIds,
  };
}
