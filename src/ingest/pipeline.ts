import { FULL_MATRIX_TARGETS, QUALITY_ORDER } from "../config.js";
import { getCachedHtml } from "./fetch/cache.js";
import { normalizeRecords } from "./normalize/normalize.js";
import { SOURCE_REGISTRY } from "./sourceRegistry.js";
import type { ChordQuality, ChordRecord, RawChordRecord, SourceRegistryEntry } from "../types/model.js";
import type { IngestTarget } from "../config.js";

export interface IngestPipelineOptions {
  refresh?: boolean;
  delayMs?: number;
  chord?: string;
  source?: string;
  dryRun?: boolean;
  includeParserConfidence?: boolean;
  strictCapabilities?: boolean;
  capabilityAllowlist?: ReadonlyArray<string>;
}

interface PipelineIngestTarget {
  source: string;
  chordId?: string;
  slug: string;
  url: string;
}

type UnsupportedReason = "unsupported_quality" | "unsupported_root";

interface CapabilityDecision<T extends PipelineIngestTarget> {
  target: T;
  supported: boolean;
  reason?: UnsupportedReason;
}

interface CapabilityGap {
  chordId: string;
  unsupportedSources: string[];
}

interface CapabilitySelection<T extends PipelineIngestTarget> {
  selectedTargets: ReadonlyArray<T>;
  processableTargets: ReadonlyArray<T>;
  skippedUnsupported: ReadonlyArray<CapabilityDecision<T>>;
  unresolvedGaps: ReadonlyArray<CapabilityGap>;
  allowlistedGaps: ReadonlyArray<CapabilityGap>;
}

const KNOWN_QUALITY_SET = new Set<ChordQuality>(QUALITY_ORDER);
const STRICT_CAPABILITIES_ENV = "INGEST_STRICT_CAPABILITIES";
const CAPABILITY_ALLOWLIST_ENV = "INGEST_CAPABILITY_ALLOWLIST";

// Temporary explicit exceptions for known upstream target gaps.
export const TEMPORARY_CAPABILITY_ALLOWLIST: ReadonlyArray<string> = [];

function sourceRegistryMap(
  registry: ReadonlyArray<SourceRegistryEntry>,
): Map<string, SourceRegistryEntry> {
  return new Map(registry.map((entry) => [entry.id, entry]));
}

function parseStrictCapabilitiesEnv(value: string | undefined): boolean {
  if (!value) {
    return false;
  }
  return value === "1" || value.toLowerCase() === "true";
}

