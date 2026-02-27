import { mkdir, readFile, rm } from "node:fs/promises";
import path from "node:path";
import { chordIndexMarkdown, chordMarkdown } from "../build/docs/generateDocs.js";
import { buildDocsSitemap } from "../build/docs/generateSitemap.js";
import { writeChordJsonl } from "../build/output/writeJsonl.js";
import { generateChordSvg } from "../build/svg/generateSvg.js";
import { ingestNormalizedChords } from "../ingest/pipeline.js";
import { SOURCE_REGISTRY } from "../ingest/sourceRegistry.js";
import type { ChordRecord } from "../types/model.js";
import { compareChordOrder } from "../utils/sort.js";
import { pathExists, writeJson, writeText } from "../utils/fs.js";
import { validateChordRecords } from "../validate/schema.js";
import { parseBuildCliOptions } from "./options.js";
import { MVP_TARGETS } from "../config.js";

const NORMALIZED_PATH = path.join("data", "generated", "chords.normalized.json");

interface BuildRuntimeOptions {
  chord?: string;
  source?: string;
  dryRun: boolean;
}

async function loadNormalized(): Promise<ChordRecord[]> {
  const content = await readFile(NORMALIZED_PATH, "utf8");
  return JSON.parse(content) as ChordRecord[];
}

export function filterBuildChords(chords: ChordRecord[], options: BuildRuntimeOptions): ChordRecord[] {
  let filtered = chords;

  if (options.source) {
    const sourceId = options.source;
    const sourceExists = SOURCE_REGISTRY.some((entry) => entry.id === sourceId);
    if (!sourceExists) {
      throw new Error(`Unknown source: ${sourceId}`);
    }

    filtered = filtered.filter((chord) => chord.source_refs.some((ref) => ref.source === sourceId));
  }

  if (options.chord) {
    const term = options.chord.toLowerCase();
    const isCanonical = term.startsWith("chord:");
    if (isCanonical) {
      filtered = filtered.filter((chord) => chord.id.toLowerCase() === term);
    } else {
      const matchingCanonicalIds = new Set(
        MVP_TARGETS
          .filter((target) => target.slug.toLowerCase().includes(term))
          .map((target) => target.chordId.toLowerCase()),
      );

      filtered = filtered.filter((chord) => {
        const chordId = chord.id.toLowerCase();
        return matchingCanonicalIds.has(chordId) || chordId.includes(term);
      });
    }
  }

  if (filtered.length === 0 && (options.chord || options.source)) {
    const requested = `${options.source ? `source=${options.source} ` : ""}${options.chord ? `chord=${options.chord}` : ""}`.trim();
    throw new Error(`No chords matched filters: ${requested}`);
  }

  return filtered;
}

async function loadOrGenerateNormalized(options: BuildRuntimeOptions): Promise<ChordRecord[]> {
  if (await pathExists(NORMALIZED_PATH)) {
    const normalized = await loadNormalized();
    return filterBuildChords(normalized, options);
  }

  const generated = await ingestNormalizedChords({
    refresh: false,
    delayMs: 250,
    chord: options.chord,
    source: options.source,
    dryRun: false,
  });

  if (!options.dryRun) {
    await writeJson(NORMALIZED_PATH, generated);
  }
  return generated;
}

async function main(): Promise<void> {
  const options = parseBuildCliOptions(process.argv.slice(2));
  const chords = (await loadOrGenerateNormalized(options)).slice().sort(compareChordOrder);

  await validateChordRecords(chords);

  if (options.dryRun) {
    process.stdout.write(`Dry run: would build outputs for ${chords.length} chords\n`);
    return;
  }

  await rm(path.join("docs", "chords"), { recursive: true, force: true });
  await rm(path.join("docs", "diagrams"), { recursive: true, force: true });
  await writeChordJsonl(path.join("data", "chords.jsonl"), chords);
  await mkdir(path.join("docs", "chords"), { recursive: true });
  await mkdir(path.join("docs", "diagrams"), { recursive: true });
  await writeText(path.join("docs", "index.md"), chordIndexMarkdown(chords));

  const sitemap = buildDocsSitemap(chords, new Date().toISOString());
  await writeJson(path.join("docs", "sitemap.json"), sitemap);

  for (const chord of chords) {
    await writeText(
      path.join("docs", "chords", `${chord.id.replace(/:/g, "__").replace(/#/g, "%23")}.md`),
      chordMarkdown(chord, chords),
    );
    for (const voicing of chord.voicings) {
      const svg = generateChordSvg(voicing, chord.tuning);
      await writeText(
        path.join("docs", "diagrams", `${voicing.id.replace(/:/g, "__").replace(/#/g, "%23")}.svg`),
        svg,
      );
    }
  }

  process.stdout.write(`Built outputs for ${chords.length} chords\n`);
}

main().catch((error: unknown) => {
  process.stderr.write(`${String(error)}\n`);
  process.exit(1);
});
