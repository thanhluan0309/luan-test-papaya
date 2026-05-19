import { verifyJWT } from "./auth";

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function withSimulation(handler: () => Promise<Response>): Promise<Response> {
  await sleep(200 + Math.random() * 300);

  if (Math.random() < 0.1) {
    return Response.json({ message: "Service temporarily unavailable" }, { status: 503 });
  }

  return handler();
}

type AuthResult =
  | { ok: true; apiKey: string }
  | { ok: false; response: Response };

export function requireAuth(req: Request): AuthResult {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) {
    return {
      ok: false,
      response: Response.json({ message: "Missing authorization header" }, { status: 401 }),
    };
  }

  const token = auth.slice(7);
  const result = verifyJWT(token);

  if (!result.valid) {
    return {
      ok: false,
      response: Response.json({ message: "Invalid or expired token" }, { status: 401 }),
    };
  }

  return { ok: true, apiKey: String(result.payload?.apiKey ?? "") };
}
