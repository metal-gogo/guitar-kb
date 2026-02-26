/**
 * Schema snapshot contract suite (issue #87)
 *
 * Captures the full serialized shape of representative chord records and locks
 * them in via Vitest snapshots. Any unintentional change to a field name, type,
 * structural nesting, or sort order will cause a snapshot mismatch and require
 * an explicit reviewer-approved update.
 *
 * Representative set: C maj, C min, C 7, C maj7 — the four MVP chords that
 * exercise all quality types and provide broad schema-shape coverage.
 */

import { describe, expect, it } from "vitest";
import { ingestNormalizedChords } from "../../src/ingest/pipeline.js";
import { compareChordOrder } from "../../src/utils/sort.js";

const REPRESENTATIVE_IDS = new Set([
  "chord:C:maj",
  "chord:C:min",
  "chord:C:7",
  "chord:C:maj7",
]);

describe("schema snapshot contracts", () => {
  it("representative chord records match stored snapshots", async () => {
    const all = (await ingestNormalizedChords({ refresh: false, delayMs: 0 }))
      .slice()
      .sort(compareChordOrder);

    const representative = all.filter((chord) => REPRESENTATIVE_IDS.has(chord.id));

    expect(representative).toHaveLength(REPRESENTATIVE_IDS.size);

    for (const chord of representative) {
      // Snapshot each chord separately so diffs are scoped to the affected record
      expect(chord, `snapshot for ${chord.id}`).toMatchSnapshot();
    }
  });
});
