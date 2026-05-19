export interface PolicyBenefit {
  limit: number;
  copay_pct: number;
  waiting_days: number;
}

export interface PolicyData {
  policy_id: string;
  member_name: string;
  insurer: string;
  active: boolean;
  start_date: string;
  end_date: string;
  claim_types: string[];
  benefits: Record<string, PolicyBenefit>;
  exclusions: string[];
  annual_limit: number;
  used_amount: number;
}

export interface ClaimData {
  claim_id: string;
  policy_id: string;
  claim_type: string;
  diagnosis_code: string;
  diagnosis_name: string;
  procedures: string[];
  submitted_amount: number;
  service_date: string;
  submitted_date: string;
  documents: string[];
}

export interface DocumentData {
  document_id: string;
  document_type: string;
  complete: boolean;
  issues: string[];
}

export interface ToolCallLog {
  tool: string;
  input: Record<string, unknown>;
  output: unknown;
  timestamp: string;
}

export interface AssessmentReport {
  document_review: {
    doc_id: string;
    type: string;
    status: "complete" | "incomplete" | "missing";
    issues: string[];
  }[];
  policy_verification: {
    active: boolean;
    member_covered: boolean;
    claim_type_covered: boolean;
    within_limit: boolean;
    notes: string;
  };
  medical_necessity: {
    appropriate: boolean;
    reasoning: string;
  };
  benefit_calculation: {
    submitted: number;
    covered: number;
    copay: number;
    member_pays: number;
  };
  recommendation: "APPROVE" | "REJECT" | "REQUEST_MORE_INFO";
  reasoning: string;
  policy_citations: string[];
}

export interface AgentResult {
  case_id: string;
  tool_logs: ToolCallLog[];
  report: AssessmentReport;
  raw_response: string;
}

export interface AssessmentCase {
  case_id: string;
  label: string;
  description: string;
  expected: AssessmentReport["recommendation"];
  claim: ClaimData;
  policy: PolicyData;
  documents: DocumentData[];
}
