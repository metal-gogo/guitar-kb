import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import type { ChordRecord, RawChordRecord, SourceRegistryEntry } from "../../src/types/model.js";
import { ingestNormalizedChordsWithTargets } from "../../src/ingest/pipeline.js";
import { siteChordHtml, siteIndexHtml } from "../../src/build/site/generateSite.js";

const originalCwd = process.cwd();

let tempDir = "";

beforeEach(async () => {
  tempDir = await mkdtemp(path.join(os.tmpdir(), "gckb-wave-e-regression-"));
  process.chdir(tempDir);

  await mkdir(path.join("data", "sources", "all-guitar-chords"), { recursive: true });
  await mkdir(path.join("data", "sources", "guitar-chord-org"), { recursive: true });
  await writeFile(path.join("data", "sources", "all-guitar-chords", "c-major.html"), "<html>all</html>", "utf8");
  await writeFile(path.join("data", "sources", "guitar-chord-org", "c-major.html"), "<html>org</html>", "utf8");
});

afterEach(async () => {
  process.chdir(originalCwd);
  await rm(tempDir, { recursive: true, force: true });
  tempDir = "";
});

function makeSource(
  id: "all-guitar-chords" | "guitar-chord-org",
  parse: (html: string, url: string) => RawChordRecord,
): SourceRegistryEntry {
  return {
    id,
    displayName: id,
    baseUrl: `https://${id}.example`,
    cacheDir: id,
    capabilities: { roots: ["C"], qualities: ["maj"] },
    parse,
  };
}

function buildChord(overrides: Partial<ChordRecord>): ChordRecord {
  return {
    id: "chord:C:maj",
    root: "C",
    canonical_root: "C",
    root_aliases: ["C"],
    root_display: { flat: "C" },
    quality: "maj",
    aliases: ["C"],
    enharmonic_equivalents: [],
    formula: ["1", "3", "5"],
    pitch_classes: ["C", "E", "G"],
    tuning: ["E", "A", "D", "G", "B", "E"],
    voicings: [{ id: "chord:C:maj:v1", frets: [null, 3, 2, 0, 1, 0], base_fret: 1 }],
    notes: { summary: "C major" },
    source_refs: [{ source: "unit", url: "https://example.com/c-major" }],
    ...overrides,
  };
}

function extractRuntimeAliasMap(html: string): Record<string, string> {
  const match = html.match(/const ALIAS_MAP = (\{[\s\S]*?\});/);
  if (!match || !match[1]) {
    throw new Error("Unable to extract ALIAS_MAP from runtime script.");
  }
  return JSON.parse(match[1]) as Record<string, string>;
}

function regressionProjection(chords: ReadonlyArray<ChordRecord>): unknown {
  return chords.map((chord) => ({
    id: chord.id,
    aliases: chord.aliases ?? [],
    source_refs: chord.source_refs,
    voicings: chord.voicings.map((voicing) => ({
      id: voicing.id,
      base_fret: voicing.base_fret,
      frets: voicing.frets,
      position: voicing.position,
      source_refs: voicing.source_refs ?? [],
    })),
  }));
}

