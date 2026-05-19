import type { Claim, ScoringResult, MetricsReport } from "./types";

export function computeMetrics(results: ScoringResult[], claims: Claim[]): MetricsReport {
  const flaggedIds = new Set(results.map(r => r.claim_id));
  const fraudIds = new Set(claims.filter(c => c.is_fraud).map(c => c.claim_id));

  let tp = 0, fp = 0, fn = 0, tn = 0;
  for (const c of claims) {
    const flagged = flaggedIds.has(c.claim_id);
    const fraud = fraudIds.has(c.claim_id);
    if (flagged && fraud) tp++;
    else if (flagged && !fraud) fp++;
    else if (!flagged && fraud) fn++;
    else tn++;
  }

  const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
  const recall = tp + fn > 0 ? tp / (tp + fn) : 0;
  const false_positive_rate = fp + tn > 0 ? fp / (fp + tn) : 0;

  return {
    total_claims: claims.length,
    flagged_claims: flaggedIds.size,
    known_fraud: fraudIds.size,
    true_positives: tp,
    false_positives: fp,
    false_negatives: fn,
    precision,
    recall,
    false_positive_rate,
  };
}
