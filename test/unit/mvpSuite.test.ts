import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { writeChordJsonl } from "../../src/build/output/writeJsonl.js";
import { generateChordSvg } from "../../src/build/svg/generateSvg.js";
import { ingestNormalizedChords } from "../../src/ingest/pipeline.js";
import { validateChordRecords } from "../../src/validate/schema.js";

describe("MVP pipeline suite", () => {
  const REQUIRED_MVP_CHORD_IDS = [
    "chord:C:maj",
    "chord:C:min",
    "chord:C:7",
    "chord:C:maj7",
  ] as const;
  const MIN_VOICINGS_PER_MVP_CHORD = 6;

  let tempDir = "";

  afterEach(async () => {
    if (tempDir) {
      await rm(tempDir, { recursive: true, force: true });
      tempDir = "";
    }
  });

  it("produces schema-valid chords, JSONL output, and SVG markup", async () => {
    const chords = await ingestNormalizedChords({ refresh: false, delayMs: 0 });
    const byId = new Map(chords.map((chord) => [chord.id, chord]));

    expect(chords.map((chord) => chord.id)).toEqual(REQUIRED_MVP_CHORD_IDS);

    for (const chordId of REQUIRED_MVP_CHORD_IDS) {
      const chord = byId.get(chordId);
      expect(chord, `Missing required MVP chord ${chordId}`).toBeDefined();
      expect(chord?.voicings.length ?? 0, `MVP chord ${chordId} has insufficient voicings`).toBeGreaterThanOrEqual(MIN_VOICINGS_PER_MVP_CHORD);
    }

    await validateChordRecords(chords);

    tempDir = await mkdtemp(path.join(os.tmpdir(), "gckb-mvp-suite-"));
    const jsonlPath = path.join(tempDir, "chords.jsonl");
    await writeChordJsonl(jsonlPath, chords);

    const jsonl = await readFile(jsonlPath, "utf8");
    const lines = jsonl.split("\n").map((line) => line.trim()).filter(Boolean);
    expect(lines).toHaveLength(chords.length);

    for (const chord of chords) {
      for (const voicing of chord.voicings) {
        const svg = generateChordSvg(voicing);
        expect(svg).toContain("<svg");
        expect(svg).toContain(`aria-label=\"${voicing.id}\"`);
      }
    }
  });
});
