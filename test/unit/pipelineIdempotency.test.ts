/**
 * Pipeline idempotency tests across refresh modes (issue #110).
 *
 * Verifies that:
 *   1. Running the pipeline with refresh=false twice produces identical records.
 *   2. Running with refresh=true (fresh fetch that returns the same HTML) and
 *      refresh=false both produce identical normalized records.
 *   3. Failure messages identify divergent record IDs when they differ.
 */
import { mkdir, mkdtemp, rm, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ingestNormalizedChordsWithTargets } from "../../src/ingest/pipeline.js";
import { parseGuitarChordOrg } from "../../src/ingest/parsers/guitarChordOrg.js";
import { parseAllGuitarChords } from "../../src/ingest/parsers/allGuitarChords.js";
import type { ChordRecord, SourceRegistryEntry } from "../../src/types/model.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const FIXTURE_SLUGS = ["c-major", "cmaj7"] as const;

const SOURCE_REGISTRY_STUB: ReadonlyArray<SourceRegistryEntry> = [
  {
    id: "guitar-chord-org",
    displayName: "Guitar Chord Org",
    baseUrl: "https://www.guitar-chord.org",
    cacheDir: "guitar-chord-org",
    parse: parseGuitarChordOrg,
  },
  {
    id: "all-guitar-chords",
    displayName: "All Guitar Chords",
    baseUrl: "https://www.all-guitar-chords.com",
    cacheDir: "all-guitar-chords",
    parse: parseAllGuitarChords,
  },
];

const TARGETS = [
  { source: "guitar-chord-org", slug: "c-major", url: "https://www.guitar-chord.org/c-maj.html" },
  { source: "guitar-chord-org", slug: "cmaj7", url: "https://www.guitar-chord.org/c-maj7.html" },
  { source: "all-guitar-chords", slug: "c-major", url: "https://www.all-guitar-chords.com/chords/index/c/major" },
  { source: "all-guitar-chords", slug: "cmaj7", url: "https://www.all-guitar-chords.com/chords/index/c/major-7th" },
];

function stableStringify(records: ChordRecord[]): string {
  return JSON.stringify(records.map((r) => r.id).sort());
}

// ---------------------------------------------------------------------------
// Fixture management
// ---------------------------------------------------------------------------

let tempDir = "";
const originalCwd = process.cwd();

async function seedCacheFromData(destRoot: string): Promise<void> {
  // Copy the real fixture HTML files from data/sources/ into the temp dir
  const srcRoot = path.join(originalCwd, "data", "sources");
  for (const source of ["guitar-chord-org", "all-guitar-chords"] as const) {
    const destDir = path.join(destRoot, "data", "sources", source);
    await mkdir(destDir, { recursive: true });
    for (const slug of FIXTURE_SLUGS) {
      const html = await readFile(path.join(srcRoot, source, `${slug}.html`), "utf8");
      await writeFile(path.join(destDir, `${slug}.html`), html, "utf8");
    }
  }
}

beforeEach(async () => {
  tempDir = await mkdtemp(path.join(os.tmpdir(), "gckb-idempotency-"));
  await seedCacheFromData(tempDir);
  process.chdir(tempDir);
});

