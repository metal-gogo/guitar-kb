import { readFile } from "node:fs/promises";
import { Ajv2020 } from "ajv/dist/2020.js";
import type { ChordRecord } from "../types/model.js";

export async function validateChordRecords(records: ChordRecord[]): Promise<void> {
  const schemaRaw = await readFile("chords.schema.json", "utf8");
  const schema = JSON.parse(schemaRaw) as object;
  const ajv = new Ajv2020({ allErrors: true });
  const validate = ajv.compile(schema);

  for (const record of records) {
    const recordId = record.id;
    const valid = validate(record);
    if (!valid) {
      const details = ajv.errorsText(validate.errors, { separator: "\n" });
      throw new Error(`Schema validation failed for ${recordId}\n${details}`);
    }
  }
}
