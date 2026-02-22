import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PROJECT_USER_AGENT } from "../../src/config.js";
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

  it("throws an error with HTTP status code when fetch response is not ok", async () => {
    tempDir = await mkdtemp(path.join(os.tmpdir(), "gckb-cache-error-"));
    process.chdir(tempDir);

    const fetchMock = vi.fn(async () => ({
      ok: false,
      status: 404,
      statusText: "Not Found",
      text: async () => "",
    }));
    vi.stubGlobal("fetch", fetchMock);

    const promise = getCachedHtml("test-source", "C Major", "https://example.com/c-major", {
      refresh: true,
      delayMs: 0,
    });

    await expect(promise).rejects.toThrow(/404/);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("bypasses existing cache and refreshes html when refresh is true", async () => {
    tempDir = await mkdtemp(path.join(os.tmpdir(), "gckb-cache-refresh-"));
    process.chdir(tempDir);

    const cachePath = path.join("data", "sources", "test-source", "c-major.html");
    await mkdir(path.dirname(cachePath), { recursive: true });
    await writeFile(cachePath, "stale-html", "utf8");

    const fetchMock = vi.fn(async () => ({
      ok: true,
      text: async () => "fresh-html",
    }));
    vi.stubGlobal("fetch", fetchMock);

    const html = await getCachedHtml("test-source", "C Major", "https://example.com/c-major", {
      refresh: true,
      delayMs: 0,
    });

    const persistedContent = await readFile(cachePath, "utf8");

    expect(html).toBe("fresh-html");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(persistedContent).toBe("fresh-html");
  });

  it("sends project user-agent header on network fetch", async () => {
    tempDir = await mkdtemp(path.join(os.tmpdir(), "gckb-cache-ua-"));
    process.chdir(tempDir);

    const fetchMock = vi.fn(async () => ({
      ok: true,
      text: async () => "fresh-html",
    }));
    vi.stubGlobal("fetch", fetchMock);

    await getCachedHtml("test-source", "C Major", "https://example.com/c-major", {
      refresh: true,
      delayMs: 0,
    });

    expect(fetchMock).toHaveBeenCalledWith("https://example.com/c-major", {
      headers: { "User-Agent": PROJECT_USER_AGENT },
    });
  });

  it("retries fetch and succeeds on a later attempt", async () => {
    tempDir = await mkdtemp(path.join(os.tmpdir(), "gckb-cache-retry-success-"));
    process.chdir(tempDir);

    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new Error("temporary network error"))
      .mockResolvedValueOnce({
        ok: true,
        text: async () => "fresh-html",
      });
    vi.stubGlobal("fetch", fetchMock);

    const html = await getCachedHtml("test-source", "C Major", "https://example.com/c-major", {
      refresh: true,
      delayMs: 0,
    });

    expect(html).toBe("fresh-html");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("throws after all retry attempts are exhausted", async () => {
    tempDir = await mkdtemp(path.join(os.tmpdir(), "gckb-cache-retry-fail-"));
    process.chdir(tempDir);

    const fetchMock = vi.fn(async () => {
      throw new Error("permanent network error");
    });
    vi.stubGlobal("fetch", fetchMock);

    const promise = getCachedHtml("test-source", "C Major", "https://example.com/c-major", {
      refresh: true,
      delayMs: 0,
    });

    await expect(promise).rejects.toThrow("permanent network error");
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});
