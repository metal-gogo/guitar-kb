import { MVP_TARGETS } from "../config.js";

export interface CacheTargetKey {
  source: string;
  slug: string;
}

/** Build sorted list of unique (source, slug) pairs expected in cache. */
export function expectedCacheKeys(): CacheTargetKey[] {
  const seen = new Set<string>();
  const keys: CacheTargetKey[] = [];

  for (const target of MVP_TARGETS) {
    const dedupeKey = `${target.source}::${target.slug}`;
    if (seen.has(dedupeKey)) {
      continue;
    }
    seen.add(dedupeKey);
    keys.push({ source: target.source, slug: target.slug });
  }

  keys.sort((a, b) => {
    if (a.source < b.source) {
      return -1;
    }
    if (a.source > b.source) {
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

  return keys;
}
