/**
 * Example 1 — Simple claim submission
 * Run: npx tsx lib/challenge-13/examples/1-simple-claim.ts
 * Requires: npm run dev (Next.js server on port 3000)
 */

import { InsuranceSDK, ValidationError, AuthError } from "../sdk/index";

const sdk = new InsuranceSDK({
  apiKey: "pk_test_demo",
  environment: "sandbox",
  baseUrl: "http://localhost:3000/api/challenge-13/v1",
});

async function main() {
  console.log("── Creating claim ─────────────────────────────────");

  const claim = await sdk.claims.create({
    policyId: "POL-001",
    claimType: "OUTPATIENT",
    diagnosisCode: "J06.9",
    treatmentDate: "2025-01-15",
    amount: 15000,
    currency: "THB",
  });

  console.log(`Created: ${claim.id}  status=${claim.status}`);

  console.log("\n── Fetching claim ─────────────────────────────────");
  const fetched = await sdk.claims.get(claim.id);
  console.log(`Fetched: ${fetched.id}  status=${fetched.status}`);

  console.log("\n── Listing claims ─────────────────────────────────");
  const list = await sdk.claims.list({ page: 1, pageSize: 5 });
  console.log(`Total claims: ${list.total}`);
  list.data.forEach(c => console.log(`  ${c.id}  ${c.claimType}  ${c.status}`));
}

main().catch(err => {
  if (err instanceof ValidationError) {
    console.error("Validation error:", err.fields);
  } else if (err instanceof AuthError) {
    console.error("Auth error:", err.message);
  } else {
    console.error("Error:", err);
  }
  process.exit(1);
});