function parseAllowlistEnv(value: string | undefined): ReadonlyArray<string> {
  if (!value) {
    return [];
  }
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

function capabilityAllowlist(options: IngestPipelineOptions): ReadonlySet<string> {
  return new Set([
    ...TEMPORARY_CAPABILITY_ALLOWLIST,
    ...parseAllowlistEnv(process.env[CAPABILITY_ALLOWLIST_ENV]),
    ...(options.capabilityAllowlist ?? []),
  ]);
}

function strictCapabilitiesEnabled(options: IngestPipelineOptions): boolean {
  if (typeof options.strictCapabilities === "boolean") {
    return options.strictCapabilities;
  }
  return parseStrictCapabilitiesEnv(process.env[STRICT_CAPABILITIES_ENV]);
}

function parseCanonicalChordId(chordId: string | undefined): { root: string; quality: ChordQuality } | null {
  if (!chordId) {
    return null;
  }
  const parts = chordId.split(":");
  if (parts.length !== 3 || parts[0] !== "chord") {
    return null;
  }

  const quality = parts[2] as ChordQuality;
  if (!KNOWN_QUALITY_SET.has(quality)) {
    return null;
  }

  return {
    root: parts[1] ?? "",
    quality,
  };
}

function evaluateCapabilitiesForTarget<T extends PipelineIngestTarget>(
  target: T,
  sourceEntry: SourceRegistryEntry,
): CapabilityDecision<T> {
  const parsed = parseCanonicalChordId(target.chordId);
  if (!parsed) {
    return { target, supported: true };
  }

  if (!sourceEntry.capabilities.qualities.includes(parsed.quality)) {
    return { target, supported: false, reason: "unsupported_quality" };
  }
  if (!sourceEntry.capabilities.roots.includes(parsed.root)) {
    return { target, supported: false, reason: "unsupported_root" };
  }
  return { target, supported: true };
}

function applyCapabilitySelection<T extends PipelineIngestTarget>(
  selectedTargets: ReadonlyArray<T>,
  registryById: ReadonlyMap<string, SourceRegistryEntry>,
  options: IngestPipelineOptions,
): CapabilitySelection<T> {
  const processableTargets: T[] = [];
  const skippedUnsupported: CapabilityDecision<T>[] = [];
  const gapOrder: string[] = [];
  const gapByChord = new Map<string, { hasProcessable: boolean; unsupportedSources: Set<string> }>();
  const allowlist = capabilityAllowlist(options);

  for (const target of selectedTargets) {
    const sourceEntry = registryById.get(target.source);
    if (!sourceEntry) {
      throw new Error(`No source registry entry found for ${target.source}`);
    }

    const decision = evaluateCapabilitiesForTarget(target, sourceEntry);
    if (!decision.supported) {
      skippedUnsupported.push(decision);
    } else {
      processableTargets.push(target);
    }

    const chordId = target.chordId;
    if (!chordId) {
      continue;
    }

    let gap = gapByChord.get(chordId);
    if (!gap) {
      gap = { hasProcessable: false, unsupportedSources: new Set<string>() };
      gapByChord.set(chordId, gap);
      gapOrder.push(chordId);
    }

    if (decision.supported) {
      gap.hasProcessable = true;
    } else {
      gap.unsupportedSources.add(target.source);
    }
  }

  const unresolvedGaps: CapabilityGap[] = [];
  const allowlistedGaps: CapabilityGap[] = [];
  for (const chordId of gapOrder) {
    const gap = gapByChord.get(chordId);
    if (!gap || gap.hasProcessable) {
      continue;
    }

    const report: CapabilityGap = {
      chordId,
      unsupportedSources: [...gap.unsupportedSources].sort((a, b) => a.localeCompare(b)),
    };
    if (allowlist.has(chordId)) {
      allowlistedGaps.push(report);
    } else {
      unresolvedGaps.push(report);
    }
  }

  return {
    selectedTargets,
    processableTargets,
    skippedUnsupported,
    unresolvedGaps,
    allowlistedGaps,
  };
}

function writeCapabilityDiagnostics<T extends PipelineIngestTarget>(
  selection: CapabilitySelection<T>,
  options: IngestPipelineOptions,
): void {
  const shouldLog =
    selection.skippedUnsupported.length > 0
    || selection.unresolvedGaps.length > 0
    || selection.allowlistedGaps.length > 0
    || strictCapabilitiesEnabled(options);

  if (!shouldLog) {
    return;
  }

  process.stdout.write(
    `Capability diagnostics: selected=${selection.selectedTargets.length} processable=${selection.processableTargets.length} `
    + `skipped_unsupported=${selection.skippedUnsupported.length} `
    + `allowlisted_gaps=${selection.allowlistedGaps.length} unresolved_gaps=${selection.unresolvedGaps.length}\n`,
  );

  for (const decision of selection.skippedUnsupported) {
    process.stdout.write(
      `SKIP_UNSUPPORTED source=${decision.target.source} chord=${decision.target.chordId ?? "unknown"} `
      + `slug=${decision.target.slug} reason=${decision.reason ?? "unsupported"}\n`,
    );
  }

  for (const gap of selection.allowlistedGaps) {
    process.stdout.write(
      `GAP_ALLOWLISTED chord=${gap.chordId} unsupported_sources=${gap.unsupportedSources.join(",")}\n`,
    );
  }

  for (const gap of selection.unresolvedGaps) {
    process.stdout.write(
      `GAP_UNRESOLVED chord=${gap.chordId} unsupported_sources=${gap.unsupportedSources.join(",")}\n`,
    );
  }
}

function enforceStrictCapabilities<T extends PipelineIngestTarget>(
  selection: CapabilitySelection<T>,
  options: IngestPipelineOptions,
): void {
  if (!strictCapabilitiesEnabled(options) || selection.unresolvedGaps.length === 0) {
    return;
  }

  throw new Error(
    "Strict capability mode enabled, unresolved required gaps: "
    + `${selection.unresolvedGaps.length} (first=${selection.unresolvedGaps[0]?.chordId ?? "unknown"})`,
  );
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

export function defaultIngestTargets(options: IngestPipelineOptions = {}): ReadonlyArray<IngestTarget> {
  void options;
  return FULL_MATRIX_TARGETS;
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
  const capabilitySelection = applyCapabilitySelection(selectedTargets, registryById, options);

  if (dryRun) {
    process.stdout.write(
      `Dry run: would process ${capabilitySelection.processableTargets.length} ingest targets `
      + `(skipped unsupported: ${capabilitySelection.skippedUnsupported.length})\n`,
    );
    for (const target of capabilitySelection.processableTargets) {
      process.stdout.write(`- [${target.source}] ${target.slug} -> ${target.url}\n`);
    }
    writeCapabilityDiagnostics(capabilitySelection, options);
    enforceStrictCapabilities(capabilitySelection, options);
    return [];
  }

  writeCapabilityDiagnostics(capabilitySelection, options);
  enforceStrictCapabilities(capabilitySelection, options);

  for (const target of capabilitySelection.processableTargets) {
    const sourceEntry = registryById.get(target.source);
    if (!sourceEntry) {
      throw new Error(`No source registry entry found for ${target.source}`);
    }

    try {
      const html = await getCachedHtml(sourceEntry.cacheDir, target.slug, target.url, { refresh, delayMs });
      rawRecords.push(sourceEntry.parse(html, target.url));
    } catch (error: unknown) {
      const message = String(error);
      if (message.includes("HTTP ")) {
        const httpCode = message.match(/HTTP\s+(\d{3})/)?.[1] ?? "unknown";
        process.stdout.write(
          `SKIP_MISSING source=${target.source} chord=${target.chordId ?? "unknown"} `
          + `slug=${target.slug} reason=http_${httpCode}\n`,
        );
        continue;
      }
      throw error;
    }
  }

  return normalizeRecords(rawRecords, {
    includeParserConfidence: options.includeParserConfidence ?? false,
  });
}

export async function ingestNormalizedChords(options: IngestPipelineOptions = {}): Promise<ChordRecord[]> {
  const targets = defaultIngestTargets(options);
  return ingestNormalizedChordsWithTargets(targets, SOURCE_REGISTRY, options);
}
