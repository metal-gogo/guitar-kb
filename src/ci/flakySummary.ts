import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

interface VitestAssertionResult {
  fullName: string;
  status: string;
}

interface VitestSuiteResult {
  name: string;
  status: string;
  assertionResults?: VitestAssertionResult[];
}

export interface VitestJsonReport {
  numTotalTestSuites: number;
  numFailedTestSuites: number;
  numTotalTests: number;
  numFailedTests: number;
  testResults: VitestSuiteResult[];
}

interface SignatureStats {
  file: string;
  testName: string;
  passed: number;
  nonPassed: number;
}

export interface FlakySummary {
  totalSuites: number;
  failedSuites: number;
  totalTests: number;
  failedTests: number;
  nonPassAssertions: number;
  unstableSignatures: Array<{
    file: string;
    testName: string;
    nonPassed: number;
    passed: number;
  }>;
  nonPassByFile: Array<{
    file: string;
    nonPassed: number;
  }>;
}

function sortTextStable(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

export function buildFlakySummary(report: VitestJsonReport): FlakySummary {
  const signatureMap = new Map<string, SignatureStats>();
  const nonPassByFileMap = new Map<string, number>();

  for (const suite of report.testResults) {
    const file = suite.name;
    const assertions = suite.assertionResults ?? [];
    for (const assertion of assertions) {
      const key = `${file}::${assertion.fullName}`;
      const current = signatureMap.get(key) ?? {
        file,
        testName: assertion.fullName,
        passed: 0,
        nonPassed: 0,
      };

      if (assertion.status === "passed") {
        current.passed += 1;
      } else {
        current.nonPassed += 1;
        const fileNonPassed = nonPassByFileMap.get(file) ?? 0;
        nonPassByFileMap.set(file, fileNonPassed + 1);
      }

      signatureMap.set(key, current);
    }
  }

  const unstableSignatures = Array.from(signatureMap.values())
    .filter((entry) => entry.nonPassed > 0)
    .sort((a, b) => {
      const countDiff = b.nonPassed - a.nonPassed;
      if (countDiff !== 0) {
        return countDiff;
      }
      const fileDiff = sortTextStable(a.file, b.file);
      if (fileDiff !== 0) {
        return fileDiff;
      }
      return sortTextStable(a.testName, b.testName);
    });

  const nonPassByFile = Array.from(nonPassByFileMap.entries())
    .map(([file, nonPassed]) => ({ file, nonPassed }))
    .sort((a, b) => {
      const countDiff = b.nonPassed - a.nonPassed;
      if (countDiff !== 0) {
        return countDiff;
      }
      return sortTextStable(a.file, b.file);
    });

  const nonPassAssertions = nonPassByFile.reduce((sum, entry) => sum + entry.nonPassed, 0);

  return {
    totalSuites: report.numTotalTestSuites,
    failedSuites: report.numFailedTestSuites,
    totalTests: report.numTotalTests,
    failedTests: report.numFailedTests,
    nonPassAssertions,
    unstableSignatures,
    nonPassByFile,
  };
}

export function formatFlakySummaryMarkdown(summary: FlakySummary, topN: number): string {
  const lines: string[] = [];
  lines.push("# Flaky Test Summary");
  lines.push("");
  lines.push(`- Total suites: ${summary.totalSuites}`);
  lines.push(`- Failed suites: ${summary.failedSuites}`);
  lines.push(`- Total tests: ${summary.totalTests}`);
  lines.push(`- Failed tests: ${summary.failedTests}`);
  lines.push(`- Non-pass assertions: ${summary.nonPassAssertions}`);
  lines.push("");

  lines.push(`## Top Unstable Tests (Top ${topN})`);
  lines.push("");
  if (summary.unstableSignatures.length === 0) {
    lines.push("none");
  } else {
    lines.push("| Rank | Non-pass count | Passed count | Test | File |");
    lines.push("|---|---:|---:|---|---|");
    summary.unstableSignatures.slice(0, topN).forEach((entry, index) => {
      lines.push(`| ${index + 1} | ${entry.nonPassed} | ${entry.passed} | ${entry.testName} | ${entry.file} |`);
    });
  }
  lines.push("");

  lines.push("## Non-pass Assertions By File");
  lines.push("");
  if (summary.nonPassByFile.length === 0) {
    lines.push("none");
  } else {
    lines.push("| Rank | Non-pass count | File |");
    lines.push("|---|---:|---|");
    summary.nonPassByFile.forEach((entry, index) => {
      lines.push(`| ${index + 1} | ${entry.nonPassed} | ${entry.file} |`);
    });
  }
  lines.push("");

  return lines.join("\n");
}

interface CliOptions {
  input: string;
  markdownOut: string;
  jsonOut: string;
  top: number;
}

function parseCliOptions(argv: string[]): CliOptions {
  const options: CliOptions = {
    input: ".artifacts/vitest-results.json",
    markdownOut: ".artifacts/flaky-test-summary.md",
    jsonOut: ".artifacts/flaky-test-summary.json",
    top: 15,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const value = argv[i + 1];
    if (arg === "--input" && value) {
      options.input = value;
      i += 1;
      continue;
    }
    if (arg === "--md" && value) {
      options.markdownOut = value;
      i += 1;
      continue;
    }
    if (arg === "--json" && value) {
      options.jsonOut = value;
      i += 1;
      continue;
    }
    if (arg === "--top" && value) {
      options.top = Number(value);
      i += 1;
      continue;
    }
  }

  if (!Number.isFinite(options.top) || options.top <= 0) {
    throw new Error(`Invalid --top value: ${options.top}`);
  }

  return options;
}

async function main(): Promise<void> {
  const options = parseCliOptions(process.argv.slice(2));
  const raw = await readFile(options.input, "utf8");
  const report = JSON.parse(raw) as VitestJsonReport;
  const summary = buildFlakySummary(report);
  const markdown = formatFlakySummaryMarkdown(summary, options.top);

  await mkdir(path.dirname(options.markdownOut), { recursive: true });
  await mkdir(path.dirname(options.jsonOut), { recursive: true });
  await writeFile(options.markdownOut, markdown, "utf8");
  await writeFile(options.jsonOut, JSON.stringify(summary, null, 2), "utf8");

  process.stdout.write(
    `Flaky summary: ${summary.unstableSignatures.length} unstable signature(s), ${summary.nonPassAssertions} non-pass assertion(s)\n`,
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error: unknown) => {
    process.stderr.write(`${String(error)}\n`);
    process.exit(1);
  });
}
