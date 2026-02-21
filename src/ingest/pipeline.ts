import { MVP_TARGETS } from "../config.js";
import { getCachedHtml } from "./fetch/cache.js";
import { normalizeRecords } from "./normalize/normalize.js";
import { parseAllGuitarChords } from "./parsers/allGuitarChords.js";
import { parseGuitarChordOrg } from "./parsers/guitarChordOrg.js";
import type { ChordRecord, RawChordRecord } from "../types/model.js";

interface IngestPipelineOptions {
  refresh?: boolean;
  delayMs?: number;
}

export async function ingestNormalizedChords(options: IngestPipelineOptions = {}): Promise<ChordRecord[]> {
  const refresh = options.refresh ?? false;
  const delayMs = options.delayMs ?? 250;
  const rawRecords: RawChordRecord[] = [];

  for (const target of MVP_TARGETS) {
    const html = await getCachedHtml(target.source, target.slug, target.url, { refresh, delayMs });

    if (target.source === "guitar-chord-org") {
      rawRecords.push(parseGuitarChordOrg(html, target.url));
    } else {
      rawRecords.push(parseAllGuitarChords(html, target.url));
    }
  }

  return normalizeRecords(rawRecords);
}
