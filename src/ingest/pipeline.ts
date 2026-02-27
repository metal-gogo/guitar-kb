import { MVP_TARGETS } from "../config.js";
import { getCachedHtml } from "./fetch/cache.js";
import { normalizeRecords } from "./normalize/normalize.js";
import { SOURCE_REGISTRY } from "./sourceRegistry.js";
import type { ChordRecord, RawChordRecord, SourceRegistryEntry } from "../types/model.js";
import type { IngestTarget } from "../config.js";

export interface IngestPipelineOptions {
  refresh?: boolean;
  delayMs?: number;
  chord?: string;
  source?: string;
  dryRun?: boolean;
  includeParserConfidence?: boolean;
}

interface PipelineIngestTarget {
  source: string;
  chordId?: string;
  slug: string;
  url: string;
}

function sourceRegistryMap(
  registry: ReadonlyArray<SourceRegistryEntry>,
): Map<string, SourceRegistryEntry> {
  return new Map(registry.map((entry) => [entry.id, entry]));
}

function filterTargets<T extends PipelineIngestTarget>(
  targets: ReadonlyArray<T>,
  registry: ReadonlyArray<SourceRegistryEntry>,
  options: IngestPipelineOptions,
): ReadonlyArray<T> {
  let filtered = [...targets];

  if (options.source) {
    const sourceId = options.source;
    const sourceExists = registry.some((entry) => entry.id === sourceId);
    if (!sourceExists) {
      throw new Error(`Unknown source: ${sourceId}`);
    }
    filtered = filtered.filter((target) => target.source === sourceId);
  }

  if (options.chord) {
    const term = options.chord.toLowerCase();
    const isCanonical = term.startsWith("chord:");
    filtered = filtered.filter((target) => {
      if (isCanonical) {
        return (target.chordId ?? "").toLowerCase() === term;
      }
      return target.slug.toLowerCase().includes(term);
    });
  }

  if (filtered.length === 0 && (options.chord || options.source)) {
    const requested = `${options.source ? `source=${options.source} ` : ""}${options.chord ? `chord=${options.chord}` : ""}`.trim();
    throw new Error(`No ingest targets matched filters: ${requested}`);
  }

  return filtered;
}

export function selectIngestTargets(
  targets: ReadonlyArray<IngestTarget>,
  registry: ReadonlyArray<SourceRegistryEntry>,
  options: IngestPipelineOptions,
): ReadonlyArray<IngestTarget> {
  return filterTargets(targets, registry, options);
}

export async function ingestNormalizedChordsWithTargets(
  targets: ReadonlyArray<PipelineIngestTarget>,
  registry: ReadonlyArray<SourceRegistryEntry>,
  options: IngestPipelineOptions = {},
): Promise<ChordRecord[]> {
  const refresh = options.refresh ?? false;
  const delayMs = options.delayMs ?? 250;
  const dryRun = options.dryRun ?? false;
  const rawRecords: RawChordRecord[] = [];
  const registryById = sourceRegistryMap(registry);
  const selectedTargets = filterTargets(targets, registry, options);

  if (dryRun) {
    process.stdout.write(`Dry run: would process ${selectedTargets.length} ingest targets\n`);
    for (const target of selectedTargets) {
      process.stdout.write(`- [${target.source}] ${target.slug} -> ${target.url}\n`);
    }
    return [];
  }

  for (const target of selectedTargets) {
    const sourceEntry = registryById.get(target.source);
    if (!sourceEntry) {
      throw new Error(`No source registry entry found for ${target.source}`);
    }

    const html = await getCachedHtml(sourceEntry.cacheDir, target.slug, target.url, { refresh, delayMs });
    rawRecords.push(sourceEntry.parse(html, target.url));
  }

  return normalizeRecords(rawRecords, {
    includeParserConfidence: options.includeParserConfidence ?? false,
  });
}

export async function ingestNormalizedChords(options: IngestPipelineOptions = {}): Promise<ChordRecord[]> {
  return ingestNormalizedChordsWithTargets(MVP_TARGETS, SOURCE_REGISTRY, options);
}
