import { readFile } from "node:fs/promises";
import { validateChordRecords } from "../validate/schema.js";
import type { ChordRecord } from "../types/model.js";

async function main(): Promise<void> {
  const jsonl = await readFile("data/chords.jsonl", "utf8");
  const records = jsonl
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => JSON.parse(line) as ChordRecord);

  await validateChordRecords(records);
  process.stdout.write(`Validated ${records.length} chord records\n`);
}

main().catch((error: unknown) => {
  process.stderr.write(`${String(error)}\n`);
  process.exit(1);
});
