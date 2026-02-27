import { readdir } from "node:fs/promises";
import path from "node:path";
import { checkDocLinks } from "../validate/links.js";

async function gatherMarkdownFiles(dir: string): Promise<string[]> {
  try {
    const entries = await readdir(dir, { withFileTypes: true, encoding: "utf8" });
    const files: string[] = [];
    for (const entry of entries.slice().sort((a, b) => a.name.localeCompare(b.name))) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        files.push(...(await gatherMarkdownFiles(full)));
      } else if (entry.isFile() && entry.name.endsWith(".md")) {
        files.push(full);
      }
    }
    return files;
  } catch {
    return [];
  }
}

async function main(): Promise<void> {
  const docsDir = "docs";
  const files = await gatherMarkdownFiles(docsDir);

  if (files.length === 0) {
    process.stderr.write(`No markdown files found under ${docsDir}/\n`);
    process.exit(1);
  }

  const result = await checkDocLinks(files);

  if (result.brokenLinks.length > 0) {
    for (const broken of result.brokenLinks) {
      process.stdout.write(
        `BROKEN  [${broken.linkText}](${broken.linkTarget})  in ${broken.sourceFile}\n`,
      );
    }
    process.stderr.write(
      `\nLink check failed: ${result.brokenLinks.length} broken link(s) in ${result.checkedFiles} file(s) (${result.checkedLinks} links checked)\n`,
    );
    process.exit(1);
  }

  process.stdout.write(
    `Link check passed: ${result.checkedLinks} links in ${result.checkedFiles} files — all ok\n`,
  );
}

main().catch((error: unknown) => {
  process.stderr.write(`${String(error)}\n`);
  process.exit(1);
});
