import type { AssessmentCase, PolicyData, DocumentData } from "./types";
import { DX_PROC_MAP } from "@/lib/challenge-10/rules";

// Reuse DX_PROC_MAP from ch10 for medical necessity checks
const EXTENDED_DX_MAP: Record<string, { procedures: string[]; description: string }> = {
  // From ch10
  "J18.9":   { procedures: ["Consultation", "Antibiotics", "Chest X-ray", "Blood test"], description: "Pneumonia" },
  "I21.0":   { procedures: ["ECG", "Cardiac enzyme test", "Angioplasty", "Stenting"], description: "Acute MI" },
  "K80.10":  { procedures: ["Ultrasound", "Cholecystectomy", "Laparoscopy"], description: "Cholecystitis" },
  "M54.5":   { procedures: ["Physiotherapy", "MRI", "Pain medication", "Consultation"], description: "Low back pain" },
  "E11.9":   { procedures: ["Blood glucose test", "HbA1c", "Consultation", "Medication"], description: "Diabetes" },
  "J06.9":   { procedures: ["Consultation", "Blood test", "Prescription medication"], description: "Upper respiratory infection" },
  "N39.0":   { procedures: ["Urine culture", "Antibiotics", "Consultation"], description: "UTI" },
  "S52.501": { procedures: ["X-ray", "Splinting", "Casting", "Orthopaedic consultation"], description: "Forearm fracture" },
  "C34.10":  { procedures: ["CT scan", "Biopsy", "Chemotherapy", "Radiotherapy"], description: "Lung cancer" },
  "G43.909": { procedures: ["Consultation", "Triptan medication", "MRI"], description: "Migraine" },
  // Extra for ch11 cases
  "K02.9":   { procedures: ["Tooth filling", "X-ray", "Extraction", "Root canal"], description: "Dental caries" },
  "Z41.1":   { procedures: [], description: "Cosmetic rhinoplasty — not medically necessary" },
};

export interface BenefitResult {
  policy_id: string;
  claim_type: string;
  submitted_amount: number;
  benefit_limit: number;
  annual_remaining: number;
  copay_pct: number;
  covered_amount: number;
  copay_amount: number;
  member_pays: number;
  note: string;
}

export interface NecessityResult {
  appropriate: boolean;
  reasoning: string;
  diagnosis: string;
  procedures_submitted: string[];
  procedures_expected: string[];
}

export function lookupPolicy(policyId: string, caseData: AssessmentCase): PolicyData | { error: string } {
  if (caseData.policy.policy_id !== policyId) {
    return { error: `Policy ${policyId} not found for this claim context` };
  }
  return caseData.policy;
}

export function calculateBenefit(
  policyId: string,
  claimType: string,
  amount: number,
  caseData: AssessmentCase
): BenefitResult | { error: string } {
  if (caseData.policy.policy_id !== policyId) {
    return { error: `Policy ${policyId} not found` };
  }
  const policy = caseData.policy;
  const benefit = policy.benefits[claimType];
  if (!benefit) {
    return { error: `Claim type ${claimType} not covered under policy ${policyId}` };
  }

  const annualRemaining = policy.annual_limit - policy.used_amount;
  const effectiveLimit = Math.min(benefit.limit, annualRemaining);
  const eligible = Math.min(amount, effectiveLimit);
  const copay = Math.round(eligible * (benefit.copay_pct / 100));
  const covered = eligible - copay;
  const memberPays = amount - covered;

  return {
    policy_id: policyId,
    claim_type: claimType,
    submitted_amount: amount,
    benefit_limit: benefit.limit,
    annual_remaining: annualRemaining,
    copay_pct: benefit.copay_pct,
    covered_amount: covered,
    copay_amount: copay,
    member_pays: memberPays,
    note: amount > effectiveLimit
      ? `Amount exceeds effective limit of ฿${effectiveLimit.toLocaleString()} (benefit limit ฿${benefit.limit.toLocaleString()}, annual remaining ฿${annualRemaining.toLocaleString()})`
      : "Amount within benefit limits",
  };
}

export function verifyDocument(
  documentId: string,
  caseData: AssessmentCase
): DocumentData | { error: string } {
  const doc = caseData.documents.find(d => d.document_id === documentId);
  if (!doc) {
    return {
      document_id: documentId,
      document_type: "Unknown",
      complete: false,
      issues: ["Document not found in submission — may not have been submitted"],
    } as DocumentData;
  }
  return doc;
}

export function checkMedicalNecessity(
  diagnosis: string,
  procedures: string[]
): NecessityResult {
  const entry = EXTENDED_DX_MAP[diagnosis];

  if (!entry) {
    return {
      appropriate: true,
      reasoning: `Diagnosis ${diagnosis} has no specific procedure restrictions on file. Treatment accepted as potentially appropriate pending clinical review.`,
      diagnosis,
      procedures_submitted: procedures,
      procedures_expected: [],
    };
  }

  // Cosmetic procedures always inappropriate
  if (entry.procedures.length === 0) {
    return {
      appropriate: false,
      reasoning: `Diagnosis ${diagnosis} (${entry.description}) is a cosmetic/elective condition. The procedures submitted are not medically necessary for insurance coverage purposes.`,
      diagnosis,
      procedures_submitted: procedures,
      procedures_expected: [],
    };
  }

  // Check if submitted procedures have any overlap with known appropriate procedures
  const procLower = procedures.map(p => p.toLowerCase());
  const expectedLower = entry.procedures.map(p => p.toLowerCase());
  const hasMatch = procLower.some(p => expectedLower.some(e => e.includes(p) || p.includes(e)));

  return {
    appropriate: hasMatch,
    reasoning: hasMatch
      ? `Procedures [${procedures.join(", ")}] are clinically appropriate for ${entry.description} (${diagnosis}). Standard treatment protocol confirmed.`
      : `Procedures [${procedures.join(", ")}] are not typically associated with ${entry.description} (${diagnosis}). Expected procedures include: ${entry.procedures.join(", ")}.`,
    diagnosis,
    procedures_submitted: procedures,
    procedures_expected: entry.procedures,
  };
}

export function executeTool(
  name: string,
  args: Record<string, unknown>,
  caseData: AssessmentCase
): unknown {
  switch (name) {
    case "lookupPolicy":
      return lookupPolicy(args.policyId as string, caseData);
    case "calculateBenefit":
      return calculateBenefit(
        args.policyId as string,
        args.claimType as string,
        args.amount as number,
        caseData
      );
    case "verifyDocument":
      return verifyDocument(args.documentId as string, caseData);
    case "checkMedicalNecessity":
      return checkMedicalNecessity(
        args.diagnosis as string,
        args.procedures as string[]
      );
    default:
      return { error: `Unknown tool: ${name}` };
  }
}

// Suppress unused import warning — DX_PROC_MAP is used by EXTENDED_DX_MAP construction reference
void (DX_PROC_MAP as unknown);
