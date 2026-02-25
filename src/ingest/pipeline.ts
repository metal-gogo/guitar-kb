import { MVP_TARGETS } from "../config.js";
import { getCachedHtml } from "./fetch/cache.js";
import { normalizeRecords } from "./normalize/normalize.js";
import { SOURCE_REGISTRY } from "./sourceRegistry.js";
import type { ChordRecord, RawChordRecord, SourceRegistryEntry } from "../types/model.js";

interface IngestPipelineOptions {
  refresh?: boolean;
  delayMs?: number;
}

interface PipelineIngestTarget {
  source: string;
  slug: string;
  url: string;
}

function sourceRegistryMap(
  registry: ReadonlyArray<SourceRegistryEntry>,
): Map<string, SourceRegistryEntry> {
  return new Map(registry.map((entry) => [entry.id, entry]));
}

export async function ingestNormalizedChordsWithTargets(
  targets: ReadonlyArray<PipelineIngestTarget>,
  registry: ReadonlyArray<SourceRegistryEntry>,
  options: IngestPipelineOptions = {},
): Promise<ChordRecord[]> {
  const refresh = options.refresh ?? false;
  const delayMs = options.delayMs ?? 250;
  const rawRecords: RawChordRecord[] = [];
  const registryById = sourceRegistryMap(registry);

  for (const target of targets) {
    const sourceEntry = registryById.get(target.source);
    if (!sourceEntry) {
      throw new Error(`No source registry entry found for ${target.source}`);
    }

    const html = await getCachedHtml(sourceEntry.cacheDir, target.slug, target.url, { refresh, delayMs });
    rawRecords.push(sourceEntry.parse(html, target.url));
  }

  return normalizeRecords(rawRecords);
}

export async function ingestNormalizedChords(options: IngestPipelineOptions = {}): Promise<ChordRecord[]> {
  return ingestNormalizedChordsWithTargets(MVP_TARGETS, SOURCE_REGISTRY, options);
}
