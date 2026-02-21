import { mkdir } from "node:fs/promises";
import path from "node:path";
import { MVP_TARGETS } from "../config.js";
import { getCachedHtml } from "../ingest/fetch/cache.js";
import { normalizeRecords } from "../ingest/normalize/normalize.js";
import { parseAllGuitarChords } from "../ingest/parsers/allGuitarChords.js";
import { parseGuitarChordOrg } from "../ingest/parsers/guitarChordOrg.js";
import type { RawChordRecord } from "../types/model.js";
import { writeJson } from "../utils/fs.js";

const refresh = process.argv.includes("--refresh");

async function main(): Promise<void> {
  const rawRecords: RawChordRecord[] = [];

  for (const target of MVP_TARGETS) {
    const html = await getCachedHtml(target.source, target.slug, target.url, { refresh, delayMs: 250 });

    if (target.source === "guitar-chord-org") {
      rawRecords.push(parseGuitarChordOrg(html, target.url));
    } else {
      rawRecords.push(parseAllGuitarChords(html, target.url));
    }
  }

  const chords = normalizeRecords(rawRecords);
  await mkdir(path.join("data", "generated"), { recursive: true });
  await writeJson(path.join("data", "generated", "chords.normalized.json"), chords);

  process.stdout.write(`Ingested ${chords.length} normalized chords\n`);
}

main().catch((error: unknown) => {
  process.stderr.write(`${String(error)}\n`);
  process.exit(1);
});
