import { createHash } from "node:crypto";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  buildDocsChangelogSnapshot,
  formatDocsChangelogSnapshot,
  writeDocsBaselineSnapshot,
} from "../../src/build/docs/changelogSnapshot.js";

function sha256(content: string): string {
  return createHash("sha256").update(Buffer.from(content, "utf8")).digest("hex");
}

describe("docs changelog snapshot", () => {
  let tempDir = "";
  const originalCwd = process.cwd();

  beforeEach(async () => {
    tempDir = await mkdtemp(path.join(os.tmpdir(), "gckb-docs-changelog-"));
    process.chdir(tempDir);
  });

  afterEach(async () => {
    process.chdir(originalCwd);
    if (tempDir) {
      await rm(tempDir, { recursive: true, force: true });
      tempDir = "";
    }
  });

  it("reports deterministic added/changed/removed docs paths", async () => {
    await mkdir(path.join("docs", "chords"), { recursive: true });
    await mkdir(path.join("docs", "diagrams"), { recursive: true });
    await writeFile(path.join("docs", "chords", "a.md"), "new-chord", "utf8");
    await writeFile(path.join("docs", "diagrams", "v1.svg"), "<svg>new</svg>", "utf8");
    await writeFile(path.join("docs", "index.md"), "# Index", "utf8");

    const baselinePath = path.join("data", "generated", "docs-changelog-baseline.json");
    await mkdir(path.dirname(baselinePath), { recursive: true });
    await writeFile(
      baselinePath,
      `${JSON.stringify({
        version: 1,
        docsRoot: "docs",
        files: {
          "docs/chords/a.md": sha256("old-chord"),
          "docs/chords/removed.md": sha256("removed"),
          "docs/index.md": sha256("# Index"),
        },
      }, null, 2)}\n`,
      "utf8",
    );

    const report = await buildDocsChangelogSnapshot({
      docsRoot: "docs",
      baselinePath,
    });

    expect(report.baselineExists).toBe(true);
    expect(report.added).toEqual(["docs/diagrams/v1.svg"]);
    expect(report.changed).toEqual(["docs/chords/a.md"]);
    expect(report.removed).toEqual(["docs/chords/removed.md"]);
  });

  it("formats output consistently", async () => {
    await mkdir(path.join("docs", "chords"), { recursive: true });
    await writeFile(path.join("docs", "chords", "a.md"), "same", "utf8");

    const report = await buildDocsChangelogSnapshot({
      docsRoot: "docs",
      baselinePath: "missing-baseline.json",
    });

    const runA = formatDocsChangelogSnapshot(report);
    const runB = formatDocsChangelogSnapshot(report);
    expect(runA).toBe(runB);
    expect(runA).toContain("DOCS_CHANGELOG_SNAPSHOT");
    expect(runA).toContain("ADDED 1");
    expect(runA).toContain("+ docs/chords/a.md");
  });

  it("writes baseline and then reports no diffs for unchanged docs", async () => {
    await mkdir(path.join("docs", "chords"), { recursive: true });
    await writeFile(path.join("docs", "chords", "a.md"), "stable", "utf8");
    const baselinePath = path.join("data", "generated", "docs-changelog-baseline.json");

    const initial = await buildDocsChangelogSnapshot({
      docsRoot: "docs",
      baselinePath,
    });
    expect(initial.baselineExists).toBe(false);
    expect(initial.added.length).toBe(1);

    await writeDocsBaselineSnapshot(baselinePath, initial.currentSnapshot);

    const second = await buildDocsChangelogSnapshot({
      docsRoot: "docs",
      baselinePath,
    });
    expect(second.baselineExists).toBe(true);
    expect(second.added).toEqual([]);
    expect(second.changed).toEqual([]);
    expect(second.removed).toEqual([]);
  });
});
