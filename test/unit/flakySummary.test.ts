import { describe, expect, it } from "vitest";
import type { VitestJsonReport } from "../../src/ci/flakySummary.js";
import { buildFlakySummary, formatFlakySummaryMarkdown } from "../../src/ci/flakySummary.js";

function report(overrides: Partial<VitestJsonReport> = {}): VitestJsonReport {
  return {
    numTotalTestSuites: 2,
    numFailedTestSuites: 1,
    numTotalTests: 4,
    numFailedTests: 2,
    testResults: [
      {
        name: "test/unit/a.test.ts",
        status: "failed",
        assertionResults: [
          { fullName: "suite alpha test one", status: "passed" },
          { fullName: "suite alpha test one", status: "failed" },
          { fullName: "suite alpha test two", status: "failed" },
        ],
      },
      {
        name: "test/unit/b.test.ts",
        status: "passed",
        assertionResults: [
          { fullName: "suite beta test three", status: "passed" },
        ],
      },
    ],
    ...overrides,
  };
}

describe("buildFlakySummary", () => {
  it("aggregates non-pass signatures and per-file counts deterministically", () => {
    const summary = buildFlakySummary(report());

    expect(summary.nonPassAssertions).toBe(2);
    expect(summary.unstableSignatures).toEqual([
      {
        file: "test/unit/a.test.ts",
        testName: "suite alpha test one",
        nonPassed: 1,
        passed: 1,
      },
      {
        file: "test/unit/a.test.ts",
        testName: "suite alpha test two",
        nonPassed: 1,
        passed: 0,
      },
    ]);
    expect(summary.nonPassByFile).toEqual([{ file: "test/unit/a.test.ts", nonPassed: 2 }]);
  });

  it("returns empty unstable sections when all assertions pass", () => {
    const summary = buildFlakySummary(
      report({
        numFailedTestSuites: 0,
        numFailedTests: 0,
        testResults: [
          {
            name: "test/unit/a.test.ts",
            status: "passed",
            assertionResults: [{ fullName: "suite alpha ok", status: "passed" }],
          },
        ],
      }),
    );

    expect(summary.nonPassAssertions).toBe(0);
    expect(summary.unstableSignatures).toEqual([]);
    expect(summary.nonPassByFile).toEqual([]);
  });
});

describe("formatFlakySummaryMarkdown", () => {
  it("renders deterministic markdown with ranked tables", () => {
    const summary = buildFlakySummary(report());
    const markdown = formatFlakySummaryMarkdown(summary, 10);

    expect(markdown).toContain("# Flaky Test Summary");
    expect(markdown).toContain("## Top Unstable Tests (Top 10)");
    expect(markdown).toContain("| 1 | 1 | 1 | suite alpha test one | test/unit/a.test.ts |");
    expect(markdown).toContain("## Non-pass Assertions By File");
  });
});
