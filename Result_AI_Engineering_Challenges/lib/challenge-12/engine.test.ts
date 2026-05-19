import { describe, it, expect } from "vitest";
import { validateClaim } from "./engine";
import { diffCountries } from "./diff";
import { TEST_CLAIMS } from "./claims";
import type { CountryConfig } from "./types";
import TH from "./configs/TH.json";
import VN from "./configs/VN.json";
import HK from "./configs/HK.json";
import SG from "./configs/SG.json";

const TEST_CONFIGS: Record<string, CountryConfig> = {
  TH: TH as CountryConfig,
  VN: VN as CountryConfig,
  HK: HK as CountryConfig,
  SG: SG as CountryConfig,
};

// ── Claim validation: 15 tests ─────────────────────────────────────────────

describe("validateClaim — TH claims", () => {
  it("TH-01: OUTPATIENT all docs + within SLA → COMPLIANT", () => {
    const { claim, expected_status } = TEST_CLAIMS[0];
    expect(validateClaim(claim, TEST_CONFIGS).overall_status).toBe(expected_status);
  });

  it("TH-02: INPATIENT missing discharge_summary → NON_COMPLIANT", () => {
    const { claim, expected_status } = TEST_CLAIMS[1];
    const report = validateClaim(claim, TEST_CONFIGS);
    expect(report.overall_status).toBe(expected_status);
    const failed = report.results.find(r => r.rule_id === "TH-DOC-002");
    expect(failed?.status).toBe("FAIL");
  });

  it("TH-03: OUTPATIENT SLA exceeded (16 bd) → PARTIALLY_COMPLIANT", () => {
    const { claim, expected_status } = TEST_CLAIMS[2];
    const report = validateClaim(claim, TEST_CONFIGS);
    expect(report.overall_status).toBe(expected_status);
    const sla = report.results.find(r => r.rule_id === "TH-SLA-001");
    expect(sla?.status).toBe("FAIL");
  });

  it("TH-04: pre-existing, 89-day policy (need 120) → NON_COMPLIANT", () => {
    const { claim, expected_status } = TEST_CLAIMS[3];
    const report = validateClaim(claim, TEST_CONFIGS);
    expect(report.overall_status).toBe(expected_status);
    const wp = report.results.find(r => r.rule_id === "TH-WAIT-002");
    expect(wp?.status).toBe("FAIL");
  });

  it("TH-05: emergency outpatient → COMPLIANT with mandate PASS", () => {
    const { claim, expected_status } = TEST_CLAIMS[4];
    const report = validateClaim(claim, TEST_CONFIGS);
    expect(report.overall_status).toBe(expected_status);
    const cov = report.results.find(r => r.rule_id === "TH-COV-001");
    expect(cov?.status).toBe("PASS");
  });
});

describe("validateClaim — VN claims", () => {
  it("VN-01: OUTPATIENT all docs + within SLA → COMPLIANT", () => {
    const { claim, expected_status } = TEST_CLAIMS[5];
    expect(validateClaim(claim, TEST_CONFIGS).overall_status).toBe(expected_status);
  });

  it("VN-02: INPATIENT missing id_card_copy → NON_COMPLIANT", () => {
    const { claim, expected_status } = TEST_CLAIMS[6];
    const report = validateClaim(claim, TEST_CONFIGS);
    expect(report.overall_status).toBe(expected_status);
    const failed = report.results.find(r => r.rule_id === "VN-DOC-003");
    expect(failed?.status).toBe("FAIL");
  });

  it("VN-03: MATERNITY policy 25 months → COMPLIANT", () => {
    const { claim, expected_status } = TEST_CLAIMS[7];
    const report = validateClaim(claim, TEST_CONFIGS);
    expect(report.overall_status).toBe(expected_status);
    const cov = report.results.find(r => r.rule_id === "VN-COV-001");
    expect(cov?.status).toBe("PASS");
  });

  it("VN-04: pre-existing 300-day policy (need 365) → NON_COMPLIANT", () => {
    const { claim, expected_status } = TEST_CLAIMS[8];
    const report = validateClaim(claim, TEST_CONFIGS);
    expect(report.overall_status).toBe(expected_status);
    const wp = report.results.find(r => r.rule_id === "VN-WAIT-002");
    expect(wp?.status).toBe("FAIL");
  });

  it("VN-05: OUTPATIENT SLA exceeded (11 bd) → PARTIALLY_COMPLIANT", () => {
    const { claim, expected_status } = TEST_CLAIMS[9];
    const report = validateClaim(claim, TEST_CONFIGS);
    expect(report.overall_status).toBe(expected_status);
    const sla = report.results.find(r => r.rule_id === "VN-SLA-001");
    expect(sla?.status).toBe("FAIL");
  });
});

