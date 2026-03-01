import { afterEach, describe, expect, it, vi } from "vitest";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import os from "node:os";
import path from "node:path";
import { FULL_MATRIX_TARGETS, MVP_TARGETS, ROOT_ORDER, type IngestTarget } from "../../src/config.js";
import {
  defaultIngestTargets,
  ingestNormalizedChords,
  ingestNormalizedChordsWithTargets,
  selectIngestTargets,
} from "../../src/ingest/pipeline.js";
import { buildParserConfidenceReport } from "../../src/ingest/parserConfidenceReport.js";
import type { ChordRecord, SourceRegistryEntry } from "../../src/types/model.js";

describe("ingestNormalizedChords", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("ingests the expanded core-quality set from cached sources", async () => {
    const chords = await ingestNormalizedChords({
      refresh: false,
      delayMs: 0,
      source: "guitar-chord-org",
    });

    expect(chords.length).toBeGreaterThanOrEqual(48);

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
    const chords = await ingestNormalizedChords({
      refresh: false,
      delayMs: 0,
      source: "guitar-chord-org",
    });

    for (const chord of chords) {
      expect(chord.source_refs.length).toBeGreaterThan(0);
      for (const voicing of chord.voicings) {
        expect(voicing.source_refs?.length ?? 0).toBeGreaterThan(0);
      }
    }
  });

  it("preserves authoritative A major voicing frets and base frets", async () => {
    const chords = await ingestNormalizedChords({
      refresh: false,
      delayMs: 0,
      source: "guitar-chord-org",
    });
    const aMajor = chords.find((chord) => chord.id === "chord:A:maj");

    expect(aMajor).toBeDefined();
    expect(aMajor?.voicings.map((voicing) => voicing.frets)).toEqual([
      [null, 0, 2, 2, 2, 0],
      [5, 7, 7, 6, 5, 5],
      [null, null, 2, 2, 2, 5],
    ]);
    expect(aMajor?.voicings.map((voicing) => voicing.base_fret)).toEqual([1, 5, 2]);
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
        capabilities: {
          roots: ["C"],
          qualities: ["maj"],
        },
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
      {
        id: "guitar-chord-org",
        displayName: "A",
        baseUrl: "https://a.example",
        cacheDir: "a",
        capabilities: { roots: ["C"], qualities: ["maj"] },
        parse: () => { throw new Error("not used"); },
      },
      {
        id: "all-guitar-chords",
        displayName: "B",
        baseUrl: "https://b.example",
        cacheDir: "b",
        capabilities: { roots: ["C"], qualities: ["maj"] },
        parse: () => { throw new Error("not used"); },
      },
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
      {
        id: "guitar-chord-org",
        displayName: "A",
        baseUrl: "https://a.example",
        cacheDir: "a",
        capabilities: { roots: ["C"], qualities: ["maj"] },
        parse: () => { throw new Error("not used"); },
      },
    ];

    expect(() => selectIngestTargets(targets, registry, { source: "missing-source" }))
      .toThrow("Unknown source: missing-source");

    expect(() => selectIngestTargets(targets, registry, { chord: "chord:Db:maj7" }))
      .toThrow("No ingest targets matched filters");
  });

  it("uses expanded defined-quality target generation for dry-run mode", () => {
    expect(defaultIngestTargets({ dryRun: true })).toEqual(FULL_MATRIX_TARGETS);
    expect(defaultIngestTargets({ dryRun: false })).toEqual(FULL_MATRIX_TARGETS);
    expect(defaultIngestTargets()).toEqual(FULL_MATRIX_TARGETS);
  });

  it("keeps existing core-quality targets byte-stable", () => {
    const coreFromFull = FULL_MATRIX_TARGETS.filter((target) => {
      const quality = target.chordId.split(":")[2];
      return quality === "maj" || quality === "min" || quality === "7" || quality === "maj7";
    });

    expect(coreFromFull).toEqual(MVP_TARGETS);

    const serializedMvpTargets = JSON.stringify(MVP_TARGETS);
    const mvpDigest = createHash("sha256").update(serializedMvpTargets).digest("hex");

    expect(mvpDigest).toBe("a499e124157902a7167bbc17dc283a7b3af3e1e6cbbafd5631a2bd37cf55c1b2");
  });

  it("reports deterministic SKIP_UNSUPPORTED diagnostics in dry-run mode", async () => {
    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    const targets = [
      {
        source: "stub-source",
        chordId: "chord:C:maj",
        slug: "c-major",
        url: "https://stub.example/c-major",
      },
      {
        source: "stub-source",
        chordId: "chord:C:min7",
        slug: "c-min7",
        url: "https://stub.example/c-min7",
      },
    ];
    const registry: SourceRegistryEntry[] = [
      {
        id: "stub-source",
        displayName: "Stub Source",
        baseUrl: "https://stub.example",
        cacheDir: "stub-source",
        capabilities: { roots: ["C"], qualities: ["maj"] },
        parse: () => { throw new Error("not used"); },
      },
    ];

    await expect(ingestNormalizedChordsWithTargets(targets, registry, { dryRun: true, delayMs: 0 }))
      .resolves.toEqual([]);

    const output = writeSpy.mock.calls.map(([line]) => String(line)).join("");
    expect(output).toContain("Dry run: would process 1 ingest targets (skipped unsupported: 1)");
    expect(output).toContain("SKIP_UNSUPPORTED source=stub-source chord=chord:C:min7 slug=c-min7 reason=unsupported_quality");
    expect(output).toContain("GAP_UNRESOLVED chord=chord:C:min7 unsupported_sources=stub-source");
  });

  it("fails strict capability mode when unresolved required gaps remain", async () => {
    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    const targets = [
      {
        source: "stub-source",
        chordId: "chord:C:min7",
        slug: "c-min7",
        url: "https://stub.example/c-min7",
      },
    ];
    const registry: SourceRegistryEntry[] = [
      {
        id: "stub-source",
        displayName: "Stub Source",
        baseUrl: "https://stub.example",
        cacheDir: "stub-source",
        capabilities: { roots: ["C"], qualities: ["maj"] },
        parse: () => { throw new Error("not used"); },
      },
    ];

    await expect(ingestNormalizedChordsWithTargets(targets, registry, {
      dryRun: true,
      strictCapabilities: true,
      delayMs: 0,
    })).rejects.toThrow("Strict capability mode enabled, unresolved required gaps:");

    const output = writeSpy.mock.calls.map(([line]) => String(line)).join("");
    expect(output).toContain("GAP_UNRESOLVED chord=chord:C:min7 unsupported_sources=stub-source");
  });

  it("surfaces allowlisted gaps deterministically and passes strict mode", async () => {
    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    const targets = [
      {
        source: "stub-source",
        chordId: "chord:C:min7",
        slug: "c-min7",
        url: "https://stub.example/c-min7",
      },
    ];
    const registry: SourceRegistryEntry[] = [
      {
        id: "stub-source",
        displayName: "Stub Source",
        baseUrl: "https://stub.example",
        cacheDir: "stub-source",
        capabilities: { roots: ["C"], qualities: ["maj"] },
        parse: () => { throw new Error("not used"); },
      },
    ];

    await expect(ingestNormalizedChordsWithTargets(targets, registry, {
      dryRun: true,
      strictCapabilities: true,
      capabilityAllowlist: ["chord:C:min7"],
      delayMs: 0,
    })).resolves.toEqual([]);

    const output = writeSpy.mock.calls.map(([line]) => String(line)).join("");
    expect(output).toContain("GAP_ALLOWLISTED chord=chord:C:min7 unsupported_sources=stub-source");
    expect(output).not.toContain("GAP_UNRESOLVED chord=chord:C:min7");
  });

  it("builds deterministic parser confidence summaries grouped by source and quality", () => {
    const chords: ChordRecord[] = [
      {
        id: "chord:D:min7",
        root: "D",
        quality: "min7",
        aliases: [],
        formula: ["1", "b3", "5", "b7"],
        pitch_classes: ["D", "F", "A", "C"],
        voicings: [],
        parser_confidence: [
          { source: "source-b", level: "medium", checks: ["has_formula"] },
          { source: "source-a", level: "high", checks: ["all_voicings_complete"] },
        ],
        source_refs: [{ source: "fixture", url: "https://example.test/d-min7" }],
      },
      {
        id: "chord:C:maj",
        root: "C",
        quality: "maj",
        aliases: [],
        formula: ["1", "3", "5"],
        pitch_classes: ["C", "E", "G"],
        voicings: [],
        parser_confidence: [
          { source: "source-a", level: "low", checks: ["missing_voicings"] },
        ],
        source_refs: [{ source: "fixture", url: "https://example.test/c-major" }],
      },
      {
        id: "chord:A:dim",
        root: "A",
        quality: "dim",
        aliases: [],
        formula: ["1", "b3", "b5"],
        pitch_classes: ["A", "C", "Eb"],
        voicings: [],
        source_refs: [{ source: "fixture", url: "https://example.test/a-dim" }],
      },
    ];

    const report = buildParserConfidenceReport(chords);
    const reversedReport = buildParserConfidenceReport([...chords].reverse());

    expect(reversedReport).toEqual(report);
    expect(report).toEqual({
      totalChords: 3,
      chordsWithConfidence: 2,
      chordsWithoutConfidence: ["chord:A:dim"],
      annotations: 3,
      levels: { high: 1, medium: 1, low: 1 },
      sources: [
        {
          source: "source-a",
          chords: 2,
          annotations: 2,
          levels: { high: 1, medium: 0, low: 1 },
          qualities: [
            {
              quality: "maj",
              chords: 1,
              annotations: 1,
              levels: { high: 0, medium: 0, low: 1 },
            },
            {
              quality: "min7",
              chords: 1,
              annotations: 1,
              levels: { high: 1, medium: 0, low: 0 },
            },
          ],
        },
        {
          source: "source-b",
          chords: 1,
          annotations: 1,
          levels: { high: 0, medium: 1, low: 0 },
          qualities: [
            {
              quality: "min7",
              chords: 1,
              annotations: 1,
              levels: { high: 0, medium: 1, low: 0 },
            },
          ],
        },
      ],
      qualities: [
        {
          quality: "maj",
          chords: 1,
          annotations: 1,
          levels: { high: 0, medium: 0, low: 1 },
        },
        {
          quality: "min7",
          chords: 1,
          annotations: 2,
          levels: { high: 1, medium: 1, low: 0 },
        },
      ],
    });
  });
});
