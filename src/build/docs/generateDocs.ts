import type { ChordRecord } from "../../types/model.js";

export function chordMarkdown(chord: ChordRecord): string {
  const aliases = (chord.aliases ?? []).join(", ") || "none";
  const enharmonics = (chord.enharmonic_equivalents ?? []).join(", ") || "none";
  const voicingLines = chord.voicings
    .map((voicing) => `- ${voicing.id}: frets ${voicing.frets.map((f) => (f === null ? "x" : String(f))).join("/")} (base fret ${voicing.base_fret})`)
    .join("\n");

  const sourceLines = chord.source_refs.map((ref) => `- ${ref.source}: ${ref.url}`).join("\n");

  return `# ${chord.root} ${chord.quality}\n\n- Canonical ID: ${chord.id}\n- Aliases: ${aliases}\n- Enharmonic equivalents: ${enharmonics}\n- Formula: ${chord.formula.join("-")}\n- Pitch classes: ${chord.pitch_classes.join(", ")}\n\n## Summary\n${chord.notes?.summary ?? "Chord reference generated from factual source data."}\n\n## Voicings\n${voicingLines}\n\n## Provenance\n${sourceLines}\n`;
}
