import { parseAllGuitarChords } from "./parsers/allGuitarChords.js";
import { parseGuitarChordOrg } from "./parsers/guitarChordOrg.js";
import { ROOT_ORDER } from "../config.js";
import type { SourceRegistryEntry } from "../types/model.js";

const CORE_SUPPORTED_QUALITIES = ["maj", "min", "7", "maj7"] as const;

export const SOURCE_REGISTRY: ReadonlyArray<SourceRegistryEntry> = [
  {
    id: "guitar-chord-org",
    displayName: "Guitar Chord Org",
    baseUrl: "https://www.guitar-chord.org",
    cacheDir: "guitar-chord-org",
    capabilities: {
      roots: ROOT_ORDER,
      qualities: CORE_SUPPORTED_QUALITIES,
    },
    parse: parseGuitarChordOrg,
  },
  {
    id: "all-guitar-chords",
    displayName: "All Guitar Chords",
    baseUrl: "https://www.all-guitar-chords.com",
    cacheDir: "all-guitar-chords",
    capabilities: {
      roots: ROOT_ORDER,
      qualities: CORE_SUPPORTED_QUALITIES,
    },
    parse: parseAllGuitarChords,
  },
];
