import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { validateChordRecords } from "../validate/schema.js";
import { checkSchemaCompatibility } from "../validate/compat.js";
import { checkProvenanceCoverage } from "../validate/provenance.js";
import { buildEnharmonicReport, formatEnharmonicReport } from "../validate/enharmonic.js";
import { runA11yLint } from "../validate/a11y.js";
import { buildRootQualityCoverageReport } from "../validate/coverage.js";
import type { ChordRecord } from "../types/model.js";

async function main(): Promise<void> {
  // 1. Schema compatibility check (before record validation so a breaking schema
  //    change is diagnosed even when the JSONL hasn't been regenerated yet)
  await checkSchemaCompatibility();

  const jsonl = await readFile("data/chords.jsonl", "utf8");
  const records = jsonl
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => JSON.parse(line) as ChordRecord);

  // 2. Provenance coverage check (before AJV so missing provenance fields yield
  //    actionable chord/voicing paths rather than generic JSON Schema errors)
  checkProvenanceCoverage(records);

  await validateChordRecords(records);
  process.stdout.write(`Validated ${records.length} chord records\n`);

  // 3. Root-quality coverage summary (deterministic + CI friendly)
  const coverage = buildRootQualityCoverageReport(records);
  process.stdout.write(
    `Root-quality coverage: ${coverage.observedCombinations}/${coverage.expectedCombinations} (${coverage.coveragePercent.toFixed(2)}%)\n`,
  );
  if (coverage.missingCanonicalIds.length > 0) {
    process.stdout.write(`Missing root-quality canonical IDs (${coverage.missingCanonicalIds.length}):\n`);
    process.stdout.write(
      `Missing severity counts: critical=${coverage.missingSeverityCounts.critical} high=${coverage.missingSeverityCounts.high} medium=${coverage.missingSeverityCounts.medium} low=${coverage.missingSeverityCounts.low}\n`,
    );
    for (const id of coverage.missingCanonicalIds) {
      process.stdout.write(`MISSING ${id}\n`);
    }
    for (const missing of coverage.missingTagged) {
      process.stdout.write(
        `MISSING_TAG ${missing.canonicalId} severity=${missing.severity} tags=${missing.tags.join(",")}\n`,
      );
    }
  } else {
    process.stdout.write("Missing root-quality canonical IDs (0): none\n");
  }
  if (coverage.unexpectedCanonicalIds.length > 0) {
    process.stdout.write(`Unexpected canonical IDs outside matrix (${coverage.unexpectedCanonicalIds.length}):\n`);
    for (const id of coverage.unexpectedCanonicalIds) {
      process.stdout.write(`UNEXPECTED ${id}\n`);
    }
  }

  // 4. Enharmonic equivalence report
  const report = buildEnharmonicReport(records);
  const reportMd = formatEnharmonicReport(report);
  await writeFile("data/enharmonic-report.md", reportMd, "utf8");
  if (report.asymmetries.length > 0) {
    process.stderr.write(
      `Warning: ${report.asymmetries.length} enharmonic asymmetry(ies) detected — see data/enharmonic-report.md\n`,
    );
  } else {
    process.stdout.write(
      `Enharmonic report: ${report.pairs.length} symmetric pair(s), no asymmetries\n`,
    );
  }
  // 5. Accessibility lint baseline
  const a11y = await runA11yLint(
    path.join("docs", "diagrams"),
    path.join("docs", "chords"),
  );
  process.stdout.write(
    `A11y lint: ${a11y.checkedSvgs} SVGs, ${a11y.checkedMarkdowns} markdown pages checked\n`,
  );
  if (a11y.violations.length > 0) {
    for (const v of a11y.violations) {
      process.stderr.write(`  [${v.rule}] ${v.file}: ${v.message}\n`);
    }
    throw new Error(`Accessibility lint failed: ${a11y.violations.length} violation(s)`);
  }
}

main().catch((error: unknown) => {
  process.stderr.write(`${String(error)}\n`);
  process.exit(1);
});
