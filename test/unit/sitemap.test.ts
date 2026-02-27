import { describe, expect, it } from "vitest";
import { buildDocsSitemap } from "../../src/build/docs/generateSitemap.js";
import type { ChordRecord } from "../../src/types/model.js";

function buildChord(overrides: Partial<ChordRecord> = {}): ChordRecord {
  const base: ChordRecord = {
    id: "chord:C:maj",
    root: "C",
    quality: "maj",
    aliases: ["C", "Cmaj"],
    enharmonic_equivalents: [],
    formula: ["1", "3", "5"],
    pitch_classes: ["C", "E", "G"],
    tuning: ["E", "A", "D", "G", "B", "E"],
    voicings: [
      { id: "chord:C:maj:v2", frets: [3, 3, 5, 5, 5, 3], base_fret: 3 },
      { id: "chord:C:maj:v1", frets: [null, 3, 2, 0, 1, 0], base_fret: 1 },
    ],
    source_refs: [{ source: "unit", url: "https://example.com/chord" }],
    notes: { summary: "C major." },
  };
  return { ...base, ...overrides };
}

const FIXED_TS = "2025-01-01T00:00:00.000Z";

describe("buildDocsSitemap", () => {
  it("returns an object with generated_at, total, and entries", () => {
    const chords = [buildChord()];
    const sitemap = buildDocsSitemap(chords, FIXED_TS);
    expect(sitemap.generated_at).toBe(FIXED_TS);
    expect(sitemap.total).toBe(1);
    expect(sitemap.entries).toHaveLength(1);
  });

  it("entry has expected fields", () => {
    const chords = [buildChord()];
    const { entries } = buildDocsSitemap(chords, FIXED_TS);
    const entry = entries[0];
    expect(entry.id).toBe("chord:C:maj");
    expect(entry.root).toBe("C");
    expect(entry.quality).toBe("maj");
    expect(entry.aliases).toEqual(expect.arrayContaining(["C", "Cmaj"]));
  });

  it("path uses __ separator and %23 for #", () => {
    const chord = buildChord({ id: "chord:C#:maj", root: "C#" });
    const { entries } = buildDocsSitemap([chord], FIXED_TS);
    expect(entries[0].path).toBe("docs/chords/chord__C%23__maj.md");
  });

  it("path is correct for a plain chord", () => {
    const { entries } = buildDocsSitemap([buildChord()], FIXED_TS);
    expect(entries[0].path).toBe("docs/chords/chord__C__maj.md");
  });

  it("voicings are sorted by id and have diagram paths", () => {
    const { entries } = buildDocsSitemap([buildChord()], FIXED_TS);
    const voicings = entries[0].voicings;
    expect(voicings[0].id).toBe("chord:C:maj:v1");
    expect(voicings[1].id).toBe("chord:C:maj:v2");
    expect(voicings[0].diagram_path).toBe(
      "docs/diagrams/chord__C__maj__v1.svg",
    );
  });

  it("diagram path uses __ separator and %23 for #", () => {
    const chord = buildChord({
      id: "chord:C#:maj",
      root: "C#",
      voicings: [{ id: "chord:C#:maj:v1", frets: [null, 3, 2, 0, 1, 0], base_fret: 1 }],
    });
    const { entries } = buildDocsSitemap([chord], FIXED_TS);
    expect(entries[0].voicings[0].diagram_path).toBe(
      "docs/diagrams/chord__C%23__maj__v1.svg",
    );
  });

  it("enharmonic_equivalents are populated bidirectionally", () => {
    const cSharp = buildChord({
      id: "chord:C#:maj",
      root: "C#",
      enharmonic_equivalents: ["chord:Db:maj"],
    });
    const db = buildChord({
      id: "chord:Db:maj",
      root: "Db",
      enharmonic_equivalents: ["chord:C#:maj"],
    });
    const sitemap = buildDocsSitemap([cSharp, db], FIXED_TS);
    const cSharpEntry = sitemap.entries.find((e) => e.id === "chord:C#:maj")!;
    const dbEntry = sitemap.entries.find((e) => e.id === "chord:Db:maj")!;
    expect(cSharpEntry.related.enharmonic_equivalents).toContain("chord:Db:maj");
    expect(dbEntry.related.enharmonic_equivalents).toContain("chord:C#:maj");
  });

  it("same_root_qualities lists other chords with same root", () => {
    const cMaj = buildChord({ id: "chord:C:maj", root: "C", quality: "maj" });
    const cMin = buildChord({
      id: "chord:C:min",
      root: "C",
      quality: "min",
      aliases: [],
      pitch_classes: ["C", "Eb", "G"],
    });
    const sitemap = buildDocsSitemap([cMaj, cMin], FIXED_TS);
    const majEntry = sitemap.entries.find((e) => e.id === "chord:C:maj")!;
    const minEntry = sitemap.entries.find((e) => e.id === "chord:C:min")!;
    expect(majEntry.related.same_root_qualities).toContain("chord:C:min");
    expect(minEntry.related.same_root_qualities).toContain("chord:C:maj");
  });

  it("entries are sorted deterministically (root then quality order)", () => {
    const cMin = buildChord({
      id: "chord:C:min",
      root: "C",
      quality: "min",
      aliases: [],
      pitch_classes: ["C", "Eb", "G"],
    });
    const cMaj = buildChord({ id: "chord:C:maj", root: "C", quality: "maj" });
    const sitemap = buildDocsSitemap([cMin, cMaj], FIXED_TS);
    // maj sorts before min per compareChordOrder
    expect(sitemap.entries[0].id).toBe("chord:C:maj");
    expect(sitemap.entries[1].id).toBe("chord:C:min");
  });

  it("total matches entries length", () => {
    const chords = [
      buildChord({ id: "chord:C:maj", root: "C", quality: "maj" }),
      buildChord({ id: "chord:C:min", root: "C", quality: "min", aliases: [], pitch_classes: ["C", "Eb", "G"] }),
      buildChord({ id: "chord:G:maj", root: "G", quality: "maj", aliases: [], pitch_classes: ["G", "B", "D"] }),
    ];
    const sitemap = buildDocsSitemap(chords, FIXED_TS);
    expect(sitemap.total).toBe(chords.length);
    expect(sitemap.entries).toHaveLength(chords.length);
  });

  it("is fully deterministic — same input produces identical output", () => {
    const chords = [
      buildChord({ id: "chord:C:maj", root: "C", quality: "maj" }),
      buildChord({ id: "chord:C:min", root: "C", quality: "min", aliases: [], pitch_classes: ["C", "Eb", "G"] }),
    ];
    const a = JSON.stringify(buildDocsSitemap(chords, FIXED_TS));
    const b = JSON.stringify(buildDocsSitemap([...chords].reverse(), FIXED_TS));
    expect(a).toBe(b);
  });

  it("handles empty chord list", () => {
    const sitemap = buildDocsSitemap([], FIXED_TS);
    expect(sitemap.total).toBe(0);
    expect(sitemap.entries).toHaveLength(0);
  });

  it("aliases are sorted (locale sort order)", () => {
    const chord = buildChord({ aliases: ["Cmaj", "C", "Cmin"] });
    const { entries } = buildDocsSitemap([chord], FIXED_TS);
    expect(entries[0].aliases).toEqual(["C", "Cmin", "Cmaj"].sort());
  });
});
