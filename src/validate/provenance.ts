import type { ChordRecord } from "../types/model.js";
import { ValidationError, ValidationErrorCode } from "./errors.js";

/**
 * Thrown by {@link checkProvenanceCoverage} when any provenance-required field
 * is absent or empty.
 *
 * The message includes a precise path of the form:
 *   `chord:C:maj › source_refs is empty`
 *   `chord:C:maj › voicing v1 › source_refs is empty`
 *   `chord:C:maj › source_refs[0].source is empty`
 */

/**
 * Walks every {@link ChordRecord} and its voicings checking that:
 * - `source_refs` is a non-empty array at chord level
 * - each chord-level `source_refs[*].source` and `.url` are non-empty strings
 * - `source_refs` is a non-empty array at voicing level
 * - each voicing-level `source_refs[*].source` and `.url` are non-empty strings
 *
 * Throws a {@link ValidationError} with code
 * {@link ValidationErrorCode.PROVENANCE_MISSING} on the first violation found,
 * with an actionable path in the message.
 */
export function checkProvenanceCoverage(records: ChordRecord[]): void {
  for (const chord of records) {
    const chordPath = chord.id;

    // ── chord-level source_refs ──────────────────────────────────────────────
    if (!Array.isArray(chord.source_refs) || chord.source_refs.length === 0) {
      throw new ValidationError(
        ValidationErrorCode.PROVENANCE_MISSING,
        `Provenance check failed: ${chordPath} › source_refs is empty`,
      );
    }

    for (const [refIndex, ref] of chord.source_refs.entries()) {
      if (!ref.source || ref.source.trim() === "") {
        throw new ValidationError(
          ValidationErrorCode.PROVENANCE_MISSING,
          `Provenance check failed: ${chordPath} › source_refs[${refIndex}].source is empty`,
        );
      }
      if (!ref.url || ref.url.trim() === "") {
        throw new ValidationError(
          ValidationErrorCode.PROVENANCE_MISSING,
          `Provenance check failed: ${chordPath} › source_refs[${refIndex}].url is empty`,
        );
      }
    }

    // ── voicing-level source_refs ────────────────────────────────────────────
    for (const voicing of chord.voicings) {
      const voicingPath = `${chordPath} › voicing ${voicing.id}`;

      if (!Array.isArray(voicing.source_refs) || voicing.source_refs.length === 0) {
        throw new ValidationError(
          ValidationErrorCode.PROVENANCE_MISSING,
          `Provenance check failed: ${voicingPath} › source_refs is empty`,
        );
      }

      for (const [refIndex, ref] of voicing.source_refs.entries()) {
        if (!ref.source || ref.source.trim() === "") {
          throw new ValidationError(
            ValidationErrorCode.PROVENANCE_MISSING,
            `Provenance check failed: ${voicingPath} › source_refs[${refIndex}].source is empty`,
          );
        }
        if (!ref.url || ref.url.trim() === "") {
          throw new ValidationError(
            ValidationErrorCode.PROVENANCE_MISSING,
            `Provenance check failed: ${voicingPath} › source_refs[${refIndex}].url is empty`,
          );
        }
      }
    }
  }
}
