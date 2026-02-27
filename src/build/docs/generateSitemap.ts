import type { ChordRecord } from "../../types/model.js";
import { compareChordOrder } from "../../utils/sort.js";

export interface SitemapVoicingEntry {
  id: string;
  diagram_path: string;
}

export interface SitemapEntry {
  id: string;
  root: string;
  quality: string;
  aliases: string[];
  path: string;
  voicings: SitemapVoicingEntry[];
  related: {
    enharmonic_equivalents: string[];
    same_root_qualities: string[];
  };
}

export interface DocsSitemap {
  generated_at: string;
  total: number;
  entries: SitemapEntry[];
}

function chordDocPath(chordId: string): string {
  return `docs/chords/${chordId.replace(/:/g, "__").replace(/#/g, "%23")}.md`;
}

function voicingDiagramPath(voicingId: string): string {
  return `docs/diagrams/${voicingId.replace(/:/g, "__").replace(/#/g, "%23")}.svg`;
}

function enharmonicIds(chord: ChordRecord, byId: Map<string, ChordRecord>): string[] {
  const related = new Set<string>();

  for (const candidate of chord.enharmonic_equivalents ?? []) {
    if (byId.has(candidate) && candidate !== chord.id) {
      related.add(candidate);
    }
  }

  for (const [id, other] of byId) {
    if (id !== chord.id && (other.enharmonic_equivalents ?? []).includes(chord.id)) {
      related.add(id);
    }
  }

  return Array.from(related).sort((a, b) => {
    const left = byId.get(a);
    const right = byId.get(b);
    if (!left || !right) return a.localeCompare(b);
    return compareChordOrder(left, right);
  });
}

function sameRootQualityIds(chord: ChordRecord, sorted: ChordRecord[]): string[] {
  return sorted
    .filter((c) => c.root === chord.root && c.id !== chord.id)
    .map((c) => c.id);
}

export function buildDocsSitemap(
  chords: ChordRecord[],
  generatedAt: string,
): DocsSitemap {
  const sorted = chords.slice().sort(compareChordOrder);
  const byId = new Map(sorted.map((c) => [c.id, c]));

  const entries: SitemapEntry[] = sorted.map((chord) => ({
    id: chord.id,
    root: chord.root,
    quality: chord.quality,
    aliases: (chord.aliases ?? []).slice().sort(),
    path: chordDocPath(chord.id),
    voicings: chord.voicings
      .slice()
      .sort((a, b) => a.id.localeCompare(b.id))
      .map((v) => ({
        id: v.id,
        diagram_path: voicingDiagramPath(v.id),
      })),
    related: {
      enharmonic_equivalents: enharmonicIds(chord, byId),
      same_root_qualities: sameRootQualityIds(chord, sorted),
    },
  }));

  return {
    generated_at: generatedAt,
    total: entries.length,
    entries,
  };
}
