import { requireAuth, withSimulation } from "@/lib/challenge-13/server/middleware";
import { store, computeStatus, type ClaimRecord } from "@/lib/challenge-13/store";
import type { ClaimInput, ClaimType } from "@/lib/challenge-13/sdk/types";

const VALID_CLAIM_TYPES = new Set<ClaimType>(["OUTPATIENT", "INPATIENT", "DENTAL", "MATERNITY", "SPECIALIST"]);
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function validateBody(body: Record<string, unknown>): Record<string, string> | null {
  const errors: Record<string, string> = {};
  if (!body.policyId || typeof body.policyId !== "string") errors.policyId = "required";
  if (!body.claimType || !VALID_CLAIM_TYPES.has(body.claimType as ClaimType)) {
    errors.claimType = "must be one of: OUTPATIENT, INPATIENT, DENTAL, MATERNITY, SPECIALIST";
  }
  if (!body.diagnosisCode || typeof body.diagnosisCode !== "string") errors.diagnosisCode = "required";
  if (!body.treatmentDate || !DATE_RE.test(String(body.treatmentDate))) {
    errors.treatmentDate = "required, format: YYYY-MM-DD";
  }
  if (body.amount == null || typeof body.amount !== "number" || body.amount <= 0) {
    errors.amount = "must be a positive number";
  }
  if (!body.currency || typeof body.currency !== "string") errors.currency = "required";
  return Object.keys(errors).length ? errors : null;
}

function toResponse(record: ClaimRecord) {
  return {
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
  };
}

export async function POST(req: Request): Promise<Response> {
  const auth = requireAuth(req);
  if (!auth.ok) return auth.response;

  return withSimulation(async () => {
    let body: Record<string, unknown>;
    try {
      body = await req.json() as Record<string, unknown>;
    } catch {
      return Response.json({ message: "Invalid JSON body" }, { status: 400 });
    }

    const errors = validateBody(body);
    if (errors) {
      return Response.json({ message: "Validation failed", errors }, { status: 400 });
    }

    const input = body as unknown as ClaimInput;
    const id = `CLM-${Date.now().toString(36).toUpperCase()}`;
    const now = new Date().toISOString();
    const record: ClaimRecord = { ...input, id, createdAt: now, apiKey: auth.apiKey };
    store.claims.set(id, record);

    return Response.json(toResponse(record), { status: 201 });
  });
}

export async function GET(req: Request): Promise<Response> {
  const auth = requireAuth(req);
  if (!auth.ok) return auth.response;

  return withSimulation(async () => {
    const url = new URL(req.url);
    const statusFilter = url.searchParams.get("status") ?? undefined;
    const page = Math.max(1, Number(url.searchParams.get("page") ?? 1));
    const pageSize = Math.min(100, Math.max(1, Number(url.searchParams.get("pageSize") ?? 20)));

    const all = [...store.claims.values()]
      .filter(c => c.apiKey === auth.apiKey)
      .filter(c => !statusFilter || computeStatus(c) === statusFilter)
      .map(toResponse);

    const total = all.length;
    const data = all.slice((page - 1) * pageSize, page * pageSize);

    return Response.json({ data, total, page, pageSize });
  });
}
