import { voicingDiagramFileName, encodeIdForPathSegment } from "../docs/paths.js";
import type { ChordRecord } from "../../types/model.js";
import { compareChordOrder } from "../../utils/sort.js";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&#39;");
}

function chordFileName(chordId: string): string {
  return `${encodeIdForPathSegment(chordId)}.html`;
}

function chordHrefFromIndex(chordId: string): string {
  return `./chords/${chordFileName(chordId)}`;
}

function chordHrefFromChordPage(chordId: string): string {
  return `./${chordFileName(chordId)}`;
}

function diagramHref(voicingId: string): string {
  return `../diagrams/${voicingDiagramFileName(voicingId)}`;
}

function rootAnchorId(root: string): string {
  const token = root
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `root-${token || "x"}`;
}

function enharmonicLinkIds(chord: ChordRecord, allChords: ChordRecord[]): string[] {
  const byId = new Map(allChords.map((entry) => [entry.id, entry]));
  const related = new Set<string>();

  for (const candidate of chord.enharmonic_equivalents ?? []) {
    if (byId.has(candidate) && candidate !== chord.id) {
      related.add(candidate);
    }
  }

  for (const candidate of allChords) {
    if ((candidate.enharmonic_equivalents ?? []).includes(chord.id) && candidate.id !== chord.id) {
      related.add(candidate.id);
    }
  }

  return Array.from(related).sort((a, b) => {
    const left = byId.get(a);
    const right = byId.get(b);
    if (!left || !right) {
      return a.localeCompare(b);
    }
    return compareChordOrder(left, right);
  });
}

function relatedQualityLinkIds(chord: ChordRecord, allChords: ChordRecord[]): string[] {
  return allChords
    .filter((candidate) => candidate.root === chord.root && candidate.id !== chord.id)
    .slice()
    .sort(compareChordOrder)
    .map((candidate) => candidate.id);
}

function htmlFrame(title: string, stylesheetHref: string, body: string): string {
  return [
    "<!doctype html>",
    '<html lang="en">',
    "<head>",
    '  <meta charset="utf-8">',
    '  <meta name="viewport" content="width=device-width, initial-scale=1">',
    `  <title>${escapeHtml(title)}</title>`,
    `  <link rel="stylesheet" href="${escapeHtml(stylesheetHref)}">`,
    "</head>",
    "<body>",
    "  <div class=\"aurora\" aria-hidden=\"true\"></div>",
    `  <main class="page">${body}</main>`,
    "</body>",
    "</html>",
    "",
  ].join("\n");
}

