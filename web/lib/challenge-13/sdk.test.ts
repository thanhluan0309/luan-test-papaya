import { beforeEach, describe, expect, it, vi } from "vitest";
import { InsuranceSDK, ValidationError, AuthError, NetworkError, ApiError } from "./sdk/index";

// ── Helpers ──────────────────────────────────────────────────────────────────

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

function res(body: unknown, status = 200): Promise<Response> {
  return Promise.resolve(
    new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    }),
  );
}

const TOKEN_RES = { token: "hdr.payload.sig", expiresAt: Date.now() + 3_600_000 };

const VALID_CLAIM = {
  policyId: "POL-001",
  claimType: "OUTPATIENT" as const,
  diagnosisCode: "J06.9",
  treatmentDate: "2025-01-15",
  amount: 15000,
  currency: "THB",
};

const CLAIM_RES = {
  id: "CLM-ABC",
  ...VALID_CLAIM,
  status: "PENDING",
  createdAt: "2025-01-15T10:00:00Z",
  updatedAt: "2025-01-15T10:00:00Z",
};

const DOC_RES = {
  id: "DOC-ABC",
  claimId: "CLM-ABC",
  type: "medical_receipt",
  filename: "receipt.pdf",
  size: 1024,
  uploadedAt: "2025-01-15T10:01:00Z",
};

// SDK factory — retryBaseDelay: 0 so retry tests run instantly
function sdk(overrides: Record<string, unknown> = {}) {
  return new InsuranceSDK({
    apiKey: "pk_test_demo",
    environment: "sandbox",
    baseUrl: "http://mock",
    timeout: 5000,
    maxRetries: 3,
    retryBaseDelay: 0,
    ...overrides,
  });
}

// Each test gets a clean fetch mock with TOKEN_RES queued first (covers auth call)
beforeEach(() => {
  mockFetch.mockReset();
  mockFetch.mockResolvedValueOnce(res(TOKEN_RES));
});

// ── 1. Success flows ──────────────────────────────────────────────────────────

describe("success flows", () => {
  it("creates a claim and returns it", async () => {
    mockFetch.mockResolvedValueOnce(res(CLAIM_RES, 201));
    const claim = await sdk().claims.create(VALID_CLAIM);
    expect(claim.id).toBe("CLM-ABC");
    expect(claim.status).toBe("PENDING");
  });

  it("gets a claim by id", async () => {
    mockFetch.mockResolvedValueOnce(res(CLAIM_RES));
    const claim = await sdk().claims.get("CLM-ABC");
    expect(claim.id).toBe("CLM-ABC");
    expect(claim.policyId).toBe("POL-001");
  });

  it("lists claims with pagination result", async () => {
    const listRes = { data: [CLAIM_RES], total: 1, page: 1, pageSize: 20 };
    mockFetch.mockResolvedValueOnce(res(listRes));
    const result = await sdk().claims.list({ status: "PENDING" });
    expect(result.data).toHaveLength(1);
    expect(result.total).toBe(1);
  });

  it("uploads a document and returns doc record", async () => {
    mockFetch.mockResolvedValueOnce(res(DOC_RES, 201));
    const file = new Blob(["content"], { type: "application/pdf" });
    const doc = await sdk().documents.upload("CLM-ABC", file, { type: "medical_receipt" });
    expect(doc.id).toBe("DOC-ABC");
    expect(doc.type).toBe("medical_receipt");
  });

  it("lists documents for a claim", async () => {
    mockFetch.mockResolvedValueOnce(res([DOC_RES]));
    const docs = await sdk().documents.list("CLM-ABC");
    expect(docs).toHaveLength(1);
    expect(docs[0].id).toBe("DOC-ABC");
  });
});

// ── 2. Client-side validation ─────────────────────────────────────────────────

describe("client-side validation", () => {
  it("throws ValidationError when policyId is missing", async () => {
    await expect(sdk().claims.create({ ...VALID_CLAIM, policyId: "" }))
      .rejects.toBeInstanceOf(ValidationError);
  });

  it("throws ValidationError when amount is undefined", async () => {
    await expect(sdk().claims.create({ ...VALID_CLAIM, amount: undefined as unknown as number }))
      .rejects.toBeInstanceOf(ValidationError);
  });

  it("throws ValidationError with field when amount is negative", async () => {
    const err = await sdk().claims.create({ ...VALID_CLAIM, amount: -100 }).catch(e => e) as ValidationError;
    expect(err).toBeInstanceOf(ValidationError);
    expect(err.fields.amount).toBeDefined();
  });

  it("throws ValidationError when treatmentDate has wrong format", async () => {
    const err = await sdk().claims.create({ ...VALID_CLAIM, treatmentDate: "15/01/2025" }).catch(e => e) as ValidationError;
    expect(err).toBeInstanceOf(ValidationError);
    expect(err.fields.treatmentDate).toBeDefined();
  });

  it("throws ValidationError when diagnosisCode is blank", async () => {
    await expect(sdk().claims.create({ ...VALID_CLAIM, diagnosisCode: "  " }))
      .rejects.toBeInstanceOf(ValidationError);
  });
});

// ── 3. Authentication ─────────────────────────────────────────────────────────

