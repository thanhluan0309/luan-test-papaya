import type { WorkflowClaim } from "./types";

declare global {
  // eslint-disable-next-line no-var
  var _ch14Store: Ch14Store | undefined;
}

class Ch14Store {
  claims = new Map<string, WorkflowClaim>();
}

export const store: Ch14Store = (global._ch14Store ??= new Ch14Store());

export function createClaim(data: { policyLimit?: number; claimAmount?: number } = {}): WorkflowClaim {
  const id = `CLM14-${Date.now().toString(36).toUpperCase()}`;
  const now = new Date().toISOString();
  const claim: WorkflowClaim = {
    id,
    state: "SUBMITTED",
    documents: [],
    pendingInfoCount: 0,
    paymentRequestCreated: false,
    paymentConfirmed: false,
    appealPeriodExpired: false,
    memberAcknowledged: false,
    ...data,
    auditTrail: [],
    createdAt: now,
    updatedAt: now,
  };
  store.claims.set(id, claim);
  return claim;
}
