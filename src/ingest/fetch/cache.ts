import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { PROJECT_USER_AGENT } from "../../config.js";
import { pathExists } from "../../utils/fs.js";

interface FetchOptions {
  refresh: boolean;
  delayMs: number;
}

/**
 * Structured retry log event emitted by fetchWithRetry.
 *
 * Fields are stable and deterministic — no timestamps or nondeterministic data.
 */
export interface RetryLogEvent {
  /** Event type — always "retry" for mid-stream retries. */
  type: "retry";
  /** Source identifier (e.g., "guitar-chord-org"). */
  source: string;
  /** URL being fetched. */
  url: string;
  /** Attempt number that just failed (1-based). */
  attempt: number;
  /** Maximum attempts allowed. */
  maxAttempts: number;
  /** Delay in ms before the next attempt. */
  delayMs: number;
  /** Error message from the failed attempt. */
  error: string;
}

/** Log callback type. Defaults to writing to stderr. */
export type RetryLogger = (event: RetryLogEvent) => void;

function defaultRetryLogger(event: RetryLogEvent): void {
  process.stderr.write(
    `[ingest] retry source=${event.source} url=${event.url} attempt=${event.attempt}/${event.maxAttempts} delay=${event.delayMs}ms error=${event.error}\n`,
  );
}

export function sanitizeSlug(slug: string): string {
  return slug.replace(/[^a-z0-9-]/gi, "-").toLowerCase();
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(
  url: string,
  retries: number,
  delayMs: number,
  source: string,
  logger: RetryLogger = defaultRetryLogger,
): Promise<string> {
  const maxAttempts = retries + 1;
  let attempt = 0;
  while (attempt <= retries) {
    try {
      const response = await fetch(url, { headers: { "User-Agent": PROJECT_USER_AGENT } });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} for ${url}`);
      }
      return await response.text();
    } catch (error) {
      if (attempt === retries) {
        throw error;
      }
      const delay = delayMs * (attempt + 1);
      logger({
        type: "retry",
        source,
        url,
        attempt: attempt + 1,
        maxAttempts,
        delayMs: delay,
        error: error instanceof Error ? error.message : String(error),
      });
      await sleep(delay);
      attempt += 1;
    }
  }
  throw new Error(`Failed to fetch ${url}`);
}

export async function getCachedHtml(
  source: string,
  slug: string,
  url: string,
  options: FetchOptions,
  logger?: RetryLogger,
): Promise<string> {
  const cachePath = path.join("data", "sources", source, `${sanitizeSlug(slug)}.html`);
  const hasCache = await pathExists(cachePath);

  if (hasCache && !options.refresh) {
    return readFile(cachePath, "utf8");
  }

  await sleep(options.delayMs);
  const html = await fetchWithRetry(url, 2, options.delayMs, source, logger);
  await mkdir(path.dirname(cachePath), { recursive: true });
  await writeFile(cachePath, html, "utf8");
  return html;
}

