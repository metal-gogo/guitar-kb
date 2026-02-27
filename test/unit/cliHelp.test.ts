import { describe, expect, it, vi, afterEach } from "vitest";
import { parseIngestCliOptions, parseBuildCliOptions, INGEST_HELP, BUILD_HELP } from "../../src/cli/options.js";
import { SOURCE_REGISTRY } from "../../src/ingest/sourceRegistry.js";

describe("CLI help flags", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("parseIngestCliOptions: --help prints help text and exits 0", () => {
    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    const exitSpy = vi.spyOn(process, "exit").mockImplementation((() => {
      throw new Error("process.exit(0)");
    }) as (code?: string | number | null) => never);

    expect(() => parseIngestCliOptions(["--help"])).toThrow("process.exit(0)");
    expect(writeSpy).toHaveBeenCalledWith(INGEST_HELP);
    expect(exitSpy).toHaveBeenCalledWith(0);
  });

  it("parseIngestCliOptions: -h prints help text and exits 0", () => {
    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    const exitSpy = vi.spyOn(process, "exit").mockImplementation((() => {
      throw new Error("process.exit(0)");
    }) as (code?: string | number | null) => never);

    expect(() => parseIngestCliOptions(["-h"])).toThrow("process.exit(0)");
    expect(writeSpy).toHaveBeenCalledWith(INGEST_HELP);
    expect(exitSpy).toHaveBeenCalledWith(0);
  });

  it("parseBuildCliOptions: --help prints help text and exits 0", () => {
    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    const exitSpy = vi.spyOn(process, "exit").mockImplementation((() => {
      throw new Error("process.exit(0)");
    }) as (code?: string | number | null) => never);

    expect(() => parseBuildCliOptions(["--help"])).toThrow("process.exit(0)");
    expect(writeSpy).toHaveBeenCalledWith(BUILD_HELP);
    expect(exitSpy).toHaveBeenCalledWith(0);
  });

  it("parseBuildCliOptions: -h prints help text and exits 0", () => {
    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    const exitSpy = vi.spyOn(process, "exit").mockImplementation((() => {
      throw new Error("process.exit(0)");
    }) as (code?: string | number | null) => never);

    expect(() => parseBuildCliOptions(["-h"])).toThrow("process.exit(0)");
    expect(writeSpy).toHaveBeenCalledWith(BUILD_HELP);
    expect(exitSpy).toHaveBeenCalledWith(0);
  });

  it("INGEST_HELP mentions --chord, --source, --refresh, --dry-run flags", () => {
    expect(INGEST_HELP).toContain("--chord");
    expect(INGEST_HELP).toContain("--source");
    expect(INGEST_HELP).toContain("--refresh");
    expect(INGEST_HELP).toContain("--dry-run");
  });

  it("BUILD_HELP mentions --chord, --source, --dry-run flags", () => {
    expect(BUILD_HELP).toContain("--chord");
    expect(BUILD_HELP).toContain("--source");
    expect(BUILD_HELP).toContain("--dry-run");
  });

  it("INGEST_HELP and BUILD_HELP each include at least one npm run example", () => {
    expect(INGEST_HELP).toContain("npm run ingest");
    expect(BUILD_HELP).toContain("npm run build");
  });

  it("help text source list is derived from the source registry", () => {
    for (const source of SOURCE_REGISTRY) {
      expect(INGEST_HELP).toContain(source.id);
      expect(BUILD_HELP).toContain(source.id);
    }
  });

  it("parseIngestCliOptions: normal flags still parse correctly (no help flag)", () => {
    const opts = parseIngestCliOptions(["--refresh", "--chord", "c-major", "--source", "guitar-chord-org"]);
    expect(opts.refresh).toBe(true);
    expect(opts.chord).toBe("c-major");
    expect(opts.source).toBe("guitar-chord-org");
    expect(opts.dryRun).toBe(false);
  });

  it("parseBuildCliOptions: normal flags still parse correctly (no help flag)", () => {
    const opts = parseBuildCliOptions(["--chord", "c-major", "--dry-run"]);
    expect(opts.chord).toBe("c-major");
    expect(opts.dryRun).toBe(true);
  });
});
