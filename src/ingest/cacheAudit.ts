import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { MVP_TARGETS } from "../config.js";
import { pathExists } from "../utils/fs.js";

export type CacheEntryStatus = "ok" | "missing" | "corrupt";

export interface CacheEntry {
  source: string;
  slug: string;
  filePath: string;
  status: CacheEntryStatus;
  /** SHA-256 hex digest — present when status is "ok" or "corrupt" */
  checksum?: string;
}

export interface CacheAuditResult {
  entries: CacheEntry[];
  totalExpected: number;
  okCount: number;
  missingCount: number;
  corruptCount: number;
}

const MINIMUM_VALID_HTML_BYTES = 64;

function computeChecksum(content: Buffer): string {
  return createHash("sha256").update(content).digest("hex");
}

/** Build sorted list of unique (source, slug) pairs expected in the cache. */
function expectedCacheKeys(): Array<{ source: string; slug: string }> {
  const seen = new Set<string>();
  const result: Array<{ source: string; slug: string }> = [];
  for (const target of MVP_TARGETS) {
    const key = `${target.source}::${target.slug}`;
    if (!seen.has(key)) {
      seen.add(key);
      result.push({ source: target.source, slug: target.slug });
    }
  }
  // Deterministic ordering: source asc, then slug asc
  result.sort((a, b) => {
    const sourceCmp = a.source.localeCompare(b.source);
    return sourceCmp !== 0 ? sourceCmp : a.slug.localeCompare(b.slug);
  });
  return result;
}

/**
 * Audit all expected cache entries under `data/sources/`.
 * Returns a deterministic summary of their status and checksums.
 */
export async function auditCache(cacheBase = "data/sources"): Promise<CacheAuditResult> {
  const keys = expectedCacheKeys();
  const entries: CacheEntry[] = [];

  for (const { source, slug } of keys) {
    const filePath = path.join(cacheBase, source, `${slug}.html`);
    const exists = await pathExists(filePath);

    if (!exists) {
      entries.push({ source, slug, filePath, status: "missing" });
      continue;
    }

    const content = await readFile(filePath);
    const checksum = computeChecksum(content);

    if (content.length < MINIMUM_VALID_HTML_BYTES) {
      entries.push({ source, slug, filePath, status: "corrupt", checksum });
    } else {
      entries.push({ source, slug, filePath, status: "ok", checksum });
    }
  }

  const okCount = entries.filter((e) => e.status === "ok").length;
  const missingCount = entries.filter((e) => e.status === "missing").length;
  const corruptCount = entries.filter((e) => e.status === "corrupt").length;

  return {
    entries,
    totalExpected: keys.length,
    okCount,
    missingCount,
    corruptCount,
  };
}
