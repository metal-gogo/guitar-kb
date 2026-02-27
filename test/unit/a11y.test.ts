import { describe, expect, it } from "vitest";
import {
  checkMarkdownContent,
  checkSvgContent,
} from "../../src/validate/a11y.js";

describe("checkSvgContent", () => {
  const goodSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 248" role="img" aria-label="chord:C:maj:v1">
  <rect x="0" y="0" width="180" height="248" fill="white" />
</svg>`;

  it("returns no violations for a valid SVG with role and aria-label", () => {
    const violations = checkSvgContent("test.svg", goodSvg);
    expect(violations).toHaveLength(0);
  });

  it("flags missing role attribute", () => {
    const svg = goodSvg.replace(/ role="img"/, "");
    const violations = checkSvgContent("test.svg", svg);
    expect(violations.some((v) => v.rule === "svg-role-img")).toBe(true);
  });

  it("flags role attribute that is not 'img'", () => {
    const svg = goodSvg.replace('role="img"', 'role="presentation"');
    const violations = checkSvgContent("test.svg", svg);
    expect(violations.some((v) => v.rule === "svg-role-img")).toBe(true);
  });

  it("flags missing aria-label attribute", () => {
    const svg = goodSvg.replace(/ aria-label="[^"]*"/, "");
    const violations = checkSvgContent("test.svg", svg);
    expect(violations.some((v) => v.rule === "svg-aria-label")).toBe(true);
  });

  it("flags empty aria-label", () => {
    const svg = goodSvg.replace(/aria-label="[^"]*"/, 'aria-label=""');
    const violations = checkSvgContent("test.svg", svg);
    expect(violations.some((v) => v.rule === "svg-aria-label")).toBe(true);
  });

  it("flags whitespace-only aria-label as empty", () => {
    const svg = goodSvg.replace(/aria-label="[^"]*"/, 'aria-label="   "');
    const violations = checkSvgContent("test.svg", svg);
    expect(violations.some((v) => v.rule === "svg-aria-label")).toBe(true);
  });

  it("includes file path in violation", () => {
    const svg = goodSvg.replace(/ role="img"/, "");
    const violations = checkSvgContent("docs/diagrams/chord__C__maj__v1.svg", svg);
    expect(violations[0]!.file).toBe("docs/diagrams/chord__C__maj__v1.svg");
  });

  it("can report multiple violations for a single SVG", () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 248"></svg>`;
    const violations = checkSvgContent("test.svg", svg);
    expect(violations.length).toBeGreaterThanOrEqual(2);
    const rules = violations.map((v) => v.rule);
    expect(rules).toContain("svg-role-img");
    expect(rules).toContain("svg-aria-label");
  });
});

describe("checkMarkdownContent", () => {
  const goodMd = `# C maj\n\n- Canonical ID: chord:C:maj\n`;

  it("returns no violations for a valid chord page", () => {
    const violations = checkMarkdownContent("test.md", goodMd);
    expect(violations).toHaveLength(0);
  });

  it("flags missing H1", () => {
    const md = `## Section\nNo H1 here.`;
    const violations = checkMarkdownContent("test.md", md);
    expect(violations.some((v) => v.rule === "md-has-h1")).toBe(true);
  });

  it("flags empty H1 (# followed only by whitespace not matched)", () => {
    const md = `#\n\nContent`;
    const violations = checkMarkdownContent("test.md", md);
    // '# ' with no word char after doesn't match /^# \S/
    expect(violations.some((v) => v.rule === "md-has-h1")).toBe(true);
  });

  it("flags multiple H1 headings", () => {
    const md = `# First heading\n\nContent\n\n# Second heading\n`;
    const violations = checkMarkdownContent("test.md", md);
    expect(violations.some((v) => v.rule === "md-single-h1")).toBe(true);
  });

  it("flags when first non-blank line is not an H1 heading", () => {
    const md = `<!-- comment -->\n# C maj\n\nBody`;
    const violations = checkMarkdownContent("test.md", md);
    expect(violations.some((v) => v.rule === "md-h1-first-nonblank")).toBe(true);
  });

  it("does not flag a single H1 with text", () => {
    const violations = checkMarkdownContent("test.md", goodMd);
    expect(violations.find((v) => v.rule === "md-single-h1")).toBeUndefined();
    expect(violations.find((v) => v.rule === "md-has-h1")).toBeUndefined();
  });

  it("includes file path in violation", () => {
    const md = `## Section`;
    const violations = checkMarkdownContent("docs/chords/chord__C__maj.md", md);
    expect(violations[0]!.file).toBe("docs/chords/chord__C__maj.md");
  });

  it("a valid chord page produces zero violations", () => {
    const md = `# C 7\n\n- Canonical ID: chord:C:7\n- Aliases: C7, Cdom7\n\n## Voicings\n`;
    expect(checkMarkdownContent("chord__C__7.md", md)).toHaveLength(0);
  });
});
