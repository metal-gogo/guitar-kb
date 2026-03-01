import { load } from "cheerio";
import type { ParserConfidence, RawChordRecord, RawVoicing } from "../../types/model.js";

const URL_QUALITY_HINTS: ReadonlyArray<readonly [pattern: string, quality: string]> = [
  ["-dim7.html", "dim7"],
  ["-min7.html", "min7"],
  ["-maj7.html", "maj7"],
  ["-sus2.html", "sus2"],
  ["-sus4.html", "sus4"],
  ["-dim.html", "dim"],
  ["-aug.html", "aug"],
  ["-min.html", "minor"],
  ["-maj.html", "major"],
  ["-7.html", "7"],
];

function parseCell(value: string): number | null {
  const normalized = value.trim().toLowerCase();
  if (normalized === "x" || normalized === "") {
    return null;
  }
  return Number.parseInt(normalized, 10);
}

function parseVoicingList(value: string): Array<number | null> {
  return value.split(",").map((cell) => parseCell(cell));
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
    source: "guitar-chord-org",
    level,
    checks,
  };
}

export function parseGuitarChordOrg(html: string, url: string): RawChordRecord {
  const qualityToken = qualityHintFromUrl(url);
  const $ = load(html);
  const chord = $("[data-chord-root]").first();

  if (!chord.length) {
    throw new Error(
      `guitar-chord-org parser failed source=guitar-chord-org url=${url} quality_token=${qualityToken}`,
    );
  }

  const root = chord.attr("data-chord-root") ?? "";
  const qualityRaw = chord.attr("data-quality") ?? (qualityToken !== "unknown" ? qualityToken : "");
  const symbol = chord.attr("data-symbol") ?? `${root}${qualityRaw}`;
  const formula = chord.find(".formula li").map((_i, el) => $(el).text().trim()).get();
  const pitchClasses = chord.find(".pitch-classes li").map((_i, el) => $(el).text().trim()).get();
  const aliases = chord.find(".aliases span").map((_i, el) => $(el).text().trim()).get();

  let completeVoicingCount = 0;
  const voicings: RawVoicing[] = chord.find(".voicing").map((_i, el) => {
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
      frets: parseVoicingList(node.attr("data-frets") ?? "x,x,x,x,x,x"),
      fingers: parseVoicingList(node.attr("data-fingers") ?? "0,0,0,0,0,0"),
      source_refs: [{ source: "guitar-chord-org", url }]
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
    source: "guitar-chord-org",
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
