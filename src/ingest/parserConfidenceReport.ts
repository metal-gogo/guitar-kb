import { QUALITY_ORDER } from "../config.js";
import type {
  ChordRecord,
  ChordQuality,
  ParserConfidenceLevel,
} from "../types/model.js";

const CONFIDENCE_LEVEL_ORDER: ReadonlyArray<ParserConfidenceLevel> = ["high", "medium", "low"];

export interface ParserConfidenceCounts {
  high: number;
  medium: number;
  low: number;
}

export interface ParserConfidenceQualitySummary {
  quality: ChordQuality;
  chords: number;
  annotations: number;
  levels: ParserConfidenceCounts;
}

export interface ParserConfidenceSourceSummary {
  source: string;
  chords: number;
  annotations: number;
  levels: ParserConfidenceCounts;
  qualities: ParserConfidenceQualitySummary[];
}

export interface ParserConfidenceReport {
  totalChords: number;
  chordsWithConfidence: number;
  chordsWithoutConfidence: string[];
  annotations: number;
  levels: ParserConfidenceCounts;
  sources: ParserConfidenceSourceSummary[];
  qualities: ParserConfidenceQualitySummary[];
}

interface MutableSummaryBucket {
  chords: Set<string>;
  annotations: number;
  levels: ParserConfidenceCounts;
}

interface MutableSourceSummary {
  summary: MutableSummaryBucket;
  qualities: Map<ChordQuality, MutableSummaryBucket>;
}

function createCounts(): ParserConfidenceCounts {
  return {
    high: 0,
    medium: 0,
    low: 0,
  };
}

function createBucket(): MutableSummaryBucket {
  return {
    chords: new Set<string>(),
    annotations: 0,
    levels: createCounts(),
  };
}

function addToBucket(bucket: MutableSummaryBucket, chordId: string, level: ParserConfidenceLevel): void {
  bucket.chords.add(chordId);
  bucket.annotations += 1;
  bucket.levels[level] += 1;
}

function finalizeBucket(
  key: { source: string } | { quality: ChordQuality },
  bucket: MutableSummaryBucket,
): ParserConfidenceSourceSummary | ParserConfidenceQualitySummary {
  if ("source" in key) {
    return {
      source: key.source,
      chords: bucket.chords.size,
      annotations: bucket.annotations,
      levels: { ...bucket.levels },
      qualities: [],
    };
  }

  return {
    quality: key.quality,
    chords: bucket.chords.size,
    annotations: bucket.annotations,
    levels: { ...bucket.levels },
  };
}

function compareQuality(a: ChordQuality, b: ChordQuality): number {
  const aIndex = QUALITY_ORDER.indexOf(a);
  const bIndex = QUALITY_ORDER.indexOf(b);
  if (aIndex !== -1 && bIndex !== -1 && aIndex !== bIndex) {
    return aIndex - bIndex;
  }
  if (aIndex === -1 && bIndex !== -1) {
    return 1;
  }
  if (aIndex !== -1 && bIndex === -1) {
    return -1;
  }
  return a.localeCompare(b);
}

export function buildParserConfidenceReport(chords: ReadonlyArray<ChordRecord>): ParserConfidenceReport {
  const sourceSummaries = new Map<string, MutableSourceSummary>();
  const qualitySummaries = new Map<ChordQuality, MutableSummaryBucket>();
  const overall = createBucket();
  const chordsWithConfidence = new Set<string>();
  const chordsWithoutConfidence: string[] = [];

  const ensureSourceSummary = (source: string): MutableSourceSummary => {
    const existing = sourceSummaries.get(source);
    if (existing) {
      return existing;
    }
    const created: MutableSourceSummary = {
      summary: createBucket(),
      qualities: new Map<ChordQuality, MutableSummaryBucket>(),
    };
    sourceSummaries.set(source, created);
    return created;
  };

  const ensureQualityBucket = (
    map: Map<ChordQuality, MutableSummaryBucket>,
    quality: ChordQuality,
  ): MutableSummaryBucket => {
    const existing = map.get(quality);
    if (existing) {
      return existing;
    }
    const created = createBucket();
    map.set(quality, created);
    return created;
  };

  for (const chord of chords) {
    const confidenceEntries = chord.parser_confidence ?? [];
    if (confidenceEntries.length === 0) {
      chordsWithoutConfidence.push(chord.id);
      continue;
    }

    chordsWithConfidence.add(chord.id);

    for (const entry of confidenceEntries) {
      addToBucket(overall, chord.id, entry.level);

      const sourceSummary = ensureSourceSummary(entry.source);
      addToBucket(sourceSummary.summary, chord.id, entry.level);
      addToBucket(ensureQualityBucket(sourceSummary.qualities, chord.quality), chord.id, entry.level);

      addToBucket(ensureQualityBucket(qualitySummaries, chord.quality), chord.id, entry.level);
    }
  }

  chordsWithoutConfidence.sort((a, b) => a.localeCompare(b));

  const sources = Array.from(sourceSummaries.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([source, summary]): ParserConfidenceSourceSummary => {
      const finalized = finalizeBucket({ source }, summary.summary) as ParserConfidenceSourceSummary;
      finalized.qualities = Array.from(summary.qualities.entries())
        .sort(([a], [b]) => compareQuality(a, b))
        .map(([quality, bucket]) => finalizeBucket({ quality }, bucket) as ParserConfidenceQualitySummary);
      return finalized;
    });

  const qualities = Array.from(qualitySummaries.entries())
    .sort(([a], [b]) => compareQuality(a, b))
    .map(([quality, bucket]) => finalizeBucket({ quality }, bucket) as ParserConfidenceQualitySummary);

  // Assert level key presence at construction time to keep output shape stable.
  for (const level of CONFIDENCE_LEVEL_ORDER) {
    if (!(level in overall.levels)) {
      throw new Error(`Missing parser confidence level bucket: ${level}`);
    }
  }

  return {
    totalChords: chords.length,
    chordsWithConfidence: chordsWithConfidence.size,
    chordsWithoutConfidence,
    annotations: overall.annotations,
    levels: { ...overall.levels },
    sources,
    qualities,
  };
}
