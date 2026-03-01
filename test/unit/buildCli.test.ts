import { describe, expect, it } from "vitest";
import {
  cacheFailureMessage,
  filterBuildChords,
  shouldEnforceCacheCompletenessPolicy,
  shouldWriteCacheManifest,
} from "../../src/cli/build.js";
import type { ChordRecord } from "../../src/types/model.js";

function chord(overrides: Partial<ChordRecord>): ChordRecord {
  return {
    id: "chord:C:maj",
    root: "C",
    quality: "maj",
    aliases: ["C"],
    formula: ["1", "3", "5"],
    pitch_classes: ["C", "E", "G"],
    voicings: [{ id: "v1", frets: [null, 3, 2, 0, 1, 0], base_fret: 1, source_refs: [{ source: "unit", url: "https://example.com/v1" }] }],
    source_refs: [{ source: "guitar-chord-org", url: "https://example.com/c" }],
    ...overrides,
  };
}

describe("filterBuildChords", () => {
  it("supports slug-style chord filtering via target slug mapping", () => {
    const chords: ChordRecord[] = [
      chord({ id: "chord:D:min", root: "D", quality: "min" }),
      chord({ id: "chord:C:maj", root: "C", quality: "maj" }),
    ];

    const filtered = filterBuildChords(chords, { chord: "d-minor", source: undefined, dryRun: false });
    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.id).toBe("chord:D:min");
  });

  it("supports extended-quality slug filtering via full-matrix targets", () => {
    const chords: ChordRecord[] = [
      chord({ id: "chord:C:dim7", root: "C", quality: "dim7" }),
      chord({ id: "chord:C:maj", root: "C", quality: "maj" }),
    ];

    const filtered = filterBuildChords(chords, { chord: "c-dim7", source: undefined, dryRun: false });
    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.id).toBe("chord:C:dim7");
  });

  it("throws a clear error for unknown source id", () => {
    const chords: ChordRecord[] = [chord({})];

    expect(() => filterBuildChords(chords, { source: "guitarr-chord-org", chord: undefined, dryRun: false }))
      .toThrow("Unknown source: guitarr-chord-org");
  });

  it("enforces cache completeness policy only for full build mode", () => {
    expect(shouldEnforceCacheCompletenessPolicy({ dryRun: false })).toBe(true);
    expect(shouldEnforceCacheCompletenessPolicy({ dryRun: false, chord: "chord:C:maj" })).toBe(false);
    expect(shouldEnforceCacheCompletenessPolicy({ dryRun: false, source: "guitar-chord-org" })).toBe(false);
  });

  it("writes cache manifest only for non-dry full builds", () => {
    expect(shouldWriteCacheManifest({ dryRun: false })).toBe(true);
    expect(shouldWriteCacheManifest({ dryRun: true })).toBe(false);
    expect(shouldWriteCacheManifest({ dryRun: false, chord: "chord:C:maj" })).toBe(false);
    expect(shouldWriteCacheManifest({ dryRun: false, source: "guitar-chord-org" })).toBe(false);
  });

  it("formats deterministic cache policy failure messages with remediation guidance", () => {
    const message = cacheFailureMessage(
      [
        { source: "all-guitar-chords", slug: "c-major" },
        { source: "guitar-chord-org", slug: "d-major" },
      ],
      [{ source: "all-guitar-chords", slug: "e-major" }],
    );

    expect(message).toContain("Cache completeness policy failed");
    expect(message).toContain("Missing=2 Corrupt=1");
    expect(message).toContain("all-guitar-chords/c-major.html (missing)");
    expect(message).toContain("all-guitar-chords/e-major.html (corrupt)");
    expect(message).toContain("npm run ingest:full-refresh");
  });
});