describe("authentication", () => {
  it("auto-acquires token on first request", async () => {
    mockFetch.mockResolvedValueOnce(res(CLAIM_RES, 201));
    await sdk().claims.create(VALID_CLAIM);
    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect((mockFetch.mock.calls[0] as unknown[])[0]).toContain("/auth/token");
  });

  it("auto-refreshes an expired cached token before next request", async () => {
    const s = sdk();
    // Force the cached token to be expired
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (s.claims as any).client.token = { value: "stale", expiresAt: Date.now() - 10_000 };

    // beforeEach TOKEN_RES covers the refresh; add the actual response
    mockFetch.mockResolvedValueOnce(res(CLAIM_RES, 201));

    const claim = await s.claims.create(VALID_CLAIM);
    expect(claim.id).toBe("CLM-ABC");
    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect((mockFetch.mock.calls[0] as unknown[])[0]).toContain("/auth/token");
  });

  it("throws AuthError when auth endpoint returns 401", async () => {
    mockFetch.mockReset();
    mockFetch.mockResolvedValueOnce(res({ message: "Invalid API key" }, 401));
    await expect(
      new InsuranceSDK({ apiKey: "bad_key", environment: "sandbox", baseUrl: "http://mock" })
        .claims.get("CLM-001"),
    ).rejects.toBeInstanceOf(AuthError);
  });

  it("throws AuthError when protected route returns 401", async () => {
    mockFetch.mockResolvedValueOnce(res({ message: "Unauthorized" }, 401));
    await expect(sdk().claims.get("CLM-001")).rejects.toBeInstanceOf(AuthError);
  });
});

// ── 4. Retry logic ────────────────────────────────────────────────────────────

describe("retry logic", () => {
  it("retries on 503 and succeeds on next attempt", async () => {
    mockFetch
      .mockResolvedValueOnce(res({ message: "unavailable" }, 503))
      .mockResolvedValueOnce(res(CLAIM_RES, 201));
    const claim = await sdk().claims.create(VALID_CLAIM);
    expect(claim.id).toBe("CLM-ABC");
    expect(mockFetch).toHaveBeenCalledTimes(3); // auth + 503 + success
  });

  it("retries on TypeError (network error) and succeeds", async () => {
    mockFetch
      .mockRejectedValueOnce(new TypeError("fetch failed"))
      .mockResolvedValueOnce(res(CLAIM_RES, 201));
    const claim = await sdk().claims.create(VALID_CLAIM);
    expect(claim.id).toBe("CLM-ABC");
  });

  it("throws ApiError after exhausting max retries on 503", async () => {
    mockFetch
      .mockResolvedValueOnce(res({ message: "unavailable" }, 503))
      .mockResolvedValueOnce(res({ message: "unavailable" }, 503))
      .mockResolvedValueOnce(res({ message: "unavailable" }, 503));
    const s = sdk({ maxRetries: 2 });
    await expect(s.claims.create(VALID_CLAIM)).rejects.toBeInstanceOf(ApiError);
    expect(mockFetch).toHaveBeenCalledTimes(4); // auth + 3 attempts
  });

  it("does not retry on 400 — throws immediately", async () => {
    mockFetch.mockResolvedValueOnce(
      res({ message: "Validation failed", errors: { amount: "must be positive" } }, 400),
    );
    await expect(sdk().claims.create(VALID_CLAIM)).rejects.toBeInstanceOf(ValidationError);
    expect(mockFetch).toHaveBeenCalledTimes(2); // auth + 1 attempt only
  });
});

// ── 5. Error mapping ──────────────────────────────────────────────────────────

describe("error mapping", () => {
  it("maps 400 + errors body to ValidationError with fields populated", async () => {
    mockFetch.mockResolvedValueOnce(
      res({ message: "Validation failed", errors: { policyId: "required", amount: "must be positive" } }, 400),
    );
    const err = await sdk().claims.create(VALID_CLAIM).catch(e => e) as ValidationError;
    expect(err).toBeInstanceOf(ValidationError);
    expect(err.fields.policyId).toBe("required");
    expect(err.fields.amount).toBe("must be positive");
  });

  it("maps 401 to AuthError", async () => {
    mockFetch.mockResolvedValueOnce(res({ message: "Unauthorized" }, 401));
    await expect(sdk().claims.get("X")).rejects.toBeInstanceOf(AuthError);
  });

  it("maps 500 to ApiError with correct statusCode", async () => {
    mockFetch.mockResolvedValueOnce(res({ message: "Internal error" }, 500));
    const s = sdk({ maxRetries: 0 });
    const err = await s.claims.get("X").catch(e => e) as ApiError;
    expect(err).toBeInstanceOf(ApiError);
    expect(err.statusCode).toBe(500);
  });

  it("maps AbortError to NetworkError", async () => {
    mockFetch.mockReset();
    mockFetch
      .mockResolvedValueOnce(res(TOKEN_RES))
      .mockImplementationOnce(() => {
        const err = new Error("The operation was aborted");
        err.name = "AbortError";
        return Promise.reject(err);
      });
    const s = sdk({ maxRetries: 0 });
    await expect(s.claims.get("X")).rejects.toBeInstanceOf(NetworkError);
  });
});
