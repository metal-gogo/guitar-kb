import path from "node:path";
import {
  buildSourceFreshnessReport,
  DEFAULT_MAX_AGE_DAYS,
  formatSourceFreshnessReport,
} from "../ingest/freshnessReport.js";

const SOURCE_FRESHNESS_HELP = `
Usage: npm run source-freshness [-- [OPTIONS]]

Report cache freshness per source from data/sources/ using file mtimes.
Output is deterministic for identical cache files + --as-of timestamp.

Options:
  --max-age-days <n>  Mark cache targets stale when older than <n> days.
                      Default: ${DEFAULT_MAX_AGE_DAYS}

  --as-of <iso>       Use an explicit timestamp for stale cutoff comparison.
                      Example: 2026-02-27T00:00:00.000Z

  --cache-base <dir>  Override cache directory root.
                      Default: data/sources

  --help, -h          Print this help message and exit.

Examples:
  npm run source-freshness
  npm run source-freshness -- --max-age-days 14
  npm run source-freshness -- --as-of 2026-02-27T00:00:00.000Z
`.trimStart();

interface SourceFreshnessCliOptions {
  maxAgeDays?: number;
  asOf?: Date;
  cacheBase?: string;
}

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

function parseSourceFreshnessOptions(argv: string[]): SourceFreshnessCliOptions {
  if (isHelpRequested(argv)) {
    process.stdout.write(SOURCE_FRESHNESS_HELP);
    process.exit(0);
  }

  const maxAgeDaysRaw = readFlagValue(argv, "--max-age-days");
  const asOfRaw = readFlagValue(argv, "--as-of");
  const cacheBaseRaw = readFlagValue(argv, "--cache-base");

  const maxAgeDays = maxAgeDaysRaw === undefined ? undefined : Number(maxAgeDaysRaw);
  if (maxAgeDaysRaw !== undefined && !Number.isFinite(maxAgeDays)) {
    throw new Error(`Invalid --max-age-days value: ${maxAgeDaysRaw}`);
  }

  let asOf: Date | undefined;
  if (asOfRaw !== undefined) {
    asOf = new Date(asOfRaw);
    if (Number.isNaN(asOf.getTime())) {
      throw new Error(`Invalid --as-of timestamp: ${asOfRaw}`);
    }
  }

  const cacheBase = cacheBaseRaw === undefined
    ? undefined
    : path.resolve(cacheBaseRaw);

  return {
    maxAgeDays,
    asOf,
    cacheBase,
  };
}

async function main(): Promise<void> {
  const options = parseSourceFreshnessOptions(process.argv.slice(2));
  const report = await buildSourceFreshnessReport(options);
  process.stdout.write(formatSourceFreshnessReport(report));
}

main().catch((error: unknown) => {
  process.stderr.write(`${String(error)}\n`);
  process.exit(1);
});
