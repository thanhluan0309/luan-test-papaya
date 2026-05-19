import { writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, "../lib/challenge-10");

// Seeded LCG PRNG
let seed = 20240101;
function rand() {
  seed = (seed * 1664525 + 1013904223) & 0xffffffff;
  return (seed >>> 0) / 0xffffffff;
}
function randInt(min, max) { return Math.floor(rand() * (max - min + 1)) + min; }
function randFrom(arr) { return arr[randInt(0, arr.length - 1)]; }
function randDate(y = 2024) {
  const start = new Date(`${y}-01-01`).getTime();
  const end = new Date(`${y}-12-31`).getTime();
  const t = start + Math.floor(rand() * (end - start));
  return new Date(t).toISOString().slice(0, 10);
}

// Base data
const MEMBERS = Array.from({ length: 500 }, (_, i) => `MBR-${String(i + 1).padStart(3, "0")}`);
const PROVIDERS = Array.from({ length: 50 }, (_, i) => ({
  id: `PRV-${String(i + 1).padStart(2, "0")}`,
  name: [
    "Bangkok Hospital", "Bumrungrad International", "Samitivej Sukhumvit",
    "BNH Hospital", "Paolo Hospital", "Phyathai 2", "Bangkok Dusit Medical",
    "Vejthani Hospital", "Sikarin Hospital", "Thonburi Hospital",
  ][i % 10] + (i >= 10 ? ` Branch ${Math.floor(i / 10)}` : ""),
}));

const PROC_BASE = {
  "P-001": 2500, "P-002": 3200, "P-003": 1800, "P-004": 4500, "P-005": 1200,
  "P-006": 25000, "P-007": 32000, "P-008": 18000, "P-009": 45000, "P-010": 38000,
  "P-011": 8500, "P-012": 12000, "P-013": 6800, "P-014": 3500, "P-015": 9200,
};
const PROC_CODES = Object.keys(PROC_BASE);

// Surgical codes (P-006 to P-010)
const SURGICAL = new Set(["P-006", "P-007", "P-008", "P-009", "P-010"]);

const DIAGNOSES = [
  "J18.9", "I21.0", "K80.10", "M54.5", "E11.9",
  "J06.9", "N39.0", "S52.501", "C34.10", "G43.909",
  "Z00.00", "A09", "K21.0", "I10", "M79.3",
  "J45.20", "F32.9", "K92.1", "N18.3", "R51",
];

// Valid dx→proc pairs (mirror rules.ts)
const DX_PROC_MAP = {
  "J18.9":   ["P-001", "P-002"],
  "I21.0":   ["P-009", "P-010"],
  "K80.10":  ["P-006", "P-007"],
  "M54.5":   ["P-003", "P-004"],
  "E11.9":   ["P-001", "P-005"],
  "J06.9":   ["P-001", "P-002"],
  "N39.0":   ["P-003", "P-005"],
  "S52.501": ["P-008", "P-009"],
  "C34.10":  ["P-010", "P-011", "P-012"],
  "G43.909": ["P-004", "P-005"],
};

const BUNDLES = {
  "P-BUNDLE-A": ["P-001", "P-002", "P-003"],
  "P-BUNDLE-B": ["P-004", "P-005"],
  "P-BUNDLE-C": ["P-006", "P-007", "P-008"],
  "P-BUNDLE-D": ["P-009", "P-010"],
  "P-BUNDLE-E": ["P-011", "P-012", "P-013"],
};

const CLAIM_TYPES = ["OUTPATIENT", "OUTPATIENT", "OUTPATIENT", "OUTPATIENT", "OUTPATIENT",
                     "OUTPATIENT", "OUTPATIENT", "INPATIENT", "INPATIENT", "INPATIENT",
                     "INPATIENT", "DENTAL", "DENTAL", "DENTAL"];

function makeAmount(procs) {
  const base = procs.reduce((s, p) => s + (PROC_BASE[p] || 3000), 0);
  const noise = 0.85 + rand() * 0.30;
  return Math.round(base * noise);
}

function isWeekend(dateStr) {
  const d = new Date(dateStr).getDay();
  return d === 0 || d === 6;
}

function validProcsForDx(dx) {
  const valid = DX_PROC_MAP[dx];
  if (!valid) return null;
  const n = randInt(1, 2);
  return valid.slice(0, n);
}

function randomProcs() {
  const n = randInt(1, 3);
  const shuffled = [...PROC_CODES].sort(() => rand() - 0.5);
  return shuffled.slice(0, n);
}

let claimIdx = 1;
function newId() { return `CLM-${String(claimIdx++).padStart(5, "0")}`; }

