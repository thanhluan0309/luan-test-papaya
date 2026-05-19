import type { Claim, ClaimInput, ClaimStatus, ListOptions, PaginatedResult } from "./types";
import { ValidationError } from "./errors";
import type { HttpClient } from "./client";

const VALID_CLAIM_TYPES = new Set(["OUTPATIENT", "INPATIENT", "DENTAL", "MATERNITY", "SPECIALIST"]);
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function validateInput(input: ClaimInput): void {
  const fields: Record<string, string> = {};

  if (!input.policyId?.trim()) fields.policyId = "required";
  if (!input.claimType || !VALID_CLAIM_TYPES.has(input.claimType)) {
    fields.claimType = `must be one of: ${[...VALID_CLAIM_TYPES].join(", ")}`;
  }
  if (!input.diagnosisCode?.trim()) fields.diagnosisCode = "required";
  if (!input.treatmentDate || !DATE_RE.test(input.treatmentDate)) {
    fields.treatmentDate = "required, format: YYYY-MM-DD";
  }
  if (input.amount == null) {
    fields.amount = "required";
  } else if (typeof input.amount !== "number" || input.amount <= 0) {
    fields.amount = "must be a positive number";
  }
  if (!input.currency?.trim()) fields.currency = "required";

  if (Object.keys(fields).length > 0) {
    throw new ValidationError("Validation failed", fields);
  }
}

export class ClaimsAPI {
  constructor(private readonly client: HttpClient) {}

  async create(input: ClaimInput): Promise<Claim> {
    validateInput(input);
    return this.client.request<Claim>("POST", "/claims", input);
  }

  async get(id: string): Promise<Claim> {
    return this.client.request<Claim>("GET", `/claims/${id}`);
  }

  async list(opts: ListOptions = {}): Promise<PaginatedResult<Claim>> {
    const params = new URLSearchParams();
    if (opts.status) params.set("status", opts.status);
    if (opts.page) params.set("page", String(opts.page));
    if (opts.pageSize) params.set("pageSize", String(opts.pageSize));
    const qs = params.toString();
    return this.client.request<PaginatedResult<Claim>>("GET", `/claims${qs ? `?${qs}` : ""}`);
  }

  onStatusChange(
    claimId: string,
    handler: (status: ClaimStatus, claim: Claim) => void,
    pollMs = 3000,
  ): () => void {
    let active = true;
    let last: ClaimStatus | undefined;

    (async () => {
      while (active) {
        try {
          const claim = await this.get(claimId);
          if (claim.status !== last) {
            last = claim.status;
            handler(claim.status, claim);
          }
        } catch {
          // ignore poll errors — transient failures shouldn't stop the subscription
        }
        await sleep(pollMs);
      }
    })();

    return () => { active = false; };
  }
}
