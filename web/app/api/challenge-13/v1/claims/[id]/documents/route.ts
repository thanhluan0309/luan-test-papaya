import { requireAuth, withSimulation } from "@/lib/challenge-13/server/middleware";
import { store, type DocumentRecord } from "@/lib/challenge-13/store";
import type { DocumentType } from "@/lib/challenge-13/sdk/types";

const VALID_DOC_TYPES = new Set<DocumentType>([
  "medical_receipt", "discharge_summary", "prescription", "referral_letter", "id_card_copy",
]);

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const auth = requireAuth(req);
  if (!auth.ok) return auth.response;

  return withSimulation(async () => {
    const { id: claimId } = await params;
    const claim = store.claims.get(claimId);
    if (!claim || claim.apiKey !== auth.apiKey) {
      return Response.json({ message: `Claim ${claimId} not found` }, { status: 404 });
    }

    let body: Record<string, unknown>;
    try {
      body = await req.json() as Record<string, unknown>;
    } catch {
      return Response.json({ message: "Invalid JSON body" }, { status: 400 });
    }

    const errors: Record<string, string> = {};
    if (!body.type || !VALID_DOC_TYPES.has(body.type as DocumentType)) {
      errors.type = "must be one of: " + [...VALID_DOC_TYPES].join(", ");
    }
    if (!body.filename || typeof body.filename !== "string") errors.filename = "required";
    if (body.size == null || typeof body.size !== "number" || body.size < 0) {
      errors.size = "must be a non-negative number";
    }

    if (Object.keys(errors).length) {
      return Response.json({ message: "Validation failed", errors }, { status: 400 });
    }

    const docId = `DOC-${Date.now().toString(36).toUpperCase()}`;
    const doc: DocumentRecord = {
      id: docId,
      claimId,
      type: body.type as DocumentType,
      filename: body.filename as string,
      size: body.size as number,
      uploadedAt: new Date().toISOString(),
    };

    const existing = store.documents.get(claimId) ?? [];
    store.documents.set(claimId, [...existing, doc]);

    return Response.json(doc, { status: 201 });
  });
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const auth = requireAuth(req);
  if (!auth.ok) return auth.response;

  return withSimulation(async () => {
    const { id: claimId } = await params;
    const claim = store.claims.get(claimId);
    if (!claim || claim.apiKey !== auth.apiKey) {
      return Response.json({ message: `Claim ${claimId} not found` }, { status: 404 });
    }

    return Response.json(store.documents.get(claimId) ?? []);
  });
}
