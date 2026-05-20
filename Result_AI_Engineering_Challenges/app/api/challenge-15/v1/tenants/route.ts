import { store, createTenant } from "@/lib/challenge-15/store";
import type { TenantPlan } from "@/lib/challenge-15/types";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  if (!body.name || !body.plan) {
    return Response.json({ message: "name and plan are required" }, { status: 400 });
  }
  const tenant = createTenant({
    name: body.name,
    plan: body.plan as TenantPlan,
    environment: body.environment,
  });
  return Response.json(tenant, { status: 201 });
}

export async function GET() {
  const tenants = Array.from(store.tenants.values()).map((t) => ({
    id: t.id,
    name: t.name,
    plan: t.plan,
    environment: t.environment,
    updatedAt: t.updatedAt,
  }));
  return Response.json(tenants);
}
