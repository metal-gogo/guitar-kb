import { load } from "cheerio";
import type { RawChordRecord, RawVoicing } from "../../types/model.js";

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

export function parseGuitarChordOrg(html: string, url: string): RawChordRecord {
  const $ = load(html);
  const chord = $("[data-chord-root]").first();

  if (!chord.length) {
    throw new Error(`guitar-chord-org parser failed for ${url}`);
  }

  const root = chord.attr("data-chord-root") ?? "";
  const qualityRaw = chord.attr("data-quality") ?? "";
  const symbol = chord.attr("data-symbol") ?? `${root}${qualityRaw}`;
  const formula = chord.find(".formula li").map((_i, el) => $(el).text().trim()).get();
  const pitchClasses = chord.find(".pitch-classes li").map((_i, el) => $(el).text().trim()).get();
  const aliases = chord.find(".aliases span").map((_i, el) => $(el).text().trim()).get();

  const voicings: RawVoicing[] = chord.find(".voicing").map((_i, el) => {
    const node = $(el);
    return {
      id: node.attr("data-id") ?? "unknown",
      base_fret: Number.parseInt(node.attr("data-base-fret") ?? "1", 10),
      frets: parseVoicingList(node.attr("data-frets") ?? "x,x,x,x,x,x"),
      fingers: parseVoicingList(node.attr("data-fingers") ?? "0,0,0,0,0,0"),
      source_refs: [{ source: "guitar-chord-org", url }]
    };
  }).get();

  return {
    source: "guitar-chord-org",
    url,
    symbol,
    root,
    quality_raw: qualityRaw,
    aliases,
    formula,
    pitch_classes: pitchClasses,
    voicings
  };
}
