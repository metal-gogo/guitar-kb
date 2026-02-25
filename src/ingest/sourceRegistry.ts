import { parseAllGuitarChords } from "./parsers/allGuitarChords.js";
import { parseGuitarChordOrg } from "./parsers/guitarChordOrg.js";
import type { SourceRegistryEntry } from "../types/model.js";

export const SOURCE_REGISTRY: ReadonlyArray<SourceRegistryEntry> = [
  {
    id: "guitar-chord-org",
    displayName: "Guitar Chord Org",
    baseUrl: "https://www.guitar-chord.org",
    cacheDir: "guitar-chord-org",
    parse: parseGuitarChordOrg,
  },
  {
    id: "all-guitar-chords",
    displayName: "All Guitar Chords",
    baseUrl: "https://all-guitar-chords.com",
    cacheDir: "all-guitar-chords",
    parse: parseAllGuitarChords,
  },
];