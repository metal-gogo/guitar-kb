import { QUALITY_ORDER, ROOT_ORDER } from "../config.js";
import type { ChordQuality, ChordRecord } from "../types/model.js";

export interface RootQualityCoverageReport {
  expectedCombinations: number;
  observedCombinations: number;
  coveragePercent: number;
  missingCanonicalIds: string[];
  unexpectedCanonicalIds: string[];
}

interface CoverageOptions {
  roots?: readonly string[];
  qualities?: readonly ChordQuality[];
}

function toChordId(root: string, quality: string): string {
  return `chord:${root}:${quality}`;
}

export function buildRootQualityCoverageReport(
  records: ChordRecord[],
  options: CoverageOptions = {},
): RootQualityCoverageReport {
  const roots = options.roots ?? ROOT_ORDER;
  const qualities = options.qualities ?? QUALITY_ORDER;

  const expected = new Set<string>();
  for (const root of roots) {
    for (const quality of qualities) {
      expected.add(toChordId(root, quality));
    }
  }

  const observed = new Set(records.map((record) => record.id));

  const missingCanonicalIds: string[] = [];
  for (const root of roots) {
    for (const quality of qualities) {
      const id = toChordId(root, quality);
      if (!observed.has(id)) {
        missingCanonicalIds.push(id);
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
    expectedCombinations,
    observedCombinations,
    coveragePercent,
    missingCanonicalIds,
    unexpectedCanonicalIds,
  };
}
