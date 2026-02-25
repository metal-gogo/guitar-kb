import { describe, expect, it } from "vitest";
import { assertCanonicalChordId, isCanonicalChordId, isChordQuality } from "../../src/types/guards.js";

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
