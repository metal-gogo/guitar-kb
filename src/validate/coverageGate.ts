import type { ChordQuality } from "../types/model.js";
import type { RootQualityCoverageReport } from "./coverage.js";
import { COVERAGE_MATRIX_CONTRACT } from "./coverageContract.js";

export interface CoverageGatePolicy {
  mode: "allowlist" | "full-matrix";
  requireFullMatrix: boolean;
  allowlistedMissingCanonicalIds: string[];
}

export interface CoverageGateResult {
  pass: boolean;
  policy: CoverageGatePolicy;
  allowedMissingCanonicalIds: string[];
  blockedMissingCanonicalIds: string[];
}

interface ResolveCoverageGatePolicyOptions {
  requireFullMatrix?: boolean;
  envAllowlist?: string;
}

const TRANSITIONAL_ALLOWLIST_QUALITIES: readonly ChordQuality[] = [
  "min7",
  "dim",
  "dim7",
  "aug",
  "sus2",
  "sus4",
];

function toCanonicalId(root: string, quality: ChordQuality): string {
  return `chord:${root}:${quality}`;
}

export function parseCanonicalIdList(input: string): string[] {
  return Array.from(
    new Set(
      input
        .split(",")
        .map((token) => token.trim())
        .filter((token) => token.length > 0)
        .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0)),
    ),
  );
}

export function buildCoverageGateDefaultAllowlist(
  roots: readonly string[] = COVERAGE_MATRIX_CONTRACT.roots,
): string[] {
  const allowlist: string[] = [];
  for (const root of roots) {
    for (const quality of TRANSITIONAL_ALLOWLIST_QUALITIES) {
      allowlist.push(toCanonicalId(root, quality));
    }
  }
  return allowlist;
}

export function resolveCoverageGatePolicy(
  options: ResolveCoverageGatePolicyOptions = {},
): CoverageGatePolicy {
  const requireFullMatrix = options.requireFullMatrix ?? process.env.VALIDATE_REQUIRE_FULL_MATRIX === "1";
  const envAllowlist = options.envAllowlist ?? process.env.VALIDATE_COVERAGE_ALLOWLIST ?? "";

  const defaultAllowlist = buildCoverageGateDefaultAllowlist();
  const extraAllowlist = parseCanonicalIdList(envAllowlist);
  const allowlist = requireFullMatrix
    ? []
    : Array.from(new Set([...defaultAllowlist, ...extraAllowlist]))
      .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));

  return {
    mode: requireFullMatrix ? "full-matrix" : "allowlist",
    requireFullMatrix,
    allowlistedMissingCanonicalIds: allowlist,
  };
}

export function evaluateCoverageGate(
  coverage: RootQualityCoverageReport,
  policy: CoverageGatePolicy,
): CoverageGateResult {
  const allowset = new Set(policy.allowlistedMissingCanonicalIds);
  const allowedMissingCanonicalIds = coverage.missingCanonicalIds.filter((id) => allowset.has(id));
  const blockedMissingCanonicalIds = coverage.missingCanonicalIds.filter((id) => !allowset.has(id));

  return {
    pass: blockedMissingCanonicalIds.length === 0,
    policy,
    allowedMissingCanonicalIds,
    blockedMissingCanonicalIds,
  };
}