afterEach(async () => {
  vi.restoreAllMocks();
  process.chdir(originalCwd);
  if (tempDir) {
    await rm(tempDir, { recursive: true, force: true });
    tempDir = "";
  }
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("pipeline idempotency across refresh modes", () => {
  it("refresh=false produces identical records on repeated runs", async () => {
    const runA = await ingestNormalizedChordsWithTargets(TARGETS, SOURCE_REGISTRY_STUB, {
      refresh: false,
      delayMs: 0,
    });
    const runB = await ingestNormalizedChordsWithTargets(TARGETS, SOURCE_REGISTRY_STUB, {
      refresh: false,
      delayMs: 0,
    });

    expect(runA.length).toBe(runB.length);

    const uniqueIds = new Set(runA.map((r) => r.id));
    const divergent = runB
      .filter((r) => !uniqueIds.has(r.id) || JSON.stringify(r) !== JSON.stringify(runA.find((a) => a.id === r.id)))
      .map((r) => r.id);

    expect(divergent, `Divergent record IDs: ${divergent.join(", ")}`).toHaveLength(0);
    expect(JSON.stringify(runA)).toBe(JSON.stringify(runB));
  });

  it("refresh=true with same HTML produces identical records as refresh=false", async () => {
    // Run with refresh=false to establish the baseline
    const cachedRecords = await ingestNormalizedChordsWithTargets(TARGETS, SOURCE_REGISTRY_STUB, {
      refresh: false,
      delayMs: 0,
    });

    // Mock global.fetch to return the same HTML content that's already in cache
    // This simulates a network refresh that returns identical content
    vi.stubGlobal("fetch", async (url: string) => {
      // Identify the slug from the URL being fetched
      let source = "";
      let slugFile = "";

      if (url.includes("guitar-chord.org")) {
        source = "guitar-chord-org";
        slugFile = url.endsWith("c-maj7.html") ? "cmaj7.html" : "c-major.html";
      } else if (url.includes("all-guitar-chords")) {
        source = "all-guitar-chords";
        slugFile = url.includes("major-7th") ? "cmaj7.html" : "c-major.html";
      } else {
        throw new Error(`Unexpected fetch URL in test: ${url}`);
      }

      const html = await readFile(
        path.join(originalCwd, "data", "sources", source, slugFile),
        "utf8",
      );

      return new Response(html, { status: 200 });
    });

    // Run with refresh=true — fetch returns same HTML so output must match
    const refreshedRecords = await ingestNormalizedChordsWithTargets(TARGETS, SOURCE_REGISTRY_STUB, {
      refresh: true,
      delayMs: 0,
    });

    expect(refreshedRecords.length).toBe(cachedRecords.length);

    const divergent = refreshedRecords
      .filter((r) => {
        const cached = cachedRecords.find((c) => c.id === r.id);
        return !cached || JSON.stringify(r) !== JSON.stringify(cached);
      })
      .map((r) => r.id);

    expect(divergent, `Divergent record IDs after refresh: ${divergent.join(", ")}`).toHaveLength(0);
    expect(JSON.stringify(refreshedRecords)).toBe(JSON.stringify(cachedRecords));
  });

  it("canonical IDs are stable across refresh modes", async () => {
    const cachedRecords = await ingestNormalizedChordsWithTargets(TARGETS, SOURCE_REGISTRY_STUB, {
      refresh: false,
      delayMs: 0,
    });

    vi.stubGlobal("fetch", async (url: string) => {
      let source = "";
      let slugFile = "";
      if (url.includes("guitar-chord.org")) {
        source = "guitar-chord-org";
        slugFile = url.endsWith("c-maj7.html") ? "cmaj7.html" : "c-major.html";
      } else if (url.includes("all-guitar-chords")) {
        source = "all-guitar-chords";
        slugFile = url.includes("major-7th") ? "cmaj7.html" : "c-major.html";
      } else {
        throw new Error(`Unexpected fetch URL: ${url}`);
      }
      const html = await readFile(path.join(originalCwd, "data", "sources", source, slugFile), "utf8");
      return new Response(html, { status: 200 });
    });

    const refreshedRecords = await ingestNormalizedChordsWithTargets(TARGETS, SOURCE_REGISTRY_STUB, {
      refresh: true,
      delayMs: 0,
    });

    const cachedIds = new Set(cachedRecords.map((r) => r.id));
    const refreshedIds = new Set(refreshedRecords.map((r) => r.id));

    // All cached IDs must remain after refresh
    for (const id of cachedIds) {
      expect(refreshedIds.has(id), `Cached record ${id} missing after refresh`).toBe(true);
    }

    // All refreshed IDs must have been in cache
    for (const id of refreshedIds) {
      expect(cachedIds.has(id), `New record ${id} appeared after refresh (non-deterministic)`).toBe(true);
    }

    // Stable ordering test
    expect(stableStringify(cachedRecords)).toBe(stableStringify(refreshedRecords));
  });
});
