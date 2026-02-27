import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { checkDocLinks } from "../../src/validate/links.js";

describe("checkDocLinks", () => {
  let tempDir = "";

  beforeEach(async () => {
    tempDir = await mkdtemp(path.join(os.tmpdir(), "gckb-links-"));
  });

  afterEach(async () => {
    if (tempDir) {
      await rm(tempDir, { recursive: true, force: true });
      tempDir = "";
    }
  });

  it("returns zero broken links when all relative links resolve", async () => {
    await mkdir(path.join(tempDir, "chords"), { recursive: true });

    await writeFile(
      path.join(tempDir, "index.md"),
      "# Index\n- [C maj](./chords/c-maj.md)\n",
      "utf8",
    );
    await writeFile(
      path.join(tempDir, "chords", "c-maj.md"),
      "# C maj\n[← Index](../index.md)\n",
      "utf8",
    );

    const result = await checkDocLinks([
      path.join(tempDir, "index.md"),
      path.join(tempDir, "chords", "c-maj.md"),
    ]);

    expect(result.brokenLinks).toHaveLength(0);
    expect(result.checkedLinks).toBe(2);
    expect(result.checkedFiles).toBe(2);
  });

  it("reports a broken link when the target file is missing", async () => {
    await writeFile(
      path.join(tempDir, "index.md"),
      "# Index\n- [C maj](./chords/c-maj.md)\n",
      "utf8",
    );

    const result = await checkDocLinks([path.join(tempDir, "index.md")]);

    expect(result.brokenLinks).toHaveLength(1);
    expect(result.brokenLinks[0].linkTarget).toBe("./chords/c-maj.md");
    expect(result.brokenLinks[0].sourceFile).toBe(path.join(tempDir, "index.md"));
  });

  it("ignores http/https external links", async () => {
    await writeFile(
      path.join(tempDir, "index.md"),
      "# Index\n[Source](https://example.com/chord)\n",
      "utf8",
    );

    const result = await checkDocLinks([path.join(tempDir, "index.md")]);

    expect(result.brokenLinks).toHaveLength(0);
    expect(result.checkedLinks).toBe(0);
  });

  it("ignores anchor-only links (#fragment)", async () => {
    await writeFile(
      path.join(tempDir, "index.md"),
      "# Index\n[Jump](#section)\n",
      "utf8",
    );

    const result = await checkDocLinks([path.join(tempDir, "index.md")]);

    expect(result.brokenLinks).toHaveLength(0);
    expect(result.checkedLinks).toBe(0);
  });

  it("strips fragment from links like ./page.md#section before checking", async () => {
    await mkdir(path.join(tempDir, "chords"), { recursive: true });
    await writeFile(
      path.join(tempDir, "chords", "c-maj.md"),
      "# C maj",
      "utf8",
    );
    await writeFile(
      path.join(tempDir, "index.md"),
      "# Index\n[C maj](./chords/c-maj.md#anchored-section)\n",
      "utf8",
    );

    const result = await checkDocLinks([path.join(tempDir, "index.md")]);

    expect(result.brokenLinks).toHaveLength(0);
    expect(result.checkedLinks).toBe(1);
  });

  it("reports multiple broken links across multiple files", async () => {
    await writeFile(
      path.join(tempDir, "a.md"),
      "# A\n[missing](./missing-a.md)\n[also missing](./missing-b.md)\n",
      "utf8",
    );
    await writeFile(
      path.join(tempDir, "b.md"),
      "# B\n[broken](./no-such-file.md)\n",
      "utf8",
    );

    const result = await checkDocLinks([
      path.join(tempDir, "a.md"),
      path.join(tempDir, "b.md"),
    ]);

    expect(result.brokenLinks).toHaveLength(3);
    expect(result.checkedLinks).toBe(3);
    expect(result.checkedFiles).toBe(2);
  });

  it("handles SVG diagram links", async () => {
    await mkdir(path.join(tempDir, "diagrams"), { recursive: true });
    await writeFile(
      path.join(tempDir, "diagrams", "chord__C__maj__v1.svg"),
      "<svg/>",
      "utf8",
    );
    await mkdir(path.join(tempDir, "chords"), { recursive: true });
    await writeFile(
      path.join(tempDir, "chords", "c-maj.md"),
      "# C maj\n[diagram](../diagrams/chord__C__maj__v1.svg)\n",
      "utf8",
    );

    const result = await checkDocLinks([path.join(tempDir, "chords", "c-maj.md")]);

    expect(result.brokenLinks).toHaveLength(0);
    expect(result.checkedLinks).toBe(1);
  });
});
