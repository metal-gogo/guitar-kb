import { mkdir, readFile, rm } from "node:fs/promises";
import path from "node:path";
import { chordIndexMarkdown, chordMarkdown, licenseMarkdown, privacyNoticeMarkdown } from "../build/docs/generateDocs.js";
import { coverageDashboardMarkdown } from "../build/docs/generateCoverage.js";
import { chordDocFileName, docsVoicingDiagramPath, siteVoicingDiagramPath } from "../build/docs/paths.js";
import { buildDocsSitemap } from "../build/docs/generateSitemap.js";
import { writeChordJsonl } from "../build/output/writeJsonl.js";
import {
  siteAliasRedirectHtml,
  siteChordFileName,
  siteChordHtml,
  siteIndexHtml,
  siteLicenseHtml,
  sitePrivacyHtml,
  siteStylesheet,
} from "../build/site/generateSite.js";
import { generateChordSvg } from "../build/svg/generateSvg.js";
import { ingestNormalizedChords } from "../ingest/pipeline.js";
import { SOURCE_REGISTRY } from "../ingest/sourceRegistry.js";
import { auditCache, buildCacheCompletenessManifest } from "../ingest/cacheAudit.js";
import type { ChordRecord } from "../types/model.js";
import { sharpAliasForFlatCanonicalRoot, toFlatCanonicalRoot } from "../types/guards.js";
import { compareChordOrder } from "../utils/sort.js";
import { pathExists, writeJson, writeText } from "../utils/fs.js";
import { validateChordRecords } from "../validate/schema.js";
import { buildRootQualityCoverageReport } from "../validate/coverage.js";
import { parseBuildCliOptions } from "./options.js";
import { FULL_MATRIX_TARGETS } from "../config.js";

const NORMALIZED_PATH = path.join("data", "generated", "chords.normalized.json");
const DEFAULT_SITEMAP_GENERATED_AT = "1970-01-01T00:00:00.000Z";
const CACHE_MANIFEST_PATH = path.join("data", "generated", "cache-completeness.manifest.json");

interface BuildRuntimeOptions {
  chord?: string;
  source?: string;
  dryRun: boolean;
}

async function loadNormalized(): Promise<ChordRecord[]> {
  const content = await readFile(NORMALIZED_PATH, "utf8");
  return JSON.parse(content) as ChordRecord[];
}

export function shouldEnforceCacheCompletenessPolicy(options: BuildRuntimeOptions): boolean {
  return !options.chord && !options.source;
}

export function shouldWriteCacheManifest(options: BuildRuntimeOptions): boolean {
  return shouldEnforceCacheCompletenessPolicy(options) && !options.dryRun;
}

export function cacheFailureMessage(
  missing: ReadonlyArray<{ source: string; slug: string }>,
  corrupt: ReadonlyArray<{ source: string; slug: string }>,
): string {
  const sample = [
    ...missing.slice(0, 3).map((entry) => `${entry.source}/${entry.slug}.html (missing)`),
    ...corrupt.slice(0, 3).map((entry) => `${entry.source}/${entry.slug}.html (corrupt)`),
  ];

  return [
    "Cache completeness policy failed for full build/deploy mode.",
    `Missing=${missing.length} Corrupt=${corrupt.length}`,
    sample.length > 0 ? `Sample gaps: ${sample.join(", ")}` : "",
    "Run `npm run ingest:full-refresh` and then retry `npm run preflight`.",
  ].filter((line) => line.length > 0).join(" ");
}

export function filterBuildChords(chords: ChordRecord[], options: BuildRuntimeOptions): ChordRecord[] {
  let filtered = chords;

  if (options.source) {
    const sourceId = options.source;
    const sourceExists = SOURCE_REGISTRY.some((entry) => entry.id === sourceId);
    if (!sourceExists) {
      throw new Error(`Unknown source: ${sourceId}`);
    }

    filtered = filtered.filter((chord) => chord.source_refs.some((ref) => ref.source === sourceId));
  }

  if (options.chord) {
    const term = options.chord.toLowerCase();
    const isCanonical = term.startsWith("chord:");
    if (isCanonical) {
      filtered = filtered.filter((chord) => chord.id.toLowerCase() === term);
    } else {
      const matchingCanonicalIds = new Set(
        FULL_MATRIX_TARGETS
          .filter((target) => target.slug.toLowerCase().includes(term))
          .map((target) => target.chordId.toLowerCase()),
      );

      filtered = filtered.filter((chord) => {
        const chordId = chord.id.toLowerCase();
        return matchingCanonicalIds.has(chordId) || chordId.includes(term);
      });
    }
  }

  if (filtered.length === 0 && (options.chord || options.source)) {
    const requested = `${options.source ? `source=${options.source} ` : ""}${options.chord ? `chord=${options.chord}` : ""}`.trim();
    throw new Error(`No chords matched filters: ${requested}`);
  }

  return filtered;
}

