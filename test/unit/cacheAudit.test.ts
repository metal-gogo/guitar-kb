import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { auditCache } from "../../src/ingest/cacheAudit.js";

// Stub MVP_TARGETS so we control exactly which files are expected
vi.mock("../../src/config.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../src/config.js")>();
  return {
    ...actual,
    MVP_TARGETS: [
      { source: "guitar-chord-org", slug: "c-major",   chordId: "chord:C:maj", url: "" },
      { source: "guitar-chord-org", slug: "c-minor",   chordId: "chord:C:min", url: "" },
      { source: "all-guitar-chords", slug: "c-major",  chordId: "chord:C:maj", url: "" },
    ],
  };
});

describe("auditCache", () => {
  let tempDir = "";
  const originalCwd = process.cwd();

  beforeEach(async () => {
    tempDir = await mkdtemp(path.join(os.tmpdir(), "gckb-audit-"));
    process.chdir(tempDir);
  });

  afterEach(async () => {
    process.chdir(originalCwd);
    if (tempDir) {
      await rm(tempDir, { recursive: true, force: true });
      tempDir = "";
    }
  });

  it("reports all entries as missing when cache dir is empty", async () => {
    const result = await auditCache(path.join(tempDir, "data", "sources"));
    expect(result.totalExpected).toBe(3);
    expect(result.missingCount).toBe(3);
    expect(result.okCount).toBe(0);
    expect(result.corruptCount).toBe(0);
    expect(result.entries.every((e) => e.status === "missing")).toBe(true);
  });

  it("reports ok for a valid HTML file and records a checksum", async () => {
    const cacheBase = path.join(tempDir, "data", "sources");
    await mkdir(path.join(cacheBase, "guitar-chord-org"), { recursive: true });
    await writeFile(
      path.join(cacheBase, "guitar-chord-org", "c-major.html"),
      "<html><head></head><body>C major chord content here</body></html>",
      "utf8",
    );

    const result = await auditCache(cacheBase);
    const entry = result.entries.find((e) => e.source === "guitar-chord-org" && e.slug === "c-major");
    expect(entry?.status).toBe("ok");
    expect(entry?.checksum).toMatch(/^[a-f0-9]{64}$/);
  });

  it("reports corrupt for a file that is too small", async () => {
    const cacheBase = path.join(tempDir, "data", "sources");
    await mkdir(path.join(cacheBase, "guitar-chord-org"), { recursive: true });
    await writeFile(
      path.join(cacheBase, "guitar-chord-org", "c-major.html"),
      "<html></html>", // < 64 bytes
      "utf8",
    );

    const result = await auditCache(cacheBase);
    const entry = result.entries.find((e) => e.source === "guitar-chord-org" && e.slug === "c-major");
    expect(entry?.status).toBe("corrupt");
    expect(entry?.checksum).toBeDefined();
  });

  it("returns deterministic checksum identical to independent sha256 computation", async () => {
    const cacheBase = path.join(tempDir, "data", "sources");
    await mkdir(path.join(cacheBase, "all-guitar-chords"), { recursive: true });
    const content = "<html><body>All guitar chords — C major extended content for this test case</body></html>";
    const filePath = path.join(cacheBase, "all-guitar-chords", "c-major.html");
    await writeFile(filePath, content, "utf8");

    const result = await auditCache(cacheBase);
    const entry = result.entries.find((e) => e.source === "all-guitar-chords" && e.slug === "c-major");

    const expected = createHash("sha256").update(Buffer.from(content, "utf8")).digest("hex");
    expect(entry?.checksum).toBe(expected);
  });

  it("returns entries sorted deterministically: source asc, slug asc", async () => {
    const result = await auditCache(path.join(tempDir, "data", "sources"));
    const sources = result.entries.map((e) => e.source);
    // all-guitar-chords sorts before guitar-chord-org
    expect(sources[0]).toBe("all-guitar-chords");
    // guitar-chord-org entries are sorted by slug
    const gcEntries = result.entries.filter((e) => e.source === "guitar-chord-org");
    expect(gcEntries[0].slug).toBe("c-major");
    expect(gcEntries[1].slug).toBe("c-minor");
  });

  it("counts ok/missing/corrupt correctly in mixed scenario", async () => {
    const cacheBase = path.join(tempDir, "data", "sources");
    await mkdir(path.join(cacheBase, "guitar-chord-org"), { recursive: true });
    // ok
    await writeFile(
      path.join(cacheBase, "guitar-chord-org", "c-major.html"),
      "<html><head></head><body>C major chord — plenty of content here</body></html>",
      "utf8",
    );
    // corrupt (tiny)
    await writeFile(
      path.join(cacheBase, "guitar-chord-org", "c-minor.html"),
      "x",
      "utf8",
    );
    // all-guitar-chords/c-major.html: missing (no file written)

    const result = await auditCache(cacheBase);
    expect(result.okCount).toBe(1);
    expect(result.corruptCount).toBe(1);
    expect(result.missingCount).toBe(1);
  });
});
