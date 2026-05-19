import { createHmac } from "crypto";

const SECRET = process.env.JWT_SECRET ?? "ch13-dev-secret";

function base64url(buf: Buffer): string {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function signJWT(payload: Record<string, unknown>): string {
  const header = base64url(Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })));
  const body = base64url(Buffer.from(JSON.stringify(payload)));
  const sig = base64url(
    createHmac("sha256", SECRET).update(`${header}.${body}`).digest(),
  );
  return `${header}.${body}.${sig}`;
}

export function verifyJWT(token: string): { valid: boolean; payload?: Record<string, unknown> } {
  const parts = token.split(".");
  if (parts.length !== 3) return { valid: false };

  const [header, body, sig] = parts;
  const expected = base64url(
    createHmac("sha256", SECRET).update(`${header}.${body}`).digest(),
  );

  if (sig !== expected) return { valid: false };

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(Buffer.from(body, "base64").toString("utf-8"));
  } catch {
    return { valid: false };
  }

  if (typeof payload.exp === "number" && payload.exp < Date.now() / 1000) {
    return { valid: false };
  }

  return { valid: true, payload };
}
