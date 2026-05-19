import { store, createClaim } from "@/lib/challenge-14/store";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const claim = createClaim({
    policyLimit: body.policyLimit,
    claimAmount: body.claimAmount,
  });
  return Response.json(claim, { status: 201 });
}

export async function GET() {
  const claims = Array.from(store.claims.values()).map((c) => ({
    id: c.id,
    state: c.state,
    pendingInfoCount: c.pendingInfoCount,
    updatedAt: c.updatedAt,
  }));
  return Response.json(claims);
}
