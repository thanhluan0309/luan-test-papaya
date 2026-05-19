import { store } from "@/lib/challenge-14/store";
import { executeTransition } from "@/lib/challenge-14/engine";
import type { TransitionInput } from "@/lib/challenge-14/types";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const claim = store.claims.get(id);
  if (!claim) {
    return Response.json({ message: `Claim ${id} not found` }, { status: 404 });
  }

  const body: TransitionInput = await req.json().catch(() => null);
  if (!body?.to || !body?.triggeredBy?.userId || !body?.triggeredBy?.role) {
    return Response.json(
      { message: "Request must include: to, triggeredBy.userId, triggeredBy.role" },
      { status: 400 },
    );
  }

  const result = executeTransition(claim, body);

  if (!result.success) {
    return Response.json(result, { status: 422 });
  }

  store.claims.set(id, result.claim);
  return Response.json(result);
}
