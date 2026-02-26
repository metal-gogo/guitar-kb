import { readFile } from "node:fs/promises";
import { validateChordRecords } from "../validate/schema.js";
import { checkSchemaCompatibility } from "../validate/compat.js";
import { checkProvenanceCoverage } from "../validate/provenance.js";
import type { ChordRecord } from "../types/model.js";

async function main(): Promise<void> {
  // 1. Schema compatibility check (before record validation so a breaking schema
  //    change is diagnosed even when the JSONL hasn't been regenerated yet)
  await checkSchemaCompatibility();

  const jsonl = await readFile("data/chords.jsonl", "utf8");
  const records = jsonl
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => JSON.parse(line) as ChordRecord);

  // 2. Provenance coverage check (before AJV so missing provenance fields yield
  //    actionable chord/voicing paths rather than generic JSON Schema errors)
  checkProvenanceCoverage(records);

  await validateChordRecords(records);
  process.stdout.write(`Validated ${records.length} chord records\n`);
}

main().catch((error: unknown) => {
  process.stderr.write(`${String(error)}\n`);
  process.exit(1);
});
