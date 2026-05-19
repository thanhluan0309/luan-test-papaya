import { describe, it, expect, beforeEach } from "vitest";
import { executeTransition, getAvailableTransitions, config } from "./engine";
import type { WorkflowClaim, TransitionInput } from "./types";

function makeClaim(overrides: Partial<WorkflowClaim> = {}): WorkflowClaim {
  const now = new Date().toISOString();
  return {
    id: "CLM14-TEST",
    state: "SUBMITTED",
    documents: [],
    pendingInfoCount: 0,
    paymentRequestCreated: false,
    paymentConfirmed: false,
    appealPeriodExpired: false,
    memberAcknowledged: false,
    auditTrail: [],
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

// ── Scenario 1: Happy path ─────────────────────────────────────────────────────

describe("Scenario 1: Happy path — SUBMITTED → CLOSED", () => {
  it("SUBMITTED → DOCUMENTS_VERIFIED", () => {
    const claim = makeClaim();
    const result = executeTransition(claim, {
      to: "DOCUMENTS_VERIFIED",
      triggeredBy: { userId: "clerk1", role: "document_clerk" },
      documents: ["medical_receipt", "id_card_copy"],
    });
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.claim.state).toBe("DOCUMENTS_VERIFIED");
    expect(result.claim.documents).toEqual(["medical_receipt", "id_card_copy"]);
    expect(result.sideEffectsExecuted).toContain("notify_assessor_team");
    expect(result.claim.auditTrail).toHaveLength(1);
  });

  it("DOCUMENTS_VERIFIED → UNDER_ASSESSMENT", () => {
    const claim = makeClaim({ state: "DOCUMENTS_VERIFIED", documents: ["medical_receipt"] });
    const result = executeTransition(claim, {
      to: "UNDER_ASSESSMENT",
      triggeredBy: { userId: "lead1", role: "team_lead" },
      assessorAssigned: "assessor-007",
    });
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.claim.state).toBe("UNDER_ASSESSMENT");
    expect(result.claim.assessorAssigned).toBe("assessor-007");
  });

  it("UNDER_ASSESSMENT → APPROVED", () => {
    const claim = makeClaim({
      state: "UNDER_ASSESSMENT",
      assessorAssigned: "assessor-007",
      policyLimit: 50000,
      claimAmount: 30000,
    });
    const result = executeTransition(claim, {
      to: "APPROVED",
      triggeredBy: { userId: "assessor-007", role: "assessor" },
      assessmentReport: "Report complete — valid claim",
    });
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.claim.state).toBe("APPROVED");
    expect(result.sideEffectsExecuted).toContain("notify_member_approved");
    expect(result.sideEffectsExecuted).toContain("create_payment_request");
  });

  it("APPROVED → PAYMENT_INITIATED", () => {
    const claim = makeClaim({ state: "APPROVED", assessmentReport: "done" });
    const result = executeTransition(claim, {
      to: "PAYMENT_INITIATED",
      triggeredBy: { userId: "finance1", role: "finance" },
      paymentRequestCreated: true,
    });
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.claim.state).toBe("PAYMENT_INITIATED");
    expect(result.sideEffectsExecuted).toContain("trigger_payment_system");
  });

  it("PAYMENT_INITIATED → CLOSED", () => {
    const claim = makeClaim({
      state: "PAYMENT_INITIATED",
      paymentRequestCreated: true,
    });
    const result = executeTransition(claim, {
      to: "CLOSED",
      triggeredBy: { userId: "finance1", role: "finance" },
      paymentConfirmed: true,
    });
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.claim.state).toBe("CLOSED");
    expect(result.sideEffectsExecuted).toContain("notify_member_payment_reference");
  });
});

// ── Scenario 2: Rejection path ────────────────────────────────────────────────

