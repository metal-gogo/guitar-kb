import { voicingDiagramRelativePath, encodeIdForPathSegment } from "../docs/paths.js";
import type { ChordRecord } from "../../types/model.js";
import { sharpAliasForFlatCanonicalRoot, toFlatCanonicalRoot } from "../../types/guards.js";
import { compareChordOrder } from "../../utils/sort.js";

type NotationMode = "flat" | "sharp";

interface RootAliases {
  flat: string;
  sharp?: string;
}

const NOTATION_DEFAULT: NotationMode = "flat";
const NOTATION_STORAGE_KEY = "gckb-notation";

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
  return `../diagrams/${voicingDiagramRelativePath(voicingId)}`;
}

function privacyHrefFromIndex(): string {
  return "./privacy.html";
}

function privacyHrefFromChordPage(): string {
  return "../privacy.html";
}

function licenseHrefFromIndex(): string {
  return "./license.html";
}

function licenseHrefFromChordPage(): string {
  return "../license.html";
}

function rootAnchorId(root: string): string {
  const token = root
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `root-${token || "x"}`;
}

function rootAliasesForRoot(root: string): RootAliases {
  const canonicalRoot = toFlatCanonicalRoot(root);
  if (!canonicalRoot) {
    return { flat: root };
  }
  return {
    flat: canonicalRoot,
    ...(sharpAliasForFlatCanonicalRoot(canonicalRoot) ? { sharp: sharpAliasForFlatCanonicalRoot(canonicalRoot) } : {}),
  };
}

function rootAliasesForChord(chord: ChordRecord): RootAliases {
  const fallback = rootAliasesForRoot(chord.root);
  return {
    flat: chord.root_display?.flat ?? fallback.flat,
    ...(chord.root_display?.sharp ?? fallback.sharp ? { sharp: chord.root_display?.sharp ?? fallback.sharp } : {}),
  };
}

function rootLabelSpan(aliases: RootAliases): string {
  const attrs = [
    "class=\"root-label\"",
    `data-root-flat=\"${escapeHtml(aliases.flat)}\"`,
  ];
  if (aliases.sharp) {
    attrs.push(`data-root-sharp=\"${escapeHtml(aliases.sharp)}\"`);
  }
  return `<span ${attrs.join(" ")}>${escapeHtml(aliases.flat)}</span>`;
}

function chordDisplayName(chord: ChordRecord): string {
  return `${rootLabelSpan(rootAliasesForChord(chord))} ${escapeHtml(chord.quality)}`;
}

function sharpAliasChordId(chord: ChordRecord): string | null {
  const sharpRoot = rootAliasesForChord(chord).sharp;
  if (!sharpRoot) {
    return null;
  }
  return `chord:${sharpRoot}:${chord.quality}`;
}

function notationToggleHtml(): string {
  return [
    "<div class=\"notation-toggle\" role=\"group\" aria-label=\"Notation preference\">",
    "  <span class=\"notation-toggle__label\">Notation</span>",
    "  <button type=\"button\" data-notation-toggle=\"flat\" aria-pressed=\"true\">Flat</button>",
    "  <button type=\"button\" data-notation-toggle=\"sharp\" aria-pressed=\"false\">Sharp</button>",
    "</div>",
  ].join("\n");
}

function runtimeAliasMap(
  chords: ReadonlyArray<ChordRecord>,
  hrefForChordId: (chordId: string) => string,
): Readonly<Record<string, string>> {
  const map: Record<string, string> = {};
  for (const chord of chords) {
    const sharpAliasId = sharpAliasChordId(chord);
    if (!sharpAliasId) {
      continue;
    }

    const canonicalHref = hrefForChordId(chord.id);
    map[sharpAliasId.toLowerCase()] = canonicalHref;
    map[sharpAliasId.replace(/^chord:/, "").toLowerCase()] = canonicalHref;
  }
  return map;
}

