import { requireAuth, withSimulation } from "@/lib/challenge-13/server/middleware";
import { store, computeStatus } from "@/lib/challenge-13/store";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const auth = requireAuth(req);
  if (!auth.ok) return auth.response;

  return withSimulation(async () => {
    const { id } = await params;
    const record = store.claims.get(id);

    if (!record || record.apiKey !== auth.apiKey) {
      return Response.json({ message: `Claim ${id} not found` }, { status: 404 });
    }

    return Response.json({
      id: record.id,
      policyId: record.policyId,
      claimType: record.claimType,
      diagnosisCode: record.diagnosisCode,
      treatmentDate: record.treatmentDate,
      amount: record.amount,
      currency: record.currency,
      status: computeStatus(record),
      createdAt: record.createdAt,
      updatedAt: record.createdAt,
    });
  });
}
