import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getCachedHtml } from "../../src/ingest/fetch/cache.js";

describe("getCachedHtml", () => {
  const originalCwd = process.cwd();
  let tempDir = "";

  afterEach(async () => {
    vi.unstubAllGlobals();
    process.chdir(originalCwd);
    if (tempDir) {
      await rm(tempDir, { recursive: true, force: true });
      tempDir = "";
    }
  });

  it("reads cached html in default mode and skips network", async () => {
    tempDir = await mkdtemp(path.join(os.tmpdir(), "gckb-cache-hit-"));
    process.chdir(tempDir);

    const cachePath = path.join("data", "sources", "test-source", "c-major.html");
    await mkdir(path.dirname(cachePath), { recursive: true });
    await writeFile(cachePath, "cached-html", "utf8");

    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const html = await getCachedHtml("test-source", "C Major", "https://example.com/c-major", {
      refresh: false,
      delayMs: 0,
    });

    expect(html).toBe("cached-html");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("maps slug to deterministic cache path and writes fetched html on miss", async () => {
    tempDir = await mkdtemp(path.join(os.tmpdir(), "gckb-cache-miss-"));
    process.chdir(tempDir);

    const fetchMock = vi.fn(async () => ({
      ok: true,
      text: async () => "fresh-html",
    }));
    vi.stubGlobal("fetch", fetchMock);

    const html = await getCachedHtml("test-source", "C MAJOR", "https://example.com/c-major", {
      refresh: false,
      delayMs: 0,
    });

    expect(html).toBe("fresh-html");
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const persisted = path.join(tempDir, "data", "sources", "test-source", "c-major.html");
    const roundTrip = await getCachedHtml("test-source", "C MAJOR", "https://example.com/c-major", {
      refresh: false,
      delayMs: 0,
    });

    const persistedContent = await readFile(persisted, "utf8");

    expect(roundTrip).toBe("fresh-html");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(persistedContent).toBe("fresh-html");
  });
});
