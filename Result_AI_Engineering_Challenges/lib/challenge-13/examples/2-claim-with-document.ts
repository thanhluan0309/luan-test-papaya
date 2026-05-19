/**
 * Example 2 — Claim submission with document upload
 * Run: npx tsx lib/challenge-13/examples/2-claim-with-document.ts
 * Requires: npm run dev (Next.js server on port 3000)
 */

import { InsuranceSDK } from "../sdk/index";

const sdk = new InsuranceSDK({
  apiKey: "pk_test_demo",
  environment: "sandbox",
  baseUrl: "http://localhost:3000/api/challenge-13/v1",
});

async function main() {
  console.log("── Creating claim ─────────────────────────────────");

  const claim = await sdk.claims.create({
    policyId: "POL-002",
    claimType: "INPATIENT",
    diagnosisCode: "K35.2",
    treatmentDate: "2025-02-10",
    amount: 85000,
    currency: "THB",
  });

  console.log(`Created: ${claim.id}  status=${claim.status}`);

  console.log("\n── Uploading document ─────────────────────────────");

  const fakeFile = new Blob(["[PDF content of medical receipt]"], { type: "application/pdf" });
  // In a real browser/Node env, this would be a File object

  const doc = await sdk.documents.upload(claim.id, fakeFile, {
    type: "medical_receipt",
    onProgress: (pct) => process.stdout.write(`\r  Progress: ${pct}%`),
  });

  console.log(`\nUploaded: ${doc.id}  type=${doc.type}  size=${doc.size} bytes`);

  console.log("\n── Listing documents ──────────────────────────────");

  const docs = await sdk.documents.list(claim.id);
  docs.forEach(d => console.log(`  ${d.id}  ${d.type}  ${d.filename}`));
}

main().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
