export type ChordQuality = "maj" | "min" | "7" | "maj7" | "min7" | "dim" | "dim7" | "aug" | "sus2" | "sus4";

export interface SourceRef {
  source: string;
  url: string;
  retrieved_at?: string;
  note?: string;
}

export interface Voicing {
  id: string;
  frets: Array<number | null>;
  fingers?: Array<number | null>;
  base_fret: number;
  tags?: string[];
  difficulty?: string;
  source_refs?: SourceRef[];
}

export interface ChordRecord {
  id: string;
  root: string;
  quality: ChordQuality;
  aliases?: string[];
  enharmonic_equivalents?: string[];
  formula: string[];
  pitch_classes: string[];
  tuning?: string[];
  voicings: Voicing[];
  notes?: {
    summary?: string;
  };
  source_refs: SourceRef[];
}

export interface RawChordRecord {
  source: string;
  url: string;
  symbol: string;
  root: string;
  quality_raw: string;
  aliases: string[];
  formula: string[];
  pitch_classes: string[];
  voicings: Voicing[];
}

export type ParserFn = (html: string, url: string) => RawChordRecord;

export interface SourceRegistryEntry {
  id: string;
  displayName: string;
  baseUrl: string;
  cacheDir: string;
  parse: ParserFn;
}
