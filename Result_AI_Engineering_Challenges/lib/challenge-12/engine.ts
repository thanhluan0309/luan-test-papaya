import type { ClaimInput, ComplianceReport, CountryCode, CountryConfig, RegulatoryRule, RuleResult } from "./types";

// Count business days (Mon–Fri) between two date strings
export function countBusinessDays(from: string, to: string): number {
  const start = new Date(from);
  const end = new Date(to);
  if (end <= start) return 0;
  let count = 0;
  const cur = new Date(start);
  cur.setDate(cur.getDate() + 1);
  while (cur <= end) {
    const dow = cur.getDay();
    if (dow !== 0 && dow !== 6) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
}

function daysBetween(a: string, b: string): number {
  return (new Date(b).getTime() - new Date(a).getTime()) / 86_400_000;
}

function monthsBetween(a: string, b: string): number {
  const da = new Date(a), db = new Date(b);
  return (db.getFullYear() - da.getFullYear()) * 12 + (db.getMonth() - da.getMonth());
}

function checkDocument(rule: RegulatoryRule, claim: ClaimInput): RuleResult {
  const p = rule.parameters as { document_type: string; required_for: string };
  const appliesToThisClaim = p.required_for === "all" || p.required_for === claim.claim_type;

  if (!appliesToThisClaim) {
    return {
      rule_id: rule.rule_id, description: rule.description,
      rule_type: rule.rule_type, severity: rule.severity,
      status: "SKIP",
      explanation: `Rule applies to ${p.required_for} claims only — this is a ${claim.claim_type} claim.`,
    };
  }

  const hasDoc = claim.documents.includes(p.document_type);
  return {
    rule_id: rule.rule_id, description: rule.description,
    rule_type: rule.rule_type, severity: rule.severity,
    status: hasDoc ? "PASS" : "FAIL",
    explanation: hasDoc
      ? `Required document "${p.document_type}" is present.`
      : `Missing required document: ${p.document_type} for ${claim.claim_type} claim in ${claim.country}.`,
    remediation: hasDoc ? undefined : `Submit a valid ${p.document_type} to complete the claim.`,
  };
}

function checkSLA(rule: RegulatoryRule, claim: ClaimInput): RuleResult {
  const p = rule.parameters as { business_days: number; applies_to: string };
  const appliesToThisClaim = p.applies_to === "all" || p.applies_to === (claim.claim_type as string);

  if (!appliesToThisClaim) {
    return {
      rule_id: rule.rule_id, description: rule.description,
      rule_type: rule.rule_type, severity: rule.severity,
      status: "SKIP",
      explanation: `SLA rule applies to ${p.applies_to} claims only.`,
    };
  }

  if (!claim.processed_date) {
    return {
      rule_id: rule.rule_id, description: rule.description,
      rule_type: rule.rule_type, severity: rule.severity,
      status: "SKIP",
      explanation: "Claim has not been processed yet — SLA check deferred.",
    };
  }

  const actual = countBusinessDays(claim.submitted_date, claim.processed_date);
  const pass = actual <= p.business_days;
  return {
    rule_id: rule.rule_id, description: rule.description,
    rule_type: rule.rule_type, severity: rule.severity,
    status: pass ? "PASS" : "FAIL",
    explanation: pass
      ? `Processed in ${actual} business days — within the ${p.business_days}-day SLA.`
      : `Processed in ${actual} business days — exceeds the ${p.business_days}-day SLA by ${actual - p.business_days} days.`,
    remediation: pass ? undefined : `Escalate claim processing. SLA breach of ${actual - p.business_days} business day(s).`,
  };
}

function checkWaitingPeriod(rule: RegulatoryRule, claim: ClaimInput): RuleResult {
  const p = rule.parameters as { days: number; condition_type: "general" | "pre_existing" };

  if (p.condition_type === "pre_existing" && !claim.is_pre_existing) {
    return {
      rule_id: rule.rule_id, description: rule.description,
      rule_type: rule.rule_type, severity: rule.severity,
      status: "SKIP",
      explanation: "Pre-existing condition waiting period not applicable — claim is not pre-existing.",
    };
  }

  const elapsed = daysBetween(claim.policy_start_date, claim.service_date);
  const pass = elapsed >= p.days;
  return {
    rule_id: rule.rule_id, description: rule.description,
    rule_type: rule.rule_type, severity: rule.severity,
    status: pass ? "PASS" : "FAIL",
    explanation: pass
      ? `Waiting period satisfied — ${Math.floor(elapsed)} days elapsed since policy start (required: ${p.days} days).`
      : `Waiting period not met — only ${Math.floor(elapsed)} days elapsed since policy start (required: ${p.days} days).`,
    remediation: pass ? undefined : `Claim service date is within the ${p.days}-day ${p.condition_type} waiting period. Resubmit after ${claim.policy_start_date} + ${p.days} days.`,
  };
}

function maskNationalId(id: string, country: CountryCode): string {
  if (!id) return "N/A";
  if (country === "TH") return `****-****-${id.slice(-4)}`;
  if (country === "HK") return `${id[0]}*****(${id[id.length - 2] ?? "*"})`;
  if (country === "SG") return `${id[0]}****${id.slice(-4)}`;
  return `****${id.slice(-4)}`;
}

function maskName(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return `${parts[0][0]}.`;
  return `${parts[0][0]}. ${parts[parts.length - 1][0]}.`;
}

function checkDataMasking(rule: RegulatoryRule, claim: ClaimInput): RuleResult {
  const p = rule.parameters as { field: string; description: string };
  const fieldValue = p.field === "national_id" ? claim.national_id : claim.member_name;

  if (!fieldValue) {
    return {
      rule_id: rule.rule_id, description: rule.description,
      rule_type: rule.rule_type, severity: rule.severity,
      status: "SKIP",
      explanation: `Field "${p.field}" not present on this claim — masking not applicable.`,
    };
  }

  return {
    rule_id: rule.rule_id, description: rule.description,
    rule_type: rule.rule_type, severity: rule.severity,
    status: "PASS",
    explanation: `Field "${p.field}" will be masked in external reports: ${p.description}.`,
  };
}

function checkCoverageMandate(rule: RegulatoryRule, claim: ClaimInput): RuleResult {
  const p = rule.parameters as { applies_to: string; condition: string };

  // Emergency mandate (TH)
  if (p.applies_to === "emergency") {
    if (!claim.is_emergency) {
      return {
        rule_id: rule.rule_id, description: rule.description,
        rule_type: rule.rule_type, severity: rule.severity,
        status: "SKIP",
        explanation: "Emergency coverage mandate not applicable — claim is not an emergency.",
      };
    }
    return {
      rule_id: rule.rule_id, description: rule.description,
      rule_type: rule.rule_type, severity: rule.severity,
      status: "PASS",
      explanation: "Emergency treatment mandate satisfied — claim must be covered regardless of network.",
    };
  }

  // Maternity mandate (VN)
  if (p.applies_to === "MATERNITY") {
    if (claim.claim_type !== "MATERNITY") {
      return {
        rule_id: rule.rule_id, description: rule.description,
        rule_type: rule.rule_type, severity: rule.severity,
        status: "SKIP",
        explanation: "Maternity mandate not applicable to this claim type.",
      };
    }
    const months = monthsBetween(claim.policy_start_date, claim.submitted_date);
    const pass = months > 12;
    return {
      rule_id: rule.rule_id, description: rule.description,
      rule_type: rule.rule_type, severity: rule.severity,
      status: pass ? "PASS" : "FAIL",
      explanation: pass
        ? `Maternity coverage mandate met — policy has been active for ${months} months (>12 required).`
        : `Maternity coverage mandate not met — policy has only been active for ${months} months (>12 required).`,
      remediation: pass ? undefined : "Maternity claims require policy to be active for more than 12 months.",
    };
  }

  // Mental health mandate (HK)
  if (p.applies_to === "mental_health") {
    return {
      rule_id: rule.rule_id, description: rule.description,
      rule_type: rule.rule_type, severity: rule.severity,
      status: "PASS",
      explanation: "Mental health coverage mandate acknowledged — must be covered at same level as physical health.",
    };
  }

  return {
    rule_id: rule.rule_id, description: rule.description,
    rule_type: rule.rule_type, severity: rule.severity,
    status: "PASS",
    explanation: "Coverage mandate evaluated.",
  };
}

function buildMaskedData(claim: ClaimInput, activeRules: RegulatoryRule[]): Record<string, string> {
  const masked: Record<string, string> = {};
  for (const rule of activeRules) {
    if (rule.rule_type !== "data_masking") continue;
    const p = rule.parameters as { field: string };
    if (p.field === "national_id" && claim.national_id) {
      masked.national_id = maskNationalId(claim.national_id, claim.country);
    }
    if (p.field === "member_name" && claim.member_name) {
      masked.member_name = maskName(claim.member_name);
    }
  }
  return masked;
}

function evaluateRule(rule: RegulatoryRule, claim: ClaimInput): RuleResult {
  switch (rule.rule_type) {
    case "document_requirement": return checkDocument(rule, claim);
    case "sla_check":            return checkSLA(rule, claim);
    case "waiting_period":       return checkWaitingPeriod(rule, claim);
    case "data_masking":         return checkDataMasking(rule, claim);
    case "coverage_mandate":     return checkCoverageMandate(rule, claim);
  }
}

export function validateClaim(claim: ClaimInput, configs: Record<string, CountryConfig>): ComplianceReport {
  const config = configs[claim.country];

  const activeRules = config.rules.filter(r =>
    r.effective_date <= claim.submitted_date &&
    (!r.expiry_date || r.expiry_date > claim.submitted_date)
  );

  const results = activeRules.map(rule => evaluateRule(rule, claim));
  const masked_data = buildMaskedData(claim, activeRules);

  const failed_hard = results.filter(r => r.status === "FAIL" && r.severity === "hard");
  const failed_soft = results.filter(r => r.status === "FAIL" && r.severity === "soft");

  const overall_status: ComplianceReport["overall_status"] =
    failed_hard.length > 0 ? "NON_COMPLIANT" :
    failed_soft.length > 0 ? "PARTIALLY_COMPLIANT" : "COMPLIANT";

  return {
    claim_id: claim.claim_id,
    country: claim.country,
    submitted_date: claim.submitted_date,
    overall_status,
    rules_applied: results.filter(r => r.status !== "SKIP").length,
    rules_passed: results.filter(r => r.status === "PASS").length,
    rules_failed: results.filter(r => r.status === "FAIL").length,
    results,
    masked_data,
  };
}
