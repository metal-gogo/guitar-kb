import { mkdir, readFile, rm } from "node:fs/promises";
import path from "node:path";
import { chordMarkdown } from "../build/docs/generateDocs.js";
import { writeChordJsonl } from "../build/output/writeJsonl.js";
import { generateChordSvg } from "../build/svg/generateSvg.js";
import { ingestNormalizedChords } from "../ingest/pipeline.js";
import type { ChordRecord } from "../types/model.js";
import { compareChordOrder } from "../utils/sort.js";
import { pathExists, writeJson, writeText } from "../utils/fs.js";
import { validateChordRecords } from "../validate/schema.js";

const NORMALIZED_PATH = path.join("data", "generated", "chords.normalized.json");

async function loadNormalized(): Promise<ChordRecord[]> {
  const content = await readFile(NORMALIZED_PATH, "utf8");
  return JSON.parse(content) as ChordRecord[];
}

async function loadOrGenerateNormalized(): Promise<ChordRecord[]> {
  if (await pathExists(NORMALIZED_PATH)) {
    return loadNormalized();
  }

  const generated = await ingestNormalizedChords({ refresh: false, delayMs: 250 });
  await writeJson(NORMALIZED_PATH, generated);
  return generated;
}

async function main(): Promise<void> {
  const chords = (await loadOrGenerateNormalized()).slice().sort(compareChordOrder);
  await validateChordRecords(chords);

  await rm(path.join("docs", "chords"), { recursive: true, force: true });
  await rm(path.join("docs", "diagrams"), { recursive: true, force: true });
  await writeChordJsonl(path.join("data", "chords.jsonl"), chords);
  await mkdir(path.join("docs", "chords"), { recursive: true });
  await mkdir(path.join("docs", "diagrams"), { recursive: true });

  for (const chord of chords) {
    await writeText(path.join("docs", "chords", `${chord.id.replace(/:/g, "__")}.md`), chordMarkdown(chord));
    for (const voicing of chord.voicings) {
      const svg = generateChordSvg(voicing, chord.tuning);
      await writeText(path.join("docs", "diagrams", `${voicing.id.replace(/:/g, "__")}.svg`), svg);
    }
  }

  process.stdout.write(`Built outputs for ${chords.length} chords\n`);
}

main().catch((error: unknown) => {
  process.stderr.write(`${String(error)}\n`);
  process.exit(1);
});
