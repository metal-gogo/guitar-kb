import { stat } from "node:fs/promises";
import path from "node:path";
import { expectedCacheKeys } from "./cacheTargets.js";
import { sanitizeSlug } from "./fetch/cache.js";
import { pathExists } from "../utils/fs.js";

const DAY_MS = 24 * 60 * 60 * 1000;
export const DEFAULT_MAX_AGE_DAYS = 30;

export interface SourceFreshnessOptions {
  cacheBase?: string;
  /** Reference timestamp for stale cutoff comparison (defaults to current time). */
  asOf?: Date;
  /** Max allowed cache age in days before a target is stale (default: 30). */
  maxAgeDays?: number;
}

export interface SourceFreshnessSummary {
  source: string;
  expectedTargets: number;
  presentTargets: number;
  missingTargets: number;
  staleTargets: number;
  oldestFetchedAt?: string;
  newestFetchedAt?: string;
}

export interface StaleTargetEntry {
  source: string;
  slug: string;
  filePath: string;
  fetchedAt: string;
  ageDays: number;
}

export interface SourceFreshnessReport {
  asOf: string;
  maxAgeDays: number;
  staleCutoff: string;
  totalExpectedTargets: number;
  totalPresentTargets: number;
  totalMissingTargets: number;
  totalStaleTargets: number;
  sources: SourceFreshnessSummary[];
  staleTargets: StaleTargetEntry[];
}

interface MutableSourceSummary {
  source: string;
  expectedTargets: number;
  presentTargets: number;
  missingTargets: number;
  staleTargets: number;
  oldestFetchedAtMs?: number;
  newestFetchedAtMs?: number;
}

function resolveAsOf(input?: Date): Date {
  if (!input) {
    return new Date();
  }
  if (Number.isNaN(input.getTime())) {
    throw new Error("Invalid as-of timestamp");
  }
  return input;
}

function resolveMaxAgeDays(input?: number): number {
  if (input === undefined) {
    return DEFAULT_MAX_AGE_DAYS;
  }
  if (!Number.isFinite(input) || input < 0) {
    throw new Error(`Invalid max age days: ${String(input)}`);
  }
  return input;
}

function sortStaleEntries(entries: StaleTargetEntry[]): void {
  entries.sort((a, b) => {
    if (a.source < b.source) {
      return -1;
    }
    if (a.source > b.source) {
      return 1;
    }
    if (a.fetchedAt < b.fetchedAt) {
      return -1;
    }
    if (a.fetchedAt > b.fetchedAt) {
      return 1;
    }
    if (a.slug < b.slug) {
      return -1;
    }
    if (a.slug > b.slug) {
      return 1;
    }
    return 0;
  });
}

