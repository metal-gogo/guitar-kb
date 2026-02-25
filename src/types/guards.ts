import type { ChordQuality, VoicingPosition } from "./model.js";

const CHORD_ID_REGEX = /^chord:[A-G](#|b)?:[a-z0-9]+$/;

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
