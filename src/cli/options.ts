interface BaseCliOptions {
  chord?: string;
  source?: string;
  dryRun: boolean;
}

export interface IngestCliOptions extends BaseCliOptions {
  refresh: boolean;
}

export interface BuildCliOptions extends BaseCliOptions {
}

const INGEST_HELP = `
Usage: npm run ingest [-- [OPTIONS]]

Re-parse cached HTML source files and write normalized chord data to
data/generated/chords.normalized.json.

Options:
  --chord <name>    Process only chords whose ID or slug matches <name>.
                    Accepts a canonical ID (e.g. chord:C:maj) or a partial
                    chord name (e.g. c-major, cmaj7).
                    Example: npm run ingest -- --chord c-major

  --source <id>     Process only the specified source.
                    Known sources: guitar-chord-org, all-guitar-chords.
                    Example: npm run ingest -- --source guitar-chord-org

  --refresh         Re-fetch all source pages from the network, overwriting
                    cached HTML under data/sources/.
                    Example: npm run ingest -- --refresh

  --dry-run         Parse and normalize without writing any output files.
                    Useful for smoke-testing the parsing pipeline.
                    Example: npm run ingest -- --dry-run

  --help, -h        Print this help message and exit.

Examples:
  npm run ingest
  npm run ingest -- --chord c-major
  npm run ingest -- --source all-guitar-chords --dry-run
  npm run ingest -- --refresh
`.trimStart();

const BUILD_HELP = `
Usage: npm run build [-- [OPTIONS]]

Generate all output artifacts (docs Markdown, SVG diagrams, chords.jsonl) from
normalized chord data in data/generated/chords.normalized.json.  If that file
does not exist, ingestion runs automatically first.

Options:
  --chord <name>    Build only chords whose ID or slug matches <name>.
                    Accepts a canonical ID (e.g. chord:C:maj) or a partial
                    chord name (e.g. c-major, cmaj7).
                    Example: npm run build -- --chord c-major

  --source <id>     Build only chords that have at least one voicing from the
                    specified source.
                    Known sources: guitar-chord-org, all-guitar-chords.
                    Example: npm run build -- --source guitar-chord-org

  --dry-run         Report how many chords would be built without writing any
                    output files.
                    Example: npm run build -- --dry-run

  --help, -h        Print this help message and exit.

Examples:
  npm run build
  npm run build -- --chord c-major
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

export function parseIngestCliOptions(argv: string[]): IngestCliOptions {
  if (isHelpRequested(argv)) {
    process.stdout.write(INGEST_HELP);
    process.exit(0);
  }
  return {
    refresh: argv.includes("--refresh"),
    chord: readFlagValue(argv, "--chord"),
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
