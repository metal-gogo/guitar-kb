import type { Voicing } from "../../types/model.js";

const DEFAULT_TUNING = ["E", "A", "D", "G", "B", "E"];

export function generateChordSvg(voicing: Voicing, tuning: string[] = DEFAULT_TUNING): string {
  const width = 180;
  const height = 248;
  const stringX = [20, 48, 76, 104, 132, 160];
  const fretY = [40, 72, 104, 136, 168, 200];

  const verticalLines = stringX
    .map((x) => `<line x1="${x}" y1="40" x2="${x}" y2="200" stroke="#1f2937" stroke-width="1" />`)
    .join("\n");
  const horizontalLines = fretY
    .map((y) => `<line x1="20" y1="${y}" x2="160" y2="${y}" stroke="#1f2937" stroke-width="1" />`)
    .join("\n");

  const dots = voicing.frets
    .map((fret, index) => {
      if (fret === null || fret === 0) {
        return "";
      }
      const y = 40 + (fret - voicing.base_fret + 0.5) * 32;
      return `<circle cx="${stringX[index]}" cy="${y}" r="8" fill="#111827" />`;
    })
    .filter(Boolean)
    .join("\n");

  const openMuted = voicing.frets
    .map((fret, index) => {
      const label = fret === null ? "X" : fret === 0 ? "O" : "";
      if (!label) {
        return "";
      }
      return `<text x="${stringX[index]}" y="24" text-anchor="middle" font-size="12" fill="#111827">${label}</text>`;
    })
    .filter(Boolean)
    .join("\n");

  const stringLabels = stringX
    .map((x, index) => {
      const label = tuning[index] ?? "";
      return `<text x="${x}" y="224" text-anchor="middle" font-size="12" fill="#111827">${label}</text>`;
    })
    .join("\n");

  const fretLabel = voicing.base_fret > 1
    ? `<text x="6" y="58" text-anchor="start" font-size="12" fill="#111827">${voicing.base_fret}fr</text>`
    : "";

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="${voicing.id}">
  <rect x="0" y="0" width="${width}" height="${height}" fill="white" />
  ${verticalLines}
  ${horizontalLines}
  ${dots}
  ${openMuted}
  ${fretLabel}
  ${stringLabels}
</svg>`;
}