export async function buildSourceFreshnessReport(options: SourceFreshnessOptions = {}): Promise<SourceFreshnessReport> {
  const cacheBase = options.cacheBase ?? path.join("data", "sources");
  const asOf = resolveAsOf(options.asOf);
  const maxAgeDays = resolveMaxAgeDays(options.maxAgeDays);
  const asOfMs = asOf.getTime();
  const staleCutoffMs = asOfMs - (maxAgeDays * DAY_MS);

  const keys = expectedCacheKeys();
  const sources = new Map<string, MutableSourceSummary>();
  const staleTargets: StaleTargetEntry[] = [];

  const ensureSource = (source: string): MutableSourceSummary => {
    const existing = sources.get(source);
    if (existing) {
      return existing;
    }
    const created: MutableSourceSummary = {
      source,
      expectedTargets: 0,
      presentTargets: 0,
      missingTargets: 0,
      staleTargets: 0,
    };
    sources.set(source, created);
    return created;
  };

  for (const { source, slug } of keys) {
    const summary = ensureSource(source);
    summary.expectedTargets += 1;

    const filePath = path.join(cacheBase, source, `${sanitizeSlug(slug)}.html`);
    const exists = await pathExists(filePath);

    if (!exists) {
      summary.missingTargets += 1;
      continue;
    }

    let fetchedAtMs: number;
    try {
      const stats = await stat(filePath);
      fetchedAtMs = stats.mtime.getTime();
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (code === "ENOENT") {
        summary.missingTargets += 1;
        continue;
      }
      throw error;
    }

    summary.presentTargets += 1;
    summary.oldestFetchedAtMs =
      summary.oldestFetchedAtMs === undefined
        ? fetchedAtMs
        : Math.min(summary.oldestFetchedAtMs, fetchedAtMs);
    summary.newestFetchedAtMs =
      summary.newestFetchedAtMs === undefined
        ? fetchedAtMs
        : Math.max(summary.newestFetchedAtMs, fetchedAtMs);

    if (fetchedAtMs < staleCutoffMs) {
      summary.staleTargets += 1;
      staleTargets.push({
        source,
        slug,
        filePath,
        fetchedAt: new Date(fetchedAtMs).toISOString(),
        ageDays: (asOfMs - fetchedAtMs) / DAY_MS,
      });
    }
  }

  const sourceSummaries = Array.from(sources.values())
    .sort((a, b) => (a.source < b.source ? -1 : a.source > b.source ? 1 : 0))
    .map((summary): SourceFreshnessSummary => ({
      source: summary.source,
      expectedTargets: summary.expectedTargets,
      presentTargets: summary.presentTargets,
      missingTargets: summary.missingTargets,
      staleTargets: summary.staleTargets,
      oldestFetchedAt:
        summary.oldestFetchedAtMs === undefined
          ? undefined
          : new Date(summary.oldestFetchedAtMs).toISOString(),
      newestFetchedAt:
        summary.newestFetchedAtMs === undefined
          ? undefined
          : new Date(summary.newestFetchedAtMs).toISOString(),
    }));

  sortStaleEntries(staleTargets);

  const totals = sourceSummaries.reduce(
    (acc, source) => {
      acc.expected += source.expectedTargets;
      acc.present += source.presentTargets;
      acc.missing += source.missingTargets;
      acc.stale += source.staleTargets;
      return acc;
    },
    { expected: 0, present: 0, missing: 0, stale: 0 },
  );

  return {
    asOf: asOf.toISOString(),
    maxAgeDays,
    staleCutoff: new Date(staleCutoffMs).toISOString(),
    totalExpectedTargets: totals.expected,
    totalPresentTargets: totals.present,
    totalMissingTargets: totals.missing,
    totalStaleTargets: totals.stale,
    sources: sourceSummaries,
    staleTargets,
  };
}

export function formatSourceFreshnessReport(report: SourceFreshnessReport): string {
  const lines: string[] = [];

  lines.push(`AS_OF ${report.asOf}`);
  lines.push(`MAX_AGE_DAYS ${report.maxAgeDays.toFixed(2)}`);
  lines.push(`STALE_CUTOFF ${report.staleCutoff}`);
  lines.push(
    `TOTAL expected=${report.totalExpectedTargets} present=${report.totalPresentTargets} missing=${report.totalMissingTargets} stale=${report.totalStaleTargets}`,
  );
  lines.push("");

  for (const source of report.sources) {
    lines.push(
      `SOURCE ${source.source} expected=${source.expectedTargets} present=${source.presentTargets} missing=${source.missingTargets} stale=${source.staleTargets} oldest=${source.oldestFetchedAt ?? "-"} newest=${source.newestFetchedAt ?? "-"}`,
    );
  }

  lines.push("");
  lines.push(`STALE_TARGETS ${report.staleTargets.length}`);

  for (const stale of report.staleTargets) {
    lines.push(
      `STALE ${stale.source}/${stale.slug}.html fetched_at=${stale.fetchedAt} age_days=${stale.ageDays.toFixed(2)}`,
    );
  }

  return `${lines.join("\n")}\n`;
}
