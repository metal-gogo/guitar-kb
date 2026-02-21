import type { ChordRecord } from "../../types/model.js";
import { writeText } from "../../utils/fs.js";

export async function writeChordJsonl(filePath: string, chords: ChordRecord[]): Promise<void> {
  const lines = chords.map((chord) => JSON.stringify(chord)).join("\n");
  await writeText(filePath, `${lines}\n`);
}
