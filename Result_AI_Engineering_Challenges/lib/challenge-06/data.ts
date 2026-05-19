import type { Expense } from "./types";

// ── Policy (Corporate Gold, extends ch05 structure) ──────────────

export interface SubBenefit {
  name: string;
  limit_per_day?: number;
  limit_per_visit?: number;
  limit_per_event?: number;
  limit_per_year?: number;
  limit_per_pregnancy?: number;
  max_days?: number;
  visits_per_year?: number;
}

export interface Benefit {
  type: string;
  // maps to BenefitTypeKey (e.g. "Outpatient (OPD)" → "OUTPATIENT")
  type_key: string;
  annual_limit?: number;
  lifetime_limit?: number;
  waiting_period_days?: number;
  sub_benefits: SubBenefit[];
}

export interface Policy {
  policy_number: string;
  plan: { name: string; tier: string; effective_date: string; expiry_date: string; currency: string; };
  policyholder: { name: string; type: string; industry: string; employee_count?: number; };
  benefits: Benefit[];
  exclusions: string[];
  deductible: number;
  copay: Record<string, { percentage: number; max_per_visit?: number }>;
  network: { type: string; hospital_count: number; countries: string[]; };
}

export const policy: Policy = {
  policy_number: "POL-2024-TH-00789",
  plan: {
    name: "Corporate Health Plus",
    tier: "Gold",
    effective_date: "2024-01-01",
    expiry_date: "2024-12-31",
    currency: "THB",
  },
  policyholder: {
    name: "Acme Corporation Ltd.",
    type: "Corporate",
    industry: "Technology",
    employee_count: 250,
  },
  benefits: [
    {
      type: "Inpatient (IPD)",
      type_key: "INPATIENT",
      annual_limit: 2000000,
      sub_benefits: [
        { name: "Room & Board", limit_per_day: 8000,   max_days: 120 },
        { name: "ICU",          limit_per_day: 16000,  max_days: 30  },
        { name: "Surgery",      limit_per_event: 500000               },
        { name: "Ambulance",    limit_per_event: 5000                 },
      ],
    },
    {
      type: "Outpatient (OPD)",
      type_key: "OUTPATIENT",
      annual_limit: 100000,
      sub_benefits: [
        { name: "Doctor Visit",        limit_per_visit: 3000, visits_per_year: 30 },
        { name: "Prescribed Medicine", limit_per_visit: 3000                      },
        { name: "Diagnostic Tests",    limit_per_year: 20000                      },
      ],
    },
    {
      type: "Dental",
      type_key: "DENTAL",
      annual_limit: 30000,
      waiting_period_days: 90,
      sub_benefits: [
        { name: "Basic Dental", limit_per_year: 20000 },
        { name: "Major Dental", limit_per_year: 10000 },
      ],
    },
    {
      type: "Maternity",
      type_key: "MATERNITY",
      lifetime_limit: 200000,
      waiting_period_days: 270,
      sub_benefits: [
        { name: "Normal Delivery", limit_per_event: 100000    },
        { name: "C-Section",       limit_per_event: 200000    },
        { name: "Prenatal Care",   limit_per_pregnancy: 30000 },
      ],
    },
  ],
  exclusions: [
    "pre-existing conditions within first 12 months",
    "cosmetic surgery",
    "elective procedures",
    "self-inflicted injuries",
    "extreme sports",
    "without pre-authorization",
  ],
  deductible: 0,
  copay: {
    OUTPATIENT: { percentage: 20, max_per_visit: 500 },
    INPATIENT:  { percentage: 0  },
    DENTAL:     { percentage: 30 },
    MATERNITY:  { percentage: 0  },
  },
  network: {
    type: "Preferred Provider",
    hospital_count: 450,
    countries: ["Thailand", "Singapore", "Malaysia"],
  },
};

// ── 20 sample expenses ────────────────────────────────────────────
// Sorted chronologically. Designed to exercise all decision paths.
// Policy effective 2024-01-01.
// Dental waiting: 90 days → covered after 2024-04-01.
// Maternity waiting: 270 days → covered after 2024-09-27.

