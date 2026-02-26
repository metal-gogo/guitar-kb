import { readFile } from "node:fs/promises";

/**
 * Thrown when the current `chords.schema.json` drops a required field that is
 * listed in the committed compatibility baseline.
 */
export class SchemaCompatError extends Error {
  /**
   * Each entry names the schema section and the field that was removed.
   * e.g. `{ section: "chord", field: "source_refs" }`
   */
  readonly removals: ReadonlyArray<{ section: string; field: string }>;

  constructor(removals: Array<{ section: string; field: string }>) {
    const lines = removals
      .map(({ section, field }) => `  [${section}] required field "${field}" was removed`)
      .join("\n");
    super(`Schema compatibility check failed — breaking removals detected:\n${lines}`);
    this.name = "SchemaCompatError";
    this.removals = removals;
  }
}

interface CompatBaseline {
  chord_required: string[];
  voicing_required: string[];
}

interface SchemaShape {
  required?: string[];
  properties?: {
    voicings?: {
      items?: {
        required?: string[];
      };
    };
  };
}

/**
 * Reads `schemaPath` and `baselinePath`, then verifies that every field listed
 * as required in the baseline is still required in the current schema.
 *
 * - Removing a baseline field from `required[]` → {@link SchemaCompatError}
 * - Adding new required fields → allowed (stricter schema is non-breaking)
 * - Removing non-baseline optional fields → not checked here
 *
 * @param schemaPath   Path to `chords.schema.json` (default: `"chords.schema.json"`)
 * @param baselinePath Path to the compat baseline JSON (default: `"data/schema-compat-baseline.json"`)
 */
export async function checkSchemaCompatibility(
  schemaPath = "chords.schema.json",
  baselinePath = "data/schema-compat-baseline.json",
): Promise<void> {
  const [schemaRaw, baselineRaw] = await Promise.all([
    readFile(schemaPath, "utf8"),
    readFile(baselinePath, "utf8"),
  ]);

  const schema = JSON.parse(schemaRaw) as SchemaShape;
  const baseline = JSON.parse(baselineRaw) as CompatBaseline;

  const schemaChordRequired = new Set(schema.required ?? []);
  const schemaVoicingRequired = new Set(
    schema.properties?.voicings?.items?.required ?? [],
  );

  const removals: Array<{ section: string; field: string }> = [];

  for (const field of baseline.chord_required) {
    if (!schemaChordRequired.has(field)) {
      removals.push({ section: "chord", field });
    }
  }

  for (const field of baseline.voicing_required) {
    if (!schemaVoicingRequired.has(field)) {
      removals.push({ section: "voicing", field });
    }
  }

  if (removals.length > 0) {
    throw new SchemaCompatError(removals);
  }
}
