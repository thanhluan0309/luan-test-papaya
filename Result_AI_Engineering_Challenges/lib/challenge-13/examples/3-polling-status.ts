/**
 * Example 3 — Polling for claim status updates
 * Run: npx tsx lib/challenge-13/examples/3-polling-status.ts
 * Requires: npm run dev (Next.js server on port 3000)
 *
 * The mock server auto-progresses claim status:
 *   PENDING → PROCESSING (after 5s) → APPROVED (after 15s)
 */

import { InsuranceSDK } from "../sdk/index";
import type { ClaimStatus, Claim } from "../sdk/types";

const sdk = new InsuranceSDK({
  apiKey: "pk_test_demo",
  environment: "sandbox",
  baseUrl: "http://localhost:3000/api/challenge-13/v1",
});

function ts() {
  return new Date().toLocaleTimeString();
}

async function main() {
  console.log("── Creating claim ─────────────────────────────────");
  const claim = await sdk.claims.create({
    policyId: "POL-003",
    claimType: "SPECIALIST",
    diagnosisCode: "H52.1",
    treatmentDate: "2025-03-01",
    amount: 4500,
    currency: "THB",
  });

  console.log(`[${ts()}] Created: ${claim.id}  status=${claim.status}`);
  console.log("\n── Watching status changes (will auto-stop after APPROVED) ──");

  await new Promise<void>(resolve => {
    const unsubscribe = sdk.claims.onStatusChange(
      claim.id,
      (status: ClaimStatus, updated: Claim) => {
        console.log(`[${ts()}] Status changed → ${status}  (id=${updated.id})`);
        if (status === "APPROVED" || status === "REJECTED") {
          unsubscribe();
          resolve();
        }
      },
      2000,
    );
  });

  console.log("\n── Final claim state ──────────────────────────────");
  const final = await sdk.claims.get(claim.id);
  console.log(`id=${final.id}  status=${final.status}  amount=${final.amount} ${final.currency}`);
}

main().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
