import type { Expense, ExpenseResult, BenefitSummary, Decision } from "./types";
import type { Policy, Benefit, SubBenefit } from "./data";

// Add days to an ISO date string
function addDays(isoDate: string, days: number): string {
  const d = new Date(isoDate);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function dateGte(a: string, b: string): boolean {
  return a >= b;
}

function getSubLimit(sub: SubBenefit): { value: number; type: "per_visit" | "per_event" | "per_year" | "per_pregnancy" | "per_day" | "none" } {
  if (sub.limit_per_visit)      return { value: sub.limit_per_visit,     type: "per_visit"     };
  if (sub.limit_per_event)      return { value: sub.limit_per_event,     type: "per_event"     };
  if (sub.limit_per_year)       return { value: sub.limit_per_year,      type: "per_year"      };
  if (sub.limit_per_pregnancy)  return { value: sub.limit_per_pregnancy, type: "per_pregnancy" };
  if (sub.limit_per_day)        return { value: sub.limit_per_day,       type: "per_day"       };
  return { value: Infinity, type: "none" };
}

function denied(expense_id: string, submitted: number, reason: string): ExpenseResult {
  return {
    expense_id,
    submitted_amount: submitted,
    covered_amount: 0,
    copay_amount: 0,
    member_pays: submitted,
    decision: "DENIED",
    reason,
    remaining_annual_limit: null,
    remaining_visit_limit: null,
  };
}

export function calculateBenefits(
  policy: Policy,
  expenses: Expense[]
): { results: ExpenseResult[]; summary: BenefitSummary[] } {
  // ── Init state ────────────────────────────────────────────────
  const remainingAnnual: Record<string, number> = {};
  const remainingSubYearly: Record<string, number> = {};
  const remainingVisits: Record<string, number> = {};

  for (const b of policy.benefits) {
    const limit = b.annual_limit ?? b.lifetime_limit ?? 0;
    remainingAnnual[b.type_key] = limit;
    for (const sub of b.sub_benefits) {
      const key = `${b.type_key}::${sub.name}`;
      if (sub.limit_per_year)       remainingSubYearly[key] = sub.limit_per_year;
      if (sub.limit_per_pregnancy)  remainingSubYearly[key] = sub.limit_per_pregnancy;
      if (sub.visits_per_year)      remainingVisits[key]    = sub.visits_per_year;
    }
  }

  // ── Process ───────────────────────────────────────────────────
  const results: ExpenseResult[] = [];

  for (const exp of expenses) {
    const { expense_id, date, benefit_type, sub_benefit, amount } = exp;

    // 1. Find benefit
    const benefit: Benefit | undefined = policy.benefits.find(
      (b) => b.type_key === benefit_type
    );
    if (!benefit) {
      results.push(denied(expense_id, amount, `Benefit type "${benefit_type}" not covered under this policy.`));
      continue;
    }

    // 2. Waiting period
    if (benefit.waiting_period_days) {
      const coveredAfter = addDays(policy.plan.effective_date, benefit.waiting_period_days);
      if (!dateGte(date, coveredAfter)) {
        results.push(denied(
          expense_id, amount,
          `${benefit.type} has a ${benefit.waiting_period_days}-day waiting period. Coverage begins ${coveredAfter}; expense date is ${date}.`
        ));
        continue;
      }
    }

    // 3. Exclusion check (diagnosis + sub_benefit name)
    const searchText = `${exp.diagnosis} ${sub_benefit}`.toLowerCase();
    const matchedExclusion = policy.exclusions.find((ex) =>
      searchText.includes(ex.toLowerCase())
    );
    if (matchedExclusion) {
      results.push(denied(expense_id, amount, `Excluded: "${matchedExclusion}" applies to this claim.`));
      continue;
    }

    // 4. Find sub-benefit
    const sub: SubBenefit | undefined = benefit.sub_benefits.find(
      (s) => s.name.toLowerCase() === sub_benefit.toLowerCase()
    );
    if (!sub) {
      results.push(denied(expense_id, amount, `Sub-benefit "${sub_benefit}" is not in the ${benefit.type} schedule.`));
      continue;
    }

    const subKey = `${benefit_type}::${sub.name}`;
    const { value: subLimitValue, type: subLimitType } = getSubLimit(sub);

    // 5. Annual limit exhausted
    const remAnnual = remainingAnnual[benefit_type] ?? 0;
    if (remAnnual <= 0) {
      results.push(denied(expense_id, amount, `${benefit.type} annual limit fully exhausted.`));
      continue;
    }

    // 6. Sub-yearly limit exhausted
    if ((subLimitType === "per_year" || subLimitType === "per_pregnancy") && remainingSubYearly[subKey] !== undefined) {
      if (remainingSubYearly[subKey] <= 0) {
        results.push(denied(expense_id, amount, `${sub.name} annual sub-limit of ฿${subLimitValue.toLocaleString()} fully exhausted.`));
        continue;
      }
    }

    // 7. Visit count exhausted
    if (sub.visits_per_year !== undefined && remainingVisits[subKey] !== undefined) {
      if (remainingVisits[subKey] <= 0) {
        results.push(denied(expense_id, amount, `${sub.name} visit limit of ${sub.visits_per_year} visits/year exhausted.`));
        continue;
      }
    }

    // 8. Apply sub-limit cap
    let eligible = amount;
    const reasons: string[] = [];

    const singleVisitCap = subLimitType === "per_visit" || subLimitType === "per_event" || subLimitType === "per_day"
      ? subLimitValue
      : Infinity;

    if (eligible > singleVisitCap) {
      reasons.push(`Capped at ${sub.name} limit ฿${singleVisitCap.toLocaleString()}`);
      eligible = singleVisitCap;
    }

    // 9. Apply sub-yearly cap
    if ((subLimitType === "per_year" || subLimitType === "per_pregnancy") && remainingSubYearly[subKey] !== undefined) {
      const remSub = remainingSubYearly[subKey];
      if (eligible > remSub) {
        reasons.push(`Only ฿${remSub.toLocaleString()} remaining in ${sub.name} yearly limit`);
        eligible = remSub;
      }
    }

    // 10. Apply annual cap
    if (eligible > remAnnual) {
      reasons.push(`Only ฿${remAnnual.toLocaleString()} remaining in ${benefit.type} annual limit`);
      eligible = remAnnual;
    }

    // 11. Apply copay
    const copayConfig = policy.copay[benefit_type];
    const copayRate = copayConfig?.percentage ?? 0;
    let covered = eligible;
    let copayAmount = 0;

    if (copayRate > 0) {
      const rawCopay = eligible * (copayRate / 100);
      copayAmount = copayConfig?.max_per_visit !== undefined
        ? Math.min(rawCopay, copayConfig.max_per_visit)
        : rawCopay;
      covered = eligible - copayAmount;
      reasons.push(`${copayRate}% copay applied${copayConfig?.max_per_visit ? ` (max ฿${copayConfig.max_per_visit.toLocaleString()}/visit)` : ""}`);
    }

    // 12. Update state
    const deductedFromAnnual = eligible;
    remainingAnnual[benefit_type] = Math.max(0, remAnnual - deductedFromAnnual);

    if ((subLimitType === "per_year" || subLimitType === "per_pregnancy") && remainingSubYearly[subKey] !== undefined) {
      remainingSubYearly[subKey] = Math.max(0, remainingSubYearly[subKey] - eligible);
    }
    if (sub.visits_per_year !== undefined && remainingVisits[subKey] !== undefined) {
      remainingVisits[subKey] = Math.max(0, remainingVisits[subKey] - 1);
    }

    // 13. Determine decision
    const decision: Decision =
      covered >= amount ? "COVERED"
        : covered <= 0  ? "DENIED"
        : "PARTIALLY_COVERED";

    const memberPays = amount - covered;
    const reasonStr = reasons.length > 0
      ? reasons.join(". ") + `. Covered: ฿${covered.toLocaleString()}. Member pays: ฿${memberPays.toLocaleString()}.`
      : `Fully covered. ฿${covered.toLocaleString()} paid by insurer.`;

    results.push({
      expense_id,
      submitted_amount: amount,
      covered_amount: Math.round(covered),
      copay_amount: Math.round(copayAmount),
      member_pays: Math.round(memberPays),
      decision,
      reason: reasonStr,
      remaining_annual_limit: remainingAnnual[benefit_type],
      remaining_visit_limit: sub.visits_per_year !== undefined ? remainingVisits[subKey] : null,
    });
  }

  // ── Summary ───────────────────────────────────────────────────
  const summary: BenefitSummary[] = policy.benefits.map((b) => {
    const original = b.annual_limit ?? b.lifetime_limit ?? 0;
    const remaining = remainingAnnual[b.type_key] ?? 0;
    return {
      benefit_type: b.type,
      original_limit: original,
      used: original - remaining,
      remaining,
    };
  });

  return { results, summary };
}
