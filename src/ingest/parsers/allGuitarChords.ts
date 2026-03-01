import { load } from "cheerio";
import type { ParserConfidence, RawChordRecord, RawVoicing } from "../../types/model.js";

const URL_QUALITY_HINTS: ReadonlyArray<readonly [pattern: string, quality: string]> = [
  ["/diminished-7th", "dim7"],
  ["/minor-7th", "min7"],
  ["/major-7th", "M7"],
  ["/suspended-2nd", "sus2"],
  ["/suspended-4th", "sus4"],
  ["/dominant-7th", "7"],
  ["/diminished", "dim"],
  ["/augmented", "aug"],
  ["/minor", "min"],
  ["/major", "maj"],
];

function parseCell(value: string): number | null {
  const normalized = value.trim().toLowerCase();
  if (normalized === "x" || normalized === "") {
    return null;
  }
  return Number.parseInt(normalized, 10);
}

function parseVoicingList(value: string): Array<number | null> {
  return value.split("-").map((cell) => parseCell(cell));
}

function qualityHintFromUrl(url: string): string {
  const normalized = url.toLowerCase();
  for (const [pattern, quality] of URL_QUALITY_HINTS) {
    if (normalized.includes(pattern)) {
      return quality;
    }
  }
  return "unknown";
}

function deriveParserConfidence(
  hasRoot: boolean,
  hasQuality: boolean,
  hasFormula: boolean,
  hasPitchClasses: boolean,
  hasVoicings: boolean,
  allVoicingsComplete: boolean,
): ParserConfidence {
  const checks: string[] = [];
  if (hasRoot) {
    checks.push("has_root");
  }
  if (hasQuality) {
    checks.push("has_quality");
  }
  if (hasFormula) {
    checks.push("has_formula");
  }
  if (hasPitchClasses) {
    checks.push("has_pitch_classes");
  }
  if (hasVoicings) {
    checks.push("has_voicings");
  }
  if (allVoicingsComplete) {
    checks.push("all_voicings_complete");
  }

  let level: ParserConfidence["level"] = "low";
  if (hasRoot && hasQuality && hasFormula && hasPitchClasses && hasVoicings) {
    level = allVoicingsComplete ? "high" : "medium";
  }

  return {
    source: "all-guitar-chords",
    level,
    checks,
  };
}

export function parseAllGuitarChords(html: string, url: string): RawChordRecord {
  const qualityToken = qualityHintFromUrl(url);
  const $ = load(html);
  const chord = $("section[data-root]").first();

  if (!chord.length) {
    throw new Error(
      `all-guitar-chords parser failed source=all-guitar-chords url=${url} quality_token=${qualityToken}`,
    );
  }

  const root = chord.attr("data-root") ?? "";
  const qualityRaw = chord.attr("data-quality") ?? (qualityToken !== "unknown" ? qualityToken : "");
  const symbol = chord.attr("data-symbol") ?? `${root}${qualityRaw}`;
  const formula = chord.find("[data-formula] code").map((_i, el) => $(el).text().trim()).get();
  const pitchClasses = chord.find("[data-notes] code").map((_i, el) => $(el).text().trim()).get();
  const aliases = chord.find("[data-aliases] code").map((_i, el) => $(el).text().trim()).get();

  let completeVoicingCount = 0;
  const voicings: RawVoicing[] = chord.find("[data-voicing]").map((_i, el) => {
    const node = $(el);
    const hasCompleteAttributes =
      node.attr("data-base-fret") !== undefined &&
      node.attr("data-frets") !== undefined &&
      node.attr("data-fingers") !== undefined;
    if (hasCompleteAttributes) {
      completeVoicingCount += 1;
    }
    return {
      id: node.attr("data-id") ?? "unknown",
      base_fret: Number.parseInt(node.attr("data-base-fret") ?? "1", 10),
      frets: parseVoicingList(node.attr("data-frets") ?? "x-x-x-x-x-x"),
      fingers: parseVoicingList(node.attr("data-fingers") ?? "0-0-0-0-0-0"),
      source_refs: [{ source: "all-guitar-chords", url }]
    };
  }).get();

  const parserConfidence = deriveParserConfidence(
    root.trim().length > 0,
    qualityRaw.trim().length > 0,
    formula.length > 0,
    pitchClasses.length > 0,
    voicings.length > 0,
    voicings.length > 0 && completeVoicingCount === voicings.length,
  );

  return {
    source: "all-guitar-chords",
    url,
    symbol,
    root,
    quality_raw: qualityRaw,
    aliases,
    formula,
    pitch_classes: pitchClasses,
    voicings,
    parser_confidence: parserConfidence,
  };
}
