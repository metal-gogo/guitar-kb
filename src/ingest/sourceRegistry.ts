import { parseAllGuitarChords } from "./parsers/allGuitarChords.js";
import { parseGuitarChordOrg } from "./parsers/guitarChordOrg.js";
import { QUALITY_ORDER, ROOT_ORDER } from "../config.js";
import type { SourceRegistryEntry } from "../types/model.js";

export const SOURCE_REGISTRY: ReadonlyArray<SourceRegistryEntry> = [
  {
    id: "guitar-chord-org",
    displayName: "Guitar Chord Org",
    baseUrl: "https://www.guitar-chord.org",
    cacheDir: "guitar-chord-org",
    capabilities: {
      roots: ROOT_ORDER,
      qualities: QUALITY_ORDER,
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
      qualities: QUALITY_ORDER,
    },
    parse: parseAllGuitarChords,
  },
];
