import { SOURCE_REGISTRY } from "../ingest/sourceRegistry.js";
import { isChordQuality, toFlatCanonicalRoot } from "../types/guards.js";

interface BaseCliOptions {
  chord?: string;
  source?: string;
  dryRun: boolean;
}

export type IngestMode = "full" | "chord";

export interface IngestCliOptions extends BaseCliOptions {
  mode: IngestMode;
  refresh: boolean;
  includeParserConfidence: boolean;
}

export interface BuildCliOptions extends BaseCliOptions {
}

const KNOWN_SOURCE_IDS = SOURCE_REGISTRY.map((entry) => entry.id).join(", ");
const KNOWN_MODES = ["full", "chord"] as const;

const INGEST_HELP = `
Usage: npm run ingest [-- [OPTIONS]]

Re-parse cached HTML source files and write normalized chord data to
data/generated/chords.normalized.json.

Options:
  --mode <full|chord>
                    Select ingest mode semantics:
                    - full: process the full configured matrix
                    - chord: process one chord target only
                    Default is full unless a chord selector is provided.
                    Example: npm run ingest -- --mode full

  --chord <name>    Process only chords whose ID or slug matches <name>.
                    Accepts a canonical ID (e.g. chord:C:maj) or a partial
                    chord name (e.g. c-major, c-dim7).
                    Backward-compatible selector that infers --mode chord
                    when --mode is omitted.
                    Example: npm run ingest -- --chord c-dim7

  --chord-id <id>   Process one canonical chord ID in chord mode.
                    Example: npm run ingest -- --mode chord --chord-id chord:Db:maj7

  --root <note>     Root note for chord mode target selection.
                    Must be used with --quality.
                    Supports flat or sharp input (e.g. Db, C#).

  --quality <name>  Chord quality for chord mode target selection.
                    Must be used with --root.
                    Example: npm run ingest -- --mode chord --root C# --quality maj7

  --source <id>     Process only the specified source.
                    Known sources: ${KNOWN_SOURCE_IDS}.
                    Example: npm run ingest -- --mode chord --chord-id chord:Db:maj7 --source guitar-chord-org

  --refresh         Re-fetch all source pages from the network, overwriting
                    cached HTML under data/sources/.
                    Example: npm run ingest -- --refresh

  --dry-run         Parse and normalize without writing any output files.
                    Useful for smoke-testing the parsing pipeline.
                    Example: npm run ingest -- --dry-run

  --include-parser-confidence
                    Include parser confidence annotations in
                    data/generated/chords.normalized.json for debugging.
                    Default is off to avoid schema changes in final outputs.
                    Example: npm run ingest -- --include-parser-confidence

Environment:
  INGEST_STRICT_CAPABILITIES=1
                    Fail ingest when selected chord IDs remain unresolved
                    after applying per-source capability metadata and target
                    selection.

  INGEST_CAPABILITY_ALLOWLIST=<comma-separated canonical chord IDs>
                    Temporary allowlist for known unsupported gaps in strict
                    mode. Example:
                    INGEST_CAPABILITY_ALLOWLIST=chord:C:min7,chord:D:aug

  --help, -h        Print this help message and exit.

Examples:
  npm run ingest
  npm run ingest -- --mode full
  npm run ingest -- --mode chord --chord-id chord:Db:maj7
  npm run ingest -- --mode chord --root C# --quality maj7 --source all-guitar-chords
  npm run ingest -- --chord c-dim7
  npm run ingest -- --source all-guitar-chords --dry-run
  npm run ingest -- --refresh
  npm run ingest -- --include-parser-confidence
`.trimStart();

const BUILD_HELP = `
Usage: npm run build [-- [OPTIONS]]

Generate all output artifacts (docs Markdown, SVG diagrams, chords.jsonl) from
normalized chord data in data/generated/chords.normalized.json.  If that file
does not exist, ingestion runs automatically first.

Options:
  --chord <name>    Build only chords whose ID or slug matches <name>.
                    Accepts a canonical ID (e.g. chord:C:maj) or a partial
                    chord name (e.g. c-major, c-dim7).
                    Example: npm run build -- --chord c-dim7

  --source <id>     Build only chords that have at least one voicing from the
                    specified source.
                    Known sources: ${KNOWN_SOURCE_IDS}.
                    Example: npm run build -- --source guitar-chord-org

  --dry-run         Report how many chords would be built without writing any
                    output files.
                    Example: npm run build -- --dry-run

  --help, -h        Print this help message and exit.

Examples:
  npm run build
  npm run build -- --chord c-dim7
  npm run build -- --source all-guitar-chords --dry-run
  npm run build -- --dry-run
`.trimStart();

function isHelpRequested(argv: string[]): boolean {
  return argv.includes("--help") || argv.includes("-h");
}

