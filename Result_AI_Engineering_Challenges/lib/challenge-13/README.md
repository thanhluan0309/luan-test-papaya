# Insurance Partner SDK — Challenge 13

TypeScript SDK for submitting insurance claims, uploading documents, and tracking claim status. Includes a mock API server built with Next.js.

---

## Quick Start

```typescript
import { InsuranceSDK } from "@/lib/challenge-13/sdk";

const sdk = new InsuranceSDK({
  apiKey: "pk_test_your_key",
  environment: "sandbox",
});

// Create a claim
const claim = await sdk.claims.create({
  policyId: "POL-123",
  claimType: "OUTPATIENT",
  diagnosisCode: "J06.9",
  treatmentDate: "2025-01-15",
  amount: 15000,
  currency: "THB",
});

// Handle errors
try {
  await sdk.claims.create({ /* invalid */ });
} catch (err) {
  if (err instanceof ValidationError) console.log(err.fields);
  if (err instanceof AuthError)       console.log("Re-authenticate");
  if (err instanceof NetworkError)    console.log("Retry later");
}
```

---

## SDK Configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `apiKey` | `string` | required | Your API key (`pk_test_…` or `pk_live_…`) |
| `environment` | `"sandbox" \| "production"` | required | Target environment |
| `baseUrl` | `string` | `/api/challenge-13/v1` | Override API base URL |
| `timeout` | `number` | `30000` | Request timeout in ms |
| `maxRetries` | `number` | `3` | Max retries on 503 / network errors |

---

## API Reference

### `sdk.claims.create(input)`
Submit a new claim. Validates fields client-side before making the API call.

```typescript
const claim = await sdk.claims.create({
  policyId: string,        // required
  claimType: ClaimType,    // "OUTPATIENT" | "INPATIENT" | "DENTAL" | "MATERNITY" | "SPECIALIST"
  diagnosisCode: string,   // ICD-10 code, required
  treatmentDate: string,   // YYYY-MM-DD, required
  amount: number,          // must be > 0
  currency: string,        // e.g. "THB", required
});
// Returns: Claim
```

### `sdk.claims.get(id)`
```typescript
const claim = await sdk.claims.get("CLM-001");
// Returns: Claim with current status
```

### `sdk.claims.list(options?)`
```typescript
const result = await sdk.claims.list({
  status: "PENDING",  // optional filter
  page: 1,
  pageSize: 20,
});
// Returns: PaginatedResult<Claim>
```

### `sdk.claims.onStatusChange(claimId, handler, pollIntervalMs?)`
Subscribe to status changes via polling. Returns an unsubscribe function.

```typescript
const unsubscribe = sdk.claims.onStatusChange(
  "CLM-001",
  (status, claim) => console.log(`Now: ${status}`),
  3000, // poll every 3s (default)
);
setTimeout(unsubscribe, 30_000);
```

### `sdk.documents.upload(claimId, file, options)`
```typescript
const doc = await sdk.documents.upload("CLM-001", file, {
  type: "medical_receipt",
  onProgress: (pct) => console.log(`${pct}%`),
});
// Returns: DocumentRecord
```

### `sdk.documents.list(claimId)`
```typescript
const docs = await sdk.documents.list("CLM-001");
// Returns: DocumentRecord[]
```

---

## Error Handling

| Error class | When thrown | Extra fields |
|-------------|-------------|--------------|
| `ValidationError` | Missing/invalid fields (client or server) | `.fields: Record<string, string>` |
| `AuthError` | Invalid/expired API key | `.statusCode: 401` |
| `NetworkError` | Timeout or connection failure | — |
| `ApiError` | Other HTTP errors | `.statusCode: number` |

---

## Claim Status Lifecycle

```
PENDING → PROCESSING (5s) → APPROVED (15s)
```

The mock server auto-progresses status based on the time elapsed since claim creation.

---

## Running Examples

Requires the dev server running:

```bash
npm run dev

# In another terminal:
npx tsx lib/challenge-13/examples/1-simple-claim.ts
npx tsx lib/challenge-13/examples/2-claim-with-document.ts
npx tsx lib/challenge-13/examples/3-polling-status.ts
```

---

## Running Tests

```bash
npm run test -- lib/challenge-13/sdk.test.ts
```

Tests mock `fetch` with `vi.fn()` — no server required.

---

## Mock API Endpoints

All endpoints are under `/api/challenge-13/v1/`. The server simulates 200–500ms latency and ~10% transient 503 failures.

| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/token` | Exchange API key for JWT |
| POST | `/claims` | Create a claim |
| GET | `/claims` | List claims (paginated) |
| GET | `/claims/:id` | Get claim by ID |
| POST | `/claims/:id/documents` | Upload document |
| GET | `/claims/:id/documents` | List documents |
