import { mkdtemp, mkdir, rm, utimes, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildSourceFreshnessReport,
  formatSourceFreshnessReport,
} from "../../src/ingest/freshnessReport.js";

vi.mock("../../src/config.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../src/config.js")>();
  return {
    ...actual,
    MVP_TARGETS: [
      { source: "alpha-source", slug: "c-major", chordId: "chord:C:maj", url: "" },
      { source: "alpha-source", slug: "d-major", chordId: "chord:D:maj", url: "" },
      { source: "beta-source", slug: "e-minor", chordId: "chord:E:min", url: "" },
      // duplicate on purpose to verify de-duping in expected target list
      { source: "alpha-source", slug: "c-major", chordId: "chord:C:maj", url: "" },
    ],
  };
});

async function writeFileWithMtime(filePath: string, content: string, mtimeIso: string): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, content, "utf8");
  const mtime = new Date(mtimeIso);
  await utimes(filePath, mtime, mtime);
}

describe("source freshness report", () => {
  let tempDir = "";

  beforeEach(async () => {
    tempDir = await mkdtemp(path.join(os.tmpdir(), "gckb-freshness-"));
  });

  afterEach(async () => {
    if (tempDir) {
      await rm(tempDir, { recursive: true, force: true });
      tempDir = "";
    }
  });

  it("summarizes per-source freshness and stale counts deterministically", async () => {
    const cacheBase = path.join(tempDir, "data", "sources");
    await writeFileWithMtime(
      path.join(cacheBase, "alpha-source", "c-major.html"),
      "<html>alpha stale</html>",
      "2026-01-18T00:00:00.000Z",
    );
    await writeFileWithMtime(
      path.join(cacheBase, "beta-source", "e-minor.html"),
      "<html>beta fresh</html>",
      "2026-02-24T00:00:00.000Z",
    );

    const report = await buildSourceFreshnessReport({
      cacheBase,
      asOf: new Date("2026-02-27T00:00:00.000Z"),
      maxAgeDays: 30,
    });

    expect(report.totalExpectedTargets).toBe(3);
    expect(report.totalPresentTargets).toBe(2);
    expect(report.totalMissingTargets).toBe(1);
    expect(report.totalStaleTargets).toBe(1);

    expect(report.sources).toEqual([
      {
        source: "alpha-source",
        expectedTargets: 2,
        presentTargets: 1,
        missingTargets: 1,
        staleTargets: 1,
        oldestFetchedAt: "2026-01-18T00:00:00.000Z",
        newestFetchedAt: "2026-01-18T00:00:00.000Z",
      },
      {
        source: "beta-source",
        expectedTargets: 1,
        presentTargets: 1,
        missingTargets: 0,
        staleTargets: 0,
        oldestFetchedAt: "2026-02-24T00:00:00.000Z",
        newestFetchedAt: "2026-02-24T00:00:00.000Z",
      },
    ]);

    expect(report.staleTargets).toEqual([
      {
        source: "alpha-source",
        slug: "c-major",
        filePath: path.join(cacheBase, "alpha-source", "c-major.html"),
        fetchedAt: "2026-01-18T00:00:00.000Z",
        ageDays: 40,
      },
    ]);
  });

  it("formats report output with stable line ordering", async () => {
    const cacheBase = path.join(tempDir, "data", "sources");
    await writeFileWithMtime(
      path.join(cacheBase, "beta-source", "e-minor.html"),
      "<html>beta stale</html>",
      "2026-01-01T00:00:00.000Z",
    );
    await writeFileWithMtime(
      path.join(cacheBase, "alpha-source", "c-major.html"),
      "<html>alpha fresh</html>",
      "2026-02-26T00:00:00.000Z",
    );

    const report = await buildSourceFreshnessReport({
      cacheBase,
      asOf: new Date("2026-02-27T00:00:00.000Z"),
      maxAgeDays: 20,
    });
    const formatted = formatSourceFreshnessReport(report);

    expect(formatted).toContain("AS_OF 2026-02-27T00:00:00.000Z");
    expect(formatted).toContain("MAX_AGE_DAYS 20.00");
    expect(formatted).toContain("STALE_TARGETS 1");
    expect(formatted).toContain("SOURCE alpha-source");
    expect(formatted).toContain("SOURCE beta-source");
    expect(formatted).toContain("STALE beta-source/e-minor.html");
  });

  it("rejects invalid max-age values", async () => {
    await expect(
      buildSourceFreshnessReport({
        cacheBase: path.join(tempDir, "data", "sources"),
        asOf: new Date("2026-02-27T00:00:00.000Z"),
        maxAgeDays: -1,
      }),
    ).rejects.toThrow("Invalid max age days");
  });
});
