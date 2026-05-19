import { describe, it, expect } from "vitest";
import type { Claim } from "./types";
import {
  ruleDuplicateClaim, ruleRapidResubmission, ruleUpcoding, ruleUnbundling,
  rulePhantomBilling, ruleWeekendAnomaly, ruleDxProcedureMismatch, ruleAmountClustering,
} from "./rules";
import { scoreClaims } from "./engine";
import { computeMetrics } from "./metrics";

function c(overrides: Partial<Claim> & { claim_id: string }): Claim {
  return {
    member_id: "MBR-001", provider_id: "PRV-01", provider_name: "Test Hospital",
    claim_date: "2024-06-01", claim_type: "OUTPATIENT", diagnosis_code: "J18.9",
    procedure_codes: ["P-001"], submitted_amount: 3000,
    is_weekend: false, is_fraud: false, fraud_type: null,
    ...overrides,
  };
}

// ── Rule 1: Duplicate claim ─────────────────────────────────────────────────
describe("ruleDuplicateClaim", () => {
  it("flags both claims when same member+provider+date+diagnosis", () => {
    const claims = [
      c({ claim_id: "A", member_id: "MBR-001", provider_id: "PRV-01", claim_date: "2024-01-10", diagnosis_code: "J18.9" }),
      c({ claim_id: "B", member_id: "MBR-001", provider_id: "PRV-01", claim_date: "2024-01-10", diagnosis_code: "J18.9" }),
    ];
    const result = ruleDuplicateClaim(claims);
    expect(result.has("A")).toBe(true);
    expect(result.has("B")).toBe(true);
    expect(result.get("A")![0].rule).toBe("duplicate_claim");
  });

  it("does not flag a single unique claim", () => {
    const result = ruleDuplicateClaim([c({ claim_id: "A" })]);
    expect(result.size).toBe(0);
  });
});

// ── Rule 2: Rapid re-submission ─────────────────────────────────────────────
describe("ruleRapidResubmission", () => {
  it("flags claim submitted 3 days after same member+diagnosis", () => {
    const claims = [
      c({ claim_id: "A", claim_date: "2024-03-01", diagnosis_code: "I21.0" }),
      c({ claim_id: "B", claim_date: "2024-03-04", diagnosis_code: "I21.0" }),
    ];
    const result = ruleRapidResubmission(claims);
    expect(result.has("B")).toBe(true);
    expect(result.get("B")![0].rule).toBe("rapid_resubmission");
    expect(result.get("B")![0].evidence).toContain("3");
  });

  it("does not flag claims exactly 7 days apart (boundary)", () => {
    const claims = [
      c({ claim_id: "A", claim_date: "2024-03-01", diagnosis_code: "I21.0" }),
      c({ claim_id: "B", claim_date: "2024-03-08", diagnosis_code: "I21.0" }),
    ];
    const result = ruleRapidResubmission(claims);
    expect(result.has("B")).toBe(false);
  });

  it("does not flag different diagnosis codes", () => {
    const claims = [
      c({ claim_id: "A", claim_date: "2024-03-01", diagnosis_code: "J18.9" }),
      c({ claim_id: "B", claim_date: "2024-03-03", diagnosis_code: "I21.0" }),
    ];
    const result = ruleRapidResubmission(claims);
    expect(result.has("B")).toBe(false);
  });
});

// ── Rule 3: Upcoding ─────────────────────────────────────────────────────────
describe("ruleUpcoding", () => {
  it("flags claim with amount > 2 std devs above mean for procedure", () => {
    const base = Array.from({ length: 20 }, (_, i) =>
      c({ claim_id: `N${i}`, procedure_codes: ["P-011"], submitted_amount: 10000 })
    );
    const flagged = c({ claim_id: "FRAUD", procedure_codes: ["P-011"], submitted_amount: 35000 });
    const result = ruleUpcoding([...base, flagged]);
    expect(result.has("FRAUD")).toBe(true);
    expect(result.get("FRAUD")![0].evidence).toContain("std devs above mean");
  });

  it("does not flag amount clearly within normal range", () => {
    // mean ≈ 10000, std ≈ 2000 → 2 std threshold ≈ 14000; amount 12000 is below
    const base = Array.from({ length: 10 }, (_, i) =>
      c({ claim_id: `N${i}`, procedure_codes: ["P-013"], submitted_amount: 8000 + i * 400 })
    );
    const notFlagged = c({ claim_id: "OK", procedure_codes: ["P-013"], submitted_amount: 12000 });
    const result = ruleUpcoding([...base, notFlagged]);
    expect(result.has("OK")).toBe(false);
  });
});

