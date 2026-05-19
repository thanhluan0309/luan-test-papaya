export type CountryCode = string;
export type RuleType = "document_requirement" | "sla_check" | "waiting_period" | "data_masking" | "coverage_mandate";
export type Severity = "hard" | "soft";
export type ClaimType = "OUTPATIENT" | "INPATIENT" | "DENTAL" | "MATERNITY" | "SPECIALIST";

export interface RegulatoryRule {
  rule_id: string;
  description: string;
  rule_type: RuleType;
  severity: Severity;
  parameters: Record<string, unknown>;
  effective_date: string;
  expiry_date?: string;
}

export interface CountryConfig {
  country_code: CountryCode;
  country_name: string;
  rules: RegulatoryRule[];
}

export interface ClaimInput {
  claim_id: string;
  country: CountryCode;
  claim_type: ClaimType;
  submitted_date: string;
  service_date: string;
  processed_date?: string;
  policy_start_date: string;
  is_pre_existing: boolean;
  is_emergency: boolean;
  is_specialist?: boolean;
  documents: string[];
  member_name: string;
  national_id?: string;
}

export interface RuleResult {
  rule_id: string;
  description: string;
  rule_type: RuleType;
  severity: Severity;
  status: "PASS" | "FAIL" | "SKIP";
  explanation: string;
  remediation?: string;
}

export interface ComplianceReport {
  claim_id: string;
  country: CountryCode;
  submitted_date: string;
  overall_status: "COMPLIANT" | "NON_COMPLIANT" | "PARTIALLY_COMPLIANT";
  rules_applied: number;
  rules_passed: number;
  rules_failed: number;
  results: RuleResult[];
  masked_data: Record<string, string>;
}

export interface RuleDiff {
  rule_type: RuleType;
  aspect: string;
  country_a: { code: CountryCode; value: unknown };
  country_b: { code: CountryCode; value: unknown };
  description: string;
}
