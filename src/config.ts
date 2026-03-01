import type { ChordQuality } from "./types/model.js";

export const PROJECT_USER_AGENT = "GCKB/0.1 (+https://github.com/metal-gogo/guitar-kb)";

export const ROOT_ORDER = [
  "C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B",
] as const;

export const QUALITY_ORDER = ["maj", "min", "7", "maj7", "min7", "dim", "dim7", "aug", "sus2", "sus4"] as const;
export const CORE_QUALITY_ORDER = ["maj", "min", "7", "maj7"] as const;
export const SOURCE_PRIORITY = ["all-guitar-chords", "guitar-chord-org"] as const;

export type SourceId = typeof SOURCE_PRIORITY[number];

interface QualityTarget {
  quality: ChordQuality;
  cacheSuffix: string;
  guitarSlug: string;
  allGuitarSlug: string;
}

type QualityTargetDefinition = Omit<QualityTarget, "quality">;

export interface IngestTarget {
  source: SourceId;
  chordId: string;
  slug: string;
  url: string;
}

const QUALITY_TARGET_DEFINITIONS = {
  maj: { cacheSuffix: "major", guitarSlug: "maj", allGuitarSlug: "major" },
  min: { cacheSuffix: "minor", guitarSlug: "min", allGuitarSlug: "minor" },
  "7": { cacheSuffix: "7", guitarSlug: "7", allGuitarSlug: "dominant-7th" },
  maj7: { cacheSuffix: "maj7", guitarSlug: "maj7", allGuitarSlug: "major-7th" },
  min7: { cacheSuffix: "min7", guitarSlug: "min7", allGuitarSlug: "minor-7th" },
  dim: { cacheSuffix: "dim", guitarSlug: "dim", allGuitarSlug: "diminished" },
  dim7: { cacheSuffix: "dim7", guitarSlug: "dim7", allGuitarSlug: "diminished-7th" },
  aug: { cacheSuffix: "aug", guitarSlug: "aug", allGuitarSlug: "augmented" },
  sus2: { cacheSuffix: "sus2", guitarSlug: "sus2", allGuitarSlug: "suspended-2nd" },
  sus4: { cacheSuffix: "sus4", guitarSlug: "sus4", allGuitarSlug: "suspended-4th" },
} as const satisfies Record<ChordQuality, QualityTargetDefinition>;

const FULL_QUALITY_TARGETS: readonly QualityTarget[] = QUALITY_ORDER.map((quality) => ({
  quality,
  ...QUALITY_TARGET_DEFINITIONS[quality],
}));

const CORE_QUALITY_SET = new Set<ChordQuality>(CORE_QUALITY_ORDER);

function toRootSlug(root: string): string {
  let slug = root.toLowerCase().replace(/#/g, "-sharp");
  if (root.length > 1 && root.endsWith("b")) {
    slug = slug.replace(/b$/, "-flat");
  }
  return slug;
}

function buildTargetForSource(
  source: SourceId,
  root: string,
  rootSlug: string,
  qualityTarget: QualityTarget,
): IngestTarget {
  switch (source) {
    case "all-guitar-chords":
      return {
        source,
        chordId: `chord:${root}:${qualityTarget.quality}`,
        slug: `${rootSlug}-${qualityTarget.cacheSuffix}`,
        url: `https://www.all-guitar-chords.com/chords/index/${rootSlug}/${qualityTarget.allGuitarSlug}`,
      };
    case "guitar-chord-org":
      return {
        source,
        chordId: `chord:${root}:${qualityTarget.quality}`,
        slug: `${rootSlug}-${qualityTarget.cacheSuffix}`,
        url: `https://www.guitar-chord.org/${rootSlug}-${qualityTarget.guitarSlug}.html`,
      };
    default: {
      const _exhaustiveCheck: never = source;
      return _exhaustiveCheck;
    }
  }
}

function buildTargets(qualityTargets: ReadonlyArray<QualityTarget>): ReadonlyArray<IngestTarget> {
  return ROOT_ORDER.flatMap((root) => {
    const rootSlug = toRootSlug(root);
    return qualityTargets.flatMap((qualityTarget) => (
      SOURCE_PRIORITY.map((source) => buildTargetForSource(source, root, rootSlug, qualityTarget))
    ));
  });
}

export const FULL_MATRIX_TARGETS: ReadonlyArray<IngestTarget> = buildTargets(FULL_QUALITY_TARGETS);

export const CORE_MATRIX_TARGETS: ReadonlyArray<IngestTarget> = buildTargets(
  FULL_QUALITY_TARGETS.filter((target) => CORE_QUALITY_SET.has(target.quality)),
);

/** @deprecated Use CORE_MATRIX_TARGETS instead. */
export const MVP_TARGETS: ReadonlyArray<IngestTarget> = CORE_MATRIX_TARGETS;
