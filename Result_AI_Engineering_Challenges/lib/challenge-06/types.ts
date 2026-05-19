export type BenefitTypeKey = "OUTPATIENT" | "INPATIENT" | "DENTAL" | "MATERNITY";
export type Decision = "COVERED" | "PARTIALLY_COVERED" | "DENIED";

export interface Expense {
  expense_id: string;
  date: string;         // ISO "YYYY-MM-DD"
  benefit_type: BenefitTypeKey;
  sub_benefit: string;  // must match SubBenefit.name exactly
  amount: number;
  diagnosis: string;
  provider: string;
}

export interface ExpenseResult {
  expense_id: string;
  submitted_amount: number;
  covered_amount: number;
  copay_amount: number;
  member_pays: number;
  decision: Decision;
  reason: string;
  remaining_annual_limit: number | null;
  remaining_visit_limit: number | null;
}

export interface BenefitSummary {
  benefit_type: string;
  original_limit: number;
  used: number;
  remaining: number;
}
