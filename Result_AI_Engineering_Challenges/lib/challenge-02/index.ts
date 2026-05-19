export interface RawClaim {
  claim_id: string;
  policy_id: string;
  member_name: string;
  claim_type: string;
  diagnosis: string;
  submitted_amount: string;
  currency: string;
  submitted_date: string;
  status: string;
}

export interface CleanClaim {
  claim_id: string | null;
  policy_id: string | null;
  member_name: string;
  claim_type: "OUTPATIENT" | "INPATIENT" | "DENTAL";
  diagnosis: string | null;
  submitted_amount: number;
  currency: "THB" | "VND";
  submitted_date: string;
  status: "APPROVED" | "REJECTED" | "PENDING" | "IN_REVIEW";
}

export interface DataQualityReport {
  totalBefore: number;
  totalAfter: number;
  duplicatesRemoved: number;
  invalidAmountsRemoved: number;
  issuesByType: Record<string, number>;
  claimsByType: Record<string, number>;
  claimsByStatus: Record<string, number>;
  avgAmountByType: Record<string, number>;
  top5Diagnoses: { diagnosis: string; count: number; avgAmount: number }[];
  samplePairs: { dirty: RawClaim; clean: CleanClaim; changed: string[] }[];
}

// ── Seeded LCG random ──────────────────────────────────────────
class Rng {
  private s: number;
  constructor(seed: number) { this.s = seed >>> 0; }
  next() { this.s = (Math.imul(1664525, this.s) + 1013904223) >>> 0; return this.s / 4294967296; }
  int(min: number, max: number) { return Math.floor(this.next() * (max - min + 1)) + min; }
  pick<T>(arr: readonly T[]): T { return arr[Math.floor(this.next() * arr.length)]; }
  bool(p = 0.5) { return this.next() < p; }
}

// ── Reference data ─────────────────────────────────────────────
const MEMBERS = [
  "Somchai Jaidee", "Nguyen Van An", "Priya Sharma", "John Smith",
  "Lisa Chen", "Mohamed Hassan", "Sarah Park", "David Nguyen",
  "Ananya Patel", "James Wilson", "Thanh Tran", "Mia Rodriguez",
  "Arjun Mehta", "Emma Davis", "Kiet Pham", "Suwanna Boontham",
] as const;

const DIAGNOSES = [
  "Flu", "Hypertension", "Diabetes Type 2", "Back Pain", "Allergy",
  "Migraine", "Fracture", "COVID-19", "Appendicitis", "Pneumonia",
  "Gastritis", "Urinary Infection", "Sprained Ankle", "Common Cold", "Asthma",
] as const;


const CLAIM_TYPES = ["OUTPATIENT", "INPATIENT", "DENTAL"] as const;
const STATUSES = ["APPROVED", "REJECTED", "PENDING", "IN_REVIEW"] as const;
const STATUS_WEIGHTS = [0.44, 0.16, 0.28, 0.12]; // realistic distribution

function weightedStatus(rng: Rng): string {
  const r = rng.next();
  let acc = 0;
  for (let i = 0; i < STATUS_WEIGHTS.length; i++) {
    acc += STATUS_WEIGHTS[i];
    if (r < acc) return STATUSES[i];
  }
  return "PENDING";
}

function isoDate(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function randomDate(rng: Rng): string {
  const month = rng.int(1, 12);
  const maxDay = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1];
  return isoDate(2024, month, rng.int(1, maxDay));
}

// ── Dirty variant generators ───────────────────────────────────
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function dirtyDate(clean: string, rng: Rng): string {
  const [y, m, d] = clean.split("-").map(Number);
  const variant = rng.int(0, 1);
  if (variant === 0) return `${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}/${y}`;
  return `${MONTH_NAMES[m - 1]} ${d}, ${y}`;
}

function dirtyCurrency(clean: "THB" | "VND", rng: Rng): string {
  if (clean === "THB") return rng.pick(["thb", "Baht", "baht", "THB"] as const);
  return rng.pick(["vnd", "Vnd", "VND"] as const);
}

