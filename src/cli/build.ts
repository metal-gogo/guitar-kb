import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { chordMarkdown } from "../build/docs/generateDocs.js";
import { writeChordJsonl } from "../build/output/writeJsonl.js";
import { generateChordSvg } from "../build/svg/generateSvg.js";
import type { ChordRecord } from "../types/model.js";
import { writeText } from "../utils/fs.js";
import { validateChordRecords } from "../validate/schema.js";

async function loadNormalized(): Promise<ChordRecord[]> {
  const content = await readFile(path.join("data", "generated", "chords.normalized.json"), "utf8");
  return JSON.parse(content) as ChordRecord[];
}

async function main(): Promise<void> {
  const chords = await loadNormalized();
  await validateChordRecords(chords);

  await writeChordJsonl(path.join("data", "chords.jsonl"), chords);
  await mkdir(path.join("docs", "chords"), { recursive: true });
  await mkdir(path.join("docs", "diagrams"), { recursive: true });

  for (const chord of chords) {
    await writeText(path.join("docs", "chords", `${chord.id.replace(/:/g, "__")}.md`), chordMarkdown(chord));
    for (const voicing of chord.voicings) {
      const svg = generateChordSvg(voicing);
      await writeText(path.join("docs", "diagrams", `${voicing.id.replace(/:/g, "__")}.svg`), svg);
    }
  }

  process.stdout.write(`Built outputs for ${chords.length} chords\n`);
}

main().catch((error: unknown) => {
  process.stderr.write(`${String(error)}\n`);
  process.exit(1);
});
