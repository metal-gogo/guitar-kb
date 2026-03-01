import { CORE_MATRIX_TARGETS } from "../config.js";

export interface CacheTargetKey {
  source: string;
  slug: string;
}

const SHARP_ALIAS_BY_FLAT_ROOT: Readonly<Record<string, string>> = {
  Db: "C#",
  Eb: "D#",
  Gb: "F#",
  Ab: "G#",
  Bb: "A#",
};

const QUALITY_SLUG_BY_QUALITY: Readonly<Record<string, string>> = {
  maj: "major",
  min: "minor",
  "7": "7",
  maj7: "maj7",
  min7: "min7",
  dim: "dim",
  dim7: "dim7",
  aug: "aug",
  sus2: "sus2",
  sus4: "sus4",
};

function toRootSlug(root: string): string {
  let slug = root.toLowerCase().replace(/#/g, "-sharp");
  if (slug.endsWith("b")) {
    slug = `${slug.slice(0, -1)}-flat`;
  }
  return slug;
}

function parseChordId(chordId?: string): { root: string; quality: string } | null {
  if (!chordId) {
    return null;
  }
  const match = /^chord:([^:]+):([^:]+)$/.exec(chordId);
  if (!match) {
    return null;
  }
  return { root: match[1], quality: match[2] };
}

function buildAliasSlug(chordId?: string): string | null {
  const parsed = parseChordId(chordId);
  if (!parsed) {
    return null;
  }
  const sharpAlias = SHARP_ALIAS_BY_FLAT_ROOT[parsed.root];
  if (!sharpAlias) {
    return null;
  }
  const qualitySlug = QUALITY_SLUG_BY_QUALITY[parsed.quality];
  if (!qualitySlug) {
    return null;
  }
  return `${toRootSlug(sharpAlias)}-${qualitySlug}`;
}

/** Build sorted list of unique (source, slug) pairs expected in cache. */
export function expectedCacheKeys(): CacheTargetKey[] {
  const seen = new Set<string>();
  const keys: CacheTargetKey[] = [];

  for (const target of CORE_MATRIX_TARGETS) {
    const slugs = [target.slug];
    const aliasSlug = buildAliasSlug(target.chordId);
    if (aliasSlug) {
      slugs.push(aliasSlug);
    }

    for (const slug of slugs) {
      const dedupeKey = `${target.source}::${slug}`;
      if (seen.has(dedupeKey)) {
        continue;
      }
      seen.add(dedupeKey);
      keys.push({ source: target.source, slug });
    }
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
