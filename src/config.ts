export const PROJECT_USER_AGENT = "GCKB/0.1 (+https://github.com/metal-gogo/guitar-kb)";

export const ROOT_ORDER = [
  "C", "C#", "Db", "D", "D#", "Eb", "E", "F", "F#", "Gb", "G", "G#", "Ab", "A", "A#", "Bb", "B"
] as const;

export const QUALITY_ORDER = ["maj", "min", "7", "maj7", "min7", "dim", "dim7", "aug", "sus2", "sus4"] as const;

interface CoreQualityTarget {
  quality: "maj" | "min" | "7" | "maj7";
  cacheSuffix: "major" | "minor" | "7" | "maj7";
  guitarSlug: "maj" | "min" | "7" | "maj7";
  allGuitarSlug: "major" | "minor" | "dominant-7th" | "major-7th";
}

export interface IngestTarget {
  source: "guitar-chord-org" | "all-guitar-chords";
  chordId: string;
  slug: string;
  url: string;
}

const CORE_QUALITY_TARGETS: readonly CoreQualityTarget[] = [
  { quality: "maj", cacheSuffix: "major", guitarSlug: "maj", allGuitarSlug: "major" },
  { quality: "min", cacheSuffix: "minor", guitarSlug: "min", allGuitarSlug: "minor" },
  { quality: "7", cacheSuffix: "7", guitarSlug: "7", allGuitarSlug: "dominant-7th" },
  { quality: "maj7", cacheSuffix: "maj7", guitarSlug: "maj7", allGuitarSlug: "major-7th" },
] as const;

function toRootSlug(root: string): string {
  let slug = root.toLowerCase().replace(/#/g, "-sharp");
  if (root.length > 1 && root.endsWith("b")) {
    slug = slug.replace(/b$/, "-flat");
  }
  return slug;
}

export const MVP_TARGETS: ReadonlyArray<IngestTarget> = ROOT_ORDER.flatMap((root) => {
  const rootSlug = toRootSlug(root);
  return CORE_QUALITY_TARGETS.flatMap((qualityTarget) => {
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
        url: `https://all-guitar-chords.com/chords/index/${rootSlug}/${qualityTarget.allGuitarSlug}`,
      },
    ];
  });
});