function dirtyClaimType(clean: string, rng: Rng): string {
  if (clean === "OUTPATIENT") return rng.pick(["outpatient", "Outpateint", "OP", "OUTPATIENT"] as const);
  if (clean === "INPATIENT") return rng.pick(["inpatient", "INPATIENT"] as const);
  return rng.pick(["dental", "DENTAL"] as const);
}

function dirtyName(name: string, rng: Rng): string {
  const v = rng.int(0, 1);
  return v === 0 ? name.toUpperCase() : name.toLowerCase();
}

function dirtyAmount(amount: number, rng: Rng): string {
  const v = rng.int(0, 2);
  if (v === 0) return String(-amount);
  if (v === 1) return "0";
  return amount.toLocaleString("en-US"); // "15,000" format
}

// ── Generator ─────────────────────────────────────────────────
export function generateDirtyData(count = 500, seed = 42): RawClaim[] {
  const rng = new Rng(seed);
  const baseCount = count - 20; // reserve 20 slots for duplicates
  const records: RawClaim[] = [];

  // issue slots distributed across base rows
  const issueSlots = new Set<number>();
  while (issueSlots.size < Math.floor(baseCount * 0.17)) {
    issueSlots.add(rng.int(0, baseCount - 1));
  }
  const issueList = [...issueSlots];

  // assign issue types to slots
  const issueAssignments = new Map<number, string[]>();
  const issueTypes = [
    "missing_claim_id", "missing_policy_id", "bad_name_casing",
    "claim_type_typo", "bad_diagnosis", "bad_amount",
    "bad_currency", "bad_date",
  ];
  let ii = 0;
  for (const slot of issueList) {
    const type = issueTypes[ii % issueTypes.length];
    if (!issueAssignments.has(slot)) issueAssignments.set(slot, []);
    issueAssignments.get(slot)!.push(type);
    ii++;
  }
  // add a few multi-issue rows
  for (let i = 0; i < 10; i++) {
    const slot = rng.pick(issueList);
    const extra = issueTypes[rng.int(0, issueTypes.length - 1)];
    const existing = issueAssignments.get(slot) ?? [];
    if (!existing.includes(extra)) {
      issueAssignments.set(slot, [...existing, extra]);
    }
  }

  for (let i = 0; i < baseCount; i++) {
    const id = `CLM-${String(i + 1).padStart(5, "0")}`;
    const polId = `POL-${String(rng.int(1, 150)).padStart(3, "0")}`;
    const name = rng.pick(MEMBERS) as string;
    const claimType = rng.pick(CLAIM_TYPES) as string;
    const diagnosis = rng.pick(DIAGNOSES) as string;
    const baseAmount = rng.int(500, 80_000);
    const currency = rng.bool(0.65) ? "THB" : "VND";
    const date = randomDate(rng);
    const status = weightedStatus(rng);

    const issues = issueAssignments.get(i) ?? [];

    records.push({
      claim_id: issues.includes("missing_claim_id") ? "" : id,
      policy_id: issues.includes("missing_policy_id") ? "" : polId,
      member_name: issues.includes("bad_name_casing") ? dirtyName(name, rng) : name,
      claim_type: issues.includes("claim_type_typo") ? dirtyClaimType(claimType, rng) : claimType,
      diagnosis: issues.includes("bad_diagnosis")
        ? rng.pick(["", "N/A", "n/a"] as const)
        : diagnosis,
      submitted_amount: issues.includes("bad_amount")
        ? dirtyAmount(baseAmount, rng)
        : String(baseAmount),
      currency: issues.includes("bad_currency")
        ? dirtyCurrency(currency as "THB" | "VND", rng)
        : currency,
      submitted_date: issues.includes("bad_date") ? dirtyDate(date, rng) : date,
      status,
    });
  }

  // Add 20 exact duplicates
  for (let i = 0; i < 20; i++) {
    const src = records[rng.int(0, baseCount - 1)];
    records.push({ ...src });
  }

  return records;
}

