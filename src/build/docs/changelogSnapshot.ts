import { createHash } from "node:crypto";
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { pathExists, readText, writeJson } from "../../utils/fs.js";

export const DEFAULT_DOCS_ROOT = "docs";
export const DEFAULT_BASELINE_PATH = path.join("data", "generated", "docs-changelog-baseline.json");

const GENERATED_DOC_TARGETS = ["chords", "diagrams", "index.md", "sitemap.json"] as const;

export interface DocsSnapshot {
  version: 1;
  docsRoot: string;
  files: Record<string, string>;
}

export interface DocsChangelogSnapshot {
  baselinePath: string;
  baselineExists: boolean;
  docsRoot: string;
  currentFileCount: number;
  baselineFileCount: number;
  added: string[];
  changed: string[];
  removed: string[];
  currentSnapshot: DocsSnapshot;
}

function toPosixPath(input: string): string {
  return input.split(path.sep).join("/");
}

function sortedRecord(input: Record<string, string>): Record<string, string> {
  const output: Record<string, string> = {};
  const keys = Object.keys(input).sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  for (const key of keys) {
    output[key] = input[key]!;
  }
  return output;
}

async function listFilesRecursive(dirPath: string): Promise<string[]> {
  const entries = await readdir(dirPath, { withFileTypes: true });
  entries.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));

  const files: string[] = [];
  for (const entry of entries) {
    const absolutePath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      const nested = await listFilesRecursive(absolutePath);
      files.push(...nested);
    } else if (entry.isFile()) {
      files.push(absolutePath);
    }
  }
  return files;
}

async function fileSha256(filePath: string): Promise<string> {
  const content = await readFile(filePath);
  return createHash("sha256").update(content).digest("hex");
}

async function buildCurrentDocsSnapshot(docsRoot: string): Promise<DocsSnapshot> {
  const docsRootResolved = path.resolve(docsRoot);
  const files: Record<string, string> = {};

  for (const target of GENERATED_DOC_TARGETS) {
    const targetPath = path.join(docsRootResolved, target);
    if (!await pathExists(targetPath)) {
      continue;
    }

    const targetStats = await stat(targetPath);
    if (targetStats.isDirectory()) {
      const discovered = await listFilesRecursive(targetPath);
      for (const absolutePath of discovered) {
        const relPath = toPosixPath(path.relative(process.cwd(), absolutePath));
        files[relPath] = await fileSha256(absolutePath);
      }
      continue;
    }

    if (targetStats.isFile()) {
      const relPath = toPosixPath(path.relative(process.cwd(), targetPath));
      files[relPath] = await fileSha256(targetPath);
    }
  }

  return {
    version: 1,
    docsRoot: toPosixPath(path.relative(process.cwd(), docsRootResolved) || "."),
    files: sortedRecord(files),
  };
}

function parseBaseline(json: string, baselinePath: string): DocsSnapshot {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error(`Invalid docs baseline JSON at ${baselinePath}`);
  }

  const record = parsed as Partial<DocsSnapshot>;
  if (record.version !== 1 || typeof record.docsRoot !== "string" || typeof record.files !== "object" || record.files === null) {
    throw new Error(`Invalid docs baseline shape at ${baselinePath}`);
  }

  const normalized: Record<string, string> = {};
  for (const [filePath, digest] of Object.entries(record.files as Record<string, unknown>)) {
    if (typeof digest !== "string") {
      throw new Error(`Invalid digest for ${filePath} in ${baselinePath}`);
    }
    normalized[filePath] = digest;
  }

  return {
    version: 1,
    docsRoot: record.docsRoot,
    files: sortedRecord(normalized),
  };
}

interface BuildDocsChangelogSnapshotOptions {
  docsRoot?: string;
  baselinePath?: string;
}

export async function buildDocsChangelogSnapshot(
  options: BuildDocsChangelogSnapshotOptions = {},
): Promise<DocsChangelogSnapshot> {
  const docsRoot = options.docsRoot ?? DEFAULT_DOCS_ROOT;
  const baselinePath = options.baselinePath ?? DEFAULT_BASELINE_PATH;
  const currentSnapshot = await buildCurrentDocsSnapshot(docsRoot);

  let baselineExists = false;
  let baselineSnapshot: DocsSnapshot = {
    version: 1,
    docsRoot: currentSnapshot.docsRoot,
    files: {},
  };

  if (await pathExists(baselinePath)) {
    baselineExists = true;
    baselineSnapshot = parseBaseline(await readText(baselinePath), baselinePath);
  }

  const currentKeys = Object.keys(currentSnapshot.files);
  const baselineKeys = Object.keys(baselineSnapshot.files);
  const currentSet = new Set(currentKeys);
  const baselineSet = new Set(baselineKeys);

  const added = currentKeys.filter((key) => !baselineSet.has(key));
  const removed = baselineKeys.filter((key) => !currentSet.has(key));
  const changed = currentKeys.filter(
    (key) => baselineSet.has(key) && currentSnapshot.files[key] !== baselineSnapshot.files[key],
  );

  added.sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  changed.sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  removed.sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));

  return {
    baselinePath,
    baselineExists,
    docsRoot: currentSnapshot.docsRoot,
    currentFileCount: currentKeys.length,
    baselineFileCount: baselineKeys.length,
    added,
    changed,
    removed,
    currentSnapshot,
  };
}

export async function writeDocsBaselineSnapshot(baselinePath: string, snapshot: DocsSnapshot): Promise<void> {
  await writeJson(baselinePath, {
    version: 1,
    docsRoot: snapshot.docsRoot,
    files: sortedRecord(snapshot.files),
  });
}

export function formatDocsChangelogSnapshot(report: DocsChangelogSnapshot): string {
  const lines: string[] = [];

  lines.push("DOCS_CHANGELOG_SNAPSHOT");
  lines.push(`BASELINE ${report.baselinePath} ${report.baselineExists ? "present" : "missing"}`);
  lines.push(`DOCS_ROOT ${report.docsRoot}`);
  lines.push(`FILES baseline=${report.baselineFileCount} current=${report.currentFileCount}`);
  lines.push(`SUMMARY added=${report.added.length} changed=${report.changed.length} removed=${report.removed.length}`);
  lines.push("");

  lines.push(`ADDED ${report.added.length}`);
  for (const filePath of report.added) {
    lines.push(`+ ${filePath}`);
  }
  lines.push("");

  lines.push(`CHANGED ${report.changed.length}`);
  for (const filePath of report.changed) {
    lines.push(`~ ${filePath}`);
  }
  lines.push("");

  lines.push(`REMOVED ${report.removed.length}`);
  for (const filePath of report.removed) {
    lines.push(`- ${filePath}`);
  }

  return `${lines.join("\n")}\n`;
}
