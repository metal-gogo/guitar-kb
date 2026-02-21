import type { ChordQuality, ChordRecord, RawChordRecord, SourceRef } from "../../types/model.js";
import { assertCanonicalChordId } from "../../types/guards.js";
import { compareChordOrder } from "../../utils/sort.js";

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
  min7: "min7",
  "7": "7",
  major7: "maj7",
  maj7: "maj7",
  m7b5: "dim",
  dim: "dim",
  diminished: "dim",
  aug: "aug",
  augmented: "aug",
  sus2: "sus2",
  sus4: "sus4"
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

export function normalizeRecords(raw: RawChordRecord[]): ChordRecord[] {
  const merged = new Map<string, ChordRecord>();

  for (const input of raw) {
    const quality = normalizeQuality(input.quality_raw);
    const id = toChordId(input.root, quality);
    const sourceRef: SourceRef = {
      source: input.source,
      url: input.url
    };

    const existing = merged.get(id);
    if (!existing) {
      const equivalentRoot = ENHARMONIC_ROOT[input.root];
      const enharmonic = equivalentRoot ? [toChordId(equivalentRoot, quality)] : [];
      merged.set(id, {
        id,
        root: input.root,
        quality,
        aliases: [...new Set(input.aliases)],
        enharmonic_equivalents: enharmonic,
        formula: input.formula,
        pitch_classes: input.pitch_classes,
        tuning: ["E", "A", "D", "G", "B", "E"],
        voicings: input.voicings.map((voicing, index) => ({
          ...voicing,
          id: `${id}:v${index + 1}:${input.source}`
        })),
        notes: {
          summary: `${input.root} ${quality} chord with formula ${input.formula.join("-")}.`
        },
        source_refs: [sourceRef]
      });
      continue;
    }

    existing.aliases = [...new Set([...(existing.aliases ?? []), ...input.aliases])];
    existing.voicings.push(...input.voicings.map((voicing, index) => ({
      ...voicing,
      id: `${id}:v${existing.voicings.length + index + 1}:${input.source}`
    })));
    existing.source_refs.push(sourceRef);
    existing.voicings.sort((a, b) => a.id.localeCompare(b.id));
  }

  return [...merged.values()].sort(compareChordOrder);
}
