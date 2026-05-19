export type ClaimState =
  | "SUBMITTED"
  | "DOCUMENTS_VERIFIED"
  | "UNDER_ASSESSMENT"
  | "PENDING_INFO"
  | "APPROVED"
  | "REJECTED"
  | "PAYMENT_INITIATED"
  | "CLOSED";

export type AuthRole =
  | "document_clerk"
  | "team_lead"
  | "assessor"
  | "finance"
  | "system";

export interface TransitionDef {
  from: ClaimState;
  to: ClaimState;
  preconditions: string[];
  sideEffects: string[];
  authorizedRoles: AuthRole[];
}

export interface StateMachineConfig {
  states: ClaimState[];
  transitions: TransitionDef[];
}

export interface AuditEntry {
  id: string;
  timestamp: string;
  fromState: ClaimState;
  toState: ClaimState;
  triggeredBy: { userId: string; role: AuthRole };
  reason?: string;
  sideEffectsExecuted: string[];
}

export interface WorkflowClaim {
  id: string;
  state: ClaimState;
  documents: string[];
  assessorAssigned?: string;
  assessmentReport?: string;
  rejectionReason?: string;
  missingInfoDescription?: string;
  paymentRequestCreated: boolean;
  paymentConfirmed: boolean;
  appealPeriodExpired: boolean;
  memberAcknowledged: boolean;
  policyLimit?: number;
  claimAmount?: number;
  pendingInfoCount: number;
  auditTrail: readonly AuditEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface TransitionInput {
  to: ClaimState;
  triggeredBy: { userId: string; role: AuthRole };
  reason?: string;
  documents?: string[];
  assessorAssigned?: string;
  assessmentReport?: string;
  rejectionReason?: string;
  missingInfoDescription?: string;
  paymentRequestCreated?: boolean;
  paymentConfirmed?: boolean;
  appealPeriodExpired?: boolean;
  memberAcknowledged?: boolean;
  policyLimit?: number;
  claimAmount?: number;
}

export type TransitionErrorCode =
  | "INVALID_TRANSITION"
  | "PRECONDITION_FAILED"
  | "UNAUTHORIZED_ROLE"
  | "CYCLE_LIMIT_EXCEEDED";

export type TransitionResult =
  | { success: true; claim: WorkflowClaim; sideEffectsExecuted: string[] }
  | { success: false; error: string; code: TransitionErrorCode };
