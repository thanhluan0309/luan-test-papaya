import { runAgent } from "@/lib/challenge-11/agent";

export async function POST(req: Request) {
  try {
    const { caseId } = await req.json() as { caseId: string };
    if (!caseId) return Response.json({ error: "caseId is required" }, { status: 400 });

    const result = await runAgent(caseId);
    return Response.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return Response.json({ error: msg }, { status: 500 });
  }
}
