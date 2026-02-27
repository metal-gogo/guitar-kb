import type {
  ChordQuality,
  ChordRecord,
  ParserConfidence,
  RawChordRecord,
  SourceRef,
  VoicingPosition,
} from "../../types/model.js";
import { assertCanonicalChordId } from "../../types/guards.js";
import { compareChordOrder } from "../../utils/sort.js";

/** Thrown when two distinct chords share the same alias. */
export class AliasCollisionError extends Error {
  readonly collisions: ReadonlyArray<{ alias: string; chordIds: string[] }>;

  constructor(collisions: Array<{ alias: string; chordIds: string[] }>) {
    const lines = collisions
      .map(({ alias, chordIds }) => `  "${alias}" → ${chordIds.join(", ")}`)
      .join("\n");
    super(`Normalization alias collision detected:\n${lines}`);
    this.name = "AliasCollisionError";
    this.collisions = collisions;
  }
}

/**
 * Scans `chords` for any alias that maps to more than one canonical chord ID.
 *
 * Collisions between chords that are declared mutual enharmonic equivalents are
 * permitted and silently skipped — e.g. "Db" appearing in both `chord:C#:maj`
 * and `chord:Db:maj` is expected.  Any other collision throws
 * {@link AliasCollisionError}.
 */
export function detectAliasCollisions(chords: ChordRecord[]): void {
  // Build a lookup: chordId → set of its enharmonic equivalents
  const enharmonicMap = new Map<string, Set<string>>();
  for (const chord of chords) {
    enharmonicMap.set(chord.id, new Set(chord.enharmonic_equivalents ?? []));
  }

  /** Returns true when every pair in `ids` is a mutual enharmonic equivalent. */
  function allEnharmonic(ids: string[]): boolean {
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        const a = ids[i]!;
        const b = ids[j]!;
        if (!enharmonicMap.get(a)?.has(b) || !enharmonicMap.get(b)?.has(a)) {
          return false;
        }
      }
    }
    return true;
  }

  const aliasToIds = new Map<string, string[]>();
  for (const chord of chords) {
    for (const alias of chord.aliases ?? []) {
      const existing = aliasToIds.get(alias);
      if (existing) {
        existing.push(chord.id);
      } else {
        aliasToIds.set(alias, [chord.id]);
      }
    }
  }

  const collisions = [...aliasToIds.entries()]
    .filter(([, ids]) => ids.length > 1 && !allEnharmonic(ids))
    .map(([alias, chordIds]) => ({ alias, chordIds }));

  if (collisions.length > 0) {
    throw new AliasCollisionError(collisions);
  }
}

const QUALITY_MAP: Record<string, ChordQuality> = {
  m: "min",
  minor: "min",
  min: "min",
  "Δ": "maj",
  M: "maj",
  major: "maj",
  maj: "maj",
  "": "maj",
  "Δ7": "maj7",
  M7: "maj7",
  m7: "min7",
  "-7": "min7",
  minor7: "min7",
  min7: "min7",
  "7": "7",
  major7: "maj7",
  maj7: "maj7",
  m7b5: "dim",
  dim: "dim",
  diminished: "dim",
  "°": "dim",
  o: "dim",
  dim7: "dim7",
  diminished7: "dim7",
  "°7": "dim7",
  o7: "dim7",
  aug: "aug",
  "+": "aug",
  augmented: "aug",
  sus2: "sus2",
  suspended2: "sus2",
  sus4: "sus4",
  suspended4: "sus4",
  sus: "sus4"
};

const ENHARMONIC_ROOT: Record<string, string> = {
  "C#": "Db",
  Db: "C#",
  "D#": "Eb",
  Eb: "D#",
  "F#": "Gb",
  Gb: "F#",
  "G#": "Ab",
  Ab: "G#",
  "A#": "Bb",
  Bb: "A#"
};

const DEFAULT_FORMULAS: Record<ChordQuality, string[]> = {
  maj: ["1", "3", "5"],
  min: ["1", "b3", "5"],
  "7": ["1", "3", "5", "b7"],
  maj7: ["1", "3", "5", "7"],
  min7: ["1", "b3", "5", "b7"],
  dim: ["1", "b3", "b5"],
  dim7: ["1", "b3", "b5", "bb7"],
  aug: ["1", "3", "#5"],
  sus2: ["1", "2", "5"],
  sus4: ["1", "4", "5"],
};

const INTERVAL_TO_SEMITONES: Record<string, number> = {
  "1": 0,
  b2: 1,
  "2": 2,
  "#2": 3,
  b3: 3,
  "3": 4,
  "4": 5,
  "#4": 6,
  b5: 6,
  "5": 7,
  "#5": 8,
  b6: 8,
  "6": 9,
  bb7: 9,
  b7: 10,
  "7": 11,
};

const SHARP_NOTES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"] as const;
const FLAT_NOTES = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"] as const;

const NOTE_TO_INDEX: Record<string, number> = {
  C: 0,
  "C#": 1,
  Db: 1,
  D: 2,
  "D#": 3,
  Eb: 3,
  E: 4,
  F: 5,
  "F#": 6,
  Gb: 6,
  G: 7,
  "G#": 8,
  Ab: 8,
  A: 9,
  "A#": 10,
  Bb: 10,
  B: 11,
};

function normalizeStringArray(values: string[]): string[] {
  const unique = new Set(values.map((value) => value.trim()).filter(Boolean));
  return [...unique];
}

