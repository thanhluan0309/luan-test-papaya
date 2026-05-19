/**
 * Claims Data Cleanup Script — AI Challenge 02
 *
 * Generates a dirty CSV of 500 insurance claims, cleans it,
 * writes both CSVs to /data/, and prints a quality report.
 *
 * Usage:
 *   npx tsx scripts/clean-claims.ts
 */

import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { generateDirtyData, cleanData, type RawClaim, type CleanClaim } from "@/lib/challenge-02";

// ── CSV helpers ────────────────────────────────────────────────
function escapeCell(v: string | number | null | undefined): string {
  if (v === null || v === undefined || v === "") return "";
  const s = String(v);
  return s.includes(",") || s.includes('"') || s.includes("\n")
    ? `"${s.replace(/"/g, '""')}"`
    : s;
}

const RAW_HEADERS: (keyof RawClaim)[] = [
  "claim_id", "policy_id", "member_name", "claim_type",
  "diagnosis", "submitted_amount", "currency", "submitted_date", "status",
];

const CLEAN_HEADERS: (keyof CleanClaim)[] = [
  "claim_id", "policy_id", "member_name", "claim_type",
  "diagnosis", "submitted_amount", "currency", "submitted_date", "status",
];

function toCsv<T extends object>(headers: (keyof T)[], rows: T[]): string {
  const head = headers.join(",");
  const body = rows.map((r) => headers.map((h) => escapeCell(r[h] as string | number | null)).join(","));
  return [head, ...body].join("\n");
}

// ── Report printer ─────────────────────────────────────────────
const fmt = (n: number) => n.toLocaleString("en-US");
const pct = (n: number, total: number) => `${((n / total) * 100).toFixed(1)}%`;
const bar = (n: number, max: number, width = 20) =>
  "█".repeat(Math.round((n / max) * width)).padEnd(width, "░");

const issueLabels: Record<string, string> = {
  duplicate_rows:   "Duplicate rows",
  missing_claim_id: "Missing claim ID",
  missing_policy_id:"Missing policy ID",
  bad_name_casing:  "Name casing",
  claim_type_typo:  "Claim type typo/abbr",
  bad_diagnosis:    "Empty/N/A diagnosis",
  invalid_amount:   "Invalid amount",
  bad_currency:     "Bad currency format",
  bad_date:         "Bad date format",
};

function printReport(report: ReturnType<typeof cleanData>["report"]): void {
  const totalIssues = Object.values(report.issuesByType).reduce((s, v) => s + v, 0);
  const sep = "─".repeat(62);

  console.log("\n" + "═".repeat(62));
  console.log("  CLAIMS DATA QUALITY REPORT");
  console.log("═".repeat(62));

  console.log(`\n  Total rows   (before): ${fmt(report.totalBefore)}`);
  console.log(`  Clean rows   (after):  ${fmt(report.totalAfter)}`);
  console.log(`  Rows removed:          ${report.totalBefore - report.totalAfter}`);
  console.log(`    └─ Duplicates:       ${report.duplicatesRemoved}`);
  console.log(`    └─ Invalid amounts:  ${report.invalidAmountsRemoved}`);

  console.log(`\n  ${sep}`);
  console.log("  ISSUES BY TYPE");
  console.log(`  ${sep}`);
  const maxIssue = Math.max(...Object.values(report.issuesByType));
  for (const [key, count] of Object.entries(report.issuesByType).sort((a, b) => b[1] - a[1])) {
    if (count === 0) continue;
    const label = (issueLabels[key] ?? key).padEnd(26);
    console.log(`  ${label} ${bar(count, maxIssue, 14)}  ${String(count).padStart(3)}  (${pct(count, report.totalBefore)})`);
  }

  console.log(`\n  ${sep}`);
  console.log("  SUMMARY STATISTICS");
  console.log(`  ${sep}`);

  console.log("\n  Claims by type:");
  const maxType = Math.max(...Object.values(report.claimsByType));
  for (const [type, count] of Object.entries(report.claimsByType).sort((a, b) => b[1] - a[1])) {
    console.log(`    ${type.padEnd(12)} ${bar(count, maxType, 16)}  ${fmt(count).padStart(5)}  (${pct(count, report.totalAfter)})`);
  }

  console.log("\n  Claims by status:");
  const maxStatus = Math.max(...Object.values(report.claimsByStatus));
  for (const [status, count] of Object.entries(report.claimsByStatus).sort((a, b) => b[1] - a[1])) {
    console.log(`    ${status.padEnd(12)} ${bar(count, maxStatus, 16)}  ${fmt(count).padStart(5)}  (${pct(count, report.totalAfter)})`);
  }

  console.log("\n  Average submitted amount by type:");
  for (const [type, avg] of Object.entries(report.avgAmountByType)) {
    console.log(`    ${type.padEnd(12)}  ฿${fmt(avg)}`);
  }

  console.log("\n  Top 5 diagnoses:");
  report.top5Diagnoses.forEach(({ diagnosis, count, avgAmount }, i) => {
    console.log(`    ${i + 1}. ${diagnosis.padEnd(20)} ${fmt(count).padStart(4)} claims   avg ฿${fmt(avgAmount)}`);
  });

  console.log("\n" + "═".repeat(62) + "\n");
}

// ── Main ───────────────────────────────────────────────────────
const DATA_DIR = join(import.meta.dirname, "../data");
mkdirSync(DATA_DIR, { recursive: true });

console.log("Generating 500 dirty claims...");
const dirty = generateDirtyData(500, 42);
const dirtyCsvPath = join(DATA_DIR, "dirty_claims.csv");
writeFileSync(dirtyCsvPath, toCsv(RAW_HEADERS, dirty), "utf-8");
console.log(`  ✓ dirty_claims.csv  (${dirty.length} rows)`);

console.log("Cleaning data...");
const { clean, report } = cleanData(dirty);
const cleanCsvPath = join(DATA_DIR, "clean_claims.csv");
writeFileSync(cleanCsvPath, toCsv(CLEAN_HEADERS, clean), "utf-8");
console.log(`  ✓ clean_claims.csv  (${clean.length} rows)`);

printReport(report);