async function loadOrGenerateNormalized(options: BuildRuntimeOptions): Promise<ChordRecord[]> {
  if (shouldEnforceCacheCompletenessPolicy(options)) {
    const cacheAudit = await auditCache();
    const cacheManifest = buildCacheCompletenessManifest(cacheAudit);
    if (shouldWriteCacheManifest(options)) {
      await writeJson(CACHE_MANIFEST_PATH, cacheManifest);
    }

    if (!cacheManifest.is_complete) {
      throw new Error(cacheFailureMessage(cacheManifest.missing, cacheManifest.corrupt));
    }
  }

  if (await pathExists(NORMALIZED_PATH)) {
    if (shouldEnforceCacheCompletenessPolicy(options)) {
      process.stdout.write("Ingest policy: cache + normalized artifacts complete; skipping ingest.\n");
    }
    const normalized = await loadNormalized();
    return filterBuildChords(normalized, options);
  }

  const generated = await ingestNormalizedChords({
    refresh: false,
    delayMs: 250,
    chord: options.chord,
    source: options.source,
    dryRun: false,
  });

  if (!options.dryRun) {
    await writeJson(NORMALIZED_PATH, generated);
  }
  return generated;
}

async function main(): Promise<void> {
  const options = parseBuildCliOptions(process.argv.slice(2));
  const chords = (await loadOrGenerateNormalized(options)).slice().sort(compareChordOrder);

  await validateChordRecords(chords);

  if (options.dryRun) {
    process.stdout.write(`Dry run: would build outputs for ${chords.length} chords\n`);
    return;
  }

  await rm(path.join("docs", "chords"), { recursive: true, force: true });
  await rm(path.join("docs", "diagrams"), { recursive: true, force: true });
  await rm("site", { recursive: true, force: true });
  await writeChordJsonl(path.join("data", "chords.jsonl"), chords);
  await mkdir(path.join("docs", "chords"), { recursive: true });
  await mkdir(path.join("docs", "diagrams"), { recursive: true });
  await mkdir(path.join("site", "assets"), { recursive: true });
  await mkdir(path.join("site", "chords"), { recursive: true });
  await mkdir(path.join("site", "diagrams"), { recursive: true });
  await writeText(path.join("docs", "index.md"), chordIndexMarkdown(chords));
  await writeText(path.join("docs", "privacy.md"), privacyNoticeMarkdown());
  await writeText(path.join("docs", "license.md"), licenseMarkdown());
  const coverageReport = buildRootQualityCoverageReport(chords);
  await writeText(path.join("docs", "coverage.md"), coverageDashboardMarkdown(coverageReport));
  await writeText(path.join("site", "index.html"), siteIndexHtml(chords));
  await writeText(path.join("site", "privacy.html"), sitePrivacyHtml());
  await writeText(path.join("site", "license.html"), siteLicenseHtml());
  await writeText(path.join("site", "assets", "site.css"), siteStylesheet());

  const sitemapGeneratedAt =
    process.env.DOCS_SITEMAP_GENERATED_AT ??
    process.env.BUILD_TIMESTAMP ??
    DEFAULT_SITEMAP_GENERATED_AT;
  const sitemap = buildDocsSitemap(chords, sitemapGeneratedAt);
  await writeJson(path.join("docs", "sitemap.json"), sitemap);
  const aliasRedirects = new Map<string, string>();
  const canonicalChordIds = new Set(chords.map((chord) => chord.id));

  for (const chord of chords) {
    await writeText(
      path.join("docs", "chords", chordDocFileName(chord.id)),
      chordMarkdown(chord, chords),
    );
    await writeText(
      path.join("site", "chords", siteChordFileName(chord.id)),
      siteChordHtml(chord, chords),
    );

    const canonicalRoot = chord.canonical_root ?? toFlatCanonicalRoot(chord.root);
    const sharpRoot =
      chord.root_display?.sharp
      ?? (canonicalRoot ? sharpAliasForFlatCanonicalRoot(canonicalRoot) : undefined);
    if (sharpRoot) {
      const aliasChordId = `chord:${sharpRoot}:${chord.quality}`;
      if (aliasChordId !== chord.id && !canonicalChordIds.has(aliasChordId) && !aliasRedirects.has(aliasChordId)) {
        aliasRedirects.set(aliasChordId, chord.id);
      }
    }

    for (const voicing of chord.voicings) {
      const svg = generateChordSvg(voicing, chord.tuning);
      const docsDiagramPath = docsVoicingDiagramPath(voicing.id);
      const siteDiagramPath = siteVoicingDiagramPath(voicing.id);
      await writeText(docsDiagramPath, svg);
      await writeText(siteDiagramPath, svg);
    }
  }

  for (const [aliasChordId, canonicalChordId] of [...aliasRedirects.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    await writeText(
      path.join("site", "chords", siteChordFileName(aliasChordId)),
      siteAliasRedirectHtml(aliasChordId, canonicalChordId),
    );
  }

  process.stdout.write(`Built outputs for ${chords.length} chords\n`);
}

main().catch((error: unknown) => {
  process.stderr.write(`${String(error)}\n`);
  process.exit(1);
});