// ── Cleaners ──────────────────────────────────────────────────
const MONTH_MAP: Record<string, string> = {
  january: "01", february: "02", march: "03", april: "04",
  may: "05", june: "06", july: "07", august: "08",
  september: "09", october: "10", november: "11", december: "12",
};

function parseDate(raw: string): string | null {
  const iso = /^\d{4}-\d{2}-\d{2}$/;
  if (iso.test(raw.trim())) return raw.trim();

  // DD/MM/YYYY
  const dmy = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (dmy) return isoDate(Number(dmy[3]), Number(dmy[2]), Number(dmy[1]));

  // Month DD, YYYY
  const monthLong = raw.match(/^(\w+)\s+(\d{1,2}),?\s+(\d{4})$/i);
  if (monthLong) {
    const mon = MONTH_MAP[monthLong[1].toLowerCase()];
    if (mon) return isoDate(Number(monthLong[3]), Number(mon), Number(monthLong[2]));
  }

  return null;
}

const CURRENCY_MAP: Record<string, "THB" | "VND"> = {
  thb: "THB", baht: "THB",
  vnd: "VND", dong: "VND",
};

function normalizeCurrency(raw: string): "THB" | "VND" | null {
  const key = raw.trim().toLowerCase();
  if (key === "thb") return "THB";
  if (key === "vnd") return "VND";
  return CURRENCY_MAP[key] ?? null;
}

const CLAIM_TYPE_MAP: Record<string, CleanClaim["claim_type"]> = {
  outpatient: "OUTPATIENT", outpateint: "OUTPATIENT", op: "OUTPATIENT",
  inpatient: "INPATIENT",
  dental: "DENTAL",
};

function normalizeClaimType(raw: string): CleanClaim["claim_type"] | null {
  const key = raw.trim().toLowerCase();
  if (["outpatient", "inpatient", "dental"].includes(key))
    return key.toUpperCase() as CleanClaim["claim_type"];
  return CLAIM_TYPE_MAP[key] ?? null;
}

function toTitleCase(s: string): string {
  return s.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
}

function parseAmount(raw: string): number | null {
  const cleaned = raw.replace(/,/g, "").trim();
  const n = Number(cleaned);
  if (isNaN(n)) return null;
  return n;
}

