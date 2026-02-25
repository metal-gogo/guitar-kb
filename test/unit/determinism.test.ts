import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { chordMarkdown } from "../../src/build/docs/generateDocs.js";
import { writeChordJsonl } from "../../src/build/output/writeJsonl.js";
import { generateChordSvg } from "../../src/build/svg/generateSvg.js";
import { ingestNormalizedChords } from "../../src/ingest/pipeline.js";
import { compareChordOrder } from "../../src/utils/sort.js";
import { validateChordRecords } from "../../src/validate/schema.js";

function stableStringify(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

describe("deterministic full-pipeline outputs", () => {
  const tempDirs: string[] = [];

  afterEach(async () => {
    await Promise.all(tempDirs.map((dir) => rm(dir, { recursive: true, force: true })));
    tempDirs.length = 0;
  });

  it("produces identical normalized data, JSONL, docs markdown, and SVGs across identical runs", async () => {
    const runA = (await ingestNormalizedChords({ refresh: false, delayMs: 0 })).slice().sort(compareChordOrder);
    const runB = (await ingestNormalizedChords({ refresh: false, delayMs: 0 })).slice().sort(compareChordOrder);

    await validateChordRecords(runA);
    await validateChordRecords(runB);

    expect(stableStringify(runA)).toBe(stableStringify(runB));

    const dirA = await mkdtemp(path.join(os.tmpdir(), "gckb-det-a-"));
    const dirB = await mkdtemp(path.join(os.tmpdir(), "gckb-det-b-"));
    tempDirs.push(dirA, dirB);

    const jsonlAPath = path.join(dirA, "chords.jsonl");
    const jsonlBPath = path.join(dirB, "chords.jsonl");
    await writeChordJsonl(jsonlAPath, runA);
    await writeChordJsonl(jsonlBPath, runB);

    const jsonlA = await readFile(jsonlAPath, "utf8");
    const jsonlB = await readFile(jsonlBPath, "utf8");
    expect(jsonlA).toBe(jsonlB);

    const docsA = new Map(runA.map((chord) => [chord.id, chordMarkdown(chord, runA)]));
    const docsB = new Map(runB.map((chord) => [chord.id, chordMarkdown(chord, runB)]));
    expect(Array.from(docsA.keys())).toEqual(Array.from(docsB.keys()));
    for (const [chordId, markdownA] of docsA.entries()) {
      expect(markdownA).toBe(docsB.get(chordId));
    }

    const svgsA = new Map(
      runA.flatMap((chord) => chord.voicings.map((voicing) => [voicing.id, generateChordSvg(voicing)] as const)),
    );
    const svgsB = new Map(
      runB.flatMap((chord) => chord.voicings.map((voicing) => [voicing.id, generateChordSvg(voicing)] as const)),
    );
    expect(Array.from(svgsA.keys())).toEqual(Array.from(svgsB.keys()));
    for (const [voicingId, svgA] of svgsA.entries()) {
      expect(svgA).toBe(svgsB.get(voicingId));
    }
  });
});
