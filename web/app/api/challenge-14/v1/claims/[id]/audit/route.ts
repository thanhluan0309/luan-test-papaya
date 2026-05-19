import { store } from "@/lib/challenge-14/store";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const claim = store.claims.get(id);
  if (!claim) {
    return Response.json({ message: `Claim ${id} not found` }, { status: 404 });
  }
  return Response.json(claim.auditTrail);
}