describe("Scenario 2: Rejection path — UNDER_ASSESSMENT → CLOSED", () => {
  it("UNDER_ASSESSMENT → REJECTED", () => {
    const claim = makeClaim({ state: "UNDER_ASSESSMENT", assessorAssigned: "assessor-1" });
    const result = executeTransition(claim, {
      to: "REJECTED",
      triggeredBy: { userId: "assessor-1", role: "assessor" },
      assessmentReport: "Claim is fraudulent",
      rejectionReason: "Fraudulent documentation detected",
    });
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.claim.state).toBe("REJECTED");
    expect(result.sideEffectsExecuted).toContain("notify_member_rejected");
  });

  it("REJECTED → CLOSED (appeal expired)", () => {
    const claim = makeClaim({ state: "REJECTED", rejectionReason: "Fraud" });
    const result = executeTransition(claim, {
      to: "CLOSED",
      triggeredBy: { userId: "system", role: "system" },
      appealPeriodExpired: true,
    });
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.claim.state).toBe("CLOSED");
    expect(result.sideEffectsExecuted).toContain("archive_claim");
  });

  it("REJECTED → CLOSED (member acknowledged)", () => {
    const claim = makeClaim({ state: "REJECTED", rejectionReason: "Fraud" });
    const result = executeTransition(claim, {
      to: "CLOSED",
      triggeredBy: { userId: "system", role: "system" },
      memberAcknowledged: true,
    });
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.claim.state).toBe("CLOSED");
  });
});

// ── Scenario 3: Info loop ─────────────────────────────────────────────────────

describe("Scenario 3: Request more info loop", () => {
  it("completes one PENDING_INFO cycle and then approves", () => {
    let claim = makeClaim({ state: "UNDER_ASSESSMENT", assessorAssigned: "a1" });

    // → PENDING_INFO
    let r = executeTransition(claim, {
      to: "PENDING_INFO",
      triggeredBy: { userId: "a1", role: "assessor" },
      missingInfoDescription: "Need lab results",
    });
    expect(r.success).toBe(true);
    if (!r.success) return;
    claim = r.claim;
    expect(claim.state).toBe("PENDING_INFO");
    expect(claim.pendingInfoCount).toBe(1);

    // PENDING_INFO → DOCUMENTS_VERIFIED
    r = executeTransition(claim, {
      to: "DOCUMENTS_VERIFIED",
      triggeredBy: { userId: "clerk1", role: "document_clerk" },
      documents: ["lab_results"],
    });
    expect(r.success).toBe(true);
    if (!r.success) return;
    claim = r.claim;
    expect(claim.state).toBe("DOCUMENTS_VERIFIED");

    // DOCUMENTS_VERIFIED → UNDER_ASSESSMENT
    r = executeTransition(claim, {
      to: "UNDER_ASSESSMENT",
      triggeredBy: { userId: "lead1", role: "team_lead" },
      assessorAssigned: "a1",
    });
    expect(r.success).toBe(true);
    if (!r.success) return;
    claim = r.claim;

    // UNDER_ASSESSMENT → APPROVED
    r = executeTransition(claim, {
      to: "APPROVED",
      triggeredBy: { userId: "a1", role: "assessor" },
      assessmentReport: "All clear after additional docs",
    });
    expect(r.success).toBe(true);
    if (!r.success) return;
    expect(r.claim.state).toBe("APPROVED");
  });
});

// ── Scenario 4: Invalid transition ───────────────────────────────────────────

describe("Scenario 4: Invalid transition", () => {
  it("SUBMITTED → APPROVED returns INVALID_TRANSITION with valid targets listed", () => {
    const claim = makeClaim();
    const result = executeTransition(claim, {
      to: "APPROVED",
      triggeredBy: { userId: "admin", role: "assessor" },
    });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.code).toBe("INVALID_TRANSITION");
    expect(result.error).toContain("SUBMITTED");
    expect(result.error).toContain("APPROVED");
    expect(result.error).toContain("DOCUMENTS_VERIFIED");
  });

  it("CLOSED → SUBMITTED returns INVALID_TRANSITION with none", () => {
    const claim = makeClaim({ state: "CLOSED" });
    const result = executeTransition(claim, {
      to: "SUBMITTED",
      triggeredBy: { userId: "admin", role: "system" },
    });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.code).toBe("INVALID_TRANSITION");
    expect(result.error).toContain("none");
  });
});

// ── Scenario 5: Unauthorized role ────────────────────────────────────────────

