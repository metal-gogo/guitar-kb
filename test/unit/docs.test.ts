import { describe, expect, it } from "vitest";
import path from "node:path";
import { chordIndexMarkdown, chordMarkdown, licenseMarkdown, privacyNoticeMarkdown } from "../../src/build/docs/generateDocs.js";
import { encodeIdForPathSegment, voicingDiagramRelativePath } from "../../src/build/docs/paths.js";
import { coverageDashboardMarkdown } from "../../src/build/docs/generateCoverage.js";
import {
  siteAliasRedirectHtml,
  siteChordFileName,
  siteChordHtml,
  siteIndexHtml,
  siteLicenseHtml,
  sitePrivacyHtml,
} from "../../src/build/site/generateSite.js";
import { buildRootQualityCoverageReport } from "../../src/validate/coverage.js";
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
      { id: "chord:C:maj:v1", frets: [null, 3, 2, 0, 1, 0], base_fret: 1 },
      { id: "chord:C:maj:v2", frets: [3, 3, 5, 5, 5, 3], base_fret: 3 },
    ],
    source_refs: [{ source: "unit", url: "https://example.com/chord" }],
    notes: { summary: "C major summary." },
  };

  return {
    ...base,
    ...overrides,
    id: overrides.id ?? base.id,
    root: overrides.root ?? base.root,
    quality: overrides.quality ?? base.quality,
    formula: overrides.formula ?? base.formula,
    pitch_classes: overrides.pitch_classes ?? base.pitch_classes,
    voicings: overrides.voicings ?? base.voicings,
    source_refs: overrides.source_refs ?? base.source_refs,
  };
}

function renderChord(
  chordOverrides: Partial<ChordRecord> = {},
  allChords?: ChordRecord[],
): string {
  const chord = buildChord(chordOverrides);
  return chordMarkdown(chord, allChords ?? [chord]);
}

function extractMarkdownLinks(markdown: string): string[] {
  const matches = markdown.match(/\[[^\]]+\]\(([^)]+)\)/g) ?? [];
  return matches
    .map((match) => {
      const capture = /\[[^\]]+\]\(([^)]+)\)/.exec(match);
      return capture?.[1];
    })
    .filter((value): value is string => Boolean(value));
}

function extractHtmlLinks(html: string): string[] {
  const links = html.match(/(?:href|src)="([^"]+)"/g) ?? [];
  return links
    .map((entry) => {
      const match = /(?:href|src)="([^"]+)"/.exec(entry);
      return match?.[1];
    })
    .filter((value): value is string => Boolean(value));
}

