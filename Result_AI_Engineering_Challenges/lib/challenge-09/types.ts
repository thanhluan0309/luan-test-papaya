export type ClaimType   = "OUTPATIENT" | "INPATIENT" | "DENTAL" | "MATERNITY";
export type ClaimStatus = "APPROVED" | "REJECTED" | "PENDING" | "IN_REVIEW";

export interface Claim {
  claim_id: string;
  policy_id: string;
  member_name: string;
  claim_type: ClaimType;
  diagnosis_icd10: string;
  submitted_amount: number;
  approved_amount: number;
  status: ClaimStatus;
  submitted_date: string;       // "YYYY-MM-DD"
  processed_date: string | null;
  assessor: string;
  insurer: string;
  country: string;
}

export interface Filters {
  claimType: ClaimType | "ALL";
  status: ClaimStatus | "ALL";
  insurer: string;
  country: string;
  dateFrom: string;
  dateTo: string;
}
