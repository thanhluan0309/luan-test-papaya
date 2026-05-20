import { store, updateTenantConfig } from "@/lib/challenge-15/store";
import { resolveConfig, evaluateFlags } from "@/lib/challenge-15/engine";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const tenant = store.tenants.get(id);
  if (!tenant) {
    return Response.json({ message: `Tenant ${id} not found` }, { status: 404 });
  }
  return Response.json({
    resolvedConfig: resolveConfig(tenant),
    evaluatedFlags: evaluateFlags(tenant),
  });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!store.tenants.has(id)) {
    return Response.json({ message: `Tenant ${id} not found` }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const tenant = updateTenantConfig(
    id,
    body.configOverrides ?? {},
    body.flagOverrides ?? {},
    body.changedBy ?? "unknown",
    body.description ?? "Config update",
  );

  return Response.json({
    tenant,
    resolvedConfig: resolveConfig(tenant),
    evaluatedFlags: evaluateFlags(tenant),
  });
}
