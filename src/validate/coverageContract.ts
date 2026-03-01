import { QUALITY_ORDER, ROOT_ORDER } from "../config.js";
import type { ChordQuality } from "../types/model.js";

export type CoverageGapSeverity = "critical" | "high" | "medium" | "low";

export interface CoverageMatrixContract {
  version: string;
  roots: readonly string[];
  qualities: readonly ChordQuality[];
  severityByQuality: Record<ChordQuality, CoverageGapSeverity>;
}

export const COVERAGE_MATRIX_CONTRACT: CoverageMatrixContract = {
  version: "coverage-matrix/v1",
  roots: ROOT_ORDER,
  qualities: QUALITY_ORDER,
  severityByQuality: {
    maj: "critical",
    min: "critical",
    "7": "critical",
    maj7: "critical",
    min7: "high",
    dim: "medium",
    dim7: "medium",
    aug: "medium",
    sus2: "low",
    sus4: "low",
  },
};