function readFlagValue(argv: string[], flag: string): string | undefined {
  const index = argv.indexOf(flag);
  if (index < 0) {
    return undefined;
  }

  const next = argv[index + 1];
  if (!next || next.startsWith("--")) {
    throw new Error(`Flag ${flag} requires a value`);
  }
  return next;
}

function parseIngestMode(mode: string | undefined): IngestMode | undefined {
  if (!mode) {
    return undefined;
  }
  if (mode === "full" || mode === "chord") {
    return mode;
  }
  throw new Error(`Invalid value for --mode: ${mode}. Expected one of: ${KNOWN_MODES.join(", ")}`);
}

function parseCanonicalRootInput(rootInput: string, flag = "--root"): string {
  const normalized = rootInput.trim().replaceAll("♯", "#").replaceAll("♭", "b");
  const parsed = normalized.match(/^([A-Ga-g])([#b])?$/);
  if (!parsed) {
    throw new Error(`Invalid value for ${flag}: ${rootInput}`);
  }
  const root = `${parsed[1]?.toUpperCase() ?? ""}${parsed[2] ?? ""}`;
  const canonicalRoot = toFlatCanonicalRoot(root);
  if (!canonicalRoot) {
    throw new Error(`Unsupported root for ${flag}: ${rootInput}`);
  }
  return canonicalRoot;
}

function parseChordQualityInput(qualityInput: string): string {
  const quality = qualityInput.trim().toLowerCase();
  if (!isChordQuality(quality)) {
    throw new Error(`Invalid value for --quality: ${qualityInput}`);
  }
  return quality;
}

function normalizeCanonicalChordId(selector: string, flag: string): string {
  const parsed = selector.trim().match(/^chord:([^:]+):([^:]+)$/i);
  if (!parsed) {
    throw new Error(`Invalid value for ${flag}: ${selector}. Expected chord:<ROOT>:<QUALITY>`);
  }
  const canonicalRoot = parseCanonicalRootInput(parsed[1] ?? "", flag);
  const quality = parseChordQualityInput(parsed[2] ?? "");
  return `chord:${canonicalRoot}:${quality}`;
}

export function parseIngestCliOptions(argv: string[]): IngestCliOptions {
  if (isHelpRequested(argv)) {
    process.stdout.write(INGEST_HELP);
    process.exit(0);
  }

  const modeFlag = parseIngestMode(readFlagValue(argv, "--mode"));
  const legacyChordInput = readFlagValue(argv, "--chord");
  const chordIdInput = readFlagValue(argv, "--chord-id");
  const rootValue = readFlagValue(argv, "--root");
  const qualityValue = readFlagValue(argv, "--quality");

  if ((rootValue && !qualityValue) || (!rootValue && qualityValue)) {
    throw new Error("Flags --root and --quality must be provided together");
  }

  const rootQualitySelector = (rootValue && qualityValue)
    ? `chord:${parseCanonicalRootInput(rootValue)}:${parseChordQualityInput(qualityValue)}`
    : undefined;
  const chordIdSelector = chordIdInput
    ? normalizeCanonicalChordId(chordIdInput, "--chord-id")
    : undefined;
  const legacyChordSelector = legacyChordInput?.trim().toLowerCase().startsWith("chord:")
    ? normalizeCanonicalChordId(legacyChordInput, "--chord")
    : legacyChordInput;

  const candidates = [chordIdSelector, rootQualitySelector, legacyChordSelector].filter((value): value is string => Boolean(value));
  const uniqueSelectors = [...new Set(candidates.map((value) => value.toLowerCase()))];
  if (uniqueSelectors.length > 1) {
    throw new Error("Conflicting chord selectors provided; use only one of --chord, --chord-id, or --root/--quality");
  }

  const chordSelector = chordIdSelector ?? rootQualitySelector ?? legacyChordSelector;
  const mode = modeFlag ?? (chordSelector ? "chord" : "full");

  if (mode === "full" && chordSelector) {
    throw new Error("Mode full cannot be combined with --chord, --chord-id, or --root/--quality");
  }
  if (mode === "chord" && !chordSelector) {
    throw new Error("Mode chord requires one selector: --chord, --chord-id, or --root with --quality");
  }

  return {
    mode,
    refresh: argv.includes("--refresh"),
    includeParserConfidence: argv.includes("--include-parser-confidence"),
    chord: chordSelector,
    source: readFlagValue(argv, "--source"),
    dryRun: argv.includes("--dry-run"),
  };
}

export function parseBuildCliOptions(argv: string[]): BuildCliOptions {
  if (isHelpRequested(argv)) {
    process.stdout.write(BUILD_HELP);
    process.exit(0);
  }
  return {
    chord: readFlagValue(argv, "--chord"),
    source: readFlagValue(argv, "--source"),
    dryRun: argv.includes("--dry-run"),
  };
}

export { INGEST_HELP, BUILD_HELP };
