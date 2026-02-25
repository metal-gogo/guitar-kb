import type { ChordRecord } from "../../types/model.js";
import { compareChordOrder } from "../../utils/sort.js";

export function chordMarkdown(chord: ChordRecord): string {
  const aliases = (chord.aliases ?? []).join(", ") || "none";
  const enharmonics = (chord.enharmonic_equivalents ?? []).join(", ") || "none";
  const voicingLines = chord.voicings
    .slice()
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((voicing) => {
      const frets = voicing.frets.map((fret) => (fret === null ? "x" : String(fret))).join("/");
      const diagramPath = `../diagrams/${voicing.id.replace(/:/g, "__")}.svg`;
      return `- ${voicing.id}: frets ${frets} (base fret ${voicing.base_fret}) | diagram: ${diagramPath}`;
    })
    .join("\n");

  const sourceLines = chord.source_refs.map((ref) => `- ${ref.source}: ${ref.url}`).join("\n");

  return `# ${chord.root} ${chord.quality}\n\n- Canonical ID: ${chord.id}\n- Aliases: ${aliases}\n- Enharmonic equivalents: ${enharmonics}\n- Formula: ${chord.formula.join("-")}\n- Pitch classes: ${chord.pitch_classes.join(", ")}\n\n## Summary\n${chord.notes?.summary ?? "Chord reference generated from factual source data."}\n\n## Voicings\n${voicingLines}\n\n## Provenance\n${sourceLines}\n`;
}

export function chordIndexMarkdown(chords: ChordRecord[]): string {
  const sorted = chords.slice().sort(compareChordOrder);
  const grouped = new Map<string, ChordRecord[]>();

  for (const chord of sorted) {
    const list = grouped.get(chord.root) ?? [];
    list.push(chord);
    grouped.set(chord.root, list);
  }

  const sections = Array.from(grouped.entries()).map(([root, rootChords]) => {
    const lines = rootChords.map((chord) => {
      const pagePath = `./chords/${chord.id.replace(/:/g, "__")}.md`;
      const aliases = (chord.aliases ?? []).join(", ") || "none";
      const formula = chord.formula.join("-");
      return `- [${chord.root} ${chord.quality}](${pagePath}) (aliases: ${aliases}; formula: ${formula})`;
    });

    return `## ${root}\n\n${lines.join("\n")}`;
  });

  return `# Chord Index\n\n${sections.join("\n\n")}\n`;
}