function defaultAlias(root: string, quality: ChordQuality): string {
  switch (quality) {
    case "maj":
      return root;
    case "min":
      return `${root}m`;
    case "7":
      return `${root}7`;
    case "maj7":
      return `${root}maj7`;
    case "min7":
      return `${root}m7`;
    case "dim":
      return `${root}dim`;
    case "dim7":
      return `${root}dim7`;
    case "aug":
      return `${root}aug`;
    case "sus2":
      return `${root}sus2`;
    case "sus4":
      return `${root}sus4`;
  }
}

function derivePitchClasses(root: string, formula: string[]): string[] {
  const rootIndex = NOTE_TO_INDEX[root];
  if (rootIndex === undefined) {
    return [];
  }
  const scale = root.includes("b") ? FLAT_NOTES : SHARP_NOTES;
  const notes = formula.map((interval) => INTERVAL_TO_SEMITONES[interval]).map((semitones) => {
    if (semitones === undefined) {
      return "";
    }
    return scale[(rootIndex + semitones) % 12] ?? "";
  }).filter(Boolean);

  return normalizeStringArray(notes);
}

export function normalizeQuality(qualityRaw: string): ChordQuality {
  const rawTrimmed = qualityRaw.trim();
  const exact = QUALITY_MAP[rawTrimmed];
  if (exact) {
    return exact;
  }

  const key = rawTrimmed.toLowerCase();
  const normalized = QUALITY_MAP[key];
  if (!normalized) {
    throw new Error(`Unsupported chord quality: ${qualityRaw}`);
  }
  return normalized;
}

export function toChordId(root: string, quality: ChordQuality): string {
  const id = `chord:${root}:${quality}`;
  assertCanonicalChordId(id);
  return id;
}

export function derivePosition(frets: Array<number | null>): VoicingPosition {
  const playedFrets = frets.filter((fret): fret is number => fret !== null);

  if (playedFrets.length === 0) {
    return "unknown";
  }

  const lowestPlayedFret = Math.min(...playedFrets);
  const hasOpenString = playedFrets.includes(0);
  const highestFret = Math.max(...playedFrets);
  const positiveFrets = playedFrets.filter((fret) => fret > 0);

  if (hasOpenString && highestFret <= 5) {
    return "open";
  }

  if (lowestPlayedFret >= 1) {
    const lowestFretCount = positiveFrets.filter((fret) => fret === lowestPlayedFret).length;
    if (lowestFretCount >= 4) {
      return "barre";
    }
  }

  if (lowestPlayedFret >= 5) {
    return "upper";
  }

  return "unknown";
}

export interface NormalizeRecordsOptions {
  includeParserConfidence?: boolean;
}

function mergeParserConfidence(
  existing: ParserConfidence[] | undefined,
  confidence: ParserConfidence | undefined,
): ParserConfidence[] | undefined {
  if (!confidence) {
    return existing;
  }

  const next = existing ? [...existing] : [];
  if (!next.some((entry) => entry.source === confidence.source)) {
    next.push(confidence);
  }
  next.sort((a, b) => {
    if (a.source < b.source) {
      return -1;
    }
    if (a.source > b.source) {
      return 1;
    }
    return 0;
  });
  return next;
}

export function normalizeRecords(raw: RawChordRecord[], options: NormalizeRecordsOptions = {}): ChordRecord[] {
  const merged = new Map<string, ChordRecord>();
  const includeParserConfidence = options.includeParserConfidence ?? false;

  for (const input of raw) {
    const quality = normalizeQuality(input.quality_raw);
    const id = toChordId(input.root, quality);
    const formula = normalizeStringArray(input.formula).length > 0
      ? normalizeStringArray(input.formula)
      : DEFAULT_FORMULAS[quality];
    const pitchClasses = normalizeStringArray(input.pitch_classes).length > 0
      ? normalizeStringArray(input.pitch_classes)
      : derivePitchClasses(input.root, formula);
    const aliases = normalizeStringArray(input.aliases).length > 0
      ? normalizeStringArray(input.aliases)
      : [defaultAlias(input.root, quality)];
    const sourceRef: SourceRef = {
      source: input.source,
      url: input.url
    };
    const parserConfidence = includeParserConfidence
      ? mergeParserConfidence(undefined, input.parser_confidence)
      : undefined;

    const existing = merged.get(id);
    if (!existing) {
      const equivalentRoot = ENHARMONIC_ROOT[input.root];
      const enharmonic = equivalentRoot ? [toChordId(equivalentRoot, quality)] : [];
      merged.set(id, {
        id,
        root: input.root,
        quality,
        aliases,
        enharmonic_equivalents: enharmonic,
        formula,
        pitch_classes: pitchClasses,
        tuning: ["E", "A", "D", "G", "B", "E"],
        voicings: input.voicings.map((voicing, index) => ({
          ...voicing,
          id: `${id}:v${index + 1}:${input.source}`,
          position: derivePosition(voicing.frets)
        })),
        notes: {
          summary: `${input.root} ${quality} chord with formula ${formula.join("-")}.`
        },
        ...(parserConfidence ? { parser_confidence: parserConfidence } : {}),
        source_refs: [sourceRef]
      });
      continue;
    }

    existing.aliases = normalizeStringArray([...(existing.aliases ?? []), ...aliases]);
    existing.voicings.push(...input.voicings.map((voicing, index) => ({
      ...voicing,
      id: `${id}:v${existing.voicings.length + index + 1}:${input.source}`,
      position: derivePosition(voicing.frets)
    })));
    existing.source_refs.push(sourceRef);
    existing.voicings.sort((a, b) => a.id.localeCompare(b.id));
    if (includeParserConfidence) {
      existing.parser_confidence = mergeParserConfidence(
        existing.parser_confidence,
        input.parser_confidence,
      );
    }
  }

  const result = [...merged.values()].sort(compareChordOrder);
  detectAliasCollisions(result);
  return result;
}
