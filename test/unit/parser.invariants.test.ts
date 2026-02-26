/**
 * Parser formula-note coherence invariants (issue #104).
 *
 * These tests run the same structural invariants over every valid fixture for
 * both source parsers, ensuring that:
 *   1. formula and pitch_classes are both non-empty
 *   2. formula.length === pitch_classes.length  ← the key coherence invariant
 *   3. every formula item is a non-empty string
 *   4. every pitch class matches a valid note-name pattern
 *   5. voicings is an array and each voicing carries source_refs
 *
 * Adding a new fixture or parser fixture immediately exercises all invariants
 * without requiring bespoke per-chord assertions.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseGuitarChordOrg } from "../../src/ingest/parsers/guitarChordOrg.js";
import { parseAllGuitarChords } from "../../src/ingest/parsers/allGuitarChords.js";
import type { RawChordRecord } from "../../src/types/model.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const NOTE_PATTERN = /^[A-G][#b]?$/;

/**
 * Asserts that `parsed` satisfies all formula-pitch-class coherence invariants.
 * `label` is used in failure messages to identify source + chord.
 */
function assertCoherenceInvariants(parsed: RawChordRecord, label: string): void {
  // 1. root must be non-empty
  expect(parsed.root, `${label}: root must be non-empty`).toBeTruthy();

  // 2. formula must be non-empty
  expect(parsed.formula.length, `${label}: formula must be non-empty`).toBeGreaterThan(0);

  // 3. pitch_classes must be non-empty
  expect(
    parsed.pitch_classes.length,
    `${label}: pitch_classes must be non-empty`,
  ).toBeGreaterThan(0);

  // 4. KEY INVARIANT: counts must match
  expect(
    parsed.pitch_classes.length,
    `${label}: pitch_classes.length must equal formula.length`,
  ).toBe(parsed.formula.length);

  // 5. every formula item must be a non-empty string
  for (const [i, interval] of parsed.formula.entries()) {
    expect(
      typeof interval === "string" && interval.length > 0,
      `${label}: formula[${i}] must be a non-empty string (got ${JSON.stringify(interval)})`,
    ).toBe(true);
  }

  // 6. every pitch class must match the valid note-name pattern
  for (const [i, pc] of parsed.pitch_classes.entries()) {
    expect(
      NOTE_PATTERN.test(pc),
      `${label}: pitch_classes[${i}] "${pc}" does not match note-name pattern`,
    ).toBe(true);
  }

  // 7. voicings must be an array
  expect(Array.isArray(parsed.voicings), `${label}: voicings must be an array`).toBe(true);

  // 8. each voicing must carry at least one source_ref
  for (const [vi, voicing] of parsed.voicings.entries()) {
    expect(
      voicing.source_refs && voicing.source_refs.length > 0,
      `${label}: voicings[${vi}] must have at least one source_ref`,
    ).toBe(true);
  }
}

function readFixture(source: "guitar-chord-org" | "all-guitar-chords", slug: string): string {
  return readFileSync(`test/fixtures/sources/${source}/${slug}.html`, "utf8");
}

// ---------------------------------------------------------------------------
// Fixture definitions — slugs that represent valid, parseable chord pages
// ---------------------------------------------------------------------------

const VALID_SLUGS = [
  "a-major",
  "a-sharp-major",
  "b-major",
  "c-major",
  "c-minor",
  "c-sharp-major",
  "c7",
  "cmaj7",
  "d-major",
  "d-sharp-major",
  "e-major",
  "f-major",
  "f-sharp-major",
  "g-major",
  "g-sharp-major",
] as const;

const GCO_URL_BY_SLUG: Record<string, string> = {
  "a-major": "https://www.guitar-chord.org/a-maj.html",
  "a-sharp-major": "https://www.guitar-chord.org/a-sharp-maj.html",
  "b-major": "https://www.guitar-chord.org/b-maj.html",
  "c-major": "https://www.guitar-chord.org/c-maj.html",
  "c-minor": "https://www.guitar-chord.org/c-min.html",
  "c-sharp-major": "https://www.guitar-chord.org/c-sharp-maj.html",
  "c7": "https://www.guitar-chord.org/c-7.html",
  "cmaj7": "https://www.guitar-chord.org/c-maj7.html",
  "d-major": "https://www.guitar-chord.org/d-maj.html",
  "d-sharp-major": "https://www.guitar-chord.org/d-sharp-maj.html",
  "e-major": "https://www.guitar-chord.org/e-maj.html",
  "f-major": "https://www.guitar-chord.org/f-maj.html",
  "f-sharp-major": "https://www.guitar-chord.org/f-sharp-maj.html",
  "g-major": "https://www.guitar-chord.org/g-maj.html",
  "g-sharp-major": "https://www.guitar-chord.org/g-sharp-maj.html",
};

const AGC_URL_BY_SLUG: Record<string, string> = {
  "a-major": "https://www.all-guitar-chords.com/chords/index/a/major",
  "a-sharp-major": "https://www.all-guitar-chords.com/chords/index/a-sharp/major",
  "b-major": "https://www.all-guitar-chords.com/chords/index/b/major",
  "c-major": "https://www.all-guitar-chords.com/chords/index/c/major",
  "c-minor": "https://www.all-guitar-chords.com/chords/index/c/minor",
  "c-sharp-major": "https://www.all-guitar-chords.com/chords/index/c-sharp/major",
  "c7": "https://www.all-guitar-chords.com/chords/index/c/dominant-7th",
  "cmaj7": "https://www.all-guitar-chords.com/chords/index/c/major-7th",
  "d-major": "https://www.all-guitar-chords.com/chords/index/d/major",
  "d-sharp-major": "https://www.all-guitar-chords.com/chords/index/d-sharp/major",
  "e-major": "https://www.all-guitar-chords.com/chords/index/e/major",
  "f-major": "https://www.all-guitar-chords.com/chords/index/f/major",
  "f-sharp-major": "https://www.all-guitar-chords.com/chords/index/f-sharp/major",
  "g-major": "https://www.all-guitar-chords.com/chords/index/g/major",
  "g-sharp-major": "https://www.all-guitar-chords.com/chords/index/g-sharp/major",
};

// ---------------------------------------------------------------------------
// Invariant suites
// ---------------------------------------------------------------------------

describe("parser formula-note coherence invariants", () => {
  describe("guitar-chord-org — all valid fixtures", () => {
    for (const slug of VALID_SLUGS) {
      it(`${slug}: formula length equals pitch_classes length`, () => {
        const url = GCO_URL_BY_SLUG[slug];
        expect(url, `no URL mapping for ${slug}`).toBeDefined();
        const html = readFixture("guitar-chord-org", slug);
        const parsed = parseGuitarChordOrg(html, url!);
        assertCoherenceInvariants(parsed, `guitar-chord-org/${slug}`);
      });
    }
  });

  describe("all-guitar-chords — all valid fixtures", () => {
    for (const slug of VALID_SLUGS) {
      it(`${slug}: formula length equals pitch_classes length`, () => {
        const url = AGC_URL_BY_SLUG[slug];
        expect(url, `no URL mapping for ${slug}`).toBeDefined();
        const html = readFixture("all-guitar-chords", slug);
        const parsed = parseAllGuitarChords(html, url!);
        assertCoherenceInvariants(parsed, `all-guitar-chords/${slug}`);
      });
    }
  });
});
