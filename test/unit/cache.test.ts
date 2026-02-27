import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PROJECT_USER_AGENT } from "../../src/config.js";
import type { RetryLogEvent } from "../../src/ingest/fetch/cache.js";
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

    const noopLogger = vi.fn();
    const promise = getCachedHtml("test-source", "C Major", "https://example.com/c-major", {
      refresh: true,
      delayMs: 0,
    }, noopLogger);

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

    const noopLogger = vi.fn();
    const html = await getCachedHtml("test-source", "C Major", "https://example.com/c-major", {
      refresh: true,
      delayMs: 0,
    }, noopLogger);

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

    const noopLogger = vi.fn();
    const promise = getCachedHtml("test-source", "C Major", "https://example.com/c-major", {
      refresh: true,
      delayMs: 0,
    }, noopLogger);

    await expect(promise).rejects.toThrow("permanent network error");
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});

describe("retry telemetry", () => {
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

  it("emits a retry event for each failed attempt before the last", async () => {
    tempDir = await mkdtemp(path.join(os.tmpdir(), "gckb-telemetry-retry-"));
    process.chdir(tempDir);

    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new Error("err1"))
      .mockRejectedValueOnce(new Error("err2"))
      .mockResolvedValueOnce({ ok: true, text: async () => "ok" });
    vi.stubGlobal("fetch", fetchMock);

    const events: RetryLogEvent[] = [];
    await getCachedHtml("my-source", "slug", "https://example.com/slug", {
      refresh: true,
      delayMs: 0,
    }, (e) => { events.push(e); });

    expect(events).toHaveLength(2);
    expect(events[0]).toMatchObject({
      type: "retry",
      source: "my-source",
      url: "https://example.com/slug",
      attempt: 1,
      maxAttempts: 3,
      error: "err1",
    });
    expect(events[1]).toMatchObject({
      type: "retry",
      source: "my-source",
      url: "https://example.com/slug",
      attempt: 2,
      maxAttempts: 3,
      error: "err2",
    });
  });

  it("does not emit retry events when fetch succeeds on the first attempt", async () => {
    tempDir = await mkdtemp(path.join(os.tmpdir(), "gckb-telemetry-no-retry-"));
    process.chdir(tempDir);

    const fetchMock = vi.fn(async () => ({ ok: true, text: async () => "ok" }));
    vi.stubGlobal("fetch", fetchMock);

    const events: RetryLogEvent[] = [];
    await getCachedHtml("src", "slug", "https://example.com/slug", {
      refresh: true,
      delayMs: 0,
    }, (e) => { events.push(e); });

    expect(events).toHaveLength(0);
  });

  it("does not emit retry events for cache hits (no network call)", async () => {
    tempDir = await mkdtemp(path.join(os.tmpdir(), "gckb-telemetry-cache-hit-"));
    process.chdir(tempDir);

    const cachePath = path.join("data", "sources", "src", "slug.html");
    await mkdir(path.dirname(cachePath), { recursive: true });
    await writeFile(cachePath, "cached", "utf8");

    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const events: RetryLogEvent[] = [];
    await getCachedHtml("src", "slug", "https://example.com/slug", {
      refresh: false,
      delayMs: 0,
    }, (e) => { events.push(e); });

    expect(fetchMock).not.toHaveBeenCalled();
    expect(events).toHaveLength(0);
  });

  it("retry event delay is proportional to attempt number", async () => {
    tempDir = await mkdtemp(path.join(os.tmpdir(), "gckb-telemetry-delay-"));
    process.chdir(tempDir);

    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new Error("e1"))
      .mockResolvedValueOnce({ ok: true, text: async () => "ok" });
    vi.stubGlobal("fetch", fetchMock);

    const events: RetryLogEvent[] = [];
    await getCachedHtml("src", "slug", "https://example.com/slug", {
      refresh: true,
      delayMs: 100,
    }, (e) => { events.push(e); });

    // First retry: delay = 100ms * (0+1) = 100ms
    expect(events[0]!.delayMs).toBe(100);
  });

  it("retry event fields have stable, deterministic key order", async () => {
    tempDir = await mkdtemp(path.join(os.tmpdir(), "gckb-telemetry-order-"));
    process.chdir(tempDir);

    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new Error("boom"))
      .mockResolvedValueOnce({ ok: true, text: async () => "ok" });
    vi.stubGlobal("fetch", fetchMock);

    const events: RetryLogEvent[] = [];
    await getCachedHtml("src", "slug", "https://example.com/slug", {
      refresh: true,
      delayMs: 0,
    }, (e) => { events.push(e); });

    const keys = Object.keys(events[0]!);
    // All expected fields present, in declaration order
    expect(keys).toEqual(["type", "source", "url", "attempt", "maxAttempts", "delayMs", "error"]);
  });
});