// === Generate 1800 normal claims ===
const claims = [];
for (let i = 0; i < 1800; i++) {
  const member = randFrom(MEMBERS);
  const provider = randFrom(PROVIDERS);
  const date = randDate();
  const dx = randFrom(DIAGNOSES);
  const procs = validProcsForDx(dx) ?? randomProcs();
  const amount = makeAmount(procs);
  claims.push({
    claim_id: newId(),
    member_id: member,
    provider_id: provider.id,
    provider_name: provider.name,
    claim_date: date,
    claim_type: randFrom(CLAIM_TYPES),
    diagnosis_code: dx,
    procedure_codes: procs,
    submitted_amount: amount,
    is_weekend: isWeekend(date),
    is_fraud: false,
    fraud_type: null,
  });
}

// Compute procedure stats from normal claims (for upcoding reference)
const procAmounts = {};
for (const c of claims) {
  for (const p of c.procedure_codes) {
    if (!procAmounts[p]) procAmounts[p] = [];
    procAmounts[p].push(c.submitted_amount);
  }
}
function procStats(p) {
  const vals = procAmounts[p] || [];
  if (!vals.length) return { mean: PROC_BASE[p] || 5000, std: 1000 };
  const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
  const std = Math.sqrt(vals.reduce((a, b) => a + (b - mean) ** 2, 0) / vals.length);
  return { mean, std: std || 1000 };
}

// === Embed fraud patterns ===

// 1. 30 duplicate claims
for (let i = 0; i < 30; i++) {
  const original = claims[randInt(0, 400)];
  claims.push({
    ...original,
    claim_id: newId(),
    is_fraud: true,
    fraud_type: "duplicate_claim",
  });
}

// 2. 30 rapid re-submissions (1–6 days after an existing claim)
for (let i = 0; i < 30; i++) {
  const base = claims[randInt(0, 800)];
  const baseDate = new Date(base.claim_date);
  const daysOffset = randInt(1, 6);
  baseDate.setDate(baseDate.getDate() + daysOffset);
  const newDate = baseDate.toISOString().slice(0, 10);
  claims.push({
    ...base,
    claim_id: newId(),
    claim_date: newDate,
    is_weekend: isWeekend(newDate),
    is_fraud: true,
    fraud_type: "rapid_resubmission",
  });
}

// 3. 30 upcoded claims (mean + 2.5 std)
const upcodeProcs = PROC_CODES.filter(p => SURGICAL.has(p) || PROC_BASE[p] > 5000);
for (let i = 0; i < 30; i++) {
  const proc = randFrom(upcodeProcs);
  const { mean, std } = procStats(proc);
  const upcoded = Math.round(mean + 2.5 * std + rand() * 5000);
  const member = randFrom(MEMBERS);
  const provider = randFrom(PROVIDERS);
  const date = randDate();
  const dx = randFrom(DIAGNOSES);
  claims.push({
    claim_id: newId(),
    member_id: member,
    provider_id: provider.id,
    provider_name: provider.name,
    claim_date: date,
    claim_type: randFrom(CLAIM_TYPES),
    diagnosis_code: dx,
    procedure_codes: [proc],
    submitted_amount: upcoded,
    is_weekend: isWeekend(date),
    is_fraud: true,
    fraud_type: "upcoding",
  });
}

// 4. 25 unbundled claims (use bundle components instead of bundle code)
const bundleEntries = Object.entries(BUNDLES);
for (let i = 0; i < 25; i++) {
  const [, components] = randFrom(bundleEntries);
  const member = randFrom(MEMBERS);
  const provider = randFrom(PROVIDERS);
  const date = randDate();
  const dx = randFrom(DIAGNOSES);
  claims.push({
    claim_id: newId(),
    member_id: member,
    provider_id: provider.id,
    provider_name: provider.name,
    claim_date: date,
    claim_type: randFrom(CLAIM_TYPES),
    diagnosis_code: dx,
    procedure_codes: [...components],
    submitted_amount: makeAmount(components),
    is_weekend: isWeekend(date),
    is_fraud: true,
    fraud_type: "unbundling",
  });
}

// 5. 25 phantom billing: concentrate claims to 1 provider on 1 day (pushing >30)
const phantomDate = "2024-06-15";
const phantomProvider = PROVIDERS[0];
for (let i = 0; i < 25; i++) {
  const member = randFrom(MEMBERS);
  const dx = randFrom(DIAGNOSES);
  const procs = randomProcs();
  claims.push({
    claim_id: newId(),
    member_id: member,
    provider_id: phantomProvider.id,
    provider_name: phantomProvider.name,
    claim_date: phantomDate,
    claim_type: randFrom(CLAIM_TYPES),
    diagnosis_code: dx,
    procedure_codes: procs,
    submitted_amount: makeAmount(procs),
    is_weekend: isWeekend(phantomDate),
    is_fraud: true,
    fraud_type: "phantom_billing",
  });
}
// Add 10 more normal claims on same provider+date to ensure total >30
for (let i = 0; i < 10; i++) {
  const member = randFrom(MEMBERS);
  const dx = randFrom(DIAGNOSES);
  const procs = validProcsForDx(dx) ?? randomProcs();
  claims.push({
    claim_id: newId(),
    member_id: member,
    provider_id: phantomProvider.id,
    provider_name: phantomProvider.name,
    claim_date: phantomDate,
    claim_type: randFrom(CLAIM_TYPES),
    diagnosis_code: dx,
    procedure_codes: procs,
    submitted_amount: makeAmount(procs),
    is_weekend: isWeekend(phantomDate),
    is_fraud: false,
    fraud_type: null,
  });
}

