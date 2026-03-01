import { describe, expect, it } from "vitest";
import {
  assertCanonicalChordId,
  isCanonicalChordId,
  isChordQuality,
  isFlatCanonicalRoot,
  isVoicingPosition,
  sharpAliasForFlatCanonicalRoot,
  toFlatCanonicalRoot,
} from "../../src/types/guards.js";

describe("isCanonicalChordId", () => {
  it("accepts valid canonical IDs", () => {
    expect(isCanonicalChordId("chord:C:maj")).toBe(true);
    expect(isCanonicalChordId("chord:F#:dim")).toBe(true);
    expect(isCanonicalChordId("chord:Db:maj7")).toBe(true);
  });

  it("rejects invalid canonical IDs", () => {
    expect(isCanonicalChordId("C:maj")).toBe(false);
    expect(isCanonicalChordId("chord:c:maj")).toBe(false);
    expect(isCanonicalChordId("chord:C:maj 7")).toBe(false);
    expect(isCanonicalChordId("chord:C:Δ7")).toBe(false);
  });
});

describe("assertCanonicalChordId", () => {
  it("throws for invalid IDs", () => {
    expect(() => assertCanonicalChordId("invalid")).toThrow("Invalid canonical chord id");
  });
});

describe("isChordQuality", () => {
  it("matches the allowed quality set", () => {
    expect(isChordQuality("maj")).toBe(true);
    expect(isChordQuality("dim7")).toBe(true);
    expect(isChordQuality("maj7")).toBe(true);
    expect(isChordQuality("major")).toBe(false);
  });
});

describe("isVoicingPosition", () => {
  it("matches allowed voicing positions", () => {
    expect(isVoicingPosition("open")).toBe(true);
    expect(isVoicingPosition("barre")).toBe(true);
    expect(isVoicingPosition("upper")).toBe(true);
    expect(isVoicingPosition("unknown")).toBe(true);
    expect(isVoicingPosition("mid")).toBe(false);
  });
});

describe("flat-baseline root guards", () => {
  it("validates flat-baseline canonical roots", () => {
    expect(isFlatCanonicalRoot("Db")).toBe(true);
    expect(isFlatCanonicalRoot("Bb")).toBe(true);
    expect(isFlatCanonicalRoot("C#")).toBe(false);
  });

  it("maps sharp aliases to flat-baseline canonical roots", () => {
    expect(toFlatCanonicalRoot("C#")).toBe("Db");
    expect(toFlatCanonicalRoot("F#")).toBe("Gb");
    expect(toFlatCanonicalRoot("A")).toBe("A");
    expect(toFlatCanonicalRoot("H")).toBeNull();
  });

  it("returns deterministic sharp aliases for flat canonical roots", () => {
    expect(sharpAliasForFlatCanonicalRoot("Db")).toBe("C#");
    expect(sharpAliasForFlatCanonicalRoot("Bb")).toBe("A#");
    expect(sharpAliasForFlatCanonicalRoot("C")).toBeUndefined();
  });
});
