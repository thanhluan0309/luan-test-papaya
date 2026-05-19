import type { Claim, FraudFlag } from "./types";

export const SEVERITY: Record<string, number> = {
  duplicate_claim:        5,
  rapid_resubmission:     3,
  upcoding:               4,
  unbundling:             3,
  phantom_billing:        4,
  weekend_anomaly:        3,
  dx_procedure_mismatch:  4,
  amount_clustering:      2,
};

export const MAX_SEVERITY = Object.values(SEVERITY).reduce((a, b) => a + b, 0); // 28

export const BUNDLE_MAP: Record<string, string[]> = {
  "P-BUNDLE-A": ["P-001", "P-002", "P-003"],
  "P-BUNDLE-B": ["P-004", "P-005"],
  "P-BUNDLE-C": ["P-006", "P-007", "P-008"],
  "P-BUNDLE-D": ["P-009", "P-010"],
  "P-BUNDLE-E": ["P-011", "P-012", "P-013"],
};

export const SURGICAL_CODES = new Set(["P-006", "P-007", "P-008", "P-009", "P-010"]);

export const DX_PROC_MAP: Record<string, string[]> = {
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

function stats(values: number[]): { mean: number; std: number } {
  if (values.length === 0) return { mean: 0, std: 0 };
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length;
  return { mean, std: Math.sqrt(variance) };
}

function daysBetween(a: string, b: string): number {
  return Math.abs(new Date(a).getTime() - new Date(b).getTime()) / 86_400_000;
}

type FlagMap = Map<string, FraudFlag[]>;

function addFlag(map: FlagMap, claimId: string, flag: FraudFlag) {
  if (!map.has(claimId)) map.set(claimId, []);
  map.get(claimId)!.push(flag);
}

// Rule 1 — Duplicate claim
export function ruleDuplicateClaim(claims: Claim[]): FlagMap {
  const map: FlagMap = new Map();
  const groups = new Map<string, Claim[]>();
  for (const c of claims) {
    const key = `${c.member_id}|${c.provider_id}|${c.claim_date}|${c.diagnosis_code}`;
    (groups.get(key) ?? groups.set(key, []).get(key)!).push(c);
  }
  for (const group of groups.values()) {
    if (group.length < 2) continue;
    const ids = group.map(c => c.claim_id);
    for (const c of group) {
      const others = ids.filter(id => id !== c.claim_id).join(", ");
      addFlag(map, c.claim_id, {
        rule: "duplicate_claim",
        severity: SEVERITY.duplicate_claim,
        evidence: `Duplicate of ${others} — same member ${c.member_id}, provider ${c.provider_id}, date ${c.claim_date}, diagnosis ${c.diagnosis_code}`,
      });
    }
  }
  return map;
}

// Rule 2 — Rapid re-submission (same member + diagnosis within 7 days)
export function ruleRapidResubmission(claims: Claim[]): FlagMap {
  const map: FlagMap = new Map();
  const byMember = new Map<string, Claim[]>();
  for (const c of claims) {
    (byMember.get(c.member_id) ?? byMember.set(c.member_id, []).get(c.member_id)!).push(c);
  }
  for (const group of byMember.values()) {
    const sorted = [...group].sort((a, b) => a.claim_date.localeCompare(b.claim_date));
    for (let i = 1; i < sorted.length; i++) {
      const cur = sorted[i];
      for (let j = i - 1; j >= 0; j--) {
        const prev = sorted[j];
        const days = daysBetween(cur.claim_date, prev.claim_date);
        if (days >= 7) break;
        if (days === 0) continue; // same day handled by duplicate rule
        if (cur.diagnosis_code === prev.diagnosis_code) {
          addFlag(map, cur.claim_id, {
            rule: "rapid_resubmission",
            severity: SEVERITY.rapid_resubmission,
            evidence: `Same diagnosis ${cur.diagnosis_code} submitted ${days.toFixed(0)} day(s) after ${prev.claim_id} (${prev.claim_date})`,
          });
          break;
        }
      }
    }
  }
  return map;
}

// Rule 3 — Upcoding
export function ruleUpcoding(claims: Claim[]): FlagMap {
  const map: FlagMap = new Map();
  const byProc = new Map<string, number[]>();
  for (const c of claims) {
    for (const p of c.procedure_codes) {
      (byProc.get(p) ?? byProc.set(p, []).get(p)!).push(c.submitted_amount);
    }
  }
  const procStats = new Map<string, { mean: number; std: number }>();
  for (const [p, vals] of byProc) procStats.set(p, stats(vals));

  for (const c of claims) {
    for (const p of c.procedure_codes) {
      const s = procStats.get(p);
      if (!s || s.std === 0) continue;
      const zScore = (c.submitted_amount - s.mean) / s.std;
      if (zScore > 2) {
        addFlag(map, c.claim_id, {
          rule: "upcoding",
          severity: SEVERITY.upcoding,
          evidence: `Amount ฿${c.submitted_amount.toLocaleString()} for procedure ${p} is ${zScore.toFixed(2)} std devs above mean ฿${Math.round(s.mean).toLocaleString()} (std ฿${Math.round(s.std).toLocaleString()})`,
        });
        break;
      }
    }
  }
  return map;
}

// Rule 4 — Unbundling
export function ruleUnbundling(claims: Claim[]): FlagMap {
  const map: FlagMap = new Map();
  for (const c of claims) {
    const codeSet = new Set(c.procedure_codes);
    for (const [bundle, components] of Object.entries(BUNDLE_MAP)) {
      if (components.every(comp => codeSet.has(comp))) {
        addFlag(map, c.claim_id, {
          rule: "unbundling",
          severity: SEVERITY.unbundling,
          evidence: `Procedures [${components.join(", ")}] should be billed as bundle ${bundle} — unbundling inflates reimbursement`,
        });
        break;
      }
    }
  }
  return map;
}

// Rule 5 — Phantom billing (provider > 30 claims/day)
export function rulePhantomBilling(claims: Claim[]): FlagMap {
  const map: FlagMap = new Map();
  const byProviderDate = new Map<string, Claim[]>();
  for (const c of claims) {
    const key = `${c.provider_id}|${c.claim_date}`;
    (byProviderDate.get(key) ?? byProviderDate.set(key, []).get(key)!).push(c);
  }
  for (const group of byProviderDate.values()) {
    if (group.length <= 30) continue;
    for (const c of group) {
      addFlag(map, c.claim_id, {
        rule: "phantom_billing",
        severity: SEVERITY.phantom_billing,
        evidence: `Provider ${c.provider_id} (${c.provider_name}) submitted ${group.length} claims on ${c.claim_date}, exceeding the 30-claim daily threshold`,
      });
    }
  }
  return map;
}

// Rule 6 — Weekend anomaly
export function ruleWeekendAnomaly(claims: Claim[]): FlagMap {
  const map: FlagMap = new Map();
  // Compute weekend ratio per provider
  const providerTotal = new Map<string, number>();
  const providerWeekend = new Map<string, number>();
  for (const c of claims) {
    providerTotal.set(c.provider_id, (providerTotal.get(c.provider_id) ?? 0) + 1);
    if (c.is_weekend) providerWeekend.set(c.provider_id, (providerWeekend.get(c.provider_id) ?? 0) + 1);
  }

  for (const c of claims) {
    if (!c.is_weekend) continue;
    const hasSurgical = c.procedure_codes.some(p => SURGICAL_CODES.has(p));
    if (!hasSurgical) continue;
    const total = providerTotal.get(c.provider_id) ?? 0;
    const weekend = providerWeekend.get(c.provider_id) ?? 0;
    const ratio = total > 0 ? weekend / total : 0;
    if (ratio < 0.05) {
      const day = new Date(c.claim_date).toLocaleDateString("en-US", { weekday: "long" });
      addFlag(map, c.claim_id, {
        rule: "weekend_anomaly",
        severity: SEVERITY.weekend_anomaly,
        evidence: `Provider ${c.provider_id} has ${(ratio * 100).toFixed(1)}% historical weekend volume; surgical procedure on ${c.claim_date} (${day})`,
      });
    }
  }
  return map;
}

// Rule 7 — Diagnosis-procedure mismatch
export function ruleDxProcedureMismatch(claims: Claim[]): FlagMap {
  const map: FlagMap = new Map();
  for (const c of claims) {
    const validProcs = DX_PROC_MAP[c.diagnosis_code];
    if (!validProcs) continue;
    const hasValid = c.procedure_codes.some(p => validProcs.includes(p));
    if (!hasValid) {
      addFlag(map, c.claim_id, {
        rule: "dx_procedure_mismatch",
        severity: SEVERITY.dx_procedure_mismatch,
        evidence: `Procedures [${c.procedure_codes.join(", ")}] are not clinically associated with diagnosis ${c.diagnosis_code} (expected one of: ${validProcs.join(", ")})`,
      });
    }
  }
  return map;
}

// Rule 8 — Amount clustering (47,500–49,999)
const THRESHOLD = 50_000;
const LOWER = THRESHOLD * 0.95;

export function ruleAmountClustering(claims: Claim[]): FlagMap {
  const map: FlagMap = new Map();
  for (const c of claims) {
    if (c.submitted_amount >= LOWER && c.submitted_amount < THRESHOLD) {
      const pct = ((c.submitted_amount / THRESHOLD) * 100).toFixed(1);
      addFlag(map, c.claim_id, {
        rule: "amount_clustering",
        severity: SEVERITY.amount_clustering,
        evidence: `Amount ฿${c.submitted_amount.toLocaleString()} is ${pct}% of the ฿${THRESHOLD.toLocaleString()} auto-approval threshold (within 5% band)`,
      });
    }
  }
  return map;
}

export const ALL_RULES = [
  ruleDuplicateClaim,
  ruleRapidResubmission,
  ruleUpcoding,
  ruleUnbundling,
  rulePhantomBilling,
  ruleWeekendAnomaly,
  ruleDxProcedureMismatch,
  ruleAmountClustering,
];
