/**
 * Accessibility Lint Baseline
 *
 * Checks generated docs and SVG artifacts for baseline accessibility compliance:
 *
 * SVG rules:
 *   - Every SVG must have role="img"
 *   - Every SVG must have a non-empty aria-label attribute
 *
 * Markdown rules:
 *   - Every chord page must begin with exactly one H1 heading (first non-blank line)
 *   - The H1 must be non-empty
 *
 * All violations are collected and returned; callers decide whether to fail.
 */
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

export interface A11yViolation {
  /** Absolute or workspace-relative path to the offending file. */
  file: string;
  /** Short rule identifier. */
  rule: string;
  /** Human-readable description of the violation. */
  message: string;
}

export interface A11yLintResult {
  checkedSvgs: number;
  checkedMarkdowns: number;
  violations: A11yViolation[];
}

// ---------------------------------------------------------------------------
// SVG rules
// ---------------------------------------------------------------------------

const SVG_ROLE_RE = /\brole="([^"]*)"/;
const SVG_ARIA_LABEL_RE = /\baria-label="([^"]*)"/;

export function checkSvgContent(file: string, content: string): A11yViolation[] {
  const violations: A11yViolation[] = [];

  const roleMatch = SVG_ROLE_RE.exec(content);
  if (!roleMatch || roleMatch[1] !== "img") {
    violations.push({
      file,
      rule: "svg-role-img",
      message: `SVG is missing role="img" (found: ${roleMatch ? `role="${roleMatch[1]}"` : "no role attribute"})`,
    });
  }

  const ariaMatch = SVG_ARIA_LABEL_RE.exec(content);
  if (!ariaMatch || ariaMatch[1].trim() === "") {
    violations.push({
      file,
      rule: "svg-aria-label",
      message: `SVG is missing a non-empty aria-label attribute`,
    });
  }

  return violations;
}

// ---------------------------------------------------------------------------
// Markdown rules
// ---------------------------------------------------------------------------

export function checkMarkdownContent(file: string, content: string): A11yViolation[] {
  const violations: A11yViolation[] = [];
  const lines = content.split("\n");

  const h1Lines = lines.filter((line) => /^# \S/.test(line));

  if (h1Lines.length === 0) {
    violations.push({
      file,
      rule: "md-has-h1",
      message: `Markdown page is missing an H1 heading`,
    });
  } else if (h1Lines.length > 1) {
    violations.push({
      file,
      rule: "md-single-h1",
      message: `Markdown page has ${h1Lines.length} H1 headings (expected exactly 1)`,
    });
  }

  return violations;
}

// ---------------------------------------------------------------------------
// Directory scan helpers
// ---------------------------------------------------------------------------

async function collectFiles(dir: string, ext: string): Promise<string[]> {
  let entries: Array<{ name: string; isDirectory(): boolean; isFile(): boolean }>;
  try {
    const raw = await readdir(dir, { withFileTypes: true, encoding: "utf8" });
    entries = raw as Array<{ name: string; isDirectory(): boolean; isFile(): boolean }>;
  } catch {
    return [];
  }
  const files: string[] = [];
  for (const entry of entries.slice().sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0))) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectFiles(full, ext)));
    } else if (entry.isFile() && entry.name.endsWith(ext)) {
      files.push(full);
    }
  }
  return files;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Run accessibility lint on all generated SVG diagrams and chord Markdown pages.
 *
 * @param diagramsDir - Path to the diagrams directory (e.g., "docs/diagrams")
 * @param chordsDir   - Path to the chord docs directory (e.g., "docs/chords")
 */
export async function runA11yLint(
  diagramsDir: string,
  chordsDir: string,
): Promise<A11yLintResult> {
  const svgFiles = await collectFiles(diagramsDir, ".svg");
  const mdFiles = await collectFiles(chordsDir, ".md");
  const violations: A11yViolation[] = [];

  for (const file of svgFiles) {
    let content: string;
    try {
      content = await readFile(file, "utf8");
    } catch {
      continue;
    }
    violations.push(...checkSvgContent(file, content));
  }

  for (const file of mdFiles) {
    let content: string;
    try {
      content = await readFile(file, "utf8");
    } catch {
      continue;
    }
    violations.push(...checkMarkdownContent(file, content));
  }

  return {
    checkedSvgs: svgFiles.length,
    checkedMarkdowns: mdFiles.length,
    violations,
  };
}
