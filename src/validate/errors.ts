/**
 * Stable error codes for all schema and guard validation failures.
 *
 * Each code identifies a specific failure category and remains stable across
 * releases so callers can programmatically handle or suppress individual kinds.
 */
export const ValidationErrorCode = {
  /** AJV JSON-Schema validation failed for a chord record. */
  SCHEMA_INVALID: "SCHEMA_INVALID",

  /** A voicing's fret array length does not match the tuning string count. */
  VOICING_STRING_COUNT_MISMATCH: "VOICING_STRING_COUNT_MISMATCH",

  /** A voicing contains a non-integer fret value on a played string. */
  VOICING_INVALID_FRET_VALUE: "VOICING_INVALID_FRET_VALUE",

  /** A voicing's fret value is outside the valid range [0, 24]. */
  VOICING_FRET_OUT_OF_RANGE: "VOICING_FRET_OUT_OF_RANGE",

  /** A voicing has all strings muted (no played strings). */
  VOICING_ALL_STRINGS_MUTED: "VOICING_ALL_STRINGS_MUTED",
} as const;

/** Union of all {@link ValidationErrorCode} values. */
export type ValidationErrorCode =
  (typeof ValidationErrorCode)[keyof typeof ValidationErrorCode];

/**
 * Thrown by {@link validateChordRecords} on any validation failure.
 *
 * The {@link code} property is one of the stable {@link ValidationErrorCode}
 * values so callers can branch on error type without parsing the message.
 *
 * @example
 * ```ts
 * try {
 *   await validateChordRecords(records);
 * } catch (e) {
 *   if (e instanceof ValidationError && e.code === ValidationErrorCode.SCHEMA_INVALID) {
 *     // handle schema failure
 *   }
 * }
 * ```
 */
export class ValidationError extends Error {
  readonly code: ValidationErrorCode;

  constructor(code: ValidationErrorCode, message: string) {
    super(message);
    this.name = "ValidationError";
    this.code = code;
  }
}
