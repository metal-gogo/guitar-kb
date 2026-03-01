import { readdir } from "node:fs/promises";
import path from "node:path";
import { expectedCacheKeys } from "./cacheTargets.js";
import { pathExists } from "../utils/fs.js";

export const PARITY_SOURCES = ["guitar-chord-org", "all-guitar-chords"] as const;
export type ParitySource = typeof PARITY_SOURCES[number];

const EXPECTED_FIXTURE_SLUGS: Record<ParitySource, readonly string[]> = {
  "guitar-chord-org": [
    "a-major",
    "a-sharp-major",
    "b-major",
    "c7",
    "c-aug",
    "c-dim",
    "c-dim7",
    "cmaj7",
    "c-major",
    "c-major-many-voicings",
    "c-min7",
    "c-min7-many-voicings",
    "c-min7-partial-voicing-attrs",
    "c-minor",
    "c-sharp-major",
    "c-sus2",
    "c-sus4",
    "d-major",
    "d-sharp-major",
    "e-major",
    "f-major",
    "f-sharp-major",
    "g-major",
    "g-sharp-major",
    "missing-sections",
    "no-chord-root",
    "partial-voicing-attrs",
  ],
  "all-guitar-chords": [
    "a-major",
    "a-sharp-major",
    "b-major",
    "c7",
    "c-aug",
    "c-dim",
    "c-dim7",
    "cmaj7",
    "c-major",
    "c-major-many-voicings",
    "c-min7",
    "c-min7-many-voicings",
    "c-min7-partial-voicing-attrs",
    "c-minor",
    "c-sharp-major",
    "c-sus2",
    "c-sus4",
    "d-major",
    "d-sharp-major",
    "e-major",
    "f-major",
    "f-sharp-major",
    "g-major",
    "g-sharp-major",
    "missing-sections",
    "no-section-root",
    "partial-voicing-attrs",
  ],
};

const ALLOWED_CACHE_EXTRAS: Record<ParitySource, readonly string[]> = {
  "guitar-chord-org": ["c7", "cmaj7", "c-major-many-voicings"],
  "all-guitar-chords": ["c7", "cmaj7", "c-major-many-voicings"],
};

const CACHE_BACKED_FIXTURE_SLUGS: Record<ParitySource, readonly string[]> = {
  "guitar-chord-org": [
    "a-major",
    "a-sharp-major",
    "b-major",
    "c7",
    "cmaj7",
    "c-major",
    "c-major-many-voicings",
    "c-minor",
    "c-sharp-major",
    "d-major",
    "d-sharp-major",
    "e-major",
    "f-major",
    "f-sharp-major",
    "g-major",
    "g-sharp-major",
  ],
  "all-guitar-chords": [
    "a-major",
    "a-sharp-major",
    "b-major",
    "c7",
    "cmaj7",
    "c-major",
    "c-major-many-voicings",
    "c-minor",
    "c-sharp-major",
    "d-major",
    "d-sharp-major",
    "e-major",
    "f-major",
    "f-sharp-major",
    "g-major",
    "g-sharp-major",
  ],
};

const FIXTURE_TO_CACHE_SLUG_OVERRIDES: Record<ParitySource, Record<string, string>> = {
  "guitar-chord-org": { c7: "c-7", cmaj7: "c-maj7" },
  "all-guitar-chords": { c7: "c-7", cmaj7: "c-maj7" },
};

export interface SourceFixtureCacheParity {
  source: ParitySource;
  expectedCacheSlugs: string[];
  actualCacheSlugs: string[];
  missingCacheSlugs: string[];
  allowlistedExtraCacheSlugs: string[];
  extraCacheSlugs: string[];
  expectedFixtureSlugs: string[];
  actualFixtureSlugs: string[];
  missingFixtureSlugs: string[];
  extraFixtureSlugs: string[];
  missingCacheForFixtureSlugs: string[];
}

export interface FixtureCacheParityReport {
  ok: boolean;
  sources: SourceFixtureCacheParity[];
}