describe("chordMarkdown", () => {
  describe("required sections", () => {
    it("includes a root + quality heading", () => {
      const md = renderChord();
      expect(md).toMatch(/^# C maj/m);
    });

    it("includes canonical ID", () => {
      const md = renderChord();
      expect(md).toContain("Canonical ID: chord:C:maj");
    });

    it("includes aliases", () => {
      const md = renderChord();
      expect(md).toContain("Aliases: C, Cmaj");
    });

    it("falls back to 'none' for empty aliases", () => {
      const md = renderChord({ aliases: [] });
      expect(md).toContain("Aliases: none");
    });

    it("includes formula", () => {
      const md = renderChord();
      expect(md).toContain("Formula: 1-3-5");
    });

    it("includes pitch classes", () => {
      const md = renderChord();
      expect(md).toContain("Pitch classes: C, E, G");
    });

    it("includes a Summary section with chord notes", () => {
      const md = renderChord();
      expect(md).toContain("## Summary");
      expect(md).toContain("C major summary.");
    });

    it("falls back to default summary when notes are absent", () => {
      const md = renderChord({ notes: undefined });
      expect(md).toContain("## Summary");
      expect(md).toContain("Chord reference generated from factual source data.");
    });

    it("includes a Voicings section header", () => {
      const md = renderChord();
      expect(md).toContain("## Voicings");
    });

    it("includes a Provenance section with source URLs", () => {
      const md = renderChord();
      expect(md).toContain("## Provenance");
      expect(md).toContain("- unit: https://example.com/chord");
    });

    it("includes a Navigation section with a back-to-index link", () => {
      const md = renderChord();
      expect(md).toContain("## Navigation");
      expect(md).toContain("[← Chord Index](../index.md)");
      expect(md).toContain("[Privacy Notice](../privacy.md)");
      expect(md).toContain("[License](../license.md)");
    });
  });

  describe("voicing rendering", () => {
    it("includes diagram references for each voicing", () => {
      const md = renderChord({
        voicings: [
          { id: "chord:C:maj:v2", frets: [null, 3, 2, 0, 1, 0], base_fret: 1 },
          { id: "chord:C:maj:v1", frets: [null, 3, 2, 0, 1, 0], base_fret: 1 },
        ],
      });
      expect(md).toContain("diagram: ../diagrams/C/maj/v1.svg");
      expect(md).toContain("diagram: ../diagrams/C/maj/v2.svg");
    });

    it("renders voicings in stable id order", () => {
      const md = renderChord({
        voicings: [
          { id: "chord:C:maj:v2", frets: [null, 3, 2, 0, 1, 0], base_fret: 1 },
          { id: "chord:C:maj:v1", frets: [null, 3, 2, 0, 1, 0], base_fret: 1 },
        ],
      });
      const v1Index = md.indexOf("chord:C:maj:v1");
      const v2Index = md.indexOf("chord:C:maj:v2");
      expect(v1Index).toBeGreaterThan(-1);
      expect(v2Index).toBeGreaterThan(-1);
      expect(v1Index).toBeLessThan(v2Index);
    });

    it("renders frets with 'x' for null/muted strings", () => {
      const md = renderChord({
        voicings: [{ id: "v1", frets: [null, 3, 2, 0, 1, 0], base_fret: 1 }],
      });
      expect(md).toContain("frets x/3/2/0/1/0");
    });

    it("renders base fret in voicing line", () => {
      const md = renderChord({
        voicings: [{ id: "v1", frets: [null, 3, 2, 0, 1, 0], base_fret: 5 }],
      });
      expect(md).toContain("base fret 5");
    });

    it("renders empty voicings without error", () => {
      const md = renderChord({ voicings: [] });
      expect(md).toContain("## Voicings");
    });
  });

  describe("determinism", () => {
    it("produces identical output on repeated calls for the same chord", () => {
      const chord = buildChord();
      expect(chordMarkdown(chord, [chord])).toBe(chordMarkdown(chord, [chord]));
    });

    it("produces identical output regardless of input voicing order", () => {
      const fwd = buildChord({
        voicings: [
          { id: "chord:C:maj:v1", frets: [null, 3, 2, 0, 1, 0], base_fret: 1 },
          { id: "chord:C:maj:v2", frets: [3, 3, 5, 5, 5, 3], base_fret: 3 },
        ],
      });
      const rev = buildChord({
        voicings: [
          { id: "chord:C:maj:v2", frets: [3, 3, 5, 5, 5, 3], base_fret: 3 },
          { id: "chord:C:maj:v1", frets: [null, 3, 2, 0, 1, 0], base_fret: 1 },
        ],
      });
      expect(chordMarkdown(fwd, [fwd])).toBe(chordMarkdown(rev, [rev]));
    });
  });

  describe("navigation links", () => {
    it("renders bidirectional enharmonic links when either side declares the relationship", () => {
      const cSharp = buildChord({
        id: "chord:C#:maj",
        root: "C#",
        quality: "maj",
        enharmonic_equivalents: ["chord:Db:maj"],
      });
      const dFlat = buildChord({
        id: "chord:Db:maj",
        root: "Db",
        quality: "maj",
        enharmonic_equivalents: [],
      });
      const allChords = [cSharp, dFlat];

      const cSharpMd = chordMarkdown(cSharp, allChords);
      const dFlatMd = chordMarkdown(dFlat, allChords);

      expect(cSharpMd).toContain("[Db maj](./chord__Db__maj.md)");
      expect(dFlatMd).toContain("[C# maj](./chord__C-sharp__maj.md)");
    });

    it("renders related quality links for same-root different-quality chords", () => {
      const cMaj = buildChord({ id: "chord:C:maj", root: "C", quality: "maj" });
      const cMin = buildChord({ id: "chord:C:min", root: "C", quality: "min" });
      const c7 = buildChord({ id: "chord:C:7", root: "C", quality: "7" });
      const dMaj = buildChord({ id: "chord:D:maj", root: "D", quality: "maj" });
      const allChords = [cMaj, cMin, c7, dMaj];

      const cMajMd = chordMarkdown(cMaj, allChords);
      expect(cMajMd).toContain("[C min](./chord__C__min.md)");
      expect(cMajMd).toContain("[C 7](./chord__C__7.md)");
      expect(cMajMd).not.toContain("[D maj](./chord__D__maj.md)");
    });

    it("keeps navigation output deterministic for identical inputs", () => {
      const cMaj = buildChord({ id: "chord:C:maj", root: "C", quality: "maj" });
      const c7 = buildChord({ id: "chord:C:7", root: "C", quality: "7" });
      const cMin = buildChord({ id: "chord:C:min", root: "C", quality: "min" });
      const allChords = [cMaj, c7, cMin];

      const first = chordMarkdown(cMaj, allChords);
      const second = chordMarkdown(cMaj, allChords);
      expect(first).toBe(second);
    });
  });
});

describe("chordIndexMarkdown", () => {
  it("links to the coverage dashboard", () => {
    const md = chordIndexMarkdown([buildChord()]);
    expect(md).toContain("[Coverage Dashboard](./coverage.md)");
  });

  it("links to privacy notice", () => {
    const md = chordIndexMarkdown([buildChord()]);
    expect(md).toContain("[Privacy Notice](./privacy.md)");
  });

  it("links to license", () => {
    const md = chordIndexMarkdown([buildChord()]);
    expect(md).toContain("[License](./license.md)");
  });

  it("includes the Chord Index heading", () => {
    const md = chordIndexMarkdown([buildChord()]);
    expect(md).toContain("# Chord Index");
  });

  it("contains one link entry per chord page", () => {
    const chords = [
      buildChord({ id: "chord:C:maj", root: "C", quality: "maj" }),
      buildChord({ id: "chord:C:min", root: "C", quality: "min", aliases: ["Cm"], formula: ["1", "b3", "5"] }),
      buildChord({ id: "chord:D:maj7", root: "D", quality: "maj7", aliases: ["Dmaj7"], formula: ["1", "3", "5", "7"] }),
    ];

    const md = chordIndexMarkdown(chords);

    expect(md).toContain("[maj](./chords/chord__C__maj.md)");
    expect(md).toContain("[min](./chords/chord__C__min.md)");
    expect(md).toContain("[maj7](./chords/chord__D__maj7.md)");
  });

  it("groups entries by root and keeps deterministic root/quality ordering", () => {
    const chords = [
      buildChord({ id: "chord:Db:maj", root: "Db", quality: "maj", aliases: ["Db"], formula: ["1", "3", "5"] }),
      buildChord({ id: "chord:C#:maj", root: "C#", quality: "maj", aliases: ["C#"], formula: ["1", "3", "5"] }),
      buildChord({ id: "chord:C:min", root: "C", quality: "min", aliases: ["Cm"], formula: ["1", "b3", "5"] }),
      buildChord({ id: "chord:C:maj", root: "C", quality: "maj", aliases: ["C"], formula: ["1", "3", "5"] }),
    ];

    const md = chordIndexMarkdown(chords);

    const cGroup = md.indexOf("## C");
    const csGroup = md.indexOf("## C#");
    const dbGroup = md.indexOf("## Db");
    expect(cGroup).toBeGreaterThan(-1);
    expect(csGroup).toBeGreaterThan(-1);
    expect(dbGroup).toBeGreaterThan(-1);
    expect(cGroup).toBeLessThan(dbGroup);
    expect(dbGroup).toBeLessThan(csGroup);

    const cMaj = md.indexOf("[maj](./chords/chord__C__maj.md)");
    const cMin = md.indexOf("[min](./chords/chord__C__min.md)");
    expect(cMaj).toBeGreaterThan(-1);
    expect(cMin).toBeGreaterThan(-1);
    expect(cMaj).toBeLessThan(cMin);
  });

  it("includes aliases and formula for quick reference", () => {
    const md = chordIndexMarkdown([
      buildChord({
        id: "chord:C:7",
        root: "C",
        quality: "7",
        aliases: ["C7", "Cdom7"],
        formula: ["1", "3", "5", "b7"],
      }),
    ]);

    expect(md).toContain("aliases: C7, Cdom7; formula: 1-3-5-b7");
  });

  it("is stable across repeated builds for identical inputs", () => {
    const chords = [
      buildChord({ id: "chord:C:maj", root: "C", quality: "maj" }),
      buildChord({ id: "chord:C:min", root: "C", quality: "min", aliases: ["Cm"], formula: ["1", "b3", "5"] }),
      buildChord({ id: "chord:D:7", root: "D", quality: "7", aliases: ["D7"], formula: ["1", "3", "5", "b7"] }),
    ];

    const first = chordIndexMarkdown(chords);
    const second = chordIndexMarkdown(chords);
    expect(first).toBe(second);
  });

  it("does not emit broken relative links for index and chord navigation pages", () => {
    const chords = [
      buildChord({ id: "chord:C:maj", root: "C", quality: "maj", enharmonic_equivalents: ["chord:Db:maj"] }),
      buildChord({ id: "chord:C:min", root: "C", quality: "min" }),
      buildChord({ id: "chord:Db:maj", root: "Db", quality: "maj", enharmonic_equivalents: [] }),
    ];

    const indexMd = chordIndexMarkdown(chords);
    const generatedPages = new Set([
      "./index.md",
      "./coverage.md",
      "./privacy.md",
      "./license.md",
      ...chords.map((chord) => `./chords/${encodeIdForPathSegment(chord.id)}.md`),
    ]);

    for (const link of extractMarkdownLinks(indexMd)) {
      expect(generatedPages.has(link)).toBe(true);
    }

    for (const chord of chords) {
      const pageMd = chordMarkdown(chord, chords);
      for (const link of extractMarkdownLinks(pageMd)) {
        const normalized = link.startsWith("../")
          ? `./${link.slice(3)}`
          : (link.startsWith("./") ? `./chords/${link.slice(2)}` : link);
        if (normalized.startsWith("./diagrams/")) {
          continue;
        }
        expect(generatedPages.has(normalized)).toBe(true);
      }
    }
  });
});

describe("coverageDashboardMarkdown", () => {
  it("renders deterministic coverage summary and missing-id table", () => {
    const report = buildRootQualityCoverageReport(
      [buildChord({ id: "chord:C:maj", root: "C", quality: "maj" })],
      { roots: ["C"], qualities: ["maj", "min", "dim"] },
    );

    const md = coverageDashboardMarkdown(report, { missingLimit: 10 });
    expect(md).toContain("# Coverage Dashboard");
    expect(md).toContain("Coverage: `1/3` (`33.33%`)");
    expect(md).toContain("| Canonical ID | Severity | Tags |");
    expect(md).toContain("| chord:C:min | critical | severity:critical, quality:min |");
    expect(md).toContain("| chord:C:dim | medium | severity:medium, quality:dim |");
    expect(md).toContain("[← Chord Index](./index.md)");
  });

  it("uses deterministic truncation notice when missing list exceeds limit", () => {
    const report = buildRootQualityCoverageReport([], { roots: ["C"], qualities: ["maj", "min", "7"] });
    const md = coverageDashboardMarkdown(report, { missingLimit: 2 });
    expect(md).toContain("_Showing first 2 of 3 missing IDs (deterministic order)._");
  });
});

describe("privacyNoticeMarkdown", () => {
  it("states static-site behavior without overclaiming", () => {
    const md = privacyNoticeMarkdown();
    expect(md).toContain("# Privacy Notice");
    expect(md).toContain("does not intentionally collect personal data");
    expect(md).toContain("hosting provider may keep standard request logs");
  });
});

describe("licenseMarkdown", () => {
  it("references the ISC license and repository usage boundaries", () => {
    const md = licenseMarkdown();
    expect(md).toContain("# License");
    expect(md).toContain("ISC License");
    expect(md).toContain("factual data with provenance");
  });
});

describe("site generation", () => {
  it("renders a deterministic site index with root and quality navigation", () => {
    const chords = [
      buildChord({ id: "chord:C:min", root: "C", quality: "min", aliases: ["Cm"] }),
      buildChord({ id: "chord:C:maj", root: "C", quality: "maj", aliases: ["C"] }),
      buildChord({ id: "chord:Db:maj", root: "Db", quality: "maj", aliases: ["Db"] }),
    ];

    const html = siteIndexHtml(chords);
    const reversed = siteIndexHtml([...chords].reverse());

    expect(html).toBe(reversed);
    expect(html).toContain("Guitar Chord Knowledge Base");
    expect(html).toContain("href=\"#root-c\"");
    expect(html).toContain("href=\"#root-db\"");
    expect(html).toContain("href=\"./chords/chord__C__maj.html\"");
    expect(html).toContain("href=\"./chords/chord__C__min.html\"");
    expect(html).toContain("href=\"./chords/chord__Db__maj.html\"");
    expect(html).toContain("data-notation-toggle=\"flat\"");
    expect(html).toContain("data-notation-toggle=\"sharp\"");
    expect(html).toContain("data-root-flat=\"Db\"");
    expect(html).toContain("data-root-sharp=\"C#\"");
    expect(html).toContain("\"chord:c#:maj\":\"./chords/chord__Db__maj.html\"");
    expect(html).toContain("params.get(\"chord\")");
    expect(html).toContain("href=\"./privacy.html\"");
    expect(html).toContain("href=\"./license.html\"");
  });

  it("renders chord pages with voicing diagrams, provenance, and cross-links", () => {
    const cSharp = buildChord({
      id: "chord:C#:maj",
      root: "C#",
      quality: "maj",
      enharmonic_equivalents: ["chord:Db:maj"],
      voicings: [
        { id: "chord:C#:maj:v1", frets: [null, 3, 2, 0, 1, 0], base_fret: 1 },
      ],
      source_refs: [{ source: "guitar-chord-org", url: "https://example.com/c-sharp-major" }],
    });
    const dFlat = buildChord({
      id: "chord:Db:maj",
      root: "Db",
      quality: "maj",
      enharmonic_equivalents: [],
      source_refs: [{ source: "all-guitar-chords", url: "https://example.com/d-flat-major" }],
    });
    const cMin = buildChord({
      id: "chord:C#:min",
      root: "C#",
      quality: "min",
      enharmonic_equivalents: [],
    });

    const html = siteChordHtml(cSharp, [cSharp, dFlat, cMin]);

    expect(html).toContain("src=\"../diagrams/C-sharp/maj/v1.svg\"");
    expect(html).toContain("href=\"./chord__Db__maj.html\"");
    expect(html).toContain("href=\"./chord__C-sharp__min.html\"");
    expect(html).toContain("data-notation-toggle=\"flat\"");
    expect(html).toContain("data-root-flat=\"Db\"");
    expect(html).toContain("data-root-sharp=\"C#\"");
    expect(html).toContain("href=\"https://example.com/c-sharp-major\"");
    expect(html).toContain("Back to index");
    expect(html).toContain("href=\"../privacy.html\"");
    expect(html).toContain("href=\"../license.html\"");
  });

  it("renders sharp alias redirect pages to canonical flat chord pages", () => {
    const html = siteAliasRedirectHtml("chord:C#:maj", "chord:Db:maj");
    expect(html).toContain("chord:C#:maj");
    expect(html).toContain("chord:Db:maj");
    expect(html).toContain("href=\"./chord__Db__maj.html\"");
    expect(html).toContain("params.set(\"notation\", \"sharp\")");
    expect(html).toContain("window.location.replace");
  });

  it("emits only resolvable internal links across generated index/chord pages", () => {
    const chords = [
      buildChord({ id: "chord:C:maj", root: "C", quality: "maj", enharmonic_equivalents: ["chord:Db:maj"] }),
      buildChord({ id: "chord:C:min", root: "C", quality: "min", enharmonic_equivalents: [] }),
      buildChord({ id: "chord:Db:maj", root: "Db", quality: "maj", enharmonic_equivalents: [] }),
    ];

    const index = siteIndexHtml(chords);
    const pages = new Map<string, string>([
      ["./index.html", index],
      ["./privacy.html", sitePrivacyHtml()],
      ["./license.html", siteLicenseHtml()],
      ...chords.map((chord) => [`./chords/${siteChordFileName(chord.id)}`, siteChordHtml(chord, chords)] as const),
    ]);

    const internalTargets = new Set<string>([
      "./index.html",
      "./privacy.html",
      "./license.html",
      "./assets/site.css",
      ...chords.map((chord) => `./chords/${siteChordFileName(chord.id)}`),
      ...chords.flatMap((chord) => chord.voicings.map((voicing) => `./diagrams/${voicingDiagramRelativePath(voicing.id)}`)),
    ]);

    for (const [pathName, html] of pages.entries()) {
      for (const target of extractHtmlLinks(html)) {
        if (target.startsWith("https://") || target.startsWith("http://") || target.startsWith("#")) {
          continue;
        }
        const normalized = `./${path.posix.normalize(
          path.posix.join(path.posix.dirname(pathName.slice(2)), target),
        )}`;
        expect(internalTargets.has(normalized), `${pathName} -> ${target}`).toBe(true);
      }
    }
  });
});
