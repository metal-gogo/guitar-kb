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
      expect(typeof entry.parse).toBe("function");
    }
  });
});