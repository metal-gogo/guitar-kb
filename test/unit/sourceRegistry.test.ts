import { describe, expect, it } from "vitest";
import { SOURCE_REGISTRY } from "../../src/ingest/sourceRegistry.js";

describe("SOURCE_REGISTRY", () => {
  it("defines required fields for each source entry", () => {
    expect(SOURCE_REGISTRY.length).toBeGreaterThanOrEqual(2);

    for (const entry of SOURCE_REGISTRY) {
      expect(entry.id).toBeTruthy();
      expect(entry.displayName).toBeTruthy();
      expect(entry.baseUrl).toMatch(/^https?:\/\//);
      expect(entry.cacheDir).toBeTruthy();
      expect(entry.capabilities.roots.length).toBeGreaterThan(0);
      expect(entry.capabilities.qualities.length).toBeGreaterThan(0);
      expect(typeof entry.parse).toBe("function");
    }
  });

  it("uses canonical www host for all-guitar-chords", () => {
    const allGuitar = SOURCE_REGISTRY.find((entry) => entry.id === "all-guitar-chords");
    expect(allGuitar?.baseUrl).toBe("https://www.all-guitar-chords.com");
  });

  it("declares deterministic source capability metadata for core qualities", () => {
    for (const entry of SOURCE_REGISTRY) {
      expect(entry.capabilities.qualities).toEqual(["maj", "min", "7", "maj7"]);
    }
  });
});
