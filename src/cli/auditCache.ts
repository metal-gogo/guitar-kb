import path from "node:path";
import { mkdir } from "node:fs/promises";
import { auditCache, buildCacheCompletenessManifest } from "../ingest/cacheAudit.js";
import { writeJson } from "../utils/fs.js";

function formatLine(source: string, slug: string, status: string, checksum?: string): string {
  const tag = status.toUpperCase().padEnd(8);
  const digest = checksum ? ` [${checksum.slice(0, 12)}]` : "";
  return `${tag} ${source}/${slug}.html${digest}\n`;
}

async function main(): Promise<void> {
  const result = await auditCache();
  const manifest = buildCacheCompletenessManifest(result);

  for (const entry of result.entries) {
    process.stdout.write(
      formatLine(entry.source, entry.slug, entry.status, entry.checksum),
    );
  }

  process.stdout.write(
    `\nSummary: ${result.okCount} ok, ${result.missingCount} missing, ${result.corruptCount} corrupt (${result.totalExpected} expected)\n`,
  );
  await mkdir(path.join("data", "generated"), { recursive: true });
  const manifestPath = path.join("data", "generated", "cache-completeness.manifest.json");
  await writeJson(manifestPath, manifest);
  process.stdout.write(`Manifest: ${manifestPath}\n`);

  if (result.missingCount > 0 || result.corruptCount > 0) {
    process.stderr.write(
      `\nCache audit failed: ${result.missingCount} missing, ${result.corruptCount} corrupt\n`,
    );
    process.exit(1);
  }
}

main().catch((error: unknown) => {
  process.stderr.write(`${String(error)}\n`);
  process.exit(1);
});
