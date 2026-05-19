import type { Claim, ScoringResult } from "./types";
import { ALL_RULES, MAX_SEVERITY } from "./rules";

export function scoreClaims(claims: Claim[]): ScoringResult[] {
  const flagMap = new Map<string, import("./types").FraudFlag[]>();

  for (const runRule of ALL_RULES) {
    const result = runRule(claims);
    for (const [claimId, flags] of result) {
      if (!flagMap.has(claimId)) flagMap.set(claimId, []);
      flagMap.get(claimId)!.push(...flags);
    }
  }

  return claims
    .map(c => {
      const flags = flagMap.get(c.claim_id) ?? [];
      const severitySum = flags.reduce((s, f) => s + f.severity, 0);
      const risk_score = Math.min(100, Math.round((severitySum / MAX_SEVERITY) * 100));
      return { claim_id: c.claim_id, risk_score, flags };
    })
    .filter(r => r.flags.length > 0)
    .sort((a, b) => b.risk_score - a.risk_score);
}
