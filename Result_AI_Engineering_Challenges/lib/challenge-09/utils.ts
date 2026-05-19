import type { Claim, Filters } from "./types";

export const ICD10_LABELS: Record<string, string> = {
  "J06.9":   "Acute URTI",
  "J18.9":   "Pneumonia",
  "K21.9":   "GERD",
  "I10":     "Hypertension",
  "E11.9":   "Type 2 Diabetes",
  "M54.5":   "Low Back Pain",
  "J45.909": "Asthma",
  "I25.10":  "Coronary Artery Disease",
  "K80.20":  "Cholelithiasis",
  "N39.0":   "UTI",
  "Z00.00":  "General Check-up",
  "F32.9":   "Major Depression",
  "M17.11":  "Osteoarthritis, Knee",
  "G43.909": "Migraine",
  "E78.5":   "Hyperlipidaemia",
  "K29.70":  "Gastritis",
  "L20.9":   "Atopic Dermatitis",
  "H66.90":  "Otitis Media",
  "J03.9":   "Acute Tonsillitis",
  "O80":     "Normal Delivery",
};

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export function applyFilters(claims: Claim[], f: Filters): Claim[] {
  return claims.filter((c) => {
    if (f.claimType !== "ALL" && c.claim_type !== f.claimType) return false;
    if (f.status    !== "ALL" && c.status      !== f.status)    return false;
    if (f.insurer   !== "ALL" && c.insurer      !== f.insurer)   return false;
    if (f.country   !== "ALL" && c.country      !== f.country)   return false;
    if (f.dateFrom  && c.submitted_date < f.dateFrom)            return false;
    if (f.dateTo    && c.submitted_date > f.dateTo)              return false;
    return true;
  });
}

// ── KPIs ──────────────────────────────────────────────────────────
export function kpiApprovalRate(claims: Claim[]) {
  if (!claims.length) return 0;
  return Math.round((claims.filter((c) => c.status === "APPROVED").length / claims.length) * 100);
}

export function kpiAvgProcessingDays(claims: Claim[]) {
  const processed = claims.filter((c) => c.processed_date);
  if (!processed.length) return 0;
  const total = processed.reduce((s, c) => {
    return s + (new Date(c.processed_date!).getTime() - new Date(c.submitted_date).getTime()) / 86400000;
  }, 0);
  return Math.round(total / processed.length);
}

export function kpiTotalApproved(claims: Claim[]) {
  return claims.reduce((s, c) => s + c.approved_amount, 0);
}

export function kpiAvgClaimAmount(claims: Claim[]) {
  if (!claims.length) return 0;
  return Math.round(claims.reduce((s, c) => s + c.submitted_amount, 0) / claims.length);
}

// ── Chart data ────────────────────────────────────────────────────
export function byStatus(claims: Claim[]): { status: string; count: number }[] {
  const map: Record<string, number> = { APPROVED: 0, REJECTED: 0, PENDING: 0, IN_REVIEW: 0 };
  for (const c of claims) map[c.status]++;
  return Object.entries(map).filter(([, v]) => v > 0).map(([status, count]) => ({ status, count }));
}

export function byMonth(claims: Claim[]): { period: string; count: number }[] {
  const map: Record<string, number> = {};
  for (const m of MONTHS) map[m] = 0;
  for (const c of claims) {
    const m = MONTHS[parseInt(c.submitted_date.slice(5, 7)) - 1];
    if (m) map[m]++;
  }
  return MONTHS.map((m) => ({ period: m, count: map[m] }));
}

export function byWeek(claims: Claim[]): { period: string; count: number }[] {
  const map: Record<string, number> = {};
  for (const c of claims) {
    const d   = new Date(c.submitted_date);
    const jan = new Date(2024, 0, 1);
    const wk  = Math.ceil(((d.getTime() - jan.getTime()) / 86400000 + jan.getDay() + 1) / 7);
    const key = `W${String(Math.min(wk, 52)).padStart(2, "0")}`;
    map[key]  = (map[key] ?? 0) + 1;
  }
  return Object.entries(map).sort((a, b) => a[0].localeCompare(b[0])).map(([period, count]) => ({ period, count }));
}

export function top10ByFrequency(claims: Claim[]): { code: string; label: string; count: number }[] {
  const map: Record<string, number> = {};
  for (const c of claims) map[c.diagnosis_icd10] = (map[c.diagnosis_icd10] ?? 0) + 1;
  return Object.entries(map)
    .sort((a, b) => b[1] - a[1]).slice(0, 10)
    .map(([code, count]) => ({ code, label: ICD10_LABELS[code] ?? code, count }));
}

export function top10ByCost(claims: Claim[]): { code: string; label: string; total: number }[] {
  const map: Record<string, number> = {};
  for (const c of claims) map[c.diagnosis_icd10] = (map[c.diagnosis_icd10] ?? 0) + c.approved_amount;
  return Object.entries(map)
    .sort((a, b) => b[1] - a[1]).slice(0, 10)
    .map(([code, total]) => ({ code, label: ICD10_LABELS[code] ?? code, total }));
}

export function processingTimeDist(claims: Claim[]): { bin: string; count: number }[] {
  const bins = [
    { bin: "1–3d",  min: 1,  max: 3  },
    { bin: "4–7d",  min: 4,  max: 7  },
    { bin: "8–14d", min: 8,  max: 14 },
    { bin: "15–21d",min: 15, max: 21 },
    { bin: "22–30d",min: 22, max: 30 },
  ];
  const processed = claims.filter((c) => c.processed_date);
  return bins.map(({ bin, min, max }) => {
    const count = processed.filter((c) => {
      const days = Math.round(
        (new Date(c.processed_date!).getTime() - new Date(c.submitted_date).getTime()) / 86400000
      );
      return days >= min && days <= max;
    }).length;
    return { bin, count };
  });
}

export function approvalByInsurer(claims: Claim[]): {
  insurer: string; approved: number; rejected: number; pending: number;
}[] {
  const all = [...new Set(claims.map((c) => c.insurer))].sort();
  return all.map((insurer) => {
    const sub = claims.filter((c) => c.insurer === insurer);
    return {
      insurer,
      approved: sub.filter((c) => c.status === "APPROVED").length,
      rejected: sub.filter((c) => c.status === "REJECTED").length,
      pending:  sub.filter((c) => c.status === "PENDING" || c.status === "IN_REVIEW").length,
    };
  });
}
