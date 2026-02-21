export const PROJECT_USER_AGENT = "GCKB/0.1 (+https://github.com/metal-gogo/guitar-kb)";

export const ROOT_ORDER = [
  "C", "C#", "Db", "D", "D#", "Eb", "E", "F", "F#", "Gb", "G", "G#", "Ab", "A", "A#", "Bb", "B"
] as const;

export const QUALITY_ORDER = ["maj", "min", "7", "maj7", "min7", "dim", "aug", "sus2", "sus4"] as const;

export const MVP_TARGETS = [
  { source: "guitar-chord-org", slug: "c-major", url: "https://www.guitar-chord.org/c-major.html" },
  { source: "guitar-chord-org", slug: "c-minor", url: "https://www.guitar-chord.org/c-minor.html" },
  { source: "guitar-chord-org", slug: "c7", url: "https://www.guitar-chord.org/c7.html" },
  { source: "guitar-chord-org", slug: "cmaj7", url: "https://www.guitar-chord.org/cmaj7.html" },
  { source: "all-guitar-chords", slug: "c-major", url: "https://www.all-guitar-chords.com/chords/c-major" },
  { source: "all-guitar-chords", slug: "c-minor", url: "https://www.all-guitar-chords.com/chords/c-minor" },
  { source: "all-guitar-chords", slug: "c7", url: "https://www.all-guitar-chords.com/chords/c7" },
  { source: "all-guitar-chords", slug: "cmaj7", url: "https://www.all-guitar-chords.com/chords/cmaj7" }
] as const;
