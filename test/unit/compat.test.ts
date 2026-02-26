import { writeFile, mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it, afterEach } from "vitest";
import { checkSchemaCompatibility, SchemaCompatError } from "../../src/validate/compat.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const BASELINE = JSON.stringify({
  chord_required: ["id", "root", "quality", "aliases", "formula", "pitch_classes", "voicings", "source_refs"],
  voicing_required: ["id", "frets", "base_fret", "position", "source_refs"],
});

function schemaWith(chordRequired: string[], voicingRequired: string[]): string {
  return JSON.stringify({
    type: "object",
    required: chordRequired,
    properties: {
      voicings: {
        type: "array",
        items: {
          type: "object",
          required: voicingRequired,
        },
      },
    },
  });
}

const FULL_CHORD_REQUIRED = ["id", "root", "quality", "aliases", "formula", "pitch_classes", "voicings", "source_refs"];
const FULL_VOICING_REQUIRED = ["id", "frets", "base_fret", "position", "source_refs"];

const tmpDirs: string[] = [];

async function withTmpFiles(schema: string, baseline: string): Promise<[string, string]> {
  const dir = await mkdtemp(join(tmpdir(), "compat-test-"));
  tmpDirs.push(dir);
  const schemaPath = join(dir, "schema.json");
  const baselinePath = join(dir, "baseline.json");
  await Promise.all([writeFile(schemaPath, schema), writeFile(baselinePath, baseline)]);
  return [schemaPath, baselinePath];
}

afterEach(async () => {
  for (const dir of tmpDirs.splice(0)) {
    await rm(dir, { recursive: true, force: true });
  }
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("checkSchemaCompatibility", () => {
  it("passes when schema required fields exactly match the baseline", async () => {
    const [schemaPath, baselinePath] = await withTmpFiles(
      schemaWith(FULL_CHORD_REQUIRED, FULL_VOICING_REQUIRED),
      BASELINE,
    );
    await expect(checkSchemaCompatibility(schemaPath, baselinePath)).resolves.toBeUndefined();
  });

  it("passes when schema has MORE required fields than the baseline (stricter schema)", async () => {
    const [schemaPath, baselinePath] = await withTmpFiles(
      schemaWith([...FULL_CHORD_REQUIRED, "extra_field"], FULL_VOICING_REQUIRED),
      BASELINE,
    );
    await expect(checkSchemaCompatibility(schemaPath, baselinePath)).resolves.toBeUndefined();
  });

  it("throws SchemaCompatError when a baseline chord field is removed from schema required[]", async () => {
    const reduced = FULL_CHORD_REQUIRED.filter((f) => f !== "source_refs");
    const [schemaPath, baselinePath] = await withTmpFiles(
      schemaWith(reduced, FULL_VOICING_REQUIRED),
      BASELINE,
    );
    await expect(checkSchemaCompatibility(schemaPath, baselinePath)).rejects.toThrow(SchemaCompatError);
  });

  it("throws SchemaCompatError when a baseline voicing field is removed from schema required[]", async () => {
    const reduced = FULL_VOICING_REQUIRED.filter((f) => f !== "frets");
    const [schemaPath, baselinePath] = await withTmpFiles(
      schemaWith(FULL_CHORD_REQUIRED, reduced),
      BASELINE,
    );
    await expect(checkSchemaCompatibility(schemaPath, baselinePath)).rejects.toThrow(SchemaCompatError);
  });

  it("error message names the section and field for each breaking removal", async () => {
    const reducedChord = FULL_CHORD_REQUIRED.filter((f) => f !== "aliases");
    const reducedVoicing = FULL_VOICING_REQUIRED.filter((f) => f !== "position");
    const [schemaPath, baselinePath] = await withTmpFiles(
      schemaWith(reducedChord, reducedVoicing),
      BASELINE,
    );
    let err: SchemaCompatError | undefined;
    try {
      await checkSchemaCompatibility(schemaPath, baselinePath);
    } catch (e) {
      err = e as SchemaCompatError;
    }
    expect(err).toBeInstanceOf(SchemaCompatError);
    expect(err?.message).toContain("[chord]");
    expect(err?.message).toContain("aliases");
    expect(err?.message).toContain("[voicing]");
    expect(err?.message).toContain("position");
  });

  it("structured removals property lists every broken field with its section", async () => {
    const reduced = FULL_CHORD_REQUIRED.filter((f) => f !== "formula");
    const [schemaPath, baselinePath] = await withTmpFiles(
      schemaWith(reduced, FULL_VOICING_REQUIRED),
      BASELINE,
    );
    let err: SchemaCompatError | undefined;
    try {
      await checkSchemaCompatibility(schemaPath, baselinePath);
    } catch (e) {
      err = e as SchemaCompatError;
    }
    expect(err?.removals).toHaveLength(1);
    expect(err?.removals[0]).toEqual({ section: "chord", field: "formula" });
  });

  it("passes against the actual chords.schema.json and live baseline", async () => {
    // Integration: real schema and real baseline should always be compatible
    await expect(checkSchemaCompatibility()).resolves.toBeUndefined();
  });
});