// ── Main cleaner ───────────────────────────────────────────────
export function cleanData(raw: RawClaim[]): { clean: CleanClaim[]; report: DataQualityReport } {
  const issues: Record<string, number> = {
    duplicate_rows: 0,
    missing_claim_id: 0,
    missing_policy_id: 0,
    bad_name_casing: 0,
    claim_type_typo: 0,
    bad_diagnosis: 0,
    invalid_amount: 0,
    bad_currency: 0,
    bad_date: 0,
  };

  // Deduplicate by exact row match (stringify)
  const seen = new Set<string>();
  const deduped: RawClaim[] = [];
  for (const row of raw) {
    const key = JSON.stringify(row);
    if (seen.has(key)) { issues.duplicate_rows++; continue; }
    seen.add(key);
    deduped.push(row);
  }

  const clean: CleanClaim[] = [];
  const removed: { claim_id: string; reason: string }[] = [];
  const samplePairs: DataQualityReport["samplePairs"] = [];

  for (const row of deduped) {
    const changed: string[] = [];

    // claim_id
    const claimId = row.claim_id.trim() || null;
    if (!claimId) { issues.missing_claim_id++; changed.push("claim_id"); }

    // policy_id
    const policyId = row.policy_id.trim() || null;
    if (!policyId) { issues.missing_policy_id++; changed.push("policy_id"); }

    // member_name
    const titled = toTitleCase(row.member_name.trim());
    if (titled !== row.member_name.trim()) { issues.bad_name_casing++; changed.push("member_name"); }

    // claim_type
    const claimType = normalizeClaimType(row.claim_type);
    if (!claimType) {
      removed.push({ claim_id: claimId ?? "?", reason: "unknown_claim_type" });
      continue;
    }
    if (!["OUTPATIENT", "INPATIENT", "DENTAL"].includes(row.claim_type.trim())) {
      changed.push("claim_type");
    }

    // diagnosis
    const diagRaw = row.diagnosis.trim();
    const badDiag = !diagRaw || diagRaw.toLowerCase() === "n/a";
    if (badDiag) { issues.bad_diagnosis++; changed.push("diagnosis"); }
    const diagnosis = badDiag ? null : diagRaw;

    // amount
    const amount = parseAmount(row.submitted_amount);
    if (amount === null || amount <= 0) {
      issues.invalid_amount++;
      removed.push({ claim_id: claimId ?? "?", reason: "invalid_amount" });
      continue;
    }
    if (row.submitted_amount.includes(",")) { issues.invalid_amount++; changed.push("submitted_amount"); }

    // currency
    const currency = normalizeCurrency(row.currency);
    if (!currency) {
      removed.push({ claim_id: claimId ?? "?", reason: "unknown_currency" });
      continue;
    }
    if (row.currency !== currency) { issues.bad_currency++; changed.push("currency"); }

    // date
    const date = parseDate(row.submitted_date);
    if (!date) {
      removed.push({ claim_id: claimId ?? "?", reason: "unparseable_date" });
      continue;
    }
    if (row.submitted_date !== date) { issues.bad_date++; changed.push("submitted_date"); }

    // status
    const statusMap: Record<string, CleanClaim["status"]> = {
      APPROVED: "APPROVED", REJECTED: "REJECTED", PENDING: "PENDING", IN_REVIEW: "IN_REVIEW",
    };
    const status = statusMap[row.status] ?? "PENDING";

    const cleanRow: CleanClaim = {
      claim_id: claimId,
      policy_id: policyId,
      member_name: titled,
      claim_type: claimType,
      diagnosis,
      submitted_amount: amount,
      currency,
      submitted_date: date,
      status,
    };

    clean.push(cleanRow);

    if (changed.length > 0 && samplePairs.length < 5) {
      samplePairs.push({ dirty: row, clean: cleanRow, changed });
    }
  }

  // ── Statistics ─────────────────────────────────────────────
  const claimsByType: Record<string, number> = {};
  const claimsByStatus: Record<string, number> = {};
  const amountByType: Record<string, number[]> = {};
  const diagCount: Record<string, { count: number; total: number }> = {};

  for (const c of clean) {
    claimsByType[c.claim_type] = (claimsByType[c.claim_type] ?? 0) + 1;
    claimsByStatus[c.status] = (claimsByStatus[c.status] ?? 0) + 1;
    (amountByType[c.claim_type] ??= []).push(c.submitted_amount);
    if (c.diagnosis) {
      diagCount[c.diagnosis] ??= { count: 0, total: 0 };
      diagCount[c.diagnosis].count++;
      diagCount[c.diagnosis].total += c.submitted_amount;
    }
  }

  const avgAmountByType: Record<string, number> = {};
  for (const [type, amounts] of Object.entries(amountByType)) {
    avgAmountByType[type] = Math.round(amounts.reduce((s, a) => s + a, 0) / amounts.length);
  }

  const top5Diagnoses = Object.entries(diagCount)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 5)
    .map(([diagnosis, { count, total }]) => ({
      diagnosis,
      count,
      avgAmount: Math.round(total / count),
    }));

  // recount claim_type_typo cleanly (avoid double counting above)
  issues.claim_type_typo = raw.filter((r) => {
    const key = r.claim_type.trim().toLowerCase();
    return !["outpatient", "inpatient", "dental"].includes(key) && normalizeClaimType(r.claim_type) !== null;
  }).length;

  const report: DataQualityReport = {
    totalBefore: raw.length,
    totalAfter: clean.length,
    duplicatesRemoved: issues.duplicate_rows,
    invalidAmountsRemoved: removed.filter((r) => r.reason === "invalid_amount").length,
    issuesByType: issues,
    claimsByType,
    claimsByStatus,
    avgAmountByType,
    top5Diagnoses,
    samplePairs,
  };

  return { clean, report };
}
