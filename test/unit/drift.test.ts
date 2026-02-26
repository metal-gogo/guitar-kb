/**
 * Deterministic artifact drift guard (issue #86)
 *
 * Runs the full build pipeline twice against the same cached inputs and asserts
 * that every output file is byte-identical across both runs. If any artifact
 * differs between runs the test fails and names the offending file.
 *
 * This test is the CI guard described in issue #86.
 */

import { mkdir, mkdtemp, readdir, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { chordIndexMarkdown, chordMarkdown } from "../../src/build/docs/generateDocs.js";
import { writeChordJsonl } from "../../src/build/output/writeJsonl.js";
import { generateChordSvg } from "../../src/build/svg/generateSvg.js";
import { ingestNormalizedChords } from "../../src/ingest/pipeline.js";
import { writeText } from "../../src/utils/fs.js";
import { compareChordOrder } from "../../src/utils/sort.js";
import type { ChordRecord } from "../../src/types/model.js";
import { validateChordRecords } from "../../src/validate/schema.js";

async function buildArtifacts(chords: ChordRecord[], outDir: string): Promise<void> {
  const docsDir = path.join(outDir, "docs", "chords");
  const diagramsDir = path.join(outDir, "docs", "diagrams");
  await mkdir(docsDir, { recursive: true });
  await mkdir(diagramsDir, { recursive: true });

  await writeChordJsonl(path.join(outDir, "chords.jsonl"), chords);
  await writeText(path.join(docsDir, "_index.md"), chordIndexMarkdown(chords));

  for (const chord of chords) {
    const slug = chord.id.replace(/:/g, "__").replace(/#/g, "%23");
    await writeText(path.join(docsDir, `${slug}.md`), chordMarkdown(chord, chords));
    for (const voicing of chord.voicings) {
      const voicingSlug = voicing.id.replace(/:/g, "__").replace(/#/g, "%23");
      await writeText(
        path.join(diagramsDir, `${voicingSlug}.svg`),
        generateChordSvg(voicing, chord.tuning),
      );
    }
  }
}

async function collectFiles(dir: string, base = dir): Promise<Map<string, string>> {
  const results = new Map<string, string>();
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const nested = await collectFiles(full, base);
      for (const [rel, content] of nested) results.set(rel, content);
    } else {
      results.set(path.relative(base, full), await readFile(full, "utf8"));
    }
  }
  return results;
}

describe("artifact drift guard", () => {
  const tempDirs: string[] = [];

  afterEach(async () => {
    await Promise.all(tempDirs.map((d) => rm(d, { recursive: true, force: true })));
    tempDirs.length = 0;
  });

  it("produces byte-identical JSONL, docs, and SVGs across two consecutive builds with identical inputs", async () => {
    const runA = (await ingestNormalizedChords({ refresh: false, delayMs: 0 })).slice().sort(compareChordOrder);
    const runB = (await ingestNormalizedChords({ refresh: false, delayMs: 0 })).slice().sort(compareChordOrder);

    await validateChordRecords(runA);
    await validateChordRecords(runB);

    const dirA = await mkdtemp(path.join(os.tmpdir(), "gckb-drift-a-"));
    const dirB = await mkdtemp(path.join(os.tmpdir(), "gckb-drift-b-"));
    tempDirs.push(dirA, dirB);

    await buildArtifacts(runA, dirA);
    await buildArtifacts(runB, dirB);

    const filesA = await collectFiles(dirA);
    const filesB = await collectFiles(dirB);

    const keysA = [...filesA.keys()].sort();
    const keysB = [...filesB.keys()].sort();
    expect(keysA, "artifact file list differs between runs").toEqual(keysB);

    for (const relPath of keysA) {
      expect(filesA.get(relPath), `artifact drift detected in: ${relPath}`).toBe(filesB.get(relPath));
    }
  });
});
