import { describe, it, expect } from "vitest";
import { calculateBenefits } from "./calculator";
import { policy, expenses } from "./data";
import type { Expense } from "./types";

// Helper to run a single expense through the calculator
function calc(exp: Expense) {
  const { results } = calculateBenefits(policy, [exp]);
  return results[0];
}

describe("calculateBenefits", () => {
  it("1. fully covers an IPD expense with 0% copay", () => {
    const result = calc(expenses.find((e) => e.expense_id === "EXP-006")!);
    expect(result.decision).toBe("COVERED");
    expect(result.copay_amount).toBe(0);
    expect(result.covered_amount).toBe(320000);
    expect(result.member_pays).toBe(0);
  });

  it("2. applies 20% OPD copay on a normal doctor visit", () => {
    const result = calc(expenses.find((e) => e.expense_id === "EXP-001")!);
    expect(result.decision).toBe("PARTIALLY_COVERED");
    // submitted 2500, copay = 20% of 2500 = 500, but max_per_visit = 500 → copay = 500
    expect(result.copay_amount).toBe(500);
    expect(result.covered_amount).toBe(2000);
    expect(result.member_pays).toBe(500);
  });

  it("3. caps OPD visit at per-visit sub-limit of ฿3,000", () => {
    const result = calc(expenses.find((e) => e.expense_id === "EXP-011")!);
    // submitted 4500, capped at 3000 sub-limit
    // 20% of 3000 = 600, but max_per_visit = 500 → copay = 500, covered = 3000 - 500 = 2500
    expect(result.decision).toBe("PARTIALLY_COVERED");
    expect(result.submitted_amount).toBe(4500);
    expect(result.covered_amount).toBe(2500); // 3000 - 500 (capped copay)
    expect(result.copay_amount).toBe(500);    // capped at max_per_visit
    expect(result.member_pays).toBe(2000);    // 4500 - 2500
  });

  it("4. denies Dental claim during 90-day waiting period", () => {
    const result = calc(expenses.find((e) => e.expense_id === "EXP-008")!);
    expect(result.decision).toBe("DENIED");
    expect(result.covered_amount).toBe(0);
    expect(result.reason.toLowerCase()).toContain("waiting");
    expect(result.reason).toContain("90");
  });

  it("5. denies Maternity claim during 270-day waiting period", () => {
    const result = calc(expenses.find((e) => e.expense_id === "EXP-009")!);
    expect(result.decision).toBe("DENIED");
    expect(result.reason.toLowerCase()).toContain("waiting");
    expect(result.reason).toContain("270");
  });

  it("6. denies claim matching an exclusion keyword", () => {
    const result = calc(expenses.find((e) => e.expense_id === "EXP-010")!);
    expect(result.decision).toBe("DENIED");
    expect(result.reason.toLowerCase()).toContain("excluded");
  });

  it("7. denies Diagnostic Tests after sub-yearly limit exhausted", () => {
    // Sub-yearly limit: ฿20,000
    // EXP-004: ฿5,000 → remaining 15,000
    // EXP-012: ฿8,000 → remaining 7,000
    // EXP-013: ฿10,000 → only 7,000 left, partial, remaining → 0
    // EXP-014: ฿3,000 → limit = 0 → DENIED
    const subset = expenses.filter((e) =>
      ["EXP-004", "EXP-012", "EXP-013", "EXP-014"].includes(e.expense_id)
    );
    const { results } = calculateBenefits(policy, subset);
    const denied = results.find((r) => r.expense_id === "EXP-014")!;
    expect(denied.decision).toBe("DENIED");
    expect(denied.reason.toLowerCase()).toMatch(/exhausted|limit/);
  });

  it("8. partial coverage when remaining limit < submitted amount (EXP-013)", () => {
    // EXP-004 uses ฿5,000 of the ฿20,000 Diagnostic sub-limit.
    // EXP-012 uses ฿8,000 → remaining ฿7,000.
    // EXP-013 submits ฿10,000 — only ฿7,000 remains → PARTIALLY_COVERED.
    const subset = expenses.filter((e) =>
      ["EXP-004", "EXP-012", "EXP-013"].includes(e.expense_id)
    );
    const { results } = calculateBenefits(policy, subset);
    const r = results.find((r) => r.expense_id === "EXP-013")!;
    expect(r.decision).toBe("PARTIALLY_COVERED");
    expect(r.remaining_annual_limit).toBeGreaterThanOrEqual(0);
  });

  it("9. copay max_per_visit cap — copay does not exceed ฿500 for OPD", () => {
    // 20% of 3000 = 600, but max_per_visit = 500 → copay capped at 500
    const result = calc({
      expense_id: "TEST-COPAY",
      date: "2024-05-01",
      benefit_type: "OUTPATIENT",
      sub_benefit: "Doctor Visit",
      amount: 3000,
      diagnosis: "Routine checkup",
      provider: "Test Hospital",
    });
    expect(result.copay_amount).toBe(500);
    expect(result.covered_amount).toBe(2500); // 3000 - 500
  });

  it("10. chronological processing — earlier expenses reduce limits for later ones", () => {
    // Run a large OPD expense first to reduce annual limit, then a second one.
    const first: Expense = {
      expense_id: "T-FIRST",
      date: "2024-01-10",
      benefit_type: "OUTPATIENT",
      sub_benefit: "Prescribed Medicine",
      amount: 3000,
      diagnosis: "Medication",
      provider: "Hospital",
    };
    const second: Expense = {
      expense_id: "T-SECOND",
      date: "2024-01-11",
      benefit_type: "OUTPATIENT",
      sub_benefit: "Prescribed Medicine",
      amount: 3000,
      diagnosis: "Medication",
      provider: "Hospital",
    };
    const { results } = calculateBenefits(policy, [first, second]);

    // first: 3000 eligible * 0.8 = 2400 covered, 500 copay, deducts 3000 from annual
    expect(results[0].remaining_annual_limit).toBe(100000 - 3000);
    // second should see the already-reduced annual limit
    expect(results[1].remaining_annual_limit).toBe(100000 - 6000);
  });
});
