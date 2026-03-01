import type { ChordQuality } from "./types/model.js";

export const PROJECT_USER_AGENT = "GCKB/0.1 (+https://github.com/metal-gogo/guitar-kb)";

export const ROOT_ORDER = [
  "C", "C#", "Db", "D", "D#", "Eb", "E", "F", "F#", "Gb", "G", "G#", "Ab", "A", "A#", "Bb", "B"
] as const;

export const QUALITY_ORDER = ["maj", "min", "7", "maj7", "min7", "dim", "dim7", "aug", "sus2", "sus4"] as const;

interface QualityTarget {
  quality: ChordQuality;
  cacheSuffix: string;
  guitarSlug: string;
  allGuitarSlug: string;
}

export interface IngestTarget {
  source: "guitar-chord-org" | "all-guitar-chords";
  chordId: string;
  slug: string;
  url: string;
}

const FULL_QUALITY_TARGETS: readonly QualityTarget[] = [
  { quality: "maj", cacheSuffix: "major", guitarSlug: "maj", allGuitarSlug: "major" },
  { quality: "min", cacheSuffix: "minor", guitarSlug: "min", allGuitarSlug: "minor" },
  { quality: "7", cacheSuffix: "7", guitarSlug: "7", allGuitarSlug: "dominant-7th" },
  { quality: "maj7", cacheSuffix: "maj7", guitarSlug: "maj7", allGuitarSlug: "major-7th" },
  { quality: "min7", cacheSuffix: "min7", guitarSlug: "min7", allGuitarSlug: "minor-7th" },
  { quality: "dim", cacheSuffix: "dim", guitarSlug: "dim", allGuitarSlug: "diminished" },
  { quality: "dim7", cacheSuffix: "dim7", guitarSlug: "dim7", allGuitarSlug: "diminished-7th" },
  { quality: "aug", cacheSuffix: "aug", guitarSlug: "aug", allGuitarSlug: "augmented" },
  { quality: "sus2", cacheSuffix: "sus2", guitarSlug: "sus2", allGuitarSlug: "suspended-2nd" },
  { quality: "sus4", cacheSuffix: "sus4", guitarSlug: "sus4", allGuitarSlug: "suspended-4th" },
] as const;

const CORE_QUALITY_SET = new Set<ChordQuality>(["maj", "min", "7", "maj7"]);

function toRootSlug(root: string): string {
  let slug = root.toLowerCase().replace(/#/g, "-sharp");
  if (root.length > 1 && root.endsWith("b")) {
    slug = slug.replace(/b$/, "-flat");
  }
  return slug;
}

function buildTargets(qualityTargets: ReadonlyArray<QualityTarget>): ReadonlyArray<IngestTarget> {
  return ROOT_ORDER.flatMap((root) => {
    const rootSlug = toRootSlug(root);
    return qualityTargets.flatMap((qualityTarget) => {
      const cacheSlug = `${rootSlug}-${qualityTarget.cacheSuffix}`;
      return [
        {
          source: "guitar-chord-org" as const,
          chordId: `chord:${root}:${qualityTarget.quality}`,
          slug: cacheSlug,
          url: `https://www.guitar-chord.org/${rootSlug}-${qualityTarget.guitarSlug}.html`,
        },
        {
          source: "all-guitar-chords" as const,
          chordId: `chord:${root}:${qualityTarget.quality}`,
          slug: cacheSlug,
          url: `https://www.all-guitar-chords.com/chords/index/${rootSlug}/${qualityTarget.allGuitarSlug}`,
        },
      ];
    });
  });
}

export const FULL_MATRIX_TARGETS: ReadonlyArray<IngestTarget> = buildTargets(FULL_QUALITY_TARGETS);

export const MVP_TARGETS: ReadonlyArray<IngestTarget> = buildTargets(
  FULL_QUALITY_TARGETS.filter((target) => CORE_QUALITY_SET.has(target.quality)),
);
