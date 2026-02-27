import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { sanitizeSlug } from "./fetch/cache.js";
import { pathExists } from "../utils/fs.js";
import { expectedCacheKeys } from "./cacheTargets.js";

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

/**
 * Audit all expected cache entries under `data/sources/`.
 * Returns a deterministic summary of their status and checksums.
 */
export async function auditCache(cacheBase = "data/sources"): Promise<CacheAuditResult> {
  const keys = expectedCacheKeys();
  const entries: CacheEntry[] = [];

  for (const { source, slug } of keys) {
    const filePath = path.join(cacheBase, source, `${sanitizeSlug(slug)}.html`);
    const exists = await pathExists(filePath);

    if (!exists) {
      entries.push({ source, slug, filePath, status: "missing" });
      continue;
    }

    let content: Buffer;
    try {
      content = await readFile(filePath);
    } catch (err) {
      const isNotFound = err instanceof Error && (err as NodeJS.ErrnoException).code === "ENOENT";
      entries.push({ source, slug, filePath, status: isNotFound ? "missing" : "corrupt" });
      continue;
    }

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