function runtimeScript(aliasMap: Readonly<Record<string, string>>): string {
  return [
    "<script>",
    "(function(){",
    `  const NOTATION_DEFAULT = \"${NOTATION_DEFAULT}\";`,
    `  const STORAGE_KEY = \"${NOTATION_STORAGE_KEY}\";`,
    `  const ALIAS_MAP = ${JSON.stringify(aliasMap)};`,
    "  const params = new URLSearchParams(window.location.search);",
    "  const chordParam = params.get(\"chord\");",
    "  if (chordParam) {",
    "    const requested = chordParam.trim().toLowerCase();",
    "    const normalized = requested.startsWith(\"chord:\") ? requested : `chord:${requested}`;",
    "    const target = ALIAS_MAP[requested] || ALIAS_MAP[normalized];",
    "    if (target) {",
    "      const nextParams = new URLSearchParams(window.location.search);",
    "      nextParams.delete(\"chord\");",
    "      if (!nextParams.has(\"notation\") && requested.includes(\"#\")) {",
    "        nextParams.set(\"notation\", \"sharp\");",
    "      }",
    "      const suffix = nextParams.toString();",
    "      window.location.replace(`${target}${suffix ? `?${suffix}` : \"\"}`);",
    "      return;",
    "    }",
    "  }",
    "  function loadNotation() {",
    "    const queryValue = params.get(\"notation\");",
    "    if (queryValue === \"flat\" || queryValue === \"sharp\") {",
    "      return queryValue;",
    "    }",
    "    try {",
    "      const stored = window.localStorage.getItem(STORAGE_KEY);",
    "      if (stored === \"flat\" || stored === \"sharp\") {",
    "        return stored;",
    "      }",
    "    } catch {}",
    "    return NOTATION_DEFAULT;",
    "  }",
    "  function applyNotation(mode) {",
    "    document.documentElement.setAttribute(\"data-notation\", mode);",
    "    for (const label of document.querySelectorAll(\"[data-root-flat]\")) {",
    "      const flat = label.getAttribute(\"data-root-flat\") || \"\";",
    "      const sharp = label.getAttribute(\"data-root-sharp\") || \"\";",
    "      label.textContent = mode === \"sharp\" && sharp ? sharp : flat;",
    "    }",
    "    for (const toggle of document.querySelectorAll(\"[data-notation-toggle]\")) {",
    "      const selected = toggle.getAttribute(\"data-notation-toggle\") === mode;",
    "      toggle.setAttribute(\"aria-pressed\", selected ? \"true\" : \"false\");",
    "      toggle.classList.toggle(\"is-active\", selected);",
    "    }",
    "  }",
    "  const initialNotation = loadNotation();",
    "  applyNotation(initialNotation);",
    "  for (const toggle of document.querySelectorAll(\"[data-notation-toggle]\")) {",
    "    toggle.addEventListener(\"click\", () => {",
    "      const nextNotation = toggle.getAttribute(\"data-notation-toggle\");",
    "      if (nextNotation !== \"flat\" && nextNotation !== \"sharp\") {",
    "        return;",
    "      }",
    "      try {",
    "        window.localStorage.setItem(STORAGE_KEY, nextNotation);",
    "      } catch {}",
    "      applyNotation(nextNotation);",
    "    });",
    "  }",
    "})();",
    "</script>",
  ].join("\n");
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

function htmlFrame(title: string, stylesheetHref: string, body: string, runtimeBehaviorScript = ""): string {
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
    runtimeBehaviorScript,
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
    ".notation-toggle {",
    "  margin-top: 14px;",
    "  display: inline-flex;",
    "  align-items: center;",
    "  gap: 8px;",
    "  padding: 6px;",
    "  border: 1px solid var(--line);",
    "  border-radius: 999px;",
    "  background: #fff;",
    "}",
    ".notation-toggle__label {",
    "  font-size: 0.85rem;",
    "  color: var(--muted);",
    "  margin: 0 4px 0 6px;",
    "}",
    ".notation-toggle button {",
    "  border: 0;",
    "  border-radius: 999px;",
    "  padding: 5px 11px;",
    "  font-size: 0.82rem;",
    "  background: transparent;",
    "  color: var(--ink);",
    "  cursor: pointer;",
    "}",
    ".notation-toggle button.is-active {",
    "  background: var(--accent-soft);",
    "  color: var(--accent);",
    "  font-weight: 600;",
    "}",
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
  const grouped = new Map<string, { chords: ChordRecord[]; aliases: RootAliases }>();

  for (const chord of sorted) {
    const existing = grouped.get(chord.root);
    if (existing) {
      existing.chords.push(chord);
      continue;
    }
    grouped.set(chord.root, {
      chords: [chord],
      aliases: rootAliasesForChord(chord),
    });
  }

  const roots = Array.from(grouped.keys());
  const rootChips = roots
    .map((root) => {
      const aliases = grouped.get(root)?.aliases ?? rootAliasesForRoot(root);
      return `<a class="chip" href="#${escapeHtml(rootAnchorId(root))}">${rootLabelSpan(aliases)}</a>`;
    })
    .join("");

  const rootSections = Array.from(grouped.entries())
    .map(([root, group]) => {
      const rows = group.chords.map((chord) => {
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
        `  <h2>${rootLabelSpan(group.aliases)}</h2>`,
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
    `  ${notationToggleHtml()}`,
    `  <p class="meta"><a href="${escapeHtml(privacyHrefFromIndex())}">Privacy notice</a> · <a href="${escapeHtml(licenseHrefFromIndex())}">License</a></p>`,
    `  <nav class="chip-row" aria-label="Root navigation">${rootChips}</nav>`,
  "</header>",
    "<section class=\"grid section\">",
    rootSections,
    "</section>",
  ].join("\n");

  return htmlFrame(
    "Guitar Chord Knowledge Base",
    "./assets/site.css",
    body,
    runtimeScript(runtimeAliasMap(sorted, chordHrefFromIndex)),
  );
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
      return `<li><a href="${escapeHtml(chordHrefFromChordPage(chord.id))}">${chordDisplayName(chord)}</a></li>`;
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
    `  <p><a class="back-link" href="../index.html">← Back to index</a> · <a class="back-link" href="${escapeHtml(privacyHrefFromChordPage())}">Privacy notice</a> · <a class="back-link" href="${escapeHtml(licenseHrefFromChordPage())}">License</a></p>`,
    `  <h1>${chordDisplayName(chord)}</h1>`,
    `  ${notationToggleHtml()}`,
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

  return htmlFrame(
    `${chord.root} ${chord.quality} | GCKB`,
    "../assets/site.css",
    body,
    runtimeScript(runtimeAliasMap(sortedAll, chordHrefFromChordPage)),
  );
}

export function siteChordFileName(chordId: string): string {
  return chordFileName(chordId);
}

export function siteAliasRedirectHtml(aliasChordId: string, canonicalChordId: string): string {
  const target = `./${siteChordFileName(canonicalChordId)}`;
  const body = [
    "<header class=\"hero\">",
    "  <p><a class=\"back-link\" href=\"../index.html\">← Back to index</a></p>",
    "  <h1>Enharmonic Redirect</h1>",
    `  <p class="meta">${escapeHtml(aliasChordId)} routes to ${escapeHtml(canonicalChordId)}.</p>`,
    "</header>",
    "<section class=\"grid section\">",
    "  <article class=\"card\">",
    "    <h2>Redirecting</h2>",
    `    <p><a href="${escapeHtml(target)}">Continue to canonical page</a></p>`,
    "  </article>",
    "</section>",
    "<script>",
    "(function(){",
    "  const params = new URLSearchParams(window.location.search);",
    "  if (!params.has(\"notation\")) {",
    "    params.set(\"notation\", \"sharp\");",
    "  }",
    `  const target = ${JSON.stringify(target)};`,
    "  const suffix = params.toString();",
    "  window.location.replace(`${target}${suffix ? `?${suffix}` : \"\"}`);",
    "})();",
    "</script>",
  ].join("\n");

  return htmlFrame(
    `${aliasChordId} → ${canonicalChordId} | GCKB`,
    "../assets/site.css",
    body,
  );
}

export function sitePrivacyHtml(): string {
  const body = [
    "<header class=\"hero\">",
    "  <p><a class=\"back-link\" href=\"./index.html\">← Back to index</a></p>",
    "  <h1>Privacy Notice</h1>",
    "  <p class=\"meta\">Static-site behavior and hosting notes.</p>",
    "</header>",
    "<section class=\"grid section\">",
    "  <article class=\"card\">",
    "    <h2>What This Site Does</h2>",
    "    <ul class=\"plain-list\">",
    "      <li>Serves generated chord reference pages and SVG diagrams.</li>",
    "      <li>Does not provide user accounts, forms, or in-site messaging.</li>",
    "    </ul>",
    "  </article>",
    "  <article class=\"card\">",
    "    <h2>Data Collection in Generated Output</h2>",
    "    <ul class=\"plain-list\">",
    "      <li>The generated site does not intentionally collect personal data.</li>",
    "      <li>The generated site does not set first-party analytics cookies by default.</li>",
    "    </ul>",
    "  </article>",
    "  <article class=\"card\">",
    "    <h2>Hosting and Infrastructure Logs</h2>",
    "    <p>When hosted (for example on GitHub Pages), the hosting provider may retain standard request logs under its own policies.</p>",
    "  </article>",
    "</section>",
  ].join("\n");

  return htmlFrame("Privacy Notice | GCKB", "./assets/site.css", body);
}

export function siteLicenseHtml(): string {
  const body = [
    "<header class=\"hero\">",
    "  <p><a class=\"back-link\" href=\"./index.html\">← Back to index</a></p>",
    "  <h1>License</h1>",
    "  <p class=\"meta\">Project license and usage boundaries.</p>",
    "</header>",
    "<section class=\"grid section\">",
    "  <article class=\"card\">",
    "    <h2>Project License</h2>",
    "    <p>This repository is distributed under the ISC License.</p>",
    "    <p>See the root <code>LICENSE</code> file in the repository for full terms.</p>",
    "  </article>",
    "  <article class=\"card\">",
    "    <h2>Usage Boundaries</h2>",
    "    <ul class=\"plain-list\">",
    "      <li>Generated chord pages and diagrams in this project are original outputs.</li>",
    "      <li>Source-site prose and source images are not copied into this repository.</li>",
    "      <li>Ingested chord labels, formulas, note spellings, and voicing frets are treated as factual data with provenance.</li>",
    "    </ul>",
    "  </article>",
    "</section>",
  ].join("\n");

  return htmlFrame("License | GCKB", "./assets/site.css", body);
}
