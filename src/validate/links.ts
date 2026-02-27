import { readFile } from "node:fs/promises";
import path from "node:path";
import { pathExists } from "../utils/fs.js";

const MARKDOWN_LINK_RE = /\[([^\]]*)\]\(([^)]+)\)/g;

export interface BrokenLink {
  sourceFile: string;
  linkText: string;
  /** The original link target exactly as written in the markdown (may include #fragment). */
  linkTarget: string;
  /** The path portion of linkTarget with any #fragment stripped — used for file resolution. */
  linkPath: string;
  resolvedPath: string;
}

export interface LinkCheckResult {
  checkedFiles: number;
  checkedLinks: number;
  brokenLinks: BrokenLink[];
}

/** Extract all relative (non-http/https) markdown link targets from a file. */
function extractRelativeLinks(markdown: string): Array<{ text: string; target: string; pathPart: string }> {
  const links: Array<{ text: string; target: string; pathPart: string }> = [];
  let match: RegExpExecArray | null;
  MARKDOWN_LINK_RE.lastIndex = 0;
  while ((match = MARKDOWN_LINK_RE.exec(markdown)) !== null) {
    const [, text, target] = match;
    // Skip absolute URLs and anchor-only links
    if (target.startsWith("http://") || target.startsWith("https://") || target.startsWith("#")) {
      continue;
    }
    // Separate the path part from any #fragment for file resolution
    const pathPart = target.includes("#") ? target.slice(0, target.indexOf("#")) : target;
    if (pathPart.length > 0) {
      links.push({ text, target, pathPart });
    }
  }
  return links;
}

/**
 * Validate all internal markdown links in a list of markdown files.
 * Each link target is resolved relative to its containing file.
 */
export async function checkDocLinks(markdownFiles: string[]): Promise<LinkCheckResult> {
  let checkedLinks = 0;
  const brokenLinks: BrokenLink[] = [];

  for (const file of markdownFiles) {
    let content: string;
    try {
      content = await readFile(file, "utf8");
    } catch {
      // If we can't read the file itself, skip it — it won't be linked to either
      continue;
    }

    const links = extractRelativeLinks(content);
    for (const { text, target, pathPart } of links) {
      checkedLinks++;
      const resolvedPath = path.resolve(path.dirname(file), pathPart);
      const exists = await pathExists(resolvedPath);
      if (!exists) {
        brokenLinks.push({
          sourceFile: file,
          linkText: text,
          linkTarget: target,
          linkPath: pathPart,
          resolvedPath,
        });
      }
    }
  }

  return {
    checkedFiles: markdownFiles.length,
    checkedLinks,
    brokenLinks,
  };
}
