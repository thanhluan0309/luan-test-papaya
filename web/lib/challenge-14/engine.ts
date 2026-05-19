import CONFIG from "./config.json";
import type {
  StateMachineConfig,
  WorkflowClaim,
  TransitionInput,
  TransitionResult,
  TransitionDef,
} from "./types";

export const config: StateMachineConfig = CONFIG as StateMachineConfig;

// ── Precondition checks ───────────────────────────────────────────────────────
// Returns null on pass, error string on fail

type PreconditionCheck = (c: WorkflowClaim, i: TransitionInput) => string | null;

const PRECONDITIONS: Record<string, PreconditionCheck> = {
  all_documents_present: (c, i) => {
    const docs = i.documents?.length ? i.documents : c.documents;
    return docs.length > 0 ? null : "No documents have been submitted";
  },
  assessor_assigned: (c, i) => {
    return (i.assessorAssigned || c.assessorAssigned)
      ? null
      : "No assessor has been assigned";
  },
  assessment_report_complete: (c, i) => {
    return (i.assessmentReport || c.assessmentReport)
      ? null
      : "Assessment report is not complete";
  },
  amount_within_policy_limit: (c, i) => {
    const limit = i.policyLimit ?? c.policyLimit;
    const amount = i.claimAmount ?? c.claimAmount;
    if (limit != null && amount != null && amount > limit) {
      return `Claim amount ${amount} exceeds policy limit ${limit}`;
    }
    return null;
  },
  rejection_reason_provided: (c, i) => {
    return (i.rejectionReason || c.rejectionReason)
      ? null
      : "Rejection reason must be provided";
  },
  missing_info_description_provided: (c, i) => {
    return (i.missingInfoDescription || c.missingInfoDescription)
      ? null
      : "Description of missing information must be provided";
  },
  new_documents_received: (c, i) => {
    const docs = i.documents?.length ? i.documents : c.documents;
    return docs.length > 0 ? null : "No new documents or information has been received";
  },
  payment_request_created: (c, i) => {
    return (i.paymentRequestCreated || c.paymentRequestCreated)
      ? null
      : "Payment request has not been created";
  },
  payment_confirmed: (c, i) => {
    return (i.paymentConfirmed || c.paymentConfirmed)
      ? null
      : "Payment has not been confirmed";
  },
  appeal_expired_or_acknowledged: (c, i) => {
    if (i.appealPeriodExpired || c.appealPeriodExpired) return null;
    if (i.memberAcknowledged || c.memberAcknowledged) return null;
    return "Appeal period has not expired and member has not acknowledged the rejection";
  },
};

// ── Side effects (mocked — console.log) ──────────────────────────────────────

const SIDE_EFFECTS: Record<string, (c: WorkflowClaim) => void> = {
  notify_assessor_team:           (c) => console.log(`[notify] Assessor team notified for claim ${c.id}`),
  log_assessment_start:           (c) => console.log(`[log] Assessment started for ${c.id} at ${new Date().toISOString()}`),
  notify_member_approved:         (c) => console.log(`[notify] Member notified: claim ${c.id} approved`),
  create_payment_request:         (c) => console.log(`[payment] Payment request created for ${c.id}`),
  notify_member_rejected:         (c) => console.log(`[notify] Member notified: claim ${c.id} rejected — ${c.rejectionReason}`),
  notify_member_pending_info:     (c) => console.log(`[notify] Member notified: info required for ${c.id}: ${c.missingInfoDescription}`),
  reset_assessment_timer:         (c) => console.log(`[timer] Assessment timer reset for ${c.id}`),
  trigger_payment_system:         (c) => console.log(`[payment] Payment system triggered for ${c.id}`),
  notify_member_payment_reference:(c) => console.log(`[notify] Payment reference sent to member for ${c.id}`),
  archive_claim:                  (c) => console.log(`[archive] Claim ${c.id} archived`),
};