export function siteStylesheet(): string {
  return [
    ":root {",
    "  --bg: #f4f2ec;",
    "  --paper: #fffdf9;",
    "  --ink: #1f2529;",
    "  --muted: #55616a;",
    "  --accent: #175f6a;",
    "  --accent-soft: #dff2f5;",
    "  --line: #cfd8dd;",
    "  --radius: 14px;",
    "  --shadow: 0 12px 28px rgba(21, 44, 49, 0.12);",
    "}",
    "",
    "* { box-sizing: border-box; }",
    "html, body { margin: 0; padding: 0; }",
    "body {",
    "  font-family: \"Avenir Next\", \"Gill Sans\", \"Trebuchet MS\", sans-serif;",
    "  color: var(--ink);",
    "  background: radial-gradient(circle at 8% -10%, #d6eef2 0%, transparent 40%),",
    "    radial-gradient(circle at 100% 0%, #f8e9d5 0%, transparent 36%),",
    "    var(--bg);",
    "}",
    ".aurora {",
    "  position: fixed;",
    "  inset: 0;",
    "  pointer-events: none;",
    "  background: linear-gradient(135deg, rgba(23, 95, 106, 0.07), rgba(201, 119, 63, 0.06));",
    "}",
    ".page {",
    "  position: relative;",
    "  max-width: 1080px;",
    "  margin: 0 auto;",
    "  padding: 28px 20px 56px;",
    "}",
    ".hero {",
    "  background: var(--paper);",
    "  border: 1px solid var(--line);",
    "  border-radius: calc(var(--radius) + 4px);",
    "  padding: 24px;",
    "  box-shadow: var(--shadow);",
    "}",
    ".hero h1 { margin: 0 0 8px; font-size: clamp(1.8rem, 3vw, 2.5rem); }",
    ".hero p { margin: 0; color: var(--muted); }",
    ".chip-row {",
    "  margin-top: 18px;",
    "  display: flex;",
    "  flex-wrap: wrap;",
    "  gap: 8px;",
    "}",
    ".chip {",
    "  display: inline-block;",
    "  padding: 6px 10px;",
    "  border-radius: 999px;",
    "  border: 1px solid var(--line);",
    "  background: #fff;",
    "  color: var(--ink);",
    "  text-decoration: none;",
    "  font-size: 0.88rem;",
    "}",
    ".grid {",
    "  margin-top: 18px;",
    "  display: grid;",
    "  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));",
    "  gap: 14px;",
    "}",
    ".card {",
    "  background: var(--paper);",
    "  border: 1px solid var(--line);",
    "  border-radius: var(--radius);",
    "  padding: 16px;",
    "}",
    ".card h2, .card h3 { margin-top: 0; }",
    ".meta { color: var(--muted); font-size: 0.92rem; }",
    ".quality-list, .plain-list { margin: 12px 0 0; padding-left: 18px; }",
    ".quality-list li, .plain-list li { margin: 6px 0; }",
    ".quality-list a, .plain-list a, .back-link { color: var(--accent); text-decoration: none; }",
    ".quality-list a:hover, .plain-list a:hover, .back-link:hover { text-decoration: underline; }",
    ".section { margin-top: 16px; }",
    ".voicing-grid {",
    "  display: grid;",
    "  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));",
    "  gap: 12px;",
    "}",
    ".voicing-card img { width: 100%; height: auto; background: #fff; border-radius: 10px; border: 1px solid var(--line); }",
    ".voicing-card code { font-size: 0.85rem; color: var(--muted); }",
    "@media (max-width: 680px) {",
    "  .page { padding: 16px 14px 40px; }",
    "  .hero { padding: 18px; }",
    "}",
    "",
  ].join("\n");
}

export function siteIndexHtml(chords: ReadonlyArray<ChordRecord>): string {
  const sorted = chords.slice().sort(compareChordOrder);
  const grouped = new Map<string, ChordRecord[]>();

  for (const chord of sorted) {
    const group = grouped.get(chord.root) ?? [];
    group.push(chord);
    grouped.set(chord.root, group);
  }

  const roots = Array.from(grouped.keys());
  const rootChips = roots
    .map((root) => `<a class="chip" href="#${escapeHtml(rootAnchorId(root))}">${escapeHtml(root)}</a>`)
    .join("");

  const rootSections = Array.from(grouped.entries())
    .map(([root, rootChords]) => {
      const rows = rootChords.map((chord) => {
        const aliases = (chord.aliases ?? []).join(", ") || "none";
        return [
          "<li>",
          `  <a href="${escapeHtml(chordHrefFromIndex(chord.id))}">`,
          `    <strong>${escapeHtml(chord.quality)}</strong>`,
          `    <span class="meta"> ${escapeHtml(chord.id)} | aliases: ${escapeHtml(aliases)}</span>`,
          "  </a>",
          "</li>",
        ].join("\n");
      }).join("\n");

      return [
        `<section id="${escapeHtml(rootAnchorId(root))}" class="card">`,
        `  <h2>${escapeHtml(root)}</h2>`,
        "  <ul class=\"quality-list\">",
        rows,
        "  </ul>",
        "</section>",
      ].join("\n");
    })
    .join("\n");

  const body = [
    "<header class=\"hero\">",
    "  <h1>Guitar Chord Knowledge Base</h1>",
    `  <p>Browse ${sorted.length} canonical chords by root and quality.</p>`,
    `  <nav class="chip-row" aria-label="Root navigation">${rootChips}</nav>`,
    "</header>",
    "<section class=\"grid section\">",
    rootSections,
    "</section>",
  ].join("\n");

  return htmlFrame("Guitar Chord Knowledge Base", "./assets/site.css", body);
}

