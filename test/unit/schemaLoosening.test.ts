/**
 * Schema constraint regression guard — issue #120
 *
 * Detects accidental loosening of critical JSON Schema constraints by
 * comparing the live chords.schema.json against a committed snapshot.
 *
 * To update the snapshot intentionally:
 *   1. Edit test/fixtures/schema-constraints.snapshot.json
 *   2. Commit both the schema change and the snapshot update in the same PR
 *   3. Describe the constraint change in the PR description
 */
import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

interface SchemaConstraintSnapshot {
  "chord.required": string[];
  "chord.id.pattern": string;
  "chord.root.pattern": string;
  "chord.aliases.minItems": number;
  "chord.formula.minItems": number;
  "chord.pitch_classes.minItems": number;
  "chord.pitch_classes.items.pattern": string;
  "chord.voicings.minItems": number;
  "chord.source_refs.minItems": number;
  "voicing.required": string[];
  "voicing.frets.minItems": number;
  "voicing.frets.maxItems": number;
  "voicing.frets.items.minimum": number;
  "voicing.position.enum": string[];
  "voicing.source_refs.minItems": number;
  "sourceRef.required": string[];
  "sourceRef.source.minLength": number;
  "sourceRef.url.minLength": number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SchemaShape = Record<string, any>;

async function loadSchema(): Promise<SchemaShape> {
  const raw = await readFile("chords.schema.json", "utf8");
  return JSON.parse(raw) as SchemaShape;
}

async function loadSnapshot(): Promise<SchemaConstraintSnapshot> {
  const raw = await readFile("test/fixtures/schema-constraints.snapshot.json", "utf8");
  return JSON.parse(raw) as SchemaConstraintSnapshot;
}

function extractActualConstraints(schema: SchemaShape): SchemaConstraintSnapshot {
  const props = schema.properties as SchemaShape;
  const voicingItem = props.voicings.items as SchemaShape;
  const voicingProps = voicingItem.properties as SchemaShape;
  const defs = schema.$defs as SchemaShape;
  const sourceRefDef = defs.sourceRef as SchemaShape;
  const sourceRefProps = sourceRefDef.properties as SchemaShape;

  return {
    "chord.required": (schema.required as string[]).slice().sort(),
    "chord.id.pattern": props.id.pattern as string,
    "chord.root.pattern": props.root.pattern as string,
    "chord.aliases.minItems": props.aliases.minItems as number,
    "chord.formula.minItems": props.formula.minItems as number,
    "chord.pitch_classes.minItems": props.pitch_classes.minItems as number,
    "chord.pitch_classes.items.pattern": props.pitch_classes.items.pattern as string,
    "chord.voicings.minItems": props.voicings.minItems as number,
    "chord.source_refs.minItems": props.source_refs.minItems as number,
    "voicing.required": (voicingItem.required as string[]).slice().sort(),
    "voicing.frets.minItems": voicingProps.frets.minItems as number,
    "voicing.frets.maxItems": voicingProps.frets.maxItems as number,
    "voicing.frets.items.minimum": voicingProps.frets.items.minimum as number,
    "voicing.position.enum": (voicingProps.position.enum as string[]).slice().sort(),
    "voicing.source_refs.minItems": voicingProps.source_refs.minItems as number,
    "sourceRef.required": (sourceRefDef.required as string[]).slice().sort(),
    "sourceRef.source.minLength": sourceRefProps.source.minLength as number,
    "sourceRef.url.minLength": sourceRefProps.url.minLength as number,
  };
}

describe("schema constraint regression guard", () => {
  it("all critical constraints match the committed snapshot (update snapshot to accept intentional changes)", async () => {
    const schema = await loadSchema();
    const snapshot = await loadSnapshot();

    // Normalize sorted arrays so order in snapshot doesn't matter
    const normalizedSnapshot: SchemaConstraintSnapshot = {
      ...snapshot,
      "chord.required": snapshot["chord.required"].slice().sort(),
      "voicing.required": snapshot["voicing.required"].slice().sort(),
      "voicing.position.enum": snapshot["voicing.position.enum"].slice().sort(),
      "sourceRef.required": snapshot["sourceRef.required"].slice().sort(),
    };

    const actual = extractActualConstraints(schema);

    // Single assertion gives a full diff on failure
    expect(actual).toEqual(normalizedSnapshot);
  });

  it("chord-level source_refs requires at least 1 item", async () => {
    const schema = await loadSchema();
    const minItems = (schema.properties as SchemaShape).source_refs.minItems as number;
    expect(minItems).toBeGreaterThanOrEqual(1);
  });

  it("voicing-level source_refs requires at least 1 item", async () => {
    const schema = await loadSchema();
    const voicingItem = (schema.properties as SchemaShape).voicings.items as SchemaShape;
    const minItems = (voicingItem.properties as SchemaShape).source_refs.minItems as number;
    expect(minItems).toBeGreaterThanOrEqual(1);
  });

  it("chord id pattern enforces canonical chord ID shape", async () => {
    const schema = await loadSchema();
    const pattern = (schema.properties as SchemaShape).id.pattern as string;
    // Must still match canonical IDs
    const validIds = ["chord:C:maj", "chord:C#:maj7", "chord:Db:min", "chord:A:7"];
    const regex = new RegExp(pattern);
    for (const id of validIds) {
      expect(regex.test(id), `pattern should accept ${id}`).toBe(true);
    }
    // Must still reject invalid IDs
    const invalidIds = ["C:maj", "chord:H:maj", "chord:C:", "chord::maj"];
    for (const id of invalidIds) {
      expect(regex.test(id), `pattern should reject ${id}`).toBe(false);
    }
  });

  it("voicing frets array enforces exactly 6 strings", async () => {
    const schema = await loadSchema();
    const voicingItem = (schema.properties as SchemaShape).voicings.items as SchemaShape;
    const frets = (voicingItem.properties as SchemaShape).frets as SchemaShape;
    expect(frets.minItems).toBeGreaterThanOrEqual(6);
    expect(frets.maxItems).toBeLessThanOrEqual(6);
  });

  it("voicing position enum includes all required variants", async () => {
    const schema = await loadSchema();
    const voicingItem = (schema.properties as SchemaShape).voicings.items as SchemaShape;
    const positionEnum = (voicingItem.properties as SchemaShape).position.enum as string[];
    expect(positionEnum).toContain("open");
    expect(positionEnum).toContain("barre");
    expect(positionEnum).toContain("upper");
    expect(positionEnum).toContain("unknown");
  });

  it("sourceRef requires both source and url", async () => {
    const schema = await loadSchema();
    const sourceRef = (schema.$defs as SchemaShape).sourceRef as SchemaShape;
    const required = sourceRef.required as string[];
    expect(required).toContain("source");
    expect(required).toContain("url");
  });

  it("sourceRef source and url enforce non-empty strings (minLength >= 1)", async () => {
    const schema = await loadSchema();
    const sourceRef = (schema.$defs as SchemaShape).sourceRef as SchemaShape;
    const props = sourceRef.properties as SchemaShape;
    expect((props.source as SchemaShape).minLength).toBeGreaterThanOrEqual(1);
    expect((props.url as SchemaShape).minLength).toBeGreaterThanOrEqual(1);
  });
});
