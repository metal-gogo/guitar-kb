import type { ChordRecord } from "../../types/model.js";
import { compareChordOrder } from "../../utils/sort.js";
import {
  relativeChordIndexPath,
  relativeChordPagePath,
  relativeVoicingDiagramPath,
} from "./paths.js";

function pagePathForChordId(chordId: string): string {
  return relativeChordPagePath(chordId);
}

function diagramPathForVoicingId(voicingId: string): string {
  return relativeVoicingDiagramPath(voicingId);
}

function formatNavLinks(ids: string[], byId: Map<string, ChordRecord>): string {
  if (ids.length === 0) {
    return "none";
  }

  return ids
    .map((id) => {
      const chord = byId.get(id);
      if (!chord) {
        return "";
      }
      return `[${chord.root} ${chord.quality}](${pagePathForChordId(chord.id)})`;
    })
    .filter((value) => value.length > 0)
    .join(", ");
}

function enharmonicLinkIds(chord: ChordRecord, allChords: ChordRecord[]): string[] {
  const byId = new Map(allChords.map((entry) => [entry.id, entry]));
  const related = new Set<string>();

  for (const candidate of chord.enharmonic_equivalents ?? []) {
    if (byId.has(candidate) && candidate !== chord.id) {
      related.add(candidate);
    }
  }

  for (const candidate of allChords) {
    if ((candidate.enharmonic_equivalents ?? []).includes(chord.id) && candidate.id !== chord.id) {
      related.add(candidate.id);
    }
  }

  return Array.from(related).sort((a, b) => {
    const left = byId.get(a);
    const right = byId.get(b);
    if (!left || !right) {
      return a.localeCompare(b);
    }
    return compareChordOrder(left, right);
  });
}

function relatedQualityLinkIds(chord: ChordRecord, allChords: ChordRecord[]): string[] {
  return allChords
    .filter((candidate) => candidate.root === chord.root && candidate.id !== chord.id)
    .slice()
    .sort(compareChordOrder)
    .map((candidate) => candidate.id);
}

export function chordMarkdown(chord: ChordRecord, allChords: ChordRecord[]): string {
  const byId = new Map(allChords.map((entry) => [entry.id, entry]));
  const aliases = (chord.aliases ?? []).join(", ") || "none";
  const enharmonics = (chord.enharmonic_equivalents ?? []).join(", ") || "none";
  const voicingLines = chord.voicings
    .slice()
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((voicing) => {
      const frets = voicing.frets.map((fret) => (fret === null ? "x" : String(fret))).join("/");
      const diagramPath = diagramPathForVoicingId(voicing.id);
      return `- ${voicing.id}: frets ${frets} (base fret ${voicing.base_fret}) | diagram: ${diagramPath}`;
    })
    .join("\n");

  const sourceLines = chord.source_refs.map((ref) => `- ${ref.source}: ${ref.url}`).join("\n");
  const enharmonicLinks = formatNavLinks(enharmonicLinkIds(chord, allChords), byId);
  const relatedQualityLinks = formatNavLinks(relatedQualityLinkIds(chord, allChords), byId);

  return `# ${chord.root} ${chord.quality}\n\n- Canonical ID: ${chord.id}\n- Aliases: ${aliases}\n- Enharmonic equivalents: ${enharmonics}\n- Formula: ${chord.formula.join("-")}\n- Pitch classes: ${chord.pitch_classes.join(", ")}\n\n## Summary\n${chord.notes?.summary ?? "Chord reference generated from factual source data."}\n\n## Voicings\n${voicingLines}\n\n## Provenance\n${sourceLines}\n\n## Navigation\n- [← Chord Index](../index.md)\n- Enharmonic equivalents: ${enharmonicLinks}\n- Related qualities: ${relatedQualityLinks}\n`;
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
      const pagePath = relativeChordIndexPath(chord.id);
      const aliases = (chord.aliases ?? []).join(", ") || "none";
      const formula = chord.formula.join("-");
      return `- [${chord.quality}](${pagePath}) (${chord.root} ${chord.quality}; aliases: ${aliases}; formula: ${formula})`;
    });

    return `## ${root}\n\n### Qualities\n\n${lines.join("\n")}`;
  });

  return `# Chord Index\n\n${sections.join("\n\n")}\n`;
}