interface FixtureCacheParityOptions {
  cacheBase?: string;
  fixtureBase?: string;
}

function compareSets(expected: readonly string[], actual: readonly string[]): { missing: string[]; extra: string[] } {
  const expectedSet = new Set(expected);
  const actualSet = new Set(actual);

  return {
    missing: expected.filter((item) => !actualSet.has(item)),
    extra: actual.filter((item) => !expectedSet.has(item)),
  };
}

async function listHtmlSlugs(dir: string): Promise<string[]> {
  if (!(await pathExists(dir))) {
    return [];
  }

  const entries = await readdir(dir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".html"))
    .map((entry) => entry.name.slice(0, -5))
    .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
}

function expectedCacheSlugsBySource(): Record<ParitySource, string[]> {
  const bySource: Record<ParitySource, string[]> = {
    "guitar-chord-org": [],
    "all-guitar-chords": [],
  };

  for (const key of expectedCacheKeys()) {
    if (key.source === "guitar-chord-org" || key.source === "all-guitar-chords") {
      bySource[key.source].push(key.slug);
    }
  }

  for (const source of PARITY_SOURCES) {
    bySource[source].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  }

  return bySource;
}

function buildCacheBackedFixtureSlugs(source: ParitySource): string[] {
  return CACHE_BACKED_FIXTURE_SLUGS[source]
    .map((slug) => FIXTURE_TO_CACHE_SLUG_OVERRIDES[source][slug] ?? slug)
    .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
}

export async function buildFixtureCacheParityReport(
  options: FixtureCacheParityOptions = {},
): Promise<FixtureCacheParityReport> {
  const cacheBase = options.cacheBase ?? path.join("data", "sources");
  const fixtureBase = options.fixtureBase ?? path.join("test", "fixtures", "sources");
  const expectedCacheBySource = expectedCacheSlugsBySource();

  const sources: SourceFixtureCacheParity[] = [];
  for (const source of PARITY_SOURCES) {
    const expectedCacheSlugs = expectedCacheBySource[source];
    const actualCacheSlugs = await listHtmlSlugs(path.join(cacheBase, source));
    const expectedFixtureSlugs = [...EXPECTED_FIXTURE_SLUGS[source]];
    const actualFixtureSlugs = await listHtmlSlugs(path.join(fixtureBase, source));
    const allowlistedExtras = [...ALLOWED_CACHE_EXTRAS[source]].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));

    const cacheDiff = compareSets(expectedCacheSlugs, actualCacheSlugs);
    const allowlistedExtraCacheSlugs = cacheDiff.extra.filter((slug) => allowlistedExtras.includes(slug));
    const extraCacheSlugs = cacheDiff.extra.filter((slug) => !allowlistedExtras.includes(slug));
    const fixtureDiff = compareSets(expectedFixtureSlugs, actualFixtureSlugs);
    const cacheBackedFixtureSlugs = buildCacheBackedFixtureSlugs(source);
    const cacheBackedFixtureDiff = compareSets(cacheBackedFixtureSlugs, actualCacheSlugs);

    sources.push({
      source,
      expectedCacheSlugs,
      actualCacheSlugs,
      missingCacheSlugs: cacheDiff.missing,
      allowlistedExtraCacheSlugs,
      extraCacheSlugs,
      expectedFixtureSlugs,
      actualFixtureSlugs,
      missingFixtureSlugs: fixtureDiff.missing,
      extraFixtureSlugs: fixtureDiff.extra,
      missingCacheForFixtureSlugs: cacheBackedFixtureDiff.missing,
    });
  }

  return {
    ok: sources.every((source) =>
      source.missingCacheSlugs.length === 0 &&
      source.extraCacheSlugs.length === 0 &&
      source.missingFixtureSlugs.length === 0 &&
      source.extraFixtureSlugs.length === 0 &&
      source.missingCacheForFixtureSlugs.length === 0
    ),
    sources,
  };
}
