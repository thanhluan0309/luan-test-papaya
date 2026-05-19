import type { AssessmentCase } from "./types";

const case01: AssessmentCase = {
  case_id: "case-01",
  label: "Outpatient Approval",
  description: "Standard outpatient consultation with complete documentation and amount within policy limits.",
  expected: "APPROVE",
  policy: {
    policy_id: "POL-001",
    member_name: "Somchai Jaidee",
    insurer: "AIA Thailand",
    active: true,
    start_date: "2024-01-01",
    end_date: "2024-12-31",
    claim_types: ["OUTPATIENT", "INPATIENT", "DENTAL"],
    benefits: {
      OUTPATIENT: { limit: 50000, copay_pct: 20, waiting_days: 0 },
      INPATIENT:  { limit: 500000, copay_pct: 10, waiting_days: 0 },
      DENTAL:     { limit: 15000, copay_pct: 30, waiting_days: 90 },
    },
    exclusions: ["cosmetic surgery", "elective procedures", "pre-existing conditions within 12 months"],
    annual_limit: 600000,
    used_amount: 12000,
  },
  claim: {
    claim_id: "CLM-11001",
    policy_id: "POL-001",
    claim_type: "OUTPATIENT",
    diagnosis_code: "J06.9",
    diagnosis_name: "Acute upper respiratory infection",
    procedures: ["Consultation", "Blood test", "Prescription medication"],
    submitted_amount: 3500,
    service_date: "2024-03-15",
    submitted_date: "2024-03-17",
    documents: ["DOC-001", "DOC-002", "DOC-003"],
  },
  documents: [
    { document_id: "DOC-001", document_type: "Doctor's certificate", complete: true, issues: [] },
    { document_id: "DOC-002", document_type: "Original receipt", complete: true, issues: [] },
    { document_id: "DOC-003", document_type: "Prescription", complete: true, issues: [] },
  ],
};

const case02: AssessmentCase = {
  case_id: "case-02",
  label: "Inpatient Rejection",
  description: "Inpatient admission for cosmetic procedure explicitly excluded from policy coverage.",
  expected: "REJECT",
  policy: {
    policy_id: "POL-002",
    member_name: "Nattaya Srisuk",
    insurer: "Muang Thai Life",
    active: true,
    start_date: "2024-01-01",
    end_date: "2024-12-31",
    claim_types: ["OUTPATIENT", "INPATIENT"],
    benefits: {
      OUTPATIENT: { limit: 30000, copay_pct: 20, waiting_days: 0 },
      INPATIENT:  { limit: 300000, copay_pct: 10, waiting_days: 30 },
    },
    exclusions: [
      "cosmetic surgery",
      "rhinoplasty",
      "breast augmentation",
      "liposuction",
      "elective aesthetic procedures",
    ],
    annual_limit: 350000,
    used_amount: 5000,
  },
  claim: {
    claim_id: "CLM-11002",
    policy_id: "POL-002",
    claim_type: "INPATIENT",
    diagnosis_code: "Z41.1",
    diagnosis_name: "Rhinoplasty (cosmetic nose reshaping)",
    procedures: ["Rhinoplasty", "General anaesthesia", "2-night hospital stay"],
    submitted_amount: 120000,
    service_date: "2024-04-10",
    submitted_date: "2024-04-14",
    documents: ["DOC-004", "DOC-005", "DOC-006"],
  },
  documents: [
    { document_id: "DOC-004", document_type: "Surgical report", complete: true, issues: [] },
    { document_id: "DOC-005", document_type: "Hospital bill", complete: true, issues: [] },
    { document_id: "DOC-006", document_type: "Discharge summary", complete: true, issues: [] },
  ],
};

const case03: AssessmentCase = {
  case_id: "case-03",
  label: "Dental – Missing Document",
  description: "Dental treatment claim with an incomplete submission — treatment receipt is missing.",
  expected: "REQUEST_MORE_INFO",
  policy: {
    policy_id: "POL-003",
    member_name: "Wichai Boonmee",
    insurer: "Krungthai-AXA",
    active: true,
    start_date: "2024-01-01",
    end_date: "2024-12-31",
    claim_types: ["OUTPATIENT", "INPATIENT", "DENTAL"],
    benefits: {
      OUTPATIENT: { limit: 40000, copay_pct: 20, waiting_days: 0 },
      INPATIENT:  { limit: 400000, copay_pct: 10, waiting_days: 0 },
      DENTAL:     { limit: 20000, copay_pct: 20, waiting_days: 90 },
    },
    exclusions: ["cosmetic dentistry", "teeth whitening", "orthodontics for cosmetic purposes"],
    annual_limit: 500000,
    used_amount: 3000,
  },
  claim: {
    claim_id: "CLM-11003",
    policy_id: "POL-003",
    claim_type: "DENTAL",
    diagnosis_code: "K02.9",
    diagnosis_name: "Dental caries, unspecified",
    procedures: ["Tooth filling", "X-ray"],
    submitted_amount: 8000,
    service_date: "2024-05-20",
    submitted_date: "2024-05-22",
    documents: ["DOC-007", "DOC-008"],
  },
  documents: [
    { document_id: "DOC-007", document_type: "Dentist certificate", complete: true, issues: [] },
    {
      document_id: "DOC-008",
      document_type: "Treatment receipt",
      complete: false,
      issues: ["Receipt is a photocopy — original required", "Itemized breakdown of procedures missing"],
    },
  ],
};

export const CASES: AssessmentCase[] = [case01, case02, case03];
export const CASE_MAP = new Map(CASES.map(c => [c.case_id, c]));