describe("wave-e regression suite", () => {
  it("locks source precedence, voicing dedupe, and deterministic v1..vn assignment", async () => {
    const targets = [
      {
        source: "guitar-chord-org",
        chordId: "chord:C:maj",
        slug: "c-major",
        url: "https://guitar-chord-org.example/c-major",
      },
      {
        source: "all-guitar-chords",
        chordId: "chord:C:maj",
        slug: "c-major",
        url: "https://all-guitar-chords.example/c-major",
      },
    ] as const;

    const registry: SourceRegistryEntry[] = [
      makeSource("guitar-chord-org", (_html, url) => ({
        source: "guitar-chord-org",
        url,
        symbol: "C",
        root: "C",
        quality_raw: "major",
        aliases: ["Cmaj"],
        formula: ["1", "3", "5"],
        pitch_classes: ["C", "E", "G"],
        voicings: [
          { id: "org-open", frets: [null, 3, 2, 0, 1, 0], base_fret: 1 },
          { id: "org-upper", frets: [8, 10, 10, 9, 8, 8], base_fret: 8 },
        ],
      })),
      makeSource("all-guitar-chords", (_html, url) => ({
        source: "all-guitar-chords",
        url,
        symbol: "C",
        root: "C",
        quality_raw: "major",
        aliases: ["C"],
        formula: ["1", "3", "5"],
        pitch_classes: ["C", "E", "G"],
        voicings: [
          { id: "all-open", frets: [null, 3, 2, 0, 1, 0], base_fret: 1 },
          { id: "all-barre", frets: [3, 3, 5, 5, 5, 3], base_fret: 3 },
        ],
      })),
    ];

    const runA = await ingestNormalizedChordsWithTargets(targets, registry, { refresh: false, delayMs: 0 });
    const runB = await ingestNormalizedChordsWithTargets([...targets].reverse(), [...registry].reverse(), { refresh: false, delayMs: 0 });

    const projectionA = regressionProjection(runA);
    const projectionB = regressionProjection(runB);

    expect(projectionA).toEqual(projectionB);
    expect(projectionA).toMatchInlineSnapshot(`
      [
        {
          "aliases": [
            "C",
            "Cmaj",
          ],
          "id": "chord:C:maj",
          "source_refs": [
            {
              "source": "all-guitar-chords",
              "url": "https://all-guitar-chords.example/c-major",
            },
            {
              "source": "guitar-chord-org",
              "url": "https://guitar-chord-org.example/c-major",
            },
          ],
          "voicings": [
            {
              "base_fret": 1,
              "frets": [
                null,
                3,
                2,
                0,
                1,
                0,
              ],
              "id": "chord:C:maj:v1",
              "position": "open",
              "source_refs": [
                {
                  "source": "all-guitar-chords",
                  "url": "https://all-guitar-chords.example/c-major",
                },
                {
                  "note": "duplicate-voicing",
                  "source": "guitar-chord-org",
                  "url": "https://guitar-chord-org.example/c-major",
                },
              ],
            },
            {
              "base_fret": 3,
              "frets": [
                3,
                3,
                5,
                5,
                5,
                3,
              ],
              "id": "chord:C:maj:v2",
              "position": "unknown",
              "source_refs": [
                {
                  "source": "all-guitar-chords",
                  "url": "https://all-guitar-chords.example/c-major",
                },
              ],
            },
            {
              "base_fret": 8,
              "frets": [
                8,
                10,
                10,
                9,
                8,
                8,
              ],
              "id": "chord:C:maj:v3",
              "position": "upper",
              "source_refs": [
                {
                  "source": "guitar-chord-org",
                  "url": "https://guitar-chord-org.example/c-major",
                },
              ],
            },
          ],
        },
      ]
    `);
  });

  it("locks sharp-alias routing map and enharmonic link resolution in generated site outputs", () => {
    const dbMaj = buildChord({
      id: "chord:Db:maj",
      root: "Db",
      canonical_root: "Db",
      root_aliases: ["Db", "C#"],
      root_display: { flat: "Db", sharp: "C#" },
      aliases: ["Db", "C#"],
    });
    const ebMin7 = buildChord({
      id: "chord:Eb:min7",
      root: "Eb",
      canonical_root: "Eb",
      root_aliases: ["Eb", "D#"],
      root_display: { flat: "Eb", sharp: "D#" },
      quality: "min7",
      aliases: ["Ebm7"],
      formula: ["1", "b3", "5", "b7"],
      pitch_classes: ["Eb", "Gb", "Bb", "Db"],
      voicings: [{ id: "chord:Eb:min7:v1", frets: [null, 6, 8, 6, 7, 6], base_fret: 6 }],
    });
    const cMaj = buildChord({
      id: "chord:C:maj",
      root: "C",
      canonical_root: "C",
      root_aliases: ["C"],
      root_display: { flat: "C" },
      aliases: ["C"],
    });

    const indexAliasMap = extractRuntimeAliasMap(siteIndexHtml([dbMaj, ebMin7, cMaj]));
    expect(indexAliasMap).toMatchObject({
      "chord:c#:maj": "./chords/chord__Db__maj.html",
      "c#:maj": "./chords/chord__Db__maj.html",
      "chord:d#:min7": "./chords/chord__Eb__min7.html",
      "d#:min7": "./chords/chord__Eb__min7.html",
    });
    expect(indexAliasMap["chord:c:maj"]).toBeUndefined();

    const dbChordPageAliasMap = extractRuntimeAliasMap(siteChordHtml(dbMaj, [dbMaj, ebMin7, cMaj]));
    expect(dbChordPageAliasMap["chord:c#:maj"]).toBe("./chord__Db__maj.html");

    const cSharpMaj = buildChord({
      id: "chord:C#:maj",
      root: "C#",
      canonical_root: "Db",
      root_aliases: ["Db", "C#"],
      root_display: { flat: "Db", sharp: "C#" },
      aliases: ["C#", "Db"],
      enharmonic_equivalents: ["chord:Db:maj"],
    });
    const dbPage = siteChordHtml(dbMaj, [dbMaj, cSharpMaj]);
    expect(dbPage).toContain("href=\"./chord__C-sharp__maj.html\"");
  });
});
