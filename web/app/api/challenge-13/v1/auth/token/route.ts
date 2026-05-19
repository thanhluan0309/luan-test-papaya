import { signJWT } from "@/lib/challenge-13/server/auth";

export async function POST(req: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ message: "Invalid JSON body" }, { status: 400 });
  }

  const { apiKey } = body as Record<string, unknown>;

  if (!apiKey || typeof apiKey !== "string") {
    return Response.json(
      { message: "Validation failed", errors: { apiKey: "required" } },
      { status: 400 },
    );
  }

  if (!apiKey.startsWith("pk_test_") && !apiKey.startsWith("pk_live_")) {
    return Response.json(
      { message: "Invalid API key format" },
      { status: 401 },
    );
  }

  const now = Math.floor(Date.now() / 1000);
  const exp = now + 3600;
  const token = signJWT({ apiKey, iat: now, exp });
  const expiresAt = exp * 1000;

  return Response.json({ token, expiresAt });
}
