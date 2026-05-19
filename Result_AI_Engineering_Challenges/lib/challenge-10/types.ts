export interface Claim {
  claim_id: string;
  member_id: string;
  provider_id: string;
  provider_name: string;
  claim_date: string;
  claim_type: "OUTPATIENT" | "INPATIENT" | "DENTAL";
  diagnosis_code: string;
  procedure_codes: string[];
  submitted_amount: number;
  is_weekend: boolean;
  is_fraud: boolean;
  fraud_type: string | null;
}

export interface FraudFlag {
  rule: string;
  severity: number;
  evidence: string;
}

export interface ScoringResult {
  claim_id: string;
  risk_score: number;
  flags: FraudFlag[];
}

export interface MetricsReport {
  total_claims: number;
  flagged_claims: number;
  known_fraud: number;
  true_positives: number;
  false_positives: number;
  false_negatives: number;
  precision: number;
  recall: number;
  false_positive_rate: number;
}
