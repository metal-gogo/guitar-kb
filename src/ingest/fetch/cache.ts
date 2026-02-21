import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { PROJECT_USER_AGENT } from "../../config.js";

interface FetchOptions {
  refresh: boolean;
  delayMs: number;
}

function sanitizeSlug(slug: string): string {
  return slug.replace(/[^a-z0-9-]/gi, "-").toLowerCase();
}

async function exists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
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
  const hasCache = await exists(cachePath);

  if (hasCache && !options.refresh) {
    return readFile(cachePath, "utf8");
  }

  await sleep(options.delayMs);
  const html = await fetchWithRetry(url, 2, options.delayMs);
  await mkdir(path.dirname(cachePath), { recursive: true });
  await writeFile(cachePath, html, "utf8");
  return html;
}
