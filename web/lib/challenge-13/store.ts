import type { ClaimInput, ClaimStatus, DocumentType } from "./sdk/types";

export interface ClaimRecord extends ClaimInput {
  id: string;
  createdAt: string;
  apiKey: string;
}

export interface DocumentRecord {
  id: string;
  claimId: string;
  type: DocumentType;
  filename: string;
  size: number;
  uploadedAt: string;
}

class Store {
  claims = new Map<string, ClaimRecord>();
  documents = new Map<string, DocumentRecord[]>();
}

export function computeStatus(claim: ClaimRecord): ClaimStatus {
  const ageSeconds = (Date.now() - new Date(claim.createdAt).getTime()) / 1000;
  if (ageSeconds > 15) return "APPROVED";
  if (ageSeconds > 5) return "PROCESSING";
  return "PENDING";
}

declare global {
  // eslint-disable-next-line no-var
  var _ch13Store: Store | undefined;
}

export const store: Store = global._ch13Store ??= new Store();
