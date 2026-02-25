import { readFile } from "node:fs/promises";
import { Ajv2020 } from "ajv/dist/2020.js";
import type { ChordRecord } from "../types/model.js";

function throwVoicingGuard(recordId: string, voicingIndex: number, reason: string): never {
  throw new Error(`Schema validation failed for ${recordId}\nVoicing guard failed at voicing[${voicingIndex}]: ${reason}`);
}

function validateVoicingGuards(record: ChordRecord): void {
  const tuningStringCount = Array.isArray(record.tuning) ? record.tuning.length : 6;

  if (!Array.isArray(record.voicings)) {
    return;
  }

  for (const [voicingIndex, voicing] of record.voicings.entries()) {
    if (!voicing || !Array.isArray(voicing.frets)) {
      continue;
    }

    if (voicing.frets.length !== tuningStringCount) {
      throwVoicingGuard(record.id, voicingIndex, `expected ${tuningStringCount} strings, received ${voicing.frets.length}`);
    }

    let hasPlayedString = false;
    for (const [stringIndex, fret] of voicing.frets.entries()) {
      if (fret === null) {
        continue;
      }

      if (typeof fret !== "number" || !Number.isInteger(fret)) {
        throwVoicingGuard(record.id, voicingIndex, `string ${stringIndex} has non-integer fret value`);
      }

      if (fret < 0 || fret > 24) {
        throwVoicingGuard(record.id, voicingIndex, `string ${stringIndex} has out-of-range fret ${fret}`);
      }

      hasPlayedString = true;
    }

    if (!hasPlayedString) {
      throwVoicingGuard(record.id, voicingIndex, "all strings are muted");
    }
  }
}

export async function validateChordRecords(records: ChordRecord[]): Promise<void> {
  const schemaRaw = await readFile("chords.schema.json", "utf8");
  const schema = JSON.parse(schemaRaw) as object;
  const ajv = new Ajv2020({ allErrors: true });
  ajv.addFormat("uri", {
    type: "string",
    validate: (value: string) => {
      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }
    },
  });
  ajv.addFormat("date-time", {
    type: "string",
    validate: (value: string) => !Number.isNaN(Date.parse(value)),
  });
  const validate = ajv.compile(schema);

  for (const record of records) {
    const recordId = record.id;
    validateVoicingGuards(record);

    const valid = validate(record);
    if (!valid) {
      const details = ajv.errorsText(validate.errors, { separator: "\n" });
      throw new Error(`Schema validation failed for ${recordId}\n${details}`);
    }
  }
}