// ── Rule 4: Unbundling ───────────────────────────────────────────────────────
describe("ruleUnbundling", () => {
  it("flags claim with all components of a bundle", () => {
    const claim = c({ claim_id: "A", procedure_codes: ["P-001", "P-002", "P-003"] });
    const result = ruleUnbundling([claim]);
    expect(result.has("A")).toBe(true);
    expect(result.get("A")![0].rule).toBe("unbundling");
    expect(result.get("A")![0].evidence).toContain("P-BUNDLE-A");
  });

  it("does not flag partial bundle (missing one component)", () => {
    const claim = c({ claim_id: "A", procedure_codes: ["P-001", "P-002"] });
    const result = ruleUnbundling([claim]);
    expect(result.has("A")).toBe(false);
  });
});

// ── Rule 5: Phantom billing ──────────────────────────────────────────────────
describe("rulePhantomBilling", () => {
  it("flags all claims when provider submits >30 on same day", () => {
    const claims = Array.from({ length: 31 }, (_, i) =>
      c({ claim_id: `C${i}`, provider_id: "PRV-99", claim_date: "2024-07-01" })
    );
    const result = rulePhantomBilling(claims);
    expect(result.size).toBe(31);
    expect(result.get("C0")![0].evidence).toContain("31");
  });

  it("does not flag exactly 30 claims (>30 required)", () => {
    const claims = Array.from({ length: 30 }, (_, i) =>
      c({ claim_id: `C${i}`, provider_id: "PRV-98", claim_date: "2024-07-02" })
    );
    const result = rulePhantomBilling(claims);
    expect(result.size).toBe(0);
  });
});

// ── Rule 6: Weekend anomaly ──────────────────────────────────────────────────
describe("ruleWeekendAnomaly", () => {
  it("flags surgical claim on weekend from provider with <5% weekend volume", () => {
    const normal = Array.from({ length: 98 }, (_, i) =>
      c({ claim_id: `N${i}`, provider_id: "PRV-88", is_weekend: false })
    );
    const fraud = c({
      claim_id: "W", provider_id: "PRV-88", is_weekend: true,
      claim_date: "2024-03-09", procedure_codes: ["P-006"],
    });
    const result = ruleWeekendAnomaly([...normal, fraud]);
    expect(result.has("W")).toBe(true);
    expect(result.get("W")![0].rule).toBe("weekend_anomaly");
  });

  it("does not flag weekday surgical claim", () => {
    const claims = [c({ claim_id: "A", is_weekend: false, procedure_codes: ["P-008"] })];
    const result = ruleWeekendAnomaly(claims);
    expect(result.has("A")).toBe(false);
  });
});

// ── Rule 7: Diagnosis-procedure mismatch ─────────────────────────────────────
describe("ruleDxProcedureMismatch", () => {
  it("flags claim with procedure not valid for diagnosis", () => {
    const claim = c({ claim_id: "A", diagnosis_code: "J18.9", procedure_codes: ["P-014"] });
    const result = ruleDxProcedureMismatch([claim]);
    expect(result.has("A")).toBe(true);
    expect(result.get("A")![0].evidence).toContain("J18.9");
  });

  it("does not flag claim with valid procedure for diagnosis", () => {
    const claim = c({ claim_id: "A", diagnosis_code: "J18.9", procedure_codes: ["P-001"] });
    const result = ruleDxProcedureMismatch([claim]);
    expect(result.has("A")).toBe(false);
  });

  it("does not flag diagnosis not in DX_PROC_MAP", () => {
    const claim = c({ claim_id: "A", diagnosis_code: "Z00.00", procedure_codes: ["P-014"] });
    const result = ruleDxProcedureMismatch([claim]);
    expect(result.has("A")).toBe(false);
  });
});

