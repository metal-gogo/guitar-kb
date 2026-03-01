import { describe, expect, it } from "vitest";
import { SOURCE_REGISTRY } from "../../src/ingest/sourceRegistry.js";
import { CORE_QUALITY_ORDER } from "../../src/config.js";

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

  it("declares deterministic source capability metadata for configured quality order", () => {
    const guitarChordOrg = SOURCE_REGISTRY.find((entry) => entry.id === "guitar-chord-org");
    const allGuitarChords = SOURCE_REGISTRY.find((entry) => entry.id === "all-guitar-chords");

    expect(guitarChordOrg?.capabilities.qualities).toEqual([...CORE_QUALITY_ORDER]);
    expect(allGuitarChords?.capabilities.qualities).toEqual([...CORE_QUALITY_ORDER]);
  });

  it("keeps source precedence order all-guitar-chords then guitar-chord-org", () => {
    expect(SOURCE_REGISTRY[0]?.id).toBe("all-guitar-chords");
    expect(SOURCE_REGISTRY[1]?.id).toBe("guitar-chord-org");
  });
});