export const expenses: Expense[] = [
  // 1. Normal OPD Doctor Visit — 20% copay applied → PARTIALLY_COVERED
  {
    expense_id: "EXP-001",
    date: "2024-01-20",
    benefit_type: "OUTPATIENT",
    sub_benefit: "Doctor Visit",
    amount: 2500,
    diagnosis: "Acute bronchitis",
    provider: "Bangkok Hospital",
  },
  // 2. OPD Doctor Visit below sub-limit — 20% copay → PARTIALLY_COVERED
  {
    expense_id: "EXP-002",
    date: "2024-01-25",
    benefit_type: "OUTPATIENT",
    sub_benefit: "Doctor Visit",
    amount: 1500,
    diagnosis: "Common cold",
    provider: "Bumrungrad International",
  },
  // 3. OPD Prescribed Medicine — 20% copay → PARTIALLY_COVERED
  {
    expense_id: "EXP-003",
    date: "2024-01-25",
    benefit_type: "OUTPATIENT",
    sub_benefit: "Prescribed Medicine",
    amount: 800,
    diagnosis: "Antibiotic prescription",
    provider: "Bumrungrad International",
  },
  // 4. OPD Diagnostic Tests — 20% copay, sub-yearly limit applies → PARTIALLY_COVERED
  {
    expense_id: "EXP-004",
    date: "2024-02-05",
    benefit_type: "OUTPATIENT",
    sub_benefit: "Diagnostic Tests",
    amount: 5000,
    diagnosis: "Blood panel and CBC",
    provider: "Samitivej Hospital",
  },
  // 5. IPD Room & Board 2 days — 0% copay, full coverage → COVERED
  {
    expense_id: "EXP-005",
    date: "2024-02-10",
    benefit_type: "INPATIENT",
    sub_benefit: "Room & Board",
    amount: 16000,
    diagnosis: "Appendectomy recovery",
    provider: "Bangkok Hospital",
  },
  // 6. IPD Surgery — 0% copay, fully within limit → COVERED
  {
    expense_id: "EXP-006",
    date: "2024-02-10",
    benefit_type: "INPATIENT",
    sub_benefit: "Surgery",
    amount: 320000,
    diagnosis: "Appendectomy",
    provider: "Bangkok Hospital",
  },
  // 7. IPD Ambulance — 0% copay, within event limit → COVERED
  {
    expense_id: "EXP-007",
    date: "2024-02-10",
    benefit_type: "INPATIENT",
    sub_benefit: "Ambulance",
    amount: 3500,
    diagnosis: "Emergency transport",
    provider: "Bangkok Hospital",
  },
  // 8. Dental Basic — Feb 15, only 45 days into policy (waiting 90 days) → DENIED
  {
    expense_id: "EXP-008",
    date: "2024-02-15",
    benefit_type: "DENTAL",
    sub_benefit: "Basic Dental",
    amount: 4500,
    diagnosis: "Routine cleaning and scaling",
    provider: "Dental Care Center",
  },
  // 9. Maternity Prenatal — Jun 1, only 152 days (waiting 270 days) → DENIED
  {
    expense_id: "EXP-009",
    date: "2024-06-01",
    benefit_type: "MATERNITY",
    sub_benefit: "Prenatal Care",
    amount: 8000,
    diagnosis: "First trimester prenatal checkup",
    provider: "Bumrungrad International",
  },
  // 10. OPD with excluded diagnosis (cosmetic surgery) → DENIED
  {
    expense_id: "EXP-010",
    date: "2024-03-05",
    benefit_type: "OUTPATIENT",
    sub_benefit: "Doctor Visit",
    amount: 2000,
    diagnosis: "Cosmetic surgery consultation",
    provider: "Aesthetic Clinic Bangkok",
  },
  // 11. OPD Doctor Visit — amount ฿4,500 exceeds ฿3,000 sub-limit → PARTIALLY_COVERED (capped)
  {
    expense_id: "EXP-011",
    date: "2024-03-12",
    benefit_type: "OUTPATIENT",
    sub_benefit: "Doctor Visit",
    amount: 4500,
    diagnosis: "Chronic back pain consultation",
    provider: "Samitivej Hospital",
  },
  // 12. OPD Diagnostic Tests ฿8,000 — further reduces sub-yearly limit → PARTIALLY_COVERED
  {
    expense_id: "EXP-012",
    date: "2024-04-02",
    benefit_type: "OUTPATIENT",
    sub_benefit: "Diagnostic Tests",
    amount: 8000,
    diagnosis: "MRI scan lumbar spine",
    provider: "Samitivej Hospital",
  },
  // 13. OPD Diagnostic Tests ฿10,000 — exhausts remaining ฿7,000 of sub-limit → PARTIALLY_COVERED
  {
    expense_id: "EXP-013",
    date: "2024-04-15",
    benefit_type: "OUTPATIENT",
    sub_benefit: "Diagnostic Tests",
    amount: 10000,
    diagnosis: "Full body health screening",
    provider: "Bangkok Hospital",
  },
  // 14. OPD Diagnostic Tests — sub-yearly limit already exhausted → DENIED
  {
    expense_id: "EXP-014",
    date: "2024-05-01",
    benefit_type: "OUTPATIENT",
    sub_benefit: "Diagnostic Tests",
    amount: 3000,
    diagnosis: "Follow-up blood test",
    provider: "Samitivej Hospital",
  },
  // 15-19. Five OPD Doctor Visits consuming most of the annual OPD limit → PARTIALLY_COVERED
  {
    expense_id: "EXP-015",
    date: "2024-05-10",
    benefit_type: "OUTPATIENT",
    sub_benefit: "Doctor Visit",
    amount: 3000,
    diagnosis: "Seasonal allergy",
    provider: "Bangkok Hospital",
  },
  {
    expense_id: "EXP-016",
    date: "2024-06-05",
    benefit_type: "OUTPATIENT",
    sub_benefit: "Doctor Visit",
    amount: 3000,
    diagnosis: "Hypertension follow-up",
    provider: "Bumrungrad International",
  },
  {
    expense_id: "EXP-017",
    date: "2024-07-08",
    benefit_type: "OUTPATIENT",
    sub_benefit: "Doctor Visit",
    amount: 3000,
    diagnosis: "Diabetes management",
    provider: "Samitivej Hospital",
  },
  {
    expense_id: "EXP-018",
    date: "2024-08-14",
    benefit_type: "OUTPATIENT",
    sub_benefit: "Doctor Visit",
    amount: 3000,
    diagnosis: "Respiratory infection",
    provider: "Bangkok Hospital",
  },
  {
    expense_id: "EXP-019",
    date: "2024-09-20",
    benefit_type: "OUTPATIENT",
    sub_benefit: "Prescribed Medicine",
    amount: 3000,
    diagnosis: "Long-term medication refill",
    provider: "Bumrungrad International",
  },
  // 20. OPD visit — annual OPD limit fully exhausted by this point → DENIED
  {
    expense_id: "EXP-020",
    date: "2024-10-10",
    benefit_type: "OUTPATIENT",
    sub_benefit: "Doctor Visit",
    amount: 2000,
    diagnosis: "General checkup",
    provider: "Bangkok Hospital",
  },
];
