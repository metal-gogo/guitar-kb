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
  return {
    refresh: argv.includes("--refresh"),
    chord: readFlagValue(argv, "--chord"),
    source: readFlagValue(argv, "--source"),
    dryRun: argv.includes("--dry-run"),
  };
}

export function parseBuildCliOptions(argv: string[]): BuildCliOptions {
  return {
    chord: readFlagValue(argv, "--chord"),
    source: readFlagValue(argv, "--source"),
    dryRun: argv.includes("--dry-run"),
  };
}