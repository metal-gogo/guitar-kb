import type { Voicing } from "../../types/model.js";

const DEFAULT_TUNING = ["E", "A", "D", "G", "B", "E"];

export function generateChordSvg(voicing: Voicing, tuning?: string[]): string {
  const resolvedTuning = tuning ?? DEFAULT_TUNING;
  const width = 180;
  const height = 248;
  const stringX = [20, 48, 76, 104, 132, 160];
  const fretY = [40, 72, 104, 136, 168, 200];
  const gridTopY = fretY[0] ?? 40;
  const gridBottomY = fretY[fretY.length - 1] ?? 200;
  const fretSpacing = (fretY[1] ?? 72) - gridTopY;

  const verticalLines = stringX
    .map((x) => `<line x1="${x}" y1="${gridTopY}" x2="${x}" y2="${gridBottomY}" stroke="#1f2937" stroke-width="1" />`)
    .join("\n");
  const horizontalLines = fretY
    .map((y) => `<line x1="20" y1="${y}" x2="160" y2="${y}" stroke="#1f2937" stroke-width="1" />`)
    .join("\n");

  const dots = voicing.frets
    .map((fret, index) => {
      if (fret === null || fret === 0) {
        return "";
      }
      const y = gridTopY + (fret - voicing.base_fret + 0.5) * fretSpacing;
      return [
        `<circle cx="${stringX[index]}" cy="${y}" r="8" fill="#111827" />`,
        `<text class="dot-fret-label" x="${stringX[index]}" y="${y + 3}" text-anchor="middle" font-size="7" fill="white">${fret}</text>`,
      ].join("\n");
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
      const label = resolvedTuning[index] ?? "";
      return `<text x="${x}" y="224" text-anchor="middle" font-size="12" fill="#111827">${label}</text>`;
    })
    .join("\n");

  const fretScaleLabels = Array.from({ length: Math.max(0, fretY.length - 1) }, (_, offset) => {
    const fretNumber = voicing.base_fret + offset;
    const slotMidY = ((fretY[offset] ?? gridTopY) + (fretY[offset + 1] ?? gridTopY)) / 2;
    const y = slotMidY + 4;
    return `<text class="fret-scale-label" x="6" y="${y}" text-anchor="start" font-size="10" fill="#111827">${fretNumber}</text>`;
  }).join("\n");

  const baseFretLabel = `<text class="base-fret-label" x="6" y="14" text-anchor="start" font-size="10" fill="#111827">base ${voicing.base_fret}fr</text>`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="${voicing.id}">
  <rect x="0" y="0" width="${width}" height="${height}" fill="white" />
  ${verticalLines}
  ${horizontalLines}
  ${fretScaleLabels}
  ${dots}
  ${baseFretLabel}
  ${openMuted}
  ${stringLabels}
</svg>`;
}