describe("Scenario 5: Unauthorized role", () => {
  it("finance role cannot verify documents", () => {
    const claim = makeClaim();
    const result = executeTransition(claim, {
      to: "DOCUMENTS_VERIFIED",
      triggeredBy: { userId: "fin1", role: "finance" },
      documents: ["receipt"],
    });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.code).toBe("UNAUTHORIZED_ROLE");
    expect(result.error).toContain("finance");
    expect(result.error).toContain("document_clerk");
  });

  it("document_clerk cannot approve", () => {
    const claim = makeClaim({
      state: "UNDER_ASSESSMENT",
      assessorAssigned: "a1",
      assessmentReport: "done",
    });
    const result = executeTransition(claim, {
      to: "APPROVED",
      triggeredBy: { userId: "clerk1", role: "document_clerk" },
    });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.code).toBe("UNAUTHORIZED_ROLE");
  });
});

// ── Unit: precondition failures ───────────────────────────────────────────────

describe("Precondition failures", () => {
  it("no documents → PRECONDITION_FAILED", () => {
    const claim = makeClaim(); // documents: []
    const result = executeTransition(claim, {
      to: "DOCUMENTS_VERIFIED",
      triggeredBy: { userId: "clerk1", role: "document_clerk" },
    });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.code).toBe("PRECONDITION_FAILED");
    expect(result.error).toContain("No documents");
  });

  it("no assessor assigned → PRECONDITION_FAILED", () => {
    const claim = makeClaim({ state: "DOCUMENTS_VERIFIED", documents: ["receipt"] });
    const result = executeTransition(claim, {
      to: "UNDER_ASSESSMENT",
      triggeredBy: { userId: "lead1", role: "team_lead" },
    });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.code).toBe("PRECONDITION_FAILED");
    expect(result.error).toContain("assessor");
  });

  it("no assessment report → PRECONDITION_FAILED on APPROVED", () => {
    const claim = makeClaim({ state: "UNDER_ASSESSMENT", assessorAssigned: "a1" });
    const result = executeTransition(claim, {
      to: "APPROVED",
      triggeredBy: { userId: "a1", role: "assessor" },
    });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.code).toBe("PRECONDITION_FAILED");
  });

  it("no rejection reason → PRECONDITION_FAILED on REJECTED", () => {
    const claim = makeClaim({ state: "UNDER_ASSESSMENT", assessorAssigned: "a1", assessmentReport: "done" });
    const result = executeTransition(claim, {
      to: "REJECTED",
      triggeredBy: { userId: "a1", role: "assessor" },
    });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.code).toBe("PRECONDITION_FAILED");
    expect(result.error).toContain("Rejection reason");
  });

  it("claim amount exceeds policy limit → PRECONDITION_FAILED", () => {
    const claim = makeClaim({
      state: "UNDER_ASSESSMENT",
      assessorAssigned: "a1",
      policyLimit: 10000,
      claimAmount: 20000,
    });
    const result = executeTransition(claim, {
      to: "APPROVED",
      triggeredBy: { userId: "a1", role: "assessor" },
      assessmentReport: "done",
    });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.code).toBe("PRECONDITION_FAILED");
    expect(result.error).toContain("exceeds policy limit");
  });

  it("no payment request → PRECONDITION_FAILED on PAYMENT_INITIATED", () => {
    const claim = makeClaim({ state: "APPROVED" });
    const result = executeTransition(claim, {
      to: "PAYMENT_INITIATED",
      triggeredBy: { userId: "fin1", role: "finance" },
    });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.code).toBe("PRECONDITION_FAILED");
  });

  it("no payment confirmed → PRECONDITION_FAILED on CLOSED", () => {
    const claim = makeClaim({ state: "PAYMENT_INITIATED", paymentRequestCreated: true });
    const result = executeTransition(claim, {
      to: "CLOSED",
      triggeredBy: { userId: "fin1", role: "finance" },
    });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.code).toBe("PRECONDITION_FAILED");
  });

  it("no appeal acknowledgment → PRECONDITION_FAILED on REJECTED → CLOSED", () => {
    const claim = makeClaim({ state: "REJECTED", rejectionReason: "Fraud" });
    const result = executeTransition(claim, {
      to: "CLOSED",
      triggeredBy: { userId: "system", role: "system" },
    });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.code).toBe("PRECONDITION_FAILED");
    expect(result.error).toContain("Appeal");
  });
});

