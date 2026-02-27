import { describe, expect, it } from "vitest";
import { parseBuildCliOptions, parseIngestCliOptions } from "../../src/cli/options.js";

describe("CLI options parsing", () => {
  it("parses ingest options including refresh, filters, and dry-run", () => {
    const options = parseIngestCliOptions([
      "--refresh",
      "--source",
      "all-guitar-chords",
      "--chord",
      "chord:C:maj7",
      "--dry-run",
      "--include-parser-confidence",
    ]);

    expect(options).toEqual({
      refresh: true,
      source: "all-guitar-chords",
      chord: "chord:C:maj7",
      dryRun: true,
      includeParserConfidence: true,
    });
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
    expect(() => parseBuildCliOptions(["--chord"]))
      .toThrow("Flag --chord requires a value");
  });
});
