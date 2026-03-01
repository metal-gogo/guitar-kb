import { describe, expect, it, vi } from "vitest";

vi.mock("../../src/config.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../src/config.js")>();
  return {
    ...actual,
    FULL_MATRIX_TARGETS: [
      {
        source: "all-guitar-chords",
        chordId: "chord:Db:maj",
        slug: "d-flat-major",
        url: "https://example.test/all/db-major",
      },
      {
        source: "all-guitar-chords",
        chordId: "chord:Db:dim7",
        slug: "d-flat-dim7",
        url: "https://example.test/all/db-dim7",
      },
      {
        source: "guitar-chord-org",
        chordId: "chord:C:maj",
        slug: "c-major",
        url: "https://example.test/gco/c-major",
      },
      {
        source: "guitar-chord-org",
        chordId: "chord:Db:maj",
        slug: "d-flat-major",
        url: "https://example.test/gco/db-major",
      },
    ],
  };
});

vi.mock("../../src/ingest/sourceRegistry.js", () => ({
  SOURCE_REGISTRY: [
    {
      id: "all-guitar-chords",
      capabilities: {
        roots: ["Db"],
        qualities: ["maj"],
      },
    },
    {
      id: "guitar-chord-org",
      capabilities: {
        roots: ["C", "Db"],
        qualities: ["maj"],
      },
    },
  ],
}));

describe("expectedCacheKeys", () => {
  it("uses capability-filtered full-matrix targets and includes deterministic sharp aliases", async () => {
    const { expectedCacheKeys } = await import("../../src/ingest/cacheTargets.js");

    expect(expectedCacheKeys()).toEqual([
      { source: "all-guitar-chords", slug: "c-sharp-major" },
      { source: "all-guitar-chords", slug: "d-flat-major" },
      { source: "guitar-chord-org", slug: "c-major" },
      { source: "guitar-chord-org", slug: "c-sharp-major" },
      { source: "guitar-chord-org", slug: "d-flat-major" },
    ]);
  });
});
