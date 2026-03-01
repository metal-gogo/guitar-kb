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