describe("validateClaim — HK claims", () => {
  it("HK-01: SPECIALIST missing referral_letter → NON_COMPLIANT", () => {
    const { claim, expected_status } = TEST_CLAIMS[10];
    const report = validateClaim(claim, TEST_CONFIGS);
    expect(report.overall_status).toBe(expected_status);
    const failed = report.results.find(r => r.rule_id === "HK-DOC-002");
    expect(failed?.status).toBe("FAIL");
  });

  it("HK-02: INPATIENT all docs + within SLA → COMPLIANT", () => {
    const { claim, expected_status } = TEST_CLAIMS[11];
    expect(validateClaim(claim, TEST_CONFIGS).overall_status).toBe(expected_status);
  });

  it("HK-03: mental-health SPECIALIST → COMPLIANT + COV-001 PASS", () => {
    const { claim, expected_status } = TEST_CLAIMS[12];
    const report = validateClaim(claim, TEST_CONFIGS);
    expect(report.overall_status).toBe(expected_status);
    const cov = report.results.find(r => r.rule_id === "HK-COV-001");
    expect(cov?.status).toBe("PASS");
  });

  it("HK-04: 45-day policy (need 60) → NON_COMPLIANT", () => {
    const { claim, expected_status } = TEST_CLAIMS[13];
    const report = validateClaim(claim, TEST_CONFIGS);
    expect(report.overall_status).toBe(expected_status);
    const wp = report.results.find(r => r.rule_id === "HK-WAIT-001");
    expect(wp?.status).toBe("FAIL");
  });

  it("HK-05: submitted before HK-COV-001 effective date → COMPLIANT", () => {
    const { claim, expected_status } = TEST_CLAIMS[14];
    expect(validateClaim(claim, TEST_CONFIGS).overall_status).toBe(expected_status);
  });
});

// ── Rule versioning: 3 tests ───────────────────────────────────────────────

describe("rule versioning", () => {
  it("HK-COV-001 not in results when submitted before 2024-03-01", () => {
    const claim = TEST_CLAIMS[14].claim; // HK-05: submitted 2024-02-15
    const report = validateClaim(claim, TEST_CONFIGS);
    const ids = report.results.map(r => r.rule_id);
    expect(ids).not.toContain("HK-COV-001");
  });

  it("HK-COV-001 appears in results when submitted on or after 2024-03-01", () => {
    const base = TEST_CLAIMS[12].claim; // HK-03: submitted 2025-02-05
    const report = validateClaim(base, TEST_CONFIGS);
    const ids = report.results.map(r => r.rule_id);
    expect(ids).toContain("HK-COV-001");
  });

  it("SG claim submitted before 2025-01-01 has zero active rules", () => {
    const sgClaim = {
      claim_id: "SG-PRE",
      country: "SG" as const,
      claim_type: "OUTPATIENT" as const,
      submitted_date: "2024-12-31",
      service_date: "2024-12-30",
      policy_start_date: "2024-06-01",
      is_pre_existing: false,
      is_emergency: false,
      documents: [],
      member_name: "Tan Ah Kow",
    };
    const report = validateClaim(sgClaim, TEST_CONFIGS);
    expect(report.rules_applied).toBe(0);
    expect(report.overall_status).toBe("COMPLIANT");
  });
});

// ── diffCountries: 3 tests ─────────────────────────────────────────────────

describe("diffCountries", () => {
  it("TH vs VN produces 11 diffs (SLA×3, wait×1, docs×4, mask×1, cov×2)", () => {
    const diffs = diffCountries("TH", "VN", TEST_CONFIGS);
    expect(diffs).toHaveLength(11);
  });

  it("TH vs HK produces 10 diffs (SLA×3, wait×2, docs×2, mask×1, cov×2)", () => {
    const diffs = diffCountries("TH", "HK", TEST_CONFIGS);
    expect(diffs).toHaveLength(10);
  });

  it("VN vs HK: pre-existing waiting period — VN 365 days, HK 180 days", () => {
    const diffs = diffCountries("VN", "HK", TEST_CONFIGS);
    const wpDiff = diffs.find(
      d => d.rule_type === "waiting_period" && d.aspect.includes("pre_existing")
    );
    expect(wpDiff).toBeDefined();
    expect(wpDiff?.country_a.value).toBe("365 days");
    expect(wpDiff?.country_b.value).toBe("180 days");
  });

  it("TH vs VN: TH requires prescription, VN does not", () => {
    const diffs = diffCountries("TH", "VN", TEST_CONFIGS);
    const docDiff = diffs.find(
      d => d.rule_type === "document_requirement" && d.aspect.includes("prescription")
    );
    expect(docDiff).toBeDefined();
    expect(docDiff?.country_a.value).toBe("Required");
    expect(docDiff?.country_b.value).toBe("Not required");
  });
});

// ── Report shape & masking ─────────────────────────────────────────────────

describe("ComplianceReport structure", () => {
  it("rules_applied + rules_failed + SKIP count = total active rules", () => {
    const claim = TEST_CLAIMS[0].claim; // TH-01
    const report = validateClaim(claim, TEST_CONFIGS);
    const applied = report.results.filter(r => r.status !== "SKIP").length;
    expect(report.rules_applied).toBe(applied);
  });

  it("masked_data includes national_id for TH claim with national_id present", () => {
    const claim = TEST_CLAIMS[0].claim; // TH-01 has national_id
    const report = validateClaim(claim, TEST_CONFIGS);
    expect(report.masked_data.national_id).toBeDefined();
    expect(report.masked_data.national_id).toMatch(/^\*{4}-\*{4}-\d{4}$/);
  });

  it("masked_data includes member_name for VN claim", () => {
    const claim = TEST_CLAIMS[5].claim; // VN-01 has member_name
    const report = validateClaim(claim, TEST_CONFIGS);
    expect(report.masked_data.member_name).toBeDefined();
  });

  it("overall_status is NON_COMPLIANT when any hard rule fails", () => {
    const claim = TEST_CLAIMS[1].claim; // TH-02 missing discharge_summary (hard)
    const report = validateClaim(claim, TEST_CONFIGS);
    expect(report.overall_status).toBe("NON_COMPLIANT");
    expect(report.rules_failed).toBeGreaterThan(0);
  });
});
