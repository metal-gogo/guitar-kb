/**
 * Enharmonic Equivalence Report
 *
 * Analyses the normalised chord records for enharmonic pair symmetry and
 * reports any asymmetric or missing counterparts.
 *
 * Pairs are expected to be *mutual*: if chord A declares chord B as an
 * enharmonic equivalent, then chord B must also declare chord A.
 *
 * The report is deterministic: pair ordering is alphabetical by ID.
 */
import type { ChordRecord } from "../types/model.js";

export interface EnharmonicPair {
  /** The two chord IDs forming an enharmonic equivalence (alphabetically sorted). */
  a: string;
  b: string;
}

export interface EnharmonicAsymmetry {
  /** The chord that declares an equivalent. */
  from: string;
  /** The declared equivalent that does not reciprocate. */
  to: string;
  /** Human-readable explanation. */
  reason: string;
}

export interface EnharmonicReport {
  /** All symmetric (mutual) enharmonic pairs, sorted by `a` then `b`. */
  pairs: EnharmonicPair[];
  /**
   * Asymmetries: one side declares the other but the relationship is not
   * mutual (the counterpart either does not exist in the record set or does
   * not list the original as an equivalent).
   */
  asymmetries: EnharmonicAsymmetry[];
  /** Total chord records examined. */
  totalRecords: number;
  /** Number of records that declared at least one enharmonic equivalent. */
  recordsWithEnharmonics: number;
}

/**
 * Builds an enharmonic equivalence report from a set of normalised chord records.
 *
 * @param records - Normalised chord records from `data/chords.jsonl`.
 * @returns A deterministic {@link EnharmonicReport}.
 */
export function buildEnharmonicReport(records: ChordRecord[]): EnharmonicReport {
  const idSet = new Set(records.map((r) => r.id));
  const enharmonicMap = new Map<string, string[]>(
    records.map((r) => [r.id, r.enharmonic_equivalents ?? []]),
  );

  const seenPairs = new Set<string>(); // deduplicate by canonical key "a|b"
  const pairs: EnharmonicPair[] = [];
  const asymmetries: EnharmonicAsymmetry[] = [];

  const recordsWithEnharmonics = records.filter(
    (r) => (r.enharmonic_equivalents ?? []).length > 0,
  ).length;

  // Collect all declared equivalences, classify as symmetric or asymmetric
  for (const record of records) {
    for (const equiv of record.enharmonic_equivalents ?? []) {
      // Self-references are a data error — record as asymmetry
      if (equiv === record.id) {
        asymmetries.push({
          from: record.id,
          to: equiv,
          reason: `"${record.id}" declares itself as an enharmonic equivalent (self-reference)`,
        });
        continue;
      }

      const [a, b] = [record.id, equiv].sort();
      const pairKey = `${a}|${b}`;

      if (!idSet.has(equiv)) {
        asymmetries.push({
          from: record.id,
          to: equiv,
          reason: `"${equiv}" is declared as an equivalent of "${record.id}" but does not exist in the record set`,
        });
        continue;
      }

      const reverseEquivs = enharmonicMap.get(equiv) ?? [];
      const isSymmetric = reverseEquivs.includes(record.id);

      if (!isSymmetric) {
        asymmetries.push({
          from: record.id,
          to: equiv,
          reason: `"${record.id}" declares "${equiv}" as an equivalent, but "${equiv}" does not reciprocate`,
        });
        continue;
      }

      // Symmetric — record the pair once
      if (!seenPairs.has(pairKey)) {
        seenPairs.add(pairKey);
        pairs.push({ a: a!, b: b! });
      }
    }
  }

  // Sort deterministically using locale-independent string comparison
  // to ensure consistent output regardless of runtime locale/ICU settings.
  const cmp = (x: string, y: string): number => (x < y ? -1 : x > y ? 1 : 0);
  pairs.sort((x, y) => cmp(x.a, y.a) || cmp(x.b, y.b));
  asymmetries.sort((x, y) => cmp(x.from, y.from) || cmp(x.to, y.to));

  return { pairs, asymmetries, totalRecords: records.length, recordsWithEnharmonics };
}

/**
 * Formats an {@link EnharmonicReport} as a human-readable Markdown string.
 * Output is deterministic for identical inputs.
 */
export function formatEnharmonicReport(report: EnharmonicReport): string {
  const lines: string[] = [];

  lines.push("# Enharmonic Equivalence Report");
  lines.push("");
  lines.push(
    `Examined ${report.totalRecords} chord records; ` +
      `${report.recordsWithEnharmonics} declare at least one enharmonic equivalent.`,
  );
  lines.push("");

  lines.push("## Symmetric Pairs");
  lines.push("");
  if (report.pairs.length === 0) {
    lines.push("_No symmetric pairs found._");
  } else {
    lines.push("| A | B |");
    lines.push("|---|---|");
    for (const pair of report.pairs) {
      lines.push(`| ${pair.a} | ${pair.b} |`);
    }
  }
  lines.push("");

  lines.push("## Asymmetries");
  lines.push("");
  if (report.asymmetries.length === 0) {
    lines.push("_No asymmetries detected._");
  } else {
    lines.push("| From | To | Reason |");
    lines.push("|------|----|--------|");
    for (const a of report.asymmetries) {
      lines.push(`| ${a.from} | ${a.to} | ${a.reason} |`);
    }
  }
  lines.push("");

  return lines.join("\n");
}