// ── Core functions ────────────────────────────────────────────────────────────

export function getAvailableTransitions(
  claim: WorkflowClaim,
  cfg: StateMachineConfig = config,
): TransitionDef[] {
  return cfg.transitions.filter((t) => t.from === claim.state);
}

export function executeTransition(
  claim: WorkflowClaim,
  input: TransitionInput,
  cfg: StateMachineConfig = config,
): TransitionResult {
  // 1. Find transition
  const transition = cfg.transitions.find(
    (t) => t.from === claim.state && t.to === input.to,
  );
  if (!transition) {
    const valid =
      getAvailableTransitions(claim, cfg)
        .map((t) => t.to)
        .join(", ") || "none";
    return {
      success: false,
      code: "INVALID_TRANSITION",
      error: `Cannot transition from ${claim.state} to ${input.to}. Valid targets from ${claim.state}: ${valid}.`,
    };
  }

  // 2. Role check
  if (!transition.authorizedRoles.includes(input.triggeredBy.role)) {
    return {
      success: false,
      code: "UNAUTHORIZED_ROLE",
      error: `Role "${input.triggeredBy.role}" is not authorized to perform ${claim.state} → ${input.to}. Authorized roles: ${transition.authorizedRoles.join(", ")}.`,
    };
  }

  // 3. Cycle detection (checked before preconditions)
  if (claim.state === "UNDER_ASSESSMENT" && input.to === "PENDING_INFO") {
    if (claim.pendingInfoCount >= 3) {
      return {
        success: false,
        code: "CYCLE_LIMIT_EXCEEDED",
        error: "Maximum information requests exceeded — escalate to team lead.",
      };
    }
  }

  // 4. Preconditions
  for (const precondId of transition.preconditions) {
    const check = PRECONDITIONS[precondId];
    if (!check) continue;
    const err = check(claim, input);
    if (err) {
      return {
        success: false,
        code: "PRECONDITION_FAILED",
        error: `Precondition "${precondId}" not met: ${err}.`,
      };
    }
  }

  // 5. Build updated claim
  const auditEntry = {
    id: `aud-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: new Date().toISOString(),
    fromState: claim.state,
    toState: input.to,
    triggeredBy: input.triggeredBy,
    reason: input.reason,
    sideEffectsExecuted: transition.sideEffects,
  };

  const updated: WorkflowClaim = {
    ...claim,
    state: input.to,
    documents:              input.documents              ?? claim.documents,
    assessorAssigned:       input.assessorAssigned       ?? claim.assessorAssigned,
    assessmentReport:       input.assessmentReport       ?? claim.assessmentReport,
    rejectionReason:        input.rejectionReason        ?? claim.rejectionReason,
    missingInfoDescription: input.missingInfoDescription ?? claim.missingInfoDescription,
    paymentRequestCreated:  input.paymentRequestCreated  ?? claim.paymentRequestCreated,
    paymentConfirmed:       input.paymentConfirmed       ?? claim.paymentConfirmed,
    appealPeriodExpired:    input.appealPeriodExpired    ?? claim.appealPeriodExpired,
    memberAcknowledged:     input.memberAcknowledged     ?? claim.memberAcknowledged,
    policyLimit:            input.policyLimit            ?? claim.policyLimit,
    claimAmount:            input.claimAmount            ?? claim.claimAmount,
    pendingInfoCount:
      claim.state === "UNDER_ASSESSMENT" && input.to === "PENDING_INFO"
        ? claim.pendingInfoCount + 1
        : claim.pendingInfoCount,
    auditTrail: [...claim.auditTrail, auditEntry],
    updatedAt: new Date().toISOString(),
  };

  // 6. Side effects
  for (const seId of transition.sideEffects) {
    SIDE_EFFECTS[seId]?.(updated);
  }

  return { success: true, claim: updated, sideEffectsExecuted: transition.sideEffects };
}
