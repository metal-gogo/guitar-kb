import path from "node:path";
import {
  buildDocsChangelogSnapshot,
  DEFAULT_BASELINE_PATH,
  DEFAULT_DOCS_ROOT,
  formatDocsChangelogSnapshot,
  writeDocsBaselineSnapshot,
} from "../build/docs/changelogSnapshot.js";
import { writeJson, writeText } from "../utils/fs.js";

const DOCS_CHANGELOG_HELP = `
Usage: npm run docs-changelog [-- [OPTIONS]]

Compare generated docs outputs against a baseline snapshot and print a
deterministic added/changed/removed summary.

Options:
  --docs-root <dir>    Docs root directory to inspect (default: ${DEFAULT_DOCS_ROOT})
  --baseline <file>    Baseline snapshot JSON path (default: ${DEFAULT_BASELINE_PATH})
  --write-baseline     Write current snapshot to --baseline after reporting
  --out <file>         Write formatted changelog text to file
  --json <file>        Write JSON report to file
  --help, -h           Print this help message and exit

Examples:
  npm run docs-changelog
  npm run docs-changelog -- --write-baseline
  npm run docs-changelog -- --out .artifacts/docs-changelog.txt --json .artifacts/docs-changelog.json
`.trimStart();

interface DocsChangelogCliOptions {
  docsRoot: string;
  baselinePath: string;
  writeBaseline: boolean;
  outPath?: string;
  jsonPath?: string;
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

function parseCliOptions(argv: string[]): DocsChangelogCliOptions {
  if (isHelpRequested(argv)) {
    process.stdout.write(DOCS_CHANGELOG_HELP);
    process.exit(0);
  }

  return {
    docsRoot: path.resolve(readFlagValue(argv, "--docs-root") ?? DEFAULT_DOCS_ROOT),
    baselinePath: path.resolve(readFlagValue(argv, "--baseline") ?? DEFAULT_BASELINE_PATH),
    writeBaseline: argv.includes("--write-baseline"),
    outPath: readFlagValue(argv, "--out"),
    jsonPath: readFlagValue(argv, "--json"),
  };
}

async function main(): Promise<void> {
  const options = parseCliOptions(process.argv.slice(2));
  const report = await buildDocsChangelogSnapshot({
    docsRoot: options.docsRoot,
    baselinePath: options.baselinePath,
  });
  const formatted = formatDocsChangelogSnapshot(report);
  process.stdout.write(formatted);

  if (options.outPath) {
    await writeText(options.outPath, formatted);
  }

  if (options.jsonPath) {
    await writeJson(options.jsonPath, report);
  }

  if (options.writeBaseline) {
    await writeDocsBaselineSnapshot(options.baselinePath, report.currentSnapshot);
  }
}

main().catch((error: unknown) => {
  process.stderr.write(`${String(error)}\n`);
  process.exit(1);
});
