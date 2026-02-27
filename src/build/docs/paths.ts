export function encodeIdForPathSegment(id: string): string {
  return id.replace(/:/g, "__").replace(/#/g, "%23");
}

export function chordDocFileName(chordId: string): string {
  return `${encodeIdForPathSegment(chordId)}.md`;
}

export function voicingDiagramFileName(voicingId: string): string {
  return `${encodeIdForPathSegment(voicingId)}.svg`;
}

export function relativeChordPagePath(chordId: string): string {
  return `./${chordDocFileName(chordId)}`;
}

export function relativeChordIndexPath(chordId: string): string {
  return `./chords/${chordDocFileName(chordId)}`;
}

export function relativeVoicingDiagramPath(voicingId: string): string {
  return `../diagrams/${voicingDiagramFileName(voicingId)}`;
}

export function docsChordPath(chordId: string): string {
  return `docs/chords/${chordDocFileName(chordId)}`;
}

export function docsVoicingDiagramPath(voicingId: string): string {
  return `docs/diagrams/${voicingDiagramFileName(voicingId)}`;
}
