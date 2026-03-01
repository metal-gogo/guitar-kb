const ID_SEPARATOR = ":";
const PATH_SEPARATOR = "__";
const SHARP_TOKEN = "-sharp";

function encodePathToken(token: string): string {
  return token.replace(/#/g, SHARP_TOKEN);
}

export function encodeIdForPathSegment(id: string): string {
  return id.split(ID_SEPARATOR).map(encodePathToken).join(PATH_SEPARATOR);
}

export function chordDocFileName(chordId: string): string {
  return `${encodeIdForPathSegment(chordId)}.md`;
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