// ── Unit: cycle detection ─────────────────────────────────────────────────────

describe("Cycle detection", () => {
  function buildCycledClaim(count: number): WorkflowClaim {
    return makeClaim({ state: "UNDER_ASSESSMENT", assessorAssigned: "a1", pendingInfoCount: count });
  }

  it("3rd PENDING_INFO request succeeds (pendingInfoCount=2 → 3)", () => {
    const claim = buildCycledClaim(2);
    const result = executeTransition(claim, {
      to: "PENDING_INFO",
      triggeredBy: { userId: "a1", role: "assessor" },
      missingInfoDescription: "Need more docs",
    });
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.claim.pendingInfoCount).toBe(3);
  });

  it("4th PENDING_INFO request → CYCLE_LIMIT_EXCEEDED", () => {
    const claim = buildCycledClaim(3);
    const result = executeTransition(claim, {
      to: "PENDING_INFO",
      triggeredBy: { userId: "a1", role: "assessor" },
      missingInfoDescription: "Yet more docs",
    });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.code).toBe("CYCLE_LIMIT_EXCEEDED");
    expect(result.error).toContain("Maximum information requests exceeded");
  });
});

// ── Unit: getAvailableTransitions ─────────────────────────────────────────────

describe("getAvailableTransitions", () => {
  it("from SUBMITTED → 1 transition (to DOCUMENTS_VERIFIED)", () => {
    const t = getAvailableTransitions(makeClaim());
    expect(t).toHaveLength(1);
    expect(t[0].to).toBe("DOCUMENTS_VERIFIED");
  });

  it("from UNDER_ASSESSMENT → 3 transitions", () => {
    const t = getAvailableTransitions(makeClaim({ state: "UNDER_ASSESSMENT" }));
    expect(t).toHaveLength(3);
    const targets = t.map((x) => x.to).sort();
    expect(targets).toEqual(["APPROVED", "PENDING_INFO", "REJECTED"].sort());
  });

  it("from CLOSED → 0 transitions", () => {
    const t = getAvailableTransitions(makeClaim({ state: "CLOSED" }));
    expect(t).toHaveLength(0);
  });
});

// ── Unit: audit trail ─────────────────────────────────────────────────────────

describe("Audit trail", () => {
  it("accumulates an entry per transition", () => {
    let claim = makeClaim();
    const r1 = executeTransition(claim, {
      to: "DOCUMENTS_VERIFIED",
      triggeredBy: { userId: "clerk1", role: "document_clerk" },
      documents: ["receipt"],
    });
    expect(r1.success).toBe(true);
    if (!r1.success) return;
    claim = r1.claim;

    const r2 = executeTransition(claim, {
      to: "UNDER_ASSESSMENT",
      triggeredBy: { userId: "lead1", role: "team_lead" },
      assessorAssigned: "a1",
    });
    expect(r2.success).toBe(true);
    if (!r2.success) return;
    expect(r2.claim.auditTrail).toHaveLength(2);
  });

  it("audit entries contain correct from/to/role/sideEffects", () => {
    const claim = makeClaim();
    const result = executeTransition(claim, {
      to: "DOCUMENTS_VERIFIED",
      triggeredBy: { userId: "clerk1", role: "document_clerk" },
      documents: ["receipt"],
      reason: "All docs in order",
    });
    expect(result.success).toBe(true);
    if (!result.success) return;
    const entry = result.claim.auditTrail[0];
    expect(entry.fromState).toBe("SUBMITTED");
    expect(entry.toState).toBe("DOCUMENTS_VERIFIED");
    expect(entry.triggeredBy.role).toBe("document_clerk");
    expect(entry.reason).toBe("All docs in order");
    expect(entry.sideEffectsExecuted).toContain("notify_assessor_team");
    expect(entry.timestamp).toBeTruthy();
  });
});
