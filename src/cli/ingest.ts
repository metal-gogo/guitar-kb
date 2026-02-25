import { mkdir } from "node:fs/promises";
import path from "node:path";
import { ingestNormalizedChords } from "../ingest/pipeline.js";
import { writeJson } from "../utils/fs.js";
import { parseIngestCliOptions } from "./options.js";

async function main(): Promise<void> {
  const options = parseIngestCliOptions(process.argv.slice(2));
  const chords = await ingestNormalizedChords({
    refresh: options.refresh,
    delayMs: 250,
    chord: options.chord,
    source: options.source,
    dryRun: options.dryRun,
  });

  if (options.dryRun) {
    process.stdout.write("Dry run complete\n");
    return;
  }

  await mkdir(path.join("data", "generated"), { recursive: true });
  await writeJson(path.join("data", "generated", "chords.normalized.json"), chords);

  process.stdout.write(`Ingested ${chords.length} normalized chords\n`);
}

main().catch((error: unknown) => {
  process.stderr.write(`${String(error)}\n`);
  process.exit(1);
});