// 6. 20 weekend anomaly: surgical on Saturday/Sunday from a low-weekend provider
// Use provider PRV-40 (index 39) — will have < 5% weekend ratio from normal claims
const weekendProvider = PROVIDERS[39];
const weekendDates = ["2024-03-09", "2024-04-20", "2024-05-04", "2024-06-29", "2024-07-13",
                      "2024-08-17", "2024-09-07", "2024-10-05", "2024-11-02", "2024-11-30",
                      "2024-03-16", "2024-04-27", "2024-05-11", "2024-06-01", "2024-07-20",
                      "2024-08-24", "2024-09-14", "2024-10-12", "2024-11-09", "2024-12-07"];
const surgicalProcs = [...SURGICAL];
for (let i = 0; i < 20; i++) {
  const date = weekendDates[i];
  const proc = randFrom(surgicalProcs);
  const dx = randFrom(DIAGNOSES);
  claims.push({
    claim_id: newId(),
    member_id: randFrom(MEMBERS),
    provider_id: weekendProvider.id,
    provider_name: weekendProvider.name,
    claim_date: date,
    claim_type: "INPATIENT",
    diagnosis_code: dx,
    procedure_codes: [proc],
    submitted_amount: makeAmount([proc]),
    is_weekend: true,
    is_fraud: true,
    fraud_type: "weekend_anomaly",
  });
}

// 7. 20 diagnosis-procedure mismatches
const dxWithMapping = Object.keys(DX_PROC_MAP);
const invalidProcs = ["P-014", "P-015"];
for (let i = 0; i < 20; i++) {
  const dx = randFrom(dxWithMapping);
  const proc = randFrom(invalidProcs);
  const member = randFrom(MEMBERS);
  const provider = randFrom(PROVIDERS);
  const date = randDate();
  claims.push({
    claim_id: newId(),
    member_id: member,
    provider_id: provider.id,
    provider_name: provider.name,
    claim_date: date,
    claim_type: randFrom(CLAIM_TYPES),
    diagnosis_code: dx,
    procedure_codes: [proc],
    submitted_amount: makeAmount([proc]),
    is_weekend: isWeekend(date),
    is_fraud: true,
    fraud_type: "dx_procedure_mismatch",
  });
}

// 8. 20 amount clustering (47,500–49,999)
for (let i = 0; i < 20; i++) {
  const amount = randInt(47500, 49999);
  const member = randFrom(MEMBERS);
  const provider = randFrom(PROVIDERS);
  const date = randDate();
  const dx = randFrom(DIAGNOSES);
  const procs = randomProcs();
  claims.push({
    claim_id: newId(),
    member_id: member,
    provider_id: provider.id,
    provider_name: provider.name,
    claim_date: date,
    claim_type: "INPATIENT",
    diagnosis_code: dx,
    procedure_codes: procs,
    submitted_amount: amount,
    is_weekend: isWeekend(date),
    is_fraud: true,
    fraud_type: "amount_clustering",
  });
}

// Final count check
const total = claims.length;
const fraudCount = claims.filter(c => c.is_fraud).length;
console.log(`Total claims: ${total}, Fraud: ${fraudCount} (${((fraudCount/total)*100).toFixed(1)}%)`);

// Write JSON
writeFileSync(join(OUT_DIR, "claims.json"), JSON.stringify(claims, null, 2));
console.log(`✓ claims.json written (${total} claims)`);

// Write CSV
const header = "claim_id,member_id,provider_id,provider_name,claim_date,claim_type,diagnosis_code,procedure_codes,submitted_amount,is_weekend,is_fraud,fraud_type";
const rows = claims.map(c =>
  [c.claim_id, c.member_id, c.provider_id, `"${c.provider_name}"`,
   c.claim_date, c.claim_type, c.diagnosis_code,
   `"${c.procedure_codes.join("|")}"`,
   c.submitted_amount, c.is_weekend, c.is_fraud, c.fraud_type ?? ""].join(",")
);
writeFileSync(join(OUT_DIR, "claims.csv"), [header, ...rows].join("\n"));
console.log(`✓ claims.csv written`);
