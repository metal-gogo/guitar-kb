import { mkdir } from "node:fs/promises";
import path from "node:path";
import { ingestNormalizedChords } from "../ingest/pipeline.js";
import { writeJson } from "../utils/fs.js";

const refresh = process.argv.includes("--refresh");

async function main(): Promise<void> {
  const chords = await ingestNormalizedChords({ refresh, delayMs: 250 });
  await mkdir(path.join("data", "generated"), { recursive: true });
  await writeJson(path.join("data", "generated", "chords.normalized.json"), chords);

  process.stdout.write(`Ingested ${chords.length} normalized chords\n`);
}

main().catch((error: unknown) => {
  process.stderr.write(`${String(error)}\n`);
  process.exit(1);
});
