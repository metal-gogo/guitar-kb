import type { RootQualityCoverageReport } from "../../validate/coverage.js";

const DEFAULT_MISSING_LIMIT = 100;

function formatMissingRows(report: RootQualityCoverageReport, limit: number): string {
  const rows = report.missingTagged.slice(0, limit);
  if (rows.length === 0) {
    return "_None_";
  }

  const header = [
    "| Canonical ID | Severity | Tags |",
    "|---|---|---|",
  ];
  const body = rows.map((entry) => `| ${entry.canonicalId} | ${entry.severity} | ${entry.tags.join(", ")} |`);
  return [...header, ...body].join("\n");
}

export function coverageDashboardMarkdown(
  report: RootQualityCoverageReport,
  options: { missingLimit?: number } = {},
): string {
  const missingLimit = options.missingLimit ?? DEFAULT_MISSING_LIMIT;
  const truncated = report.missingCanonicalIds.length > missingLimit;
  const missingRows = formatMissingRows(report, missingLimit);
  const unexpectedRows = report.unexpectedCanonicalIds.length === 0
    ? "_None_"
    : report.unexpectedCanonicalIds.map((id) => `- \`${id}\``).join("\n");
  const lines = [
    "# Coverage Dashboard",
    "",
    `- Matrix version: \`${report.matrixVersion}\``,
    `- Coverage: \`${report.observedCombinations}/${report.expectedCombinations}\` (\`${report.coveragePercent.toFixed(2)}%\`)`,
    "",
    "## Missing Severity Counts",
    "",
    "| Severity | Count |",
    "|---|---:|",
    `| critical | ${report.missingSeverityCounts.critical} |`,
    `| high | ${report.missingSeverityCounts.high} |`,
    `| medium | ${report.missingSeverityCounts.medium} |`,
    `| low | ${report.missingSeverityCounts.low} |`,
    "",
    "## Missing Canonical IDs",
    "",
    truncated
      ? `_Showing first ${missingLimit} of ${report.missingCanonicalIds.length} missing IDs (deterministic order)._`
      : "",
    "",
    missingRows,
    "",
    "## Unexpected Canonical IDs",
    "",
    unexpectedRows,
    "",
    "## Navigation",
    "",
    "- [← Chord Index](./index.md)",
    "",
  ];

  return lines.join("\n");
}
