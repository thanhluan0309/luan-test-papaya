import type { CountryCode, CountryConfig, RuleDiff, RuleType } from "./types";

export function diffCountries(codeA: CountryCode, codeB: CountryCode, configs: Record<string, CountryConfig>): RuleDiff[] {
  const cfgA = configs[codeA];
  const cfgB = configs[codeB];
  const diffs: RuleDiff[] = [];

  // Compare SLA days per claim type
  const slaTypes = ["all", "OUTPATIENT", "INPATIENT"];
  for (const applies_to of slaTypes) {
    const rulesA = cfgA.rules.filter(r => r.rule_type === "sla_check" &&
      (r.parameters as Record<string, unknown>).applies_to === applies_to);
    const rulesB = cfgB.rules.filter(r => r.rule_type === "sla_check" &&
      (r.parameters as Record<string, unknown>).applies_to === applies_to);
    const daysA = rulesA.length ? (rulesA[0].parameters as Record<string, unknown>).business_days : null;
    const daysB = rulesB.length ? (rulesB[0].parameters as Record<string, unknown>).business_days : null;
    if (daysA !== daysB) {
      diffs.push({
        rule_type: "sla_check",
        aspect: `Processing SLA (${applies_to})`,
        country_a: { code: codeA, value: daysA ? `${daysA} business days` : "Not defined" },
        country_b: { code: codeB, value: daysB ? `${daysB} business days` : "Not defined" },
        description: `${codeA} requires ${daysA ?? "N/A"} business days vs ${codeB} requires ${daysB ?? "N/A"} business days for ${applies_to} claims.`,
      });
    }
  }

  // Compare waiting periods
  const condTypes = ["general", "pre_existing"];
  for (const cond of condTypes) {
    const wpA = cfgA.rules.find(r => r.rule_type === "waiting_period" &&
      (r.parameters as Record<string, unknown>).condition_type === cond);
    const wpB = cfgB.rules.find(r => r.rule_type === "waiting_period" &&
      (r.parameters as Record<string, unknown>).condition_type === cond);
    const daysA = wpA ? (wpA.parameters as Record<string, unknown>).days : null;
    const daysB = wpB ? (wpB.parameters as Record<string, unknown>).days : null;
    if (daysA !== daysB) {
      diffs.push({
        rule_type: "waiting_period",
        aspect: `Waiting period (${cond})`,
        country_a: { code: codeA, value: daysA ? `${daysA} days` : "Not defined" },
        country_b: { code: codeB, value: daysB ? `${daysB} days` : "Not defined" },
        description: `${codeA}: ${daysA ?? "N/A"} days vs ${codeB}: ${daysB ?? "N/A"} days for ${cond} conditions.`,
      });
    }
  }

  // Compare required documents
  const docsA = new Set(cfgA.rules
    .filter(r => r.rule_type === "document_requirement")
    .map(r => (r.parameters as Record<string, unknown>).document_type as string));
  const docsB = new Set(cfgB.rules
    .filter(r => r.rule_type === "document_requirement")
    .map(r => (r.parameters as Record<string, unknown>).document_type as string));

  for (const doc of docsA) {
    if (!docsB.has(doc)) {
      diffs.push({
        rule_type: "document_requirement",
        aspect: `Required document: ${doc}`,
        country_a: { code: codeA, value: "Required" },
        country_b: { code: codeB, value: "Not required" },
        description: `${codeA} requires "${doc}" but ${codeB} does not.`,
      });
    }
  }
  for (const doc of docsB) {
    if (!docsA.has(doc)) {
      diffs.push({
        rule_type: "document_requirement",
        aspect: `Required document: ${doc}`,
        country_a: { code: codeA, value: "Not required" },
        country_b: { code: codeB, value: "Required" },
        description: `${codeB} requires "${doc}" but ${codeA} does not.`,
      });
    }
  }

  // Compare data masking fields
  const maskA = cfgA.rules.filter(r => r.rule_type === "data_masking")
    .map(r => `${(r.parameters as Record<string, unknown>).field}: ${(r.parameters as Record<string, unknown>).description}`);
  const maskB = cfgB.rules.filter(r => r.rule_type === "data_masking")
    .map(r => `${(r.parameters as Record<string, unknown>).field}: ${(r.parameters as Record<string, unknown>).description}`);
  if (maskA.join("|") !== maskB.join("|")) {
    diffs.push({
      rule_type: "data_masking",
      aspect: "Data masking requirements",
      country_a: { code: codeA, value: maskA.join("; ") || "None" },
      country_b: { code: codeB, value: maskB.join("; ") || "None" },
      description: `${codeA} masks: ${maskA.join("; ") || "nothing"} vs ${codeB} masks: ${maskB.join("; ") || "nothing"}.`,
    });
  }

  // Compare coverage mandates
  const covA = cfgA.rules.filter(r => r.rule_type === "coverage_mandate")
    .map(r => (r.parameters as Record<string, unknown>).applies_to as string);
  const covB = cfgB.rules.filter(r => r.rule_type === "coverage_mandate")
    .map(r => (r.parameters as Record<string, unknown>).applies_to as string);
  const covSetA = new Set(covA), covSetB = new Set(covB);
  const allCov = new Set([...covA, ...covB]);
  for (const cov of allCov) {
    if (covSetA.has(cov) !== covSetB.has(cov)) {
      diffs.push({
        rule_type: "coverage_mandate",
        aspect: `Coverage mandate: ${cov}`,
        country_a: { code: codeA, value: covSetA.has(cov) ? "Mandated" : "Not mandated" },
        country_b: { code: codeB, value: covSetB.has(cov) ? "Mandated" : "Not mandated" },
        description: `${cov} coverage is${covSetA.has(cov) ? "" : " not"} mandated in ${codeA} but${covSetB.has(cov) ? " is" : " is not"} mandated in ${codeB}.`,
      });
    }
  }

  // Sort by rule_type for consistent display
  const ORDER: RuleType[] = ["document_requirement", "waiting_period", "sla_check", "data_masking", "coverage_mandate"];
  return diffs.sort((a, b) => ORDER.indexOf(a.rule_type) - ORDER.indexOf(b.rule_type));
}
