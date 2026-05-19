import type { SDKConfig } from "./types";
import { HttpClient } from "./client";
import { ClaimsAPI } from "./claims";
import { DocumentsAPI } from "./documents";

export class InsuranceSDK {
  readonly claims: ClaimsAPI;
  readonly documents: DocumentsAPI;

  constructor(config: SDKConfig) {
    const client = new HttpClient(config);
    this.claims = new ClaimsAPI(client);
    this.documents = new DocumentsAPI(client);
  }
}

export { ValidationError, AuthError, NetworkError, ApiError, SDKError } from "./errors";
export type {
  SDKConfig, ClaimInput, Claim, ClaimType, ClaimStatus,
  ListOptions, PaginatedResult, DocumentRecord, DocumentType, UploadOptions,
} from "./types";
