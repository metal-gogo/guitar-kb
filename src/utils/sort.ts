import { QUALITY_ORDER, ROOT_ORDER } from "../config.js";
import type { ChordRecord } from "../types/model.js";

function indexOrEnd<T extends string>(list: readonly T[], value: string): number {
  const idx = list.indexOf(value as T);
  return idx === -1 ? list.length : idx;
}

export function compareChordOrder(a: ChordRecord, b: ChordRecord): number {
  const rootDiff = indexOrEnd(ROOT_ORDER, a.root) - indexOrEnd(ROOT_ORDER, b.root);
  if (rootDiff !== 0) {
    return rootDiff;
  }
  const qualityDiff = indexOrEnd(QUALITY_ORDER, a.quality) - indexOrEnd(QUALITY_ORDER, b.quality);
  if (qualityDiff !== 0) {
    return qualityDiff;
  }
  return a.id.localeCompare(b.id);
}
