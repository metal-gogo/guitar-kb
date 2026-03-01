export function encodeIdForPathSegment(id: string): string {
  return id.replace(/:/g, "__").replace(/#/g, "%23");
}

export function chordDocFileName(chordId: string): string {
  return `${encodeIdForPathSegment(chordId)}.md`;
}

export function voicingDiagramFileName(voicingId: string): string {
  const { voicing } = parseVoicingId(voicingId);
  return `${encodeIdForPathSegment(voicing)}.svg`;
}

interface ParsedVoicingId {
  root: string;
  quality: string;
  voicing: string;
}

function parseVoicingId(voicingId: string): ParsedVoicingId {
  const parts = voicingId.split(":");
  if (parts[0] === "chord" && parts.length >= 4) {
    return {
      root: parts[1] ?? "_legacy",
      quality: parts[2] ?? "_legacy",
      voicing: parts[3] ?? encodeIdForPathSegment(voicingId),
    };
  }

  return {
    root: "_legacy",
    quality: "_legacy",
    voicing: voicingId,
  };
}

export function voicingDiagramRelativePath(voicingId: string): string {
  const { root, quality, voicing } = parseVoicingId(voicingId);
  return `${encodeIdForPathSegment(root)}/${encodeIdForPathSegment(quality)}/${encodeIdForPathSegment(voicing)}.svg`;
}

export function relativeChordPagePath(chordId: string): string {
  return `./${chordDocFileName(chordId)}`;
}

export function relativeChordIndexPath(chordId: string): string {
  return `./chords/${chordDocFileName(chordId)}`;
}

export function relativeVoicingDiagramPath(voicingId: string): string {
  return `../diagrams/${voicingDiagramRelativePath(voicingId)}`;
}

export function docsChordPath(chordId: string): string {
  return `docs/chords/${chordDocFileName(chordId)}`;
}

export function docsVoicingDiagramPath(voicingId: string): string {
  return `docs/diagrams/${voicingDiagramRelativePath(voicingId)}`;
}

export function siteVoicingDiagramPath(voicingId: string): string {
  return `site/diagrams/${voicingDiagramRelativePath(voicingId)}`;
}