function renderChordLinkList(ids: string[], byId: Map<string, ChordRecord>): string {
  if (ids.length === 0) {
    return "<li>none</li>";
  }
  return ids
    .map((id) => {
      const chord = byId.get(id);
      if (!chord) {
        return "";
      }
      return `<li><a href="${escapeHtml(chordHrefFromChordPage(chord.id))}">${escapeHtml(`${chord.root} ${chord.quality}`)}</a></li>`;
    })
    .filter((line) => line.length > 0)
    .join("\n");
}

export function siteChordHtml(chord: ChordRecord, allChords: ReadonlyArray<ChordRecord>): string {
  const sortedAll = allChords.slice().sort(compareChordOrder);
  const byId = new Map(sortedAll.map((entry) => [entry.id, entry]));

  const aliasText = (chord.aliases ?? []).join(", ") || "none";
  const enharmonicRows = renderChordLinkList(enharmonicLinkIds(chord, sortedAll), byId);
  const relatedRows = renderChordLinkList(relatedQualityLinkIds(chord, sortedAll), byId);
  const voicingRows = chord.voicings
    .slice()
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((voicing) => {
      const frets = voicing.frets.map((fret) => (fret === null ? "x" : String(fret))).join("/");
      return [
        "<article class=\"card voicing-card\">",
        `  <h3>${escapeHtml(voicing.id)}</h3>`,
        `  <img src="${escapeHtml(diagramHref(voicing.id))}" alt="${escapeHtml(`${chord.root} ${chord.quality} ${voicing.id}`)}" loading="lazy">`,
        `  <p class="meta">frets ${escapeHtml(frets)} | base fret ${voicing.base_fret}</p>`,
        `  <code>${escapeHtml(diagramHref(voicing.id))}</code>`,
        "</article>",
      ].join("\n");
    })
    .join("\n");

  const provenanceRows = chord.source_refs
    .map((source) => `<li><a href="${escapeHtml(source.url)}">${escapeHtml(source.source)}</a></li>`)
    .join("\n");

  const body = [
    "<header class=\"hero\">",
    `  <p><a class="back-link" href="../index.html">← Back to index</a></p>`,
    `  <h1>${escapeHtml(`${chord.root} ${chord.quality}`)}</h1>`,
    `  <p class="meta">${escapeHtml(chord.id)}</p>`,
    "</header>",
    "<section class=\"grid section\">",
    "  <article class=\"card\">",
    "    <h2>Chord Details</h2>",
    `    <p><strong>Aliases:</strong> ${escapeHtml(aliasText)}</p>`,
    `    <p><strong>Formula:</strong> ${escapeHtml(chord.formula.join("-"))}</p>`,
    `    <p><strong>Pitch classes:</strong> ${escapeHtml(chord.pitch_classes.join(", "))}</p>`,
    `    <p><strong>Summary:</strong> ${escapeHtml(chord.notes?.summary ?? "Chord reference generated from factual source data.")}</p>`,
    "  </article>",
    "  <article class=\"card\">",
    "    <h2>Navigation</h2>",
    "    <h3>Enharmonic equivalents</h3>",
    `    <ul class="plain-list">${enharmonicRows}</ul>`,
    "    <h3>Related qualities</h3>",
    `    <ul class="plain-list">${relatedRows}</ul>`,
    "  </article>",
    "  <article class=\"card\">",
    "    <h2>Provenance</h2>",
    `    <ul class="plain-list">${provenanceRows}</ul>`,
    "  </article>",
    "</section>",
    "<section class=\"section\">",
    "  <h2>Voicings</h2>",
    "  <div class=\"voicing-grid\">",
    voicingRows,
    "  </div>",
    "</section>",
  ].join("\n");

  return htmlFrame(`${chord.root} ${chord.quality} | GCKB`, "../assets/site.css", body);
}

export function siteChordFileName(chordId: string): string {
  return chordFileName(chordId);
}
