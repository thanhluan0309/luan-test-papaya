export type ClaimType = "OUTPATIENT" | "INPATIENT" | "DENTAL" | "MATERNITY" | "SPECIALIST";
export type ClaimStatus = "PENDING" | "PROCESSING" | "APPROVED" | "REJECTED";
export type DocumentType =
  | "medical_receipt"
  | "discharge_summary"
  | "prescription"
  | "referral_letter"
  | "id_card_copy";

export interface SDKConfig {
  apiKey: string;
  environment: "sandbox" | "production";
  baseUrl?: string;
  timeout?: number;
  maxRetries?: number;
  retryBaseDelay?: number;
}

export interface ClaimInput {
  policyId: string;
  claimType: ClaimType;
  diagnosisCode: string;
  treatmentDate: string;
  amount: number;
  currency: string;
}

export interface Claim extends ClaimInput {
  id: string;
  status: ClaimStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ListOptions {
  status?: ClaimStatus;
  page?: number;
  pageSize?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface DocumentRecord {
  id: string;
  claimId: string;
  type: DocumentType;
  filename: string;
  size: number;
  uploadedAt: string;
}

export interface UploadOptions {
  type: DocumentType;
  onProgress?: (percent: number) => void;
}
