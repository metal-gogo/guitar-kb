import { describe, expect, it } from "vitest";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { ROOT_ORDER, type IngestTarget } from "../../src/config.js";
import { ingestNormalizedChords, ingestNormalizedChordsWithTargets, selectIngestTargets } from "../../src/ingest/pipeline.js";
import type { SourceRegistryEntry } from "../../src/types/model.js";

describe("ingestNormalizedChords", () => {
  it("ingests the expanded core-quality set from cached sources", async () => {
    const chords = await ingestNormalizedChords({ refresh: false, delayMs: 0 });

    expect(chords.length).toBeGreaterThanOrEqual(68);

    const ids = new Set(chords.map((chord) => chord.id));
    const required = ["chord:C:maj", "chord:C:min", "chord:C:7", "chord:C:maj7"];
    for (const id of required) {
      expect(ids.has(id), `missing required canonical chord ${id}`).toBe(true);
    }

    const coreQualities = ["maj", "min", "7", "maj7"] as const;
    for (const root of ROOT_ORDER) {
      for (const quality of coreQualities) {
        expect(ids.has(`chord:${root}:${quality}`), `missing root-quality pair ${root}:${quality}`).toBe(true);
      }
    }
  });

  it("produces provenance for each chord and voicing", async () => {
    const chords = await ingestNormalizedChords({ refresh: false, delayMs: 0 });

    for (const chord of chords) {
      expect(chord.source_refs.length).toBeGreaterThan(0);
      for (const voicing of chord.voicings) {
        expect(voicing.source_refs?.length ?? 0).toBeGreaterThan(0);
      }
    }
  });

  it("supports dry-run ingestion from a registry-only third source", async () => {
    const originalCwd = process.cwd();
    const tempDir = await mkdtemp(path.join(os.tmpdir(), "gckb-registry-stub-"));

    try {
      process.chdir(tempDir);
      const cacheDir = path.join("data", "sources", "stub-third-source");
      await mkdir(cacheDir, { recursive: true });
      await writeFile(path.join(cacheDir, "c-major.html"), "<stub>fixture</stub>", "utf8");

      const stubSource: SourceRegistryEntry = {
        id: "stub-third-source",
        displayName: "Stub Third Source",
        baseUrl: "https://stub.example",
        cacheDir: "stub-third-source",
        parse: (_html: string, url: string) => ({
          source: "stub-third-source",
          url,
          symbol: "C",
          root: "C",
          quality_raw: "major",
          aliases: ["C major"],
          formula: ["1", "3", "5"],
          pitch_classes: ["C", "E", "G"],
          voicings: [
            {
              id: "stub-c-major-open",
              base_fret: 1,
              frets: [null, 3, 2, 0, 1, 0],
              fingers: [null, 3, 2, 0, 1, 0],
              source_refs: [{ source: "stub-third-source", url }],
            },
          ],
        }),
      };

      const chords = await ingestNormalizedChordsWithTargets(
        [{ source: "stub-third-source", slug: "c-major", url: "https://stub.example/c-major" }],
        [stubSource],
        { refresh: false, delayMs: 0, dryRun: true },
      );

      expect(chords).toHaveLength(0);
    } finally {
      process.chdir(originalCwd);
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it("filters ingest targets by source and chord", () => {
    const targets: IngestTarget[] = [
      { source: "guitar-chord-org", chordId: "chord:C:maj", slug: "c-major", url: "https://a.example/c-major" },
      { source: "all-guitar-chords", chordId: "chord:C:maj", slug: "c-major", url: "https://b.example/c-major" },
      { source: "all-guitar-chords", chordId: "chord:C:maj7", slug: "c-maj7", url: "https://b.example/c-maj7" },
    ];
    const registry: SourceRegistryEntry[] = [
      { id: "guitar-chord-org", displayName: "A", baseUrl: "https://a.example", cacheDir: "a", parse: () => { throw new Error("not used"); } },
      { id: "all-guitar-chords", displayName: "B", baseUrl: "https://b.example", cacheDir: "b", parse: () => { throw new Error("not used"); } },
    ];

    const selected = selectIngestTargets(targets, registry, {
      source: "all-guitar-chords",
      chord: "chord:C:maj",
      dryRun: true,
    });

    expect(selected).toHaveLength(1);
    expect(selected[0]?.source).toBe("all-guitar-chords");
    expect(selected[0]?.chordId).toBe("chord:C:maj");
  });

  it("throws for unknown source or empty filtered result", () => {
    const targets: IngestTarget[] = [
      { source: "guitar-chord-org", chordId: "chord:C:maj", slug: "c-major", url: "https://a.example/c-major" },
    ];
    const registry: SourceRegistryEntry[] = [
      { id: "guitar-chord-org", displayName: "A", baseUrl: "https://a.example", cacheDir: "a", parse: () => { throw new Error("not used"); } },
    ];

    expect(() => selectIngestTargets(targets, registry, { source: "missing-source" }))
      .toThrow("Unknown source: missing-source");

    expect(() => selectIngestTargets(targets, registry, { chord: "chord:Db:maj7" }))
      .toThrow("No ingest targets matched filters");
  });
});
