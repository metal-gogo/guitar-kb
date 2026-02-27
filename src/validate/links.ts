import { readFile } from "node:fs/promises";
import path from "node:path";
import { pathExists } from "../utils/fs.js";

const MARKDOWN_LINK_RE = /\[([^\]]*)\]\(([^)]+)\)/g;

export interface BrokenLink {
  sourceFile: string;
  linkText: string;
  linkTarget: string;
  resolvedPath: string;
}

export interface LinkCheckResult {
  checkedFiles: number;
  checkedLinks: number;
  brokenLinks: BrokenLink[];
}

/** Extract all relative (non-http/https) markdown link targets from a file. */
function extractRelativeLinks(markdown: string): Array<{ text: string; target: string }> {
  const links: Array<{ text: string; target: string }> = [];
  let match: RegExpExecArray | null;
  MARKDOWN_LINK_RE.lastIndex = 0;
  while ((match = MARKDOWN_LINK_RE.exec(markdown)) !== null) {
    const [, text, target] = match;
    // Skip absolute URLs and anchor-only links
    if (target.startsWith("http://") || target.startsWith("https://") || target.startsWith("#")) {
      continue;
    }
    // Strip fragment (#...) before checking path existence
    const pathPart = target.includes("#") ? target.slice(0, target.indexOf("#")) : target;
    if (pathPart.length > 0) {
      links.push({ text, target: pathPart });
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
    for (const { text, target } of links) {
      checkedLinks++;
      const resolvedPath = path.resolve(path.dirname(file), target);
      const exists = await pathExists(resolvedPath);
      if (!exists) {
        brokenLinks.push({
          sourceFile: file,
          linkText: text,
          linkTarget: target,
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
