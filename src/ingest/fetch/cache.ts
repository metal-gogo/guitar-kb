import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { PROJECT_USER_AGENT } from "../../config.js";
import { pathExists } from "../../utils/fs.js";

interface FetchOptions {
  refresh: boolean;
  delayMs: number;
}

export function sanitizeSlug(slug: string): string {
  return slug.replace(/[^a-z0-9-]/gi, "-").toLowerCase();
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(url: string, retries: number, delayMs: number): Promise<string> {
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
      await sleep(delayMs * (attempt + 1));
      attempt += 1;
    }
  }
  throw new Error(`Failed to fetch ${url}`);
}

export async function getCachedHtml(source: string, slug: string, url: string, options: FetchOptions): Promise<string> {
  const cachePath = path.join("data", "sources", source, `${sanitizeSlug(slug)}.html`);
  const hasCache = await pathExists(cachePath);

  if (hasCache && !options.refresh) {
    return readFile(cachePath, "utf8");
  }

  await sleep(options.delayMs);
  const html = await fetchWithRetry(url, 2, options.delayMs);
  await mkdir(path.dirname(cachePath), { recursive: true });
  await writeFile(cachePath, html, "utf8");
  return html;
}