// ── Rule 8: Amount clustering ─────────────────────────────────────────────────
describe("ruleAmountClustering", () => {
  it("flags amount at 49,500 (within 5% band)", () => {
    const claim = c({ claim_id: "A", submitted_amount: 49500 });
    const result = ruleAmountClustering([claim]);
    expect(result.has("A")).toBe(true);
    expect(result.get("A")![0].evidence).toContain("49,500");
  });

  it("flags amount at lower boundary 47,500", () => {
    const claim = c({ claim_id: "A", submitted_amount: 47500 });
    const result = ruleAmountClustering([claim]);
    expect(result.has("A")).toBe(true);
  });

  it("does not flag amount at exactly 50,000 (above threshold)", () => {
    const claim = c({ claim_id: "A", submitted_amount: 50000 });
    const result = ruleAmountClustering([claim]);
    expect(result.has("A")).toBe(false);
  });

  it("does not flag amount below 47,500", () => {
    const claim = c({ claim_id: "A", submitted_amount: 47499 });
    const result = ruleAmountClustering([claim]);
    expect(result.has("A")).toBe(false);
  });
});

// ── scoreClaims: integration ──────────────────────────────────────────────────
describe("scoreClaims", () => {
  it("returns results sorted descending by risk_score", () => {
    const claims = [
      c({ claim_id: "LOW", submitted_amount: 49500 }),
      c({ claim_id: "A1", member_id: "MBR-001", provider_id: "PRV-01", claim_date: "2024-01-10", diagnosis_code: "J18.9" }),
      c({ claim_id: "A2", member_id: "MBR-001", provider_id: "PRV-01", claim_date: "2024-01-10", diagnosis_code: "J18.9" }),
    ];
    const results = scoreClaims(claims);
    for (let i = 1; i < results.length; i++) {
      expect(results[i - 1].risk_score).toBeGreaterThanOrEqual(results[i].risk_score);
    }
  });

  it("multi-flag claim scores higher than single-flag claim", () => {
    const duplicate1 = c({ claim_id: "D1", member_id: "MBR-X", provider_id: "PRV-X", claim_date: "2024-05-01", diagnosis_code: "I21.0" });
    const duplicate2 = c({ claim_id: "D2", member_id: "MBR-X", provider_id: "PRV-X", claim_date: "2024-05-01", diagnosis_code: "I21.0", submitted_amount: 49800 });
    const singleFlag = c({ claim_id: "S1", submitted_amount: 48000 });
    const results = scoreClaims([duplicate1, duplicate2, singleFlag]);
    const d2 = results.find(r => r.claim_id === "D2");
    const s1 = results.find(r => r.claim_id === "S1");
    expect(d2?.risk_score).toBeGreaterThan(s1?.risk_score ?? 0);
  });

  it("returns empty array when no claims are flagged", () => {
    const clean = [c({ claim_id: "X1", submitted_amount: 2000 })];
    expect(scoreClaims(clean)).toHaveLength(0);
  });
});

// ── computeMetrics ────────────────────────────────────────────────────────────
describe("computeMetrics", () => {
  it("computes correct precision and recall from known TP/FP/FN", () => {
    // 4 fraud, 4 normal; score 3 fraud + 1 normal → TP=3, FP=1, FN=1
    const allClaims: Claim[] = [
      c({ claim_id: "F1", is_fraud: true }),
      c({ claim_id: "F2", is_fraud: true }),
      c({ claim_id: "F3", is_fraud: true }),
      c({ claim_id: "F4", is_fraud: true }),  // missed
      c({ claim_id: "N1", is_fraud: false }),
      c({ claim_id: "N2", is_fraud: false }),  // false positive
      c({ claim_id: "N3", is_fraud: false }),
      c({ claim_id: "N4", is_fraud: false }),
    ];
    const scored = [
      { claim_id: "F1", risk_score: 80, flags: [] },
      { claim_id: "F2", risk_score: 60, flags: [] },
      { claim_id: "F3", risk_score: 40, flags: [] },
      { claim_id: "N2", risk_score: 20, flags: [] },  // FP
    ];
    const m = computeMetrics(scored, allClaims);
    expect(m.true_positives).toBe(3);
    expect(m.false_positives).toBe(1);
    expect(m.false_negatives).toBe(1);
    expect(m.precision).toBeCloseTo(3 / 4);
    expect(m.recall).toBeCloseTo(3 / 4);
  });
});
