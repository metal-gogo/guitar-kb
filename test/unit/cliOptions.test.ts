import { describe, expect, it } from "vitest";
import { parseBuildCliOptions, parseIngestCliOptions } from "../../src/cli/options.js";

describe("CLI options parsing", () => {
  it("parses ingest options including refresh, filters, and dry-run", () => {
    const options = parseIngestCliOptions([
      "--mode",
      "chord",
      "--refresh",
      "--source",
      "all-guitar-chords",
      "--chord-id",
      "chord:C#:maj7",
      "--dry-run",
      "--include-parser-confidence",
    ]);

    expect(options).toEqual({
      mode: "chord",
      refresh: true,
      source: "all-guitar-chords",
      chord: "chord:Db:maj7",
      dryRun: true,
      includeParserConfidence: true,
    });
  });

  it("infers chord mode when legacy --chord is provided without --mode", () => {
    const options = parseIngestCliOptions(["--chord", "c-major"]);
    expect(options.mode).toBe("chord");
    expect(options.chord).toBe("c-major");
  });

  it("supports root-quality targeting and normalizes sharp roots to canonical flat IDs", () => {
    const options = parseIngestCliOptions(["--mode", "chord", "--root", "C#", "--quality", "maj7"]);
    expect(options.mode).toBe("chord");
    expect(options.chord).toBe("chord:Db:maj7");
  });

  it("defaults to full mode when no chord selector is provided", () => {
    const options = parseIngestCliOptions([]);
    expect(options.mode).toBe("full");
    expect(options.chord).toBeUndefined();
  });

  it("parses build options with defaults when flags are omitted", () => {
    const options = parseBuildCliOptions([]);

    expect(options).toEqual({
      source: undefined,
      chord: undefined,
      dryRun: false,
    });
  });

  it("throws when a value flag is missing its value", () => {
    expect(() => parseIngestCliOptions(["--source"]))
      .toThrow("Flag --source requires a value");
    expect(() => parseIngestCliOptions(["--mode"]))
      .toThrow("Flag --mode requires a value");
    expect(() => parseIngestCliOptions(["--mode", "weird"]))
      .toThrow("Invalid value for --mode");
    expect(() => parseBuildCliOptions(["--chord"]))
      .toThrow("Flag --chord requires a value");
  });

  it("throws for invalid mode and selector combinations", () => {
    expect(() => parseIngestCliOptions(["--mode", "chord"]))
      .toThrow("Mode chord requires one selector");
    expect(() => parseIngestCliOptions(["--mode", "full", "--chord", "chord:C:maj"]))
      .toThrow("Mode full cannot be combined");
    expect(() => parseIngestCliOptions(["--root", "Db"]))
      .toThrow("Flags --root and --quality must be provided together");
    expect(() => parseIngestCliOptions(["--quality", "maj"]))
      .toThrow("Flags --root and --quality must be provided together");
    expect(() => parseIngestCliOptions(["--mode", "chord", "--root", "H", "--quality", "maj"]))
      .toThrow("Invalid value for --root");
    expect(() => parseIngestCliOptions(["--mode", "chord", "--root", "Db", "--quality", "major"]))
      .toThrow("Invalid value for --quality");
  });
});
