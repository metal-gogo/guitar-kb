import type { ChordQuality, FlatCanonicalRoot, VoicingPosition } from "./model.js";

const CHORD_ID_REGEX = /^chord:[A-G](#|b)?:[a-z0-9]+$/;
const FLAT_BASELINE_ROOTS: readonly FlatCanonicalRoot[] = [
  "C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B",
];
const SHARP_TO_FLAT_ROOT: Readonly<Record<string, FlatCanonicalRoot>> = {
  "C#": "Db",
  "D#": "Eb",
  "F#": "Gb",
  "G#": "Ab",
  "A#": "Bb",
};
const FLAT_TO_SHARP_ROOT: Readonly<Record<FlatCanonicalRoot, string | undefined>> = {
  C: undefined,
  Db: "C#",
  D: undefined,
  Eb: "D#",
  E: undefined,
  F: undefined,
  Gb: "F#",
  G: undefined,
  Ab: "G#",
  A: undefined,
  Bb: "A#",
  B: undefined,
};

export function isCanonicalChordId(value: string): boolean {
  return CHORD_ID_REGEX.test(value);
}

export function assertCanonicalChordId(value: string): void {
  if (!isCanonicalChordId(value)) {
    throw new Error(`Invalid canonical chord id: ${value}`);
  }
}

export function isChordQuality(value: string): value is ChordQuality {
  return ["maj", "min", "7", "maj7", "min7", "dim", "dim7", "aug", "sus2", "sus4"].includes(value);
}

export function isVoicingPosition(value: string): value is VoicingPosition {
  return ["open", "barre", "upper", "unknown"].includes(value);
}

export function isFlatCanonicalRoot(value: string): value is FlatCanonicalRoot {
  return FLAT_BASELINE_ROOTS.includes(value as FlatCanonicalRoot);
}

export function toFlatCanonicalRoot(value: string): FlatCanonicalRoot | null {
  if (isFlatCanonicalRoot(value)) {
    return value;
  }
  return SHARP_TO_FLAT_ROOT[value] ?? null;
}

export function sharpAliasForFlatCanonicalRoot(value: FlatCanonicalRoot): string | undefined {
  return FLAT_TO_SHARP_ROOT[value];
}
