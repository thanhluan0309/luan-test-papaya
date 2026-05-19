// Generates 5,000 mock insurance claims → lib/challenge-09/claims.csv + claims.json
// Run: node scripts/generate-claims.mjs

import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, "../lib/challenge-09");

// ── Seeded PRNG (LCG) for reproducible output ─────────────────────
let seed = 20240101;
function rand() {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  return seed / 0x100000000;
}
function randInt(min, max) { return Math.floor(rand() * (max - min + 1)) + min; }
function pick(arr)          { return arr[Math.floor(rand() * arr.length)]; }
function weighted(items, weights) {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = rand() * total;
  for (let i = 0; i < items.length; i++) { r -= weights[i]; if (r <= 0) return items[i]; }
  return items[items.length - 1];
}

// ── Reference data ────────────────────────────────────────────────
const CLAIM_TYPES   = ["OUTPATIENT", "INPATIENT", "DENTAL", "MATERNITY"];
const TYPE_WEIGHTS  = [60, 20, 12, 8];

const STATUSES         = ["APPROVED", "REJECTED", "PENDING", "IN_REVIEW"];
const STATUS_WEIGHTS   = [65, 15, 12, 8];

const ICD10 = [
  "J06.9",  "J18.9",   "K21.9",  "I10",     "E11.9",
  "M54.5",  "J45.909", "I25.10", "K80.20",  "N39.0",
  "Z00.00", "F32.9",   "M17.11", "G43.909", "E78.5",
  "K29.70", "L20.9",   "H66.90", "J03.9",   "O80",
];
const ICD10_WEIGHTS = [12, 8, 7, 8, 7, 6, 5, 4, 4, 6, 8, 4, 3, 4, 4, 4, 3, 3, 4, 3];

const ASSESSORS = [
  "Somchai Rattana",
  "Nguyen Thi Mai",
  "David Chen",
  "Priya Sharma",
  "Alex Wong",
];

const INSURERS_BY_COUNTRY = {
  Thailand:    "AIA Thailand",
  Vietnam:     "Prudential Vietnam",
  "Hong Kong": "AXA Hong Kong",
};
const COUNTRIES        = ["Thailand", "Vietnam", "Hong Kong"];
const COUNTRY_WEIGHTS  = [50, 30, 20];

const FIRST_NAMES = [
  "Somchai", "Priya", "Nguyen", "David", "Sarah", "Michael", "Li Wei",
  "Thida", "Arjun", "Emma", "Thanh", "Kanokwan", "Sompong", "Mai",
  "Robert", "Nattaya", "John", "Yuki", "Anna", "Surachai", "Lan",
  "Marcus", "Anchisa", "Pham", "Wanlop",
];
const LAST_NAMES = [
  "Johnson", "Chen", "Nguyen", "Patel", "Smith", "Wong", "Rattana",
  "Kumar", "Lee", "Tanaka", "Tran", "Park", "Sharma", "Brown", "Phong",
  "Srisuk", "Liu", "Yamamoto", "Williams", "Boonmee", "Hoang", "Nakamura",
  "Prasert", "Davis", "Charoenwong",
];

// ── Helper functions ──────────────────────────────────────────────
function randName() {
  return `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
}

function randAmount() {
  const r = rand();
  if (r < 0.55) return randInt(500, 5000);
  if (r < 0.78) return randInt(5000, 30000);
  if (r < 0.92) return randInt(30000, 200000);
  return randInt(200000, 2000000);
}

function randDate2024() {
  const month = randInt(1, 12);
  const day   = randInt(1, new Date(2024, month, 0).getDate());
  return `2024-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function addDays(dateStr, days) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  // Cap at 2024-12-31
  if (d > new Date("2024-12-31")) d.setFullYear(2024, 11, 31);
  return d.toISOString().slice(0, 10);
}

// Skewed toward short: ~50% within 5 days, avg ~7
function randProcessingDays() {
  const r = rand();
  if (r < 0.50) return randInt(1, 5);
  if (r < 0.80) return randInt(5, 10);
  if (r < 0.95) return randInt(10, 20);
  return randInt(20, 30);
}

// ── Generate ──────────────────────────────────────────────────────
const claims = [];

for (let i = 1; i <= 5000; i++) {
  const claim_type       = weighted(CLAIM_TYPES, TYPE_WEIGHTS);
  const status           = weighted(STATUSES, STATUS_WEIGHTS);
  const submitted_amount = randAmount();
  const submitted_date   = randDate2024();
  const country          = weighted(COUNTRIES, COUNTRY_WEIGHTS);

  let approved_amount = 0;
  let processed_date  = null;

  if (status === "APPROVED") {
    // Cover 70–100% of submitted
    approved_amount = Math.round(submitted_amount * (0.70 + rand() * 0.30));
    processed_date  = addDays(submitted_date, randProcessingDays());
  } else if (status === "REJECTED" || status === "IN_REVIEW") {
    approved_amount = 0;
    processed_date  = addDays(submitted_date, randProcessingDays());
  }
  // PENDING: approved_amount=0, processed_date=null

  claims.push({
    claim_id:         `CLM-${String(i).padStart(5, "0")}`,
    policy_id:        `POL-${String(randInt(1, 3000)).padStart(5, "0")}`,
    member_name:      randName(),
    claim_type,
    diagnosis_icd10:  weighted(ICD10, ICD10_WEIGHTS),
    submitted_amount,
    approved_amount,
    status,
    submitted_date,
    processed_date,
    assessor:         pick(ASSESSORS),
    insurer:          INSURERS_BY_COUNTRY[country],
    country,
  });
}

// ── Write JSON ────────────────────────────────────────────────────
mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(join(OUT_DIR, "claims.json"), JSON.stringify(claims, null, 2));

// ── Write CSV ─────────────────────────────────────────────────────
const HEADERS = [
  "claim_id", "policy_id", "member_name", "claim_type", "diagnosis_icd10",
  "submitted_amount", "approved_amount", "status", "submitted_date",
  "processed_date", "assessor", "insurer", "country",
];

function csvCell(v) {
  if (v === null || v === undefined) return "";
  const s = String(v);
  return s.includes(",") || s.includes('"') || s.includes("\n")
    ? `"${s.replace(/"/g, '""')}"` : s;
}

const csv = [
  HEADERS.join(","),
  ...claims.map((c) => HEADERS.map((h) => csvCell(c[h])).join(",")),
].join("\n");

writeFileSync(join(OUT_DIR, "claims.csv"), csv);

// ── Stats ─────────────────────────────────────────────────────────
const byStatus   = Object.fromEntries(STATUSES.map((s) => [s, claims.filter((c) => c.status === s).length]));
const byType     = Object.fromEntries(CLAIM_TYPES.map((t) => [t, claims.filter((c) => c.claim_type === t).length]));
const processed  = claims.filter((c) => c.processed_date);
const avgDays    = processed.reduce((sum, c) => {
  return sum + (new Date(c.processed_date) - new Date(c.submitted_date)) / 86400000;
}, 0) / processed.length;

console.log(`✓ Generated ${claims.length} claims`);
console.log(`  Status:  ${JSON.stringify(byStatus)}`);
console.log(`  Type:    ${JSON.stringify(byType)}`);
console.log(`  Avg processing days: ${avgDays.toFixed(1)}`);
console.log(`  Output:  lib/challenge-09/claims.json (${(JSON.stringify(claims).length / 1024).toFixed(0)} KB)`);
console.log(`  Output:  lib/challenge-09/claims.csv  (${csv.length / 1024 | 0} KB)`);
